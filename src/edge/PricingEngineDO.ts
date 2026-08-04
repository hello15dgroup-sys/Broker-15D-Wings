/// <reference types="@cloudflare/workers-types" />
import { Env } from './index';
import { createClient } from '@supabase/supabase-js';

export class PricingEngineDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private supabase: any;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/calculate")) {
      const payload = await request.json() as any;
      await this.calculatePrice(payload);
      return new Response(JSON.stringify({ success: true, message: "Price calculated" }), {
          headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("PricingEngineDO Active");
  }

  private async calculatePrice(payload: any) {
    const { mission_id, customization_cost = 0 } = payload;
    
    // Fetch latest state from Supabase to check for operator quotes
    const { data: mission } = await this.supabase.from('missions').select('*').eq('id', mission_id).single();
    
    // Pull the estimate_lower and estimate_upper as requested by user
    const lowerVal = Number(
      payload.estimate_lower ?? 
      payload.estimated_lower ?? 
      mission?.raw_payload?.estimate_lower ?? 
      mission?.raw_payload?.estimated_lower ?? 
      mission?.estimated_lower ?? 
      0
    );
    const upperVal = Number(
      payload.estimate_upper ?? 
      payload.estimated_upper ?? 
      mission?.raw_payload?.estimate_upper ?? 
      mission?.raw_payload?.estimated_upper ?? 
      mission?.estimated_upper ?? 
      0
    );

    const midpointEstimate = (lowerVal + upperVal) / 2;
    const platformFee = midpointEstimate * 0.10;
    const escrowDeposit = midpointEstimate * 0.50;
    const upfrontDeposit = escrowDeposit + platformFee;

    let grossOperatorQuote = 0;
    let outstandingBalance = 0;
    let platformTotalProfit = platformFee;

    const operatorQuote = mission?.operator_quote ? Number(mission.operator_quote) : 0;
    const platformMarkupRate = Number(mission?.platform_markup_rate ?? 0.10);
    const operatorCommissionRate = Number(mission?.operator_commission_rate ?? 0.05);

    if (operatorQuote === 0) {
      grossOperatorQuote = 0;
      outstandingBalance = Math.max(0, midpointEstimate - escrowDeposit);
      platformTotalProfit = platformFee;
    } else {
      grossOperatorQuote = operatorQuote * (1 + platformMarkupRate);
      outstandingBalance = Math.max(0, grossOperatorQuote - escrowDeposit);
      platformTotalProfit = platformFee + (grossOperatorQuote - operatorQuote) + (operatorQuote * operatorCommissionRate);
    }

    // Include customization costs if any exist
    if (customization_cost > 0) {
      outstandingBalance += customization_cost;
    }

    await this.state.storage.put('price_data', { 
      platformFee, 
      commitmentActivation: upfrontDeposit, 
      outstanding_balance: outstandingBalance,
      midpoint_estimate: midpointEstimate,
      escrow_deposit: escrowDeposit,
      upfront_deposit: upfrontDeposit
    });

    // Send back to Supabase for record purposes
    const newPayload = { 
      ...(mission?.raw_payload || {}), 
      customization_cost,
      estimate_lower: lowerVal,
      estimate_upper: upperVal
    };

    await this.supabase.from('missions').update({ 
        platform_fee: platformFee,
        upfront_deposit: upfrontDeposit,
        commitment_activation_fee: upfrontDeposit, // keep backwards compatibility field
        outstanding_balance: outstandingBalance,
        midpoint_estimate: midpointEstimate,
        escrow_deposit: escrowDeposit,
        gross_operator_quote: grossOperatorQuote,
        platform_total_profit: platformTotalProfit,
        raw_payload: newPayload
    }).eq('id', mission_id);

    // Sync to Client DO so Dashboard is controlled by it
    if (this.env.MISSION_DO) {
        const clientDoId = this.env.MISSION_DO.idFromName(mission_id);
        const clientStub = this.env.MISSION_DO.get(clientDoId);
        await clientStub.fetch(`https://client/mission/${mission_id}/price-update`, {
          method: "POST",
          body: JSON.stringify({ 
            platformFee, 
            commitmentActivation: upfrontDeposit, 
            outstanding_balance: outstandingBalance, 
            raw_payload: newPayload,
            midpoint_estimate: midpointEstimate,
            escrow_deposit: escrowDeposit,
            upfront_deposit: upfrontDeposit
          })
        });
    }
  }
}
