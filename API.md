## API Overview

This document describes the initial HTTP API surface for the call sheet contact extraction service.
It focuses on:

- the low-level `extract-contacts` operation, which turns a single call sheet into a normalized
  JSON structure using AI, and
- the higher-level `process-upload` operation, which ties extraction into the database model for
  productions and uploads,
- read-only endpoints for listing productions and fetching a production’s details.

For now, the backend is implemented as a Supabase Edge Function. In production, the same contract
can be fronted by an API gateway or dedicated backend service without changing the client-facing
shape.

---

### `POST /functions/v1/extract-contacts`

- **Description**: Extracts normalized contact and location information from an uploaded
  production call sheet.
- **Authentication**: None (prototype). In a production environment this should be protected
  via JWT / API keys and tenant-aware access controls.
- **Content-Type**: `application/json`

#### Request body

```json
{
  "documentContent": "string, required",
  "documentType": "string, optional"
}
```

- **`documentContent`**:
  - For text-based flows: the full call sheet as a UTF-8 string.
  - For image-based flows: a data URL (for example, `data:image/png;base64,...`).
- **`documentType`**:
  - `"text"`: `documentContent` is plain text.
  - `"image"`: `documentContent` is an image (typically a data URL).
  - `"pdf"`: reserved for future use when a PDF → OCR pipeline is attached.

In the current implementation, the function differentiates between image and non-image input.
If `documentType === "image"` and `documentContent` starts with `data:image`, it uses
multimodal (vision) capabilities; otherwise, it treats `documentContent` as text.

#### Successful response `200 OK`

Returns a JSON object with the following structure:

```json
{
  "production_info": {
    "title": "string or null",
    "production_company": "string or null",
    "shoot_date": "string or null"
  },
  "contacts": [
    {
      "name": "string",
      "role": "string or null",
      "department": "string or null",
      "phone": "string or null",
      "email": "string or null",
      "notes": "string or null"
    }
  ],
  "emergency_contacts": [
    {
      "type": "string",
      "name": "string or null",
      "phone": "string or null"
    }
  ],
  "locations": [
    {
      "name": "string or null",
      "address": "string or null",
      "phone": "string or null"
    }
  ]
}
```

Semantics:

- `production_info` describes high-level metadata extracted from the call sheet.
- `contacts` contains normalized crew, cast, and production staff contacts.
- `emergency_contacts` groups emergency services and safety-related contacts.
- `locations` lists locations and basecamps that are associated with phone numbers or other
  contact details.

If no contacts, emergency contacts, or locations are found, the corresponding arrays will be
empty.

#### Error responses

- **`400 Bad Request`**
  - Returned when `documentContent` is missing.
  - Body:
    ```json
    { "error": "Document content is required" }
    ```

- **`500 Internal Server Error`**
  - Generic server-side failures (for example, configuration issues or network errors).
  - Possible bodies:
    - OpenAI API key missing:
      ```json
      { "error": "OpenAI API key not configured" }
      ```
    - OpenAI API error:
      ```json
      { "error": "OpenAI API error: <status-code>" }
      ```
    - Failed to parse AI response as JSON:
      ```json
      {
        "error": "Failed to parse extracted data",
        "rawContent": "<raw AI response as string>"
      }
      ```
    - Generic unexpected error:
      ```json
      { "error": "Some error message" }
      ```

---

### TypeScript client usage

The frontend should not call the HTTP endpoint directly. Instead, use the typed helper in
`src/lib/api.ts`:

```ts
import { extractContacts } from "@/lib/api";

const result = await extractContacts({
  documentContent: "...",
  documentType: "text"
});
```

This helper returns a value typed as `ExtractionResult`, defined in
`src/lib/extraction-types.ts`, which mirrors the JSON structure above.

---

### `POST /functions/v1/process-upload`

- **Description**: End-to-end processing of a call sheet upload for a given production. This
  function:
  - Resolves or creates a `productions` row.
  - Creates an `uploads` tracking row.
  - Runs AI extraction (using the same logic as `extract-contacts`).
  - Persists normalized contacts into the `contacts` table.
  - Updates the upload record with status and extracted contact count.
- **Authentication**: None (prototype). In production this must be protected and scoped per
  organization/tenant.
- **Content-Type**: `application/json`

#### Request body

```json
{
  "productionId": "string, optional",
  "productionName": "string, optional",
  "filename": "string, required",
  "documentContent": "string, required",
  "documentType": "string, optional"
}
```

- **`productionId`**:
  - Optional existing production ID. If provided, the upload is associated with this production.
- **`productionName`**:
  - Optional name for a new production; used when `productionId` is not provided.
  - The function will create a new row in `public.productions`.
- **`filename`**:
  - Required. Name of the uploaded file; used for tracking and stored as `source_file` on
    contacts.
- **`documentContent`** and **`documentType`**:
  - Same semantics as in `extract-contacts`.

Either `productionId` or `productionName` must be provided. If both are provided, `productionId`
is used and `productionName` is ignored.

#### Successful response `201 Created`

```json
{
  "production_id": "string",
  "upload_id": "string",
  "contacts_created": 3,
  "extraction_result": {
    "...": "Full ExtractionResult payload"
  }
}
```

- `production_id`: The resolved or newly created production ID.
- `upload_id`: The ID of the row in `public.uploads` created for this operation.
- `contacts_created`: Number of contacts successfully inserted into `public.contacts`.
- `extraction_result`: The same structured data returned by `extract-contacts`.

#### Error responses

- **`400 Bad Request`**
  - Missing `filename`, `documentContent`, or both `productionId` and `productionName`.
  - Example:
    ```json
    { "error": "Either productionId or productionName is required" }
    ```

- **`500 Internal Server Error`**
  - Failures when:
    - Creating or resolving a production.
    - Creating the upload record.
    - Calling the AI extraction layer.
    - Persisting contacts or updating the upload status.
  - The body contains a generic `error` message that is safe to log and surface to clients.

---

### `GET /functions/v1/list-productions`

- **Description**: Returns a paginated list of productions, ordered by creation time (newest
  first). Designed to back “project list” views in the frontend.
- **Authentication**: None (prototype). In production, RLS and/or scoped tokens should be used.

#### Query parameters

- `search` (optional, string):
  - Case-insensitive substring filter applied to `productions.name`.
- `limit` (optional, integer):
  - Maximum number of rows to return.
  - Defaults to `20`, capped at `100`.

#### Successful response `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string or null",
      "created_at": "timestamp with time zone",
      "updated_at": "timestamp with time zone"
    }
  ],
  "total": 1
}
```

- `items`: The current page of productions.
- `total`: The total number of matching productions (ignoring the limit).

#### Error responses

- **`500 Internal Server Error`**
  - On database access failures.
  - Body: `{ "error": "Failed to list productions" }` or a generic error message.

---

### `GET /functions/v1/get-production-detail`

- **Description**: Fetches a single production along with its uploads and contacts. This is
  suitable for a “production dashboard” or detail view.
- **Authentication**: None (prototype).

#### Query parameters

- `productionId` (required, string, `uuid`):
  - The ID of the production to fetch.

#### Successful response `200 OK`

```json
{
  "production": {
    "id": "uuid",
    "name": "string",
    "description": "string or null",
    "created_at": "timestamp with time zone",
    "updated_at": "timestamp with time zone"
  },
  "uploads": [
    {
      "id": "uuid",
      "filename": "string",
      "status": "string",
      "contacts_extracted": 0,
      "error_message": "string or null",
      "created_at": "timestamp with time zone"
    }
  ],
  "contacts": [
    {
      "id": "uuid",
      "name": "string",
      "role": "string or null",
      "department": "string or null",
      "email": "string or null",
      "phone": "string or null",
      "company": "string or null",
      "location": "string or null",
      "call_time": "string or null",
      "wrap_time": "string or null",
      "source_file": "string or null",
      "created_at": "timestamp with time zone"
    }
  ]
}
```

If the production has no uploads or contacts, the corresponding arrays will be empty.

#### Error responses

- **`400 Bad Request`**
  - When `productionId` is missing.
  - Body: `{ "error": "productionId is required" }`

- **`404 Not Found`**
  - When the requested production does not exist.
  - Body: `{ "error": "Production not found" }`

- **`500 Internal Server Error`**
  - On failures fetching the production, uploads, or contacts.
  - Body: `{ "error": "Failed to fetch production" }`, `{ "error": "Failed to fetch uploads" }`,
    `{ "error": "Failed to fetch contacts" }`, or a generic error message.


