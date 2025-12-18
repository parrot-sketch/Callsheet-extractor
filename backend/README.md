# Call Sheet Connector Backend

Enterprise-grade backend service for production call sheet contact extraction.

## Architecture

This backend follows a clean architecture pattern with clear separation of concerns:

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── database/         # Database clients
│   ├── middleware/       # Express middleware (auth, validation, error handling)
│   ├── repositories/     # Data access layer
│   ├── services/         # Business logic layer
│   ├── routes/           # API route handlers
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions (logger, etc.)
│   └── index.ts          # Application entry point
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- ✅ **TypeScript**: Full type safety
- ✅ **Express.js**: Fast, unopinionated web framework
- ✅ **Authentication**: JWT-based auth with Supabase
- ✅ **Validation**: Zod schema validation
- ✅ **Error Handling**: Centralized error handling
- ✅ **Logging**: Winston logger with file and console outputs
- ✅ **Security**: Helmet, CORS, rate limiting
- ✅ **Clean Architecture**: Repository pattern, service layer
- ✅ **Database**: Supabase PostgreSQL integration

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key

### 3. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Production Management

- `POST /api/v1/productions/upload` - Process call sheet upload
- `GET /api/v1/productions` - List productions
- `GET /api/v1/productions/detail?productionId=<uuid>` - Get production detail

### Extraction

- `POST /api/v1/extraction/extract` - Extract contacts (low-level AI)

### Health Check

- `GET /health` - Server health status

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - Type check without building

### Code Structure

- **Repositories**: Data access layer, abstract database operations
- **Services**: Business logic, orchestrate repositories and external services
- **Routes**: HTTP handlers, validate requests, call services
- **Middleware**: Cross-cutting concerns (auth, validation, errors)

## Testing

```bash
npm test
```

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Environment Variables

Ensure all required environment variables are set in your deployment environment.

## Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output in development

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- JWT authentication required for all endpoints
- Input validation with Zod
- Error messages sanitized in production

## Future Enhancements

- [ ] Queue system for async processing (BullMQ + Redis)
- [ ] File storage integration (S3, Supabase Storage)
- [ ] Webhook support for async job completion
- [ ] Metrics and monitoring (Prometheus)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] Docker Compose for local development

