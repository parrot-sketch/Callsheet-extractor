# Backend Architecture

## Location

The backend code is located in **`backend/`** directory. This is an enterprise-grade Node.js/Express service built with TypeScript.

> **Note**: The `supabase/functions/` directory contains the original Supabase Edge Functions implementation, which can be used as a fallback or for serverless deployments. The main backend is now in `backend/`.

## Structure

```
supabase/functions/
├── _shared/                    # Shared backend utilities
│   ├── auth.ts                 # JWT authentication verification
│   ├── extraction.ts           # AI extraction logic (OpenAI integration)
│   └── supabase.ts             # Supabase database client (service role)
│
├── extract-contacts/           # POST /functions/v1/extract-contacts
│   └── index.ts                # Pure AI extraction endpoint
│
├── process-upload/             # POST /functions/v1/process-upload
│   └── index.ts                # Full upload workflow: create production, extract, persist
│
├── list-productions/           # GET /functions/v1/list-productions
│   └── index.ts                # List all productions with search
│
└── get-production-detail/      # GET /functions/v1/get-production-detail
    └── index.ts                # Get production with uploads and contacts
```

## Backend Endpoints

### 1. Extract Contacts (Low-level AI)
- **Path**: `POST /functions/v1/extract-contacts`
- **Auth**: Optional (currently `verify_jwt = false`)
- **Purpose**: Pure AI extraction without persistence
- **File**: `supabase/functions/extract-contacts/index.ts`

### 2. Process Upload (Full Workflow)
- **Path**: `POST /functions/v1/process-upload`
- **Auth**: Required (`verify_jwt = true`)
- **Purpose**: Complete workflow: create production → extract → persist contacts
- **File**: `supabase/functions/process-upload/index.ts`

### 3. List Productions
- **Path**: `GET /functions/v1/list-productions`
- **Auth**: Required (`verify_jwt = true`)
- **Purpose**: List all productions with optional search
- **File**: `supabase/functions/list-productions/index.ts`

### 4. Get Production Detail
- **Path**: `GET /functions/v1/get-production-detail?productionId=<uuid>`
- **Auth**: Required (`verify_jwt = true`)
- **Purpose**: Get production with uploads and contacts
- **File**: `supabase/functions/get-production-detail/index.ts`

## Shared Modules

### `_shared/auth.ts`
- JWT token verification
- Extracts user context from requests
- Used by all protected endpoints

### `_shared/extraction.ts`
- OpenAI API integration
- Document processing (text and images)
- JSON parsing and validation
- Used by `extract-contacts` and `process-upload`

### `_shared/supabase.ts`
- Service role Supabase client
- Database operations with full permissions
- Used by all functions that need database access

## Technology Stack

- **Runtime**: Deno (Supabase Edge Functions)
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI GPT-4o
- **Auth**: Supabase Auth (JWT)

## Deployment

These functions are deployed to Supabase Edge Functions. To deploy:

```bash
# Using Supabase CLI
supabase functions deploy extract-contacts
supabase functions deploy process-upload
supabase functions deploy list-productions
supabase functions deploy get-production-detail
```

## Environment Variables

Required environment variables (set in Supabase dashboard):

- `OPENAI_API_KEY`: OpenAI API key for AI extraction
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key (for auth verification)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for database operations)

## Future: Separate Backend Service

For enterprise-grade deployments, consider migrating to a dedicated backend service:

```
backend/
├── src/
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, etc.
│   └── utils/          # Shared utilities
├── tests/              # Backend tests
└── package.json
```

This would provide:
- Better control over infrastructure
- More sophisticated error handling
- Queue systems for async processing
- Better observability and monitoring
- More flexible deployment options

