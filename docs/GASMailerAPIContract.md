# Google Apps Script Email Relay Webhook Contract
This document outlines the API specifications, payload structure, and full setup guides for the strategic Google Apps Script (GAS) email webhook communications hub. 

All outbound communications (for all operator sign-ups, kyc uploads, payments, and flight dispatcher checklists) stream through this standardized webhook, allowing for high-throughput, low-latency mail relays under strict structural guidelines.

---

## 1. API Contract Definition

* **Protocol**: HTTP(S) POST
* **Content-Type**: `application/json`
* **Response Payload Format**: `application/json`

### Request JSON Schema:
```json
{
  "recipientName": "string // Human-readable recipient's full name",
  "recipientEmail": "string // Valid destination email address",
  "subject": "string // The clear display header for the email",
  "messagePayload": "string // HTML or plaintext core message layout content",
  "purpose": "AIRCRAFT_VERIFICATION | MISSION_COMPLETED | PAYMENT_REVIEW | SYSTEM_ALERT",
  "meta": {
    "operatorId": "string // Optional metadata for operator mapping",
    "tailNumber": "string // Optional aircraft indicator",
    "clearanceStatus": "string // Optional compliance phase"
  }
}
```

### Response JSON Schema (Success):
```json
{
  "success": true,
  "messageId": "string // Randomly generated or GAS execution tracking ID",
  "timestamp": "string"
}
```

### Response JSON Schema (Error):
```json
{
  "success": false,
  "error": "string // Reason for dispatch failure"
}
```

---

## 2. Google Apps Script Side Deployment Code
Copy and paste this script directly into your Google Sheets/Apps Script editor (`script.google.com`), assign standard scopes, and publish it as an **"Executable Web App (Anyone can access)"**.

```javascript
/**
 * POST Request entry point for the communications hub.
 * Relays email payloads to millions of private or state flight operators.
 */
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    
    // Core parameters mapping
    var recipientName = payload.recipientName || "Valued operator";
    var recipientEmail = payload.recipientEmail;
    var subject = payload.subject || "Strategic Flight Dispatch Notice";
    var messagePayload = payload.messagePayload;
    var purpose = payload.purpose || "SYSTEM_ALERT";
    var meta = payload.meta || {};
    
    if (!recipientEmail) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing mandatory 'recipientEmail' destination parameter."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Draft elegant HTML mail package using the purpose to drive custom banner assets
    var htmlContent = buildStyledEmailHtml(recipientName, messagePayload, purpose, meta);
    
    // Trigger GmailApp Relay service
    GmailApp.sendEmail(recipientEmail, subject, "", {
      name: "Wings 15D - Strategic Authority",
      htmlBody: htmlContent,
      replyTo: "noreply@wings15d.gov"
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      messageId: "GAS-RELAY-" + Utilities.getUuid(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Relay logic crashed: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Visual styling compiler matching the minimal carbon slate visual identity.
 */
function buildStyledEmailHtml(name, payload, purpose, meta) {
  var accentColor = "#3b82f6"; // fbblue
  var bannerText = "STRATEGIC OPERATIONS REPORT";
  
  if (purpose === "AIRCRAFT_VERIFICATION") {
    accentColor = "#eab308"; // amber
    bannerText = "COMPLIANCE UNDER AUDIT";
  } else if (purpose === "MISSION_COMPLETED") {
    accentColor = "#10b981"; // emerald
    bannerText = "FLIGHT DISPATCH CLEARANCE";
  }
  
  return (
    "<div style='background-color:#0b0b0b; padding:40px 20px; font-family:Inter, sans-serif, system-ui; text-align:center; color:#e2e8f0;'>" +
      "<div style='max-width:600px; margin:0 auto; background-color:#111111; border:1px solid #222; border-radius:16px; overflow:hidden; text-align:left;'>" +
        "<div style='background-color:" + accentColor + "; padding:24px; text-align:center;'>" +
          "<h1 style='color:#ffffff; font-size:18px; letter-spacing:2px; margin:0; text-transform:uppercase; font-weight:bold;'>" + bannerText + "</h1>" +
        "</div>" +
        "<div style='padding:30px 40px;'>" +
          "<p style='color:#94a3b8; font-size:14px;'>Dear " + name + ",</p>" +
          "<div style='color:#cbd5e1; font-size:14px; line-height:1.6; margin:20px 0;'>" + payload + "</div>" +
          (meta.tailNumber ? "<p style='font-size:12px; color:#64748b; font-family:monospace;'>Registered Tail Asset: " + meta.tailNumber + "</p>" : "") +
          "<hr style='border:0; border-top:1px solid #1f2937; margin:30px 0;' />" +
          "<p style='font-size:11px; text-align:center; color:#475569;'>This is a computer-generated notification from the 15D Wings Operations Centre. Do not reply to this email Address.</p>" +
        "</div>" +
      "</div>" +
    "</div>"
  );
}
```

---

## 3. Deployment Steps inside Google Workspace
1. Go to **[script.google.com](https://script.google.com/)**.
2. Click **New Project** and replace standard `Code.gs` with the snippet above.
3. Click **Deploy > New Deployment**.
4. Set the type as **"Web App"**.
5. Set Execute As: **"Me (Your Email)"**.
6. Set Who has access: **"Anyone"**.
7. Deploy, authorize Google Account permissions, and copy the output **Web App URL** (usually starts with `https://script.google.com/macros/s/..../exec`).
8. Save this URL inside your workspace `.env` variables under `GAS_EMAIL_WEBHOOK_URL`.
