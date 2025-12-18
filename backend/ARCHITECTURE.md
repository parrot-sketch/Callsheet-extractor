# Backend Architecture

## Overview

This is an enterprise-grade Node.js/Express backend service built with TypeScript, following clean architecture principles.

## Architecture Layers

### 1. Routes Layer (`src/routes/`)
- HTTP request handlers
- Request validation using Zod schemas
- Authentication middleware
- Calls service layer
- Returns HTTP responses

**Responsibilities:**
- Parse and validate HTTP requests
- Handle authentication
- Call appropriate services
- Format HTTP responses
- Handle errors

### 2. Services Layer (`src/services/`)
- Business logic orchestration
- Coordinates between repositories and external services
- No direct database access
- Transaction management

**Responsibilities:**
- Implement business rules
- Orchestrate data operations
- Call external APIs (OpenAI)
- Handle business-level errors

### 3. Repositories Layer (`src/repositories/`)
- Data access abstraction
- Database operations
- Query building
- Type-safe database interactions

**Responsibilities:**
- Abstract database operations
- Provide type-safe data access
- Handle database errors
- Map database results to domain types

### 4. Middleware (`src/middleware/`)
- Cross-cutting concerns
- Authentication
- Request validation
- Error handling
- Logging

### 5. Configuration (`src/config/`)
- Environment variable management
- Type-safe configuration
- Validation on startup

## Data Flow

```
HTTP Request
    ↓
Routes (validation, auth)
    ↓
Services (business logic)
    ↓
Repositories (data access)
    ↓
Database (Supabase PostgreSQL)
```

## Key Design Patterns

### 1. Repository Pattern
- Abstracts data access
- Makes services testable
- Allows easy database swapping

### 2. Service Layer Pattern
- Encapsulates business logic
- Coordinates multiple repositories
- Handles transactions

### 3. Dependency Injection
- Services receive repositories as constructor parameters
- Easy to mock for testing
- Loose coupling

### 4. Middleware Pattern
- Composable request processing
- Authentication, validation, error handling
- Reusable across routes

## Security Features

1. **Authentication**: JWT token verification via Supabase Auth
2. **Authorization**: User context attached to requests
3. **Input Validation**: Zod schema validation on all inputs
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **CORS**: Configurable origin whitelist
6. **Helmet**: Security headers
7. **Error Sanitization**: No sensitive data in error responses

## Error Handling

- Custom `AppError` class for application errors
- Centralized error handler middleware
- Zod validation errors formatted consistently
- Logging of all errors
- User-friendly error messages

## Logging

- Winston logger with multiple transports
- File logging (combined.log, error.log)
- Console logging in development
- Structured logging with metadata
- Log levels: error, warn, info, debug

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock repositories
- Test business logic

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flow

### E2E Tests
- Test complete workflows
- Test error scenarios

## Scalability Considerations

1. **Stateless Design**: No server-side sessions
2. **Horizontal Scaling**: Can run multiple instances
3. **Database Connection Pooling**: Handled by Supabase client
4. **Async Processing**: Ready for queue integration (BullMQ)
5. **Caching**: Can add Redis caching layer

## Future Enhancements

1. **Queue System**: BullMQ + Redis for async job processing
2. **File Storage**: S3 or Supabase Storage integration
3. **Webhooks**: Notify clients of async job completion
4. **Metrics**: Prometheus metrics endpoint
5. **API Documentation**: Swagger/OpenAPI
6. **GraphQL**: Optional GraphQL layer
7. **Microservices**: Split into smaller services if needed

## Deployment

### Docker
- Multi-stage build
- Production-optimized image
- Health checks

### Environment Variables
- All configuration via environment variables
- Type-safe configuration validation
- Example file provided

### Monitoring
- Health check endpoint
- Structured logging
- Ready for APM integration

