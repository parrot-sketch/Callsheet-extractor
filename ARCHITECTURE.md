# Callsheet Connector Architecture

## Overview

Callsheet Connector is an enterprise-grade application for extracting contact information from production callsheets using AI. The system supports multiple document formats and uses a modular architecture for maintainability and scalability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Pages     │  │ Components  │  │    Hooks    │  │     Lib     │ │
│  │  - Index    │  │ - Upload    │  │ - useAuth   │  │  - api.ts   │ │
│  │  - NotFound │  │ - Results   │  │ - useUpload │  │  - types    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JWT Auth)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend (Express + TypeScript)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Routes    │  │  Services   │  │ Repositories│  │  Middleware │ │
│  │ /productions│  │ - document/ │  │ - production│  │  - auth     │ │
│  │ /extraction │  │ - ai/       │  │ - upload    │  │  - validator│ │
│  │             │  │ - extraction│  │ - contact   │  │  - error    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │ PostgreSQL  │ │ OpenAI API  │ │Supabase Auth│
            │  (Docker)   │ │ (GPT-4o)    │ │   (JWT)     │
            └─────────────┘ └─────────────┘ └─────────────┘
```

## Document Processing Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Document Processing Pipeline                       │
│                                                                       │
│  ┌─────────────┐      ┌─────────────────────────────────────────┐   │
│  │   Input     │      │        Document Processor Service        │   │
│  │  (Data URL) │─────▶│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  └─────────────┘      │  │   PDF   │ │  Image  │ │  Text   │   │   │
│                       │  │Processor│ │Processor│ │Processor│   │   │
│                       │  └────┬────┘ └────┬────┘ └────┬────┘   │   │
│                       └───────┼───────────┼───────────┼─────────┘   │
│                               │           │           │              │
│                               ▼           ▼           ▼              │
│                       ┌─────────────────────────────────────────┐   │
│                       │              AI Module                   │   │
│                       │  ┌─────────────────┐ ┌────────────────┐ │   │
│                       │  │ Text Extraction │ │Vision Extraction│ │   │
│                       │  │  (extractText)  │ │ (extractImages) │ │   │
│                       │  └────────┬────────┘ └───────┬────────┘ │   │
│                       └───────────┼──────────────────┼──────────┘   │
│                                   │                  │               │
│                                   ▼                  ▼               │
│                       ┌─────────────────────────────────────────┐   │
│                       │          Extraction Result               │   │
│                       │  { contacts, emergency_contacts, ... }   │   │
│                       └─────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Directory Structure

```
backend/src/
├── config/              # Environment configuration (Zod validated)
├── database/
│   ├── postgres-client.ts   # Direct PostgreSQL connection
│   └── supabase-auth.ts     # Supabase client for JWT verification
├── middleware/
│   ├── auth.ts             # JWT authentication
│   ├── error-handler.ts    # Centralized error handling
│   └── validator.ts        # Zod request validation
├── repositories/           # Data access layer (Repository Pattern)
│   ├── production.repository.ts
│   ├── upload.repository.ts
│   └── contact.repository.ts
├── routes/                 # API route definitions
│   ├── productions.routes.ts
│   └── extraction.routes.ts
├── services/
│   ├── document/           # Document processing module
│   │   ├── index.ts        # Main processor service
│   │   ├── types.ts        # Type definitions
│   │   └── processors/     # Strategy pattern implementations
│   │       ├── pdf.processor.ts    # PDF handling (pdfjs-dist)
│   │       ├── image.processor.ts  # Image handling
│   │       └── text.processor.ts   # Plain text handling
│   ├── ai/                 # AI integration module
│   │   ├── index.ts        # Module exports
│   │   ├── openai.client.ts # OpenAI API wrapper with retry logic
│   │   └── prompts.ts      # Centralized prompt management
│   ├── extraction.service.ts # High-level extraction orchestration
│   └── production.service.ts # Business logic for productions
├── types/                  # Shared TypeScript types
└── utils/
    └── logger.ts           # Winston logging
```

### Design Patterns Used

| Pattern | Usage |
|---------|-------|
| **Strategy** | Document processors (PDF, Image, Text) |
| **Repository** | Data access abstraction |
| **Factory** | Document processor selection |
| **Singleton** | Database connections, OpenAI client |
| **Chain of Responsibility** | Processor selection |

## Frontend Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (15 components)
│   ├── AuthDialog.tsx   # Authentication UI
│   ├── FileUploadCard.tsx
│   ├── ExtractionResultsCard.tsx
│   ├── Header.tsx
│   ├── ProductionsView.tsx
│   └── ViewToggle.tsx
├── hooks/               # Custom React hooks
│   ├── use-auth.ts
│   ├── use-file-upload.ts
│   └── use-productions.ts
├── lib/                 # Utilities and API client
│   ├── api.ts
│   ├── extraction-types.ts
│   └── file-utils.ts
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
└── integrations/
    └── supabase/        # Supabase client for auth
```

## Document Type Support

| Format | Detection | Processing Strategy | AI Method |
|--------|-----------|---------------------|-----------|
| **PDF (text)** | `application/pdf` | pdfjs-dist text extraction | Text → GPT-4 |
| **PDF (scanned)** | PDF with <100 chars text | Convert to images | Vision → GPT-4 |
| **PNG/JPG/GIF/WebP** | `image/*` | Pass through | Vision → GPT-4 |
| **Plain text** | No data: prefix | Direct use | Text → GPT-4 |

## Security

- **Authentication**: JWT tokens via Supabase Auth
- **Authorization**: Token verification on all protected routes
- **Input validation**: Zod schemas for all API inputs
- **Rate limiting**: express-rate-limit middleware
- **Security headers**: Helmet.js
- **CORS**: Configurable origin whitelist

## Scalability Considerations

1. **Stateless backend**: Ready for horizontal scaling
2. **Connection pooling**: PostgreSQL pool with configurable limits
3. **Async processing**: Ready for queue-based processing (BullMQ)
4. **Modular design**: Easy to add new document processors
5. **Retry logic**: Exponential backoff for AI API calls

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui (15 components) |
| Backend | Express.js, TypeScript, Node.js 22 |
| Database | PostgreSQL 16 (Docker) |
| Authentication | Supabase Auth |
| AI | OpenAI GPT-4o |
| PDF Processing | pdfjs-dist (Mozilla PDF.js) |
| Logging | Winston |
| Validation | Zod |
