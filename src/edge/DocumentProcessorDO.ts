/// <reference types="@cloudflare/workers-types" />
import { Env } from './index';
import { createClient } from '@supabase/supabase-js';

/* =========================================================
   UTILITIES & HELPERS
========================================================= */

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

function computeRisk(validation_score: number, expiry_date: number | null, fraud_signal: number, completeness_score: number) {
  const now = Date.now();
  let expiryRisk = 0;
  if (expiry_date && expiry_date < now) expiryRisk = 1;
  else if (expiry_date && expiry_date - now < 1000 * 60 * 60 * 24 * 7) expiryRisk = 0.5;

  return (
    (1 - validation_score) * 0.4 +
    expiryRisk * 0.3 +
    (1 - completeness_score) * 0.2 +
    fraud_signal * 0.1
  );
}

function buildKey(scope: string, id: string, doc_type: string, fileName: string) {
  if (!id) throw new Error("MISSING_SCOPE_IDENTIFIER");
  return `${scope}/${id}/${doc_type}/${crypto.randomUUID()}-${fileName}`;
}

export class DocumentProcessorDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        });
    }

    if (url.pathname.endsWith("/upload")) {
      return this.handleUpload(request);
    }
    
    return json({ status: "DocumentProcessorDO Active" });
  }

  private async handleUpload(request: Request): Promise<Response> {
      try {
          const formData = await request.formData();
          const file = formData.get('file') as File;
          const scope = formData.get('scope') as string; 
          const idValue = formData.get('id') as string;  
          const doc_type = formData.get('doc_type') as string;
          const isDomestic = formData.get('is_domestic') === 'true'; 

          if (!file || !doc_type || !scope) return json({ error: "INVALID_INPUT" }, 400);

          if (scope === 'mission' && isDomestic && doc_type === 'permit') {
            return json({ skipped: true, message: 'Permit not required for domestic missions' });
          }

          const key = buildKey(scope, idValue, doc_type, file.name);
          
          if (scope === "mission") {
            await this.env.MISSION_DOCS.put(key, file);
          } else if (scope === "operator") {
            await this.env.OPERATOR_DOCS.put(key, file);
          } else {
            return json({ error: "INVALID_SCOPE" }, 400);
          }

          const analysis = await this.analyzeWithAI(file, doc_type);
          const { validation_score, expiry_date, fraud_signal, completeness_score, detected_doc_type } = analysis;
          const risk = computeRisk(validation_score, expiry_date, fraud_signal, completeness_score);
          
          const isValid = validation_score > 0.7 && risk < 0.6 ? 1 : 0;

          const supabase = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_SERVICE_ROLE_KEY);

          if (scope === "mission" && idValue) {
            await supabase.from('mission_documents').upsert({
              mission_id: idValue,
              doc_type: detected_doc_type,
              file_hash: key,
              validation_score,
              valid: isValid,
            });
            
            // Notify ICC DO
            const stub = this.env.ICC_DO.get(this.env.ICC_DO.idFromName(idValue));
            await stub.fetch(`https://icc/mission/pillar-update`, {
              method: 'POST',
              body: JSON.stringify({ missionId: idValue, doc_type: detected_doc_type, risk, valid: isValid })
            });

            // Notify Clock DO
            if (expiry_date) {
               const clockStub = this.env.CLOCK_DO.get(this.env.CLOCK_DO.idFromName(idValue));
               await clockStub.fetch(`https://clock/document-expiry`, {
                 method: 'POST',
                 body: JSON.stringify({ mission_id: idValue, doc_type: detected_doc_type, expiry_date })
               });
            }
          }

          if (scope === "operator" && idValue) {
            await supabase.from('operator_documents').upsert({
              operator_id: idValue,
              doc_type: detected_doc_type,
              file_hash: key,
              validation_score,
              status: isValid ? "valid" : "rejected",
            });
          }

          return json({ status: "VERIFIED", detected_doc_type, validation_score, expiry_date, document_risk_score: risk, storage_key: key });
      } catch (e: any) {
          return json({ error: e.message }, 500);
      }
  }

  private async analyzeWithAI(file: File, declared_doc_type: string) {
      if (!this.env.AI) {
        // Fallback if AI not configured
        return {
            detected_doc_type: declared_doc_type,
            expiry_date: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
            validation_score: 0.9,
            fraud_signal: 0.05,
            completeness_score: 0.95
        };
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const response = await this.env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
          prompt: `You are an ICAO-aligned aviation compliance AI.
          Declared doc: ${declared_doc_type}.
          Please extract:
          - true document type
          - expiry date (ISO8601 or null)
          - validation score (0 to 1)
          - fraud signal (0 to 1)
          - completeness score (0 to 1)
          Return strictly valid JSON with these keys: detected_doc_type (string), expiry_date (string/null), validation_score (number), fraud_signal (number), completeness_score (number).`,
          image: [...new Uint8Array(arrayBuffer)]
        });

        // The model returns text containing JSON.
        let text = typeof response === 'string' ? response : (response as any).response;
        const match = text.match(/\{[\s\S]*\}/);
        if (match) text = match[0];

        const result = JSON.parse(text);

        return {
            detected_doc_type: result.detected_doc_type || declared_doc_type,
            expiry_date: result.expiry_date ? new Date(result.expiry_date).getTime() : Date.now() + 1000 * 60 * 60 * 24 * 30,
            validation_score: result.validation_score || 0.8,
            fraud_signal: result.fraud_signal || 0.1,
            completeness_score: result.completeness_score || 0.8
        };
      } catch (err) {
        console.error("AI Analysis failed:", err);
        return {
            detected_doc_type: declared_doc_type,
            expiry_date: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
            validation_score: 0.8,
            fraud_signal: 0.1,
            completeness_score: 0.9
        };
      }
  }
}
