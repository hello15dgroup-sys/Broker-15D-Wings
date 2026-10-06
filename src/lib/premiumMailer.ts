import { supabase } from './supabase';

export interface PremiumEmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  subject?: string;
  missionCode?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  departureTime?: string;
  aircraftModel?: string;
  tailNumber?: string;
  paxCount?: number | string;
  operatorName?: string;
  aocNumber?: string;
  totalAmount?: string;
  portalUrl?: string;
  customMessage?: string;
}

interface PremiumMailPayload {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  messagePayload: string;
  purpose: 'AIRCRAFT_VERIFICATION' | 'MISSION_COMPLETED' | 'PAYMENT_REVIEW' | 'SYSTEM_ALERT';
  meta?: {
    operatorId?: string;
    tailNumber?: string;
    clearanceStatus?: string;
  };
}

/**
 * Generates an ultra-luxurious, bulletproof HTML email template for 15D Wings.
 * Configured for dispatch from ops@15dwings.com.ng via Premium Mail Studio.
 */
export function generate15DWingsHtmlEmail(d: PremiumEmailTemplateData): string {
  const missionCode = d.missionCode || "15D-001";
  const clientName = d.recipientName || "Valued Client";
  const origin = d.origin || "Lagos Murtala Muhammed (DNMM / LOS)";
  const destination = d.destination || "London Luton (EGGW / LTN)";
  const departureDate = d.departureDate || "October 18, 2026";
  const departureTime = d.departureTime || "14:00 Local (13:00 UTC)";
  const aircraftModel = d.aircraftModel || "Bombardier Challenger 650";
  const tailNumber = d.tailNumber || "5N-B15D";
  const paxCount = d.paxCount || "6 VIP Passengers";
  const operatorName = d.operatorName || "Max Air Executive Charter";
  const aocNumber = d.aocNumber || "AOC/NG/044";
  const totalAmount = d.totalAmount || "$65,000 USD";
  const portalUrl = d.portalUrl || `https://vip.15dwings.com.ng/verify/${missionCode}`;
  const customMessage = d.customMessage || "Your private aviation itinerary has been validated against our licensed carrier network. Flight crews, landing slots, and ground handling services are locked for execution.";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>15D Wings Dispatch Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Top Executive Header Bar -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 24px 32px; text-align: left; border-bottom: 3px solid #7e22ce;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                      15D <span style="color: #f59e0b;">WINGS</span>
                    </div>
                    <div style="font-size: 10px; font-weight: 600; letter-spacing: 2px; color: #a855f7; text-transform: uppercase; margin-top: 4px;">
                      EXECUTIVE CHARTER DISPATCH • OFFICIAL CONFIRMATION
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(126,34,206,0.25); border: 1px solid #7e22ce; color: #d8b4fe; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 8px; font-family: monospace;">
                      ${missionCode}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Image Banner -->
          <tr>
            <td style="padding: 0; position: relative;">
              <img src="https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682889/Bombardier_Global_6000_LX-NST_Exterior_4_1600x1200_fnstut.jpg" alt="15D Wings Aircraft" width="640" style="width: 100%; max-width: 640px; height: auto; display: block; border-bottom: 1px solid #f1f5f9;" />
            </td>
          </tr>

          <!-- Main Email Content -->
          <tr>
            <td style="padding: 32px; text-align: left;">
              
              <!-- Greeting & Status Badge -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <span style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
                      ● DISPATCH CLEARED & LOCKED
                    </span>
                    <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 12px 0 6px 0; letter-spacing: -0.5px;">
                      Charter Mission Confirmed, ${clientName}
                    </h1>
                    <div style="font-size: 14px; color: #475569; margin: 0; line-height: 1.6;">
                      ${customMessage}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Itinerary Corridor Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid #f3e8ff;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #7e22ce; text-transform: uppercase;">
                      FLIGHT ROUTE CORRIDOR
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="45%" style="vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">DEPARTURE</div>
                          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${origin}</div>
                        </td>
                        <td width="10%" align="center" style="vertical-align: middle; font-size: 18px; color: #7e22ce;">
                          ➔
                        </td>
                        <td width="45%" align="right" style="vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">DESTINATION</div>
                          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${destination}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; border-top: 1px dashed #e9d5ff; margin-top: 16px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <div style="font-size: 11px; color: #64748b;">Schedule: <strong style="color: #0f172a;">${departureDate} @ ${departureTime}</strong></div>
                        </td>
                        <td align="right">
                          <div style="font-size: 11px; color: #64748b;">Manifest: <strong style="color: #0f172a;">${paxCount}</strong></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Aircraft & Operator Specs Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;" colspan="2">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #475569; text-transform: uppercase;">
                      ALLOCATED AIRCRAFT & LICENSED CARRIER
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px; font-size: 13px; color: #64748b;" width="50%">
                    Aircraft Model: <strong style="color: #0f172a; font-size: 13px;">${aircraftModel}</strong>
                  </td>
                  <td style="padding-top: 12px; font-size: 13px; color: #64748b;" width="50%" align="right">
                    Tail Registry: <strong style="color: #7e22ce; font-family: monospace; font-size: 13px;">${tailNumber}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 8px; font-size: 13px; color: #64748b;" width="50%">
                    Operator Carrier: <strong style="color: #0f172a; font-size: 13px;">${operatorName}</strong>
                  </td>
                  <td style="padding-top: 8px; font-size: 13px; color: #64748b;" width="50%" align="right">
                    Carrier AOC: <strong style="color: #0f172a; font-size: 13px;">${aocNumber}</strong>
                  </td>
                </tr>
              </table>

              <!-- Settlement Summary Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a; border-radius: 16px; padding: 20px; color: #ffffff; margin-bottom: 28px;">
                <tr>
                  <td>
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #a855f7; text-transform: uppercase;">
                      ESCROW SETTLEMENT SUMMARY
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 4px; font-family: monospace;">
                      ${totalAmount}
                    </div>
                    <div style="font-size: 11px; color: #a1a1aa; margin-top: 2px;">
                      Secured in Providus Bank Escrow / USDC Fireblocks Vault
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background-color: #15803d; color: #ffffff; font-size: 10px; font-weight: 700; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                      SETTLED
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #7e22ce; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-decoration: none; padding: 16px 36px; border-radius: 12px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(126,34,206,0.3);">
                      ENTER MISSION CONTROL PORTAL ➔
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; border-radius: 0 0 20px 20px;">
              <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                15D WINGS EXECUTIVE AVIATION BROKERAGE
              </div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
                Flight Operations Desk: <a href="mailto:ops@15dwings.com.ng" style="color: #7e22ce; text-decoration: none; font-weight: 600;">ops@15dwings.com.ng</a> • Murtala Muhammed Int'l Airport (DNMM), Lagos.
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 12px; line-height: 1.4;">
                Disclaimer: 15D Wings acts as an air charter broker and agent for authorized air carriers holding active Air Operator Certificates (AOC). All flights are operated by AOC-licensed carriers.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPremiumEmail(payload: PremiumMailPayload): Promise<boolean> {
  const LIVE_MACRO = 'https://script.google.com/macros/s/AKfycbww8HoF28RhH7CvwoHor1mWZx6pVxw3hSg-0RmtWRojxT9P3UBXjIQ5k00fBNv3V0TVcg/exec';
  const webhookUrl = localStorage.getItem('PREMIUM_MAIL_WEBHOOK_URL') || LIVE_MACRO;
  
  console.log(`[Premium Mail Studio] Preparing to dispatch via ops@15dwings.com.ng to ${payload.recipientEmail} via Webhook: ${webhookUrl}`);
  
  try {
    const mailPayload = {
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      subject: payload.subject,
      missionCode: "15D-782",
      htmlBody: payload.messagePayload,
      purpose: payload.purpose
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(mailPayload)
    });
    
    console.log("[Premium Mail Studio] Payload dispatched successfully.");
    return true;
  } catch (error) {
    console.error("[Premium Mail Studio] Failed to dispatch payload:", error);
    return false;
  }
}

// Alias for backwards compatibility
export const sendGasEmail = sendPremiumEmail;
