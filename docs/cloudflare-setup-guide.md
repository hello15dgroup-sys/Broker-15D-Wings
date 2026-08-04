# Cloudflare Edge Cluster & Google Apps Script Setup Guide

## 1. Cloudflare Workers + Durable Objects Setup

Your edge database architecture (ORM, Mission states, ICC logic, and API) is handled via Cloudflare Durable Objects.

### Steps to Deploy:
1. Run `npx wrangler login` to authenticate with your Cloudflare account.
2. In your `wrangler.toml`, we have pre-configured four Durable Objects (`MissionPortalDO`, `OperatorPortalDO`, `ICCPortalDO`, `DocumentProcessorDO`), the AI binding, and the R2 Buckets.
3. Configure your Supabase Secrets by running:
   \`\`\`bash
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put GAS_WEBHOOK_URL
   \`\`\`
   *(The GAS_WEBHOOK_URL is the published App Script URL you generate in Section 2)*

4. Create your R2 Buckets:
   \`\`\`bash
   npx wrangler r2 bucket create 15dwings-operator-docs
   npx wrangler r2 bucket create 15dwings-mission-docs
   \`\`\`
   
5. Deploy the edge cluster:
   \`\`\`bash
   npx wrangler deploy
   \`\`\`

## 2. Google Apps Script (GAS) Setup for `ops@15dwings.com.ng`

We use a Google Apps Script Web App to safely send emails from your `ops@15dwings.com.ng` Google Workspace alias without needing to store SMTP credentials inside the edge.

### Instructions:
1. Open [script.google.com](https://script.google.com/) while logged in as `ops@15dwings.com.ng` (or the primary admin account with alias access).
2. Create a "New Project" and paste the following script:

\`\`\`javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const recipient = payload.recipient;
    const subject = payload.subject;
    const body = payload.body;
    
    // Ensure you use the proper alias if executing as primary user
    GmailApp.sendEmail(recipient, subject, body, {
       from: 'ops@15dwings.com.ng',  // Ensure this is registered in the Gmail account
       name: '15D Wings Operations Team'
    });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
\`\`\`

3. Click **Deploy > New Deployment**.
4. Select type **"Web app"**.
5. Set: 
   - Execute as: **Me (ops@15dwings.com.ng)**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize the permissions to access your Gmail app, and copy the **Web app URL**.
7. Run the Wrangler command from Step 1.3 to inject the URL into your Cloudflare Worker:
   \`\`\`bash
   npx wrangler secret put GAS_WEBHOOK_URL
   \`\`\`

You're all set! 

The Cloudflare Edge will now route `Document Uploads`, `Missions`, and `Emails` seamlessly between the Portals and your Google Apps Script environment.
