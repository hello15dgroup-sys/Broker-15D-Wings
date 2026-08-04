# 15D Wings Experiences API Contract

This document outlines the API contract between the internal 15D Wings Operations Backend and the external Experiences Portal hosted at `https://experience.15dwings.com.ng/`.

## Flow Overview
1. Client clicks "ENTER EXPERIENCES PORTAL" on the Client Dashboard.
2. The Dashboard opens a new window passing `missionId` as a query parameter (e.g. `?missionId=VIP-83XA-81`).
3. External portal presents available experiences (e.g., BlueHour™, Sky Party™).
4. Upon user selection and checkout, the external portal securely POSTs the payload back to the internal 15D Operations API.

## 1. Internal API Endpoint

**Endpoint:** `POST https://api.15dwings.com/v1/missions/{missionId}/experiences`
**Auth:** Bearer Token (Service-to-Service API Key)
**Content-Type:** `application/json`

### Request Schema (from External Portal)

```json
{
  "missionId": "string",
  "experienceType": "string", // Enum: "BLUEHOUR_SENSORY", "SKY_PARTY_PRODUCTION", "CHEF_CURATED", "CUSTOM"
  "transactionToken": "string", // Optional: payment gateway reference if billed on external portal
  "totalCostAsBilled": "number", // The amount added to final flight bill
  "passengerCount": "integer",
  "configurations": {
    "theme": "string", // e.g. "Neon", "Calm"
    "dietaryRestrictions": ["string"],
    "lightingPreset": "string",
    "scentProfile": "string"
  },
  "timestamp": "ISO8601-String"
}
```

### Response Schema
**200 OK**
```json
{
  "status": "success",
  "message": "Experience appended to flight manifest and billing.",
  "integrationId": "EXP-90021-A"
}
```

## 2. External Portal Redirect Options
Once the external portal successfully posts the API format above, it should automatically route the client back to their flight portal with a success query string.

`GET https://app.15dwings.com/flight?missionId={missionId}&experience_success=true`

The 15D Wings operational dashboard will then automatically append the chosen experiences to the final invoice and inform the flight crew.
