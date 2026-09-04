# Formular Backend Architecture

## Overview

This document outlines the production-ready backend architecture for Formular, featuring form sharing, user management, and LLM-powered response analysis.

## Tech Stack

### Core Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Prisma** - Database ORM with full TypeScript support
- **PostgreSQL** - Primary database
- **tRPC** - End-to-end type-safe API layer
- **Zod** - Runtime type validation
- **Redis** - Background job queues and caching
- **Bull** - Robust job queue system

### Authentication & Security
- **JWT** - Stateless authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Express rate limiting** - API protection

### AI/LLM Integration
- **OpenAI GPT-4** - Primary LLM for analysis
- **Custom Analysis Pipeline** - Extensible analysis framework

## Database Schema

### Core Models

#### User Management
- **User** - Core user entity with roles and organizations
- **Organization** - Multi-tenant organization support
- **Account/Session** - NextAuth.js compatible authentication

#### Form System
- **Form** - Dynamic form definitions with versioning
- **ShareSettings** - Form sharing configuration
- **SharedLink** - Public/private form sharing links
- **FormCollaborator** - Team collaboration on forms
- **FormVersion** - Form schema versioning and history

#### Data Collection
- **Submission** - Form response data with metadata
- **LLMAnalysis** - AI analysis results and insights
- **BackgroundJob** - Async job processing tracking

## API Architecture

### tRPC Routers

#### User Router (`/api/trpc/users`)
- User registration and authentication
- Profile management
- Admin user management

#### Forms Router (`/api/trpc/forms`)
- Form CRUD operations
- Form sharing and collaboration
- Template management
- Public form access via shared links

#### Submissions Router (`/api/trpc/submissions`)
- Submission collection and management
- Data export (JSON/CSV)
- Submission statistics

#### LLM Analysis Router (`/api/trpc/llmAnalysis`)
- AI-powered response analysis
- Bulk analysis operations
- Analysis insights and reporting
- Queue management

### REST API (Legacy Support)
- Backward compatible REST endpoints at `/api/v1/`
- Automatic redirects for deprecated endpoints

## Form Sharing System

### Access Control Levels
- **Private** - Owner and collaborators only
- **Restricted** - Specific users or domains
- **Public** - Anyone with the link

### Sharing Features
- Unique shareable links with custom slugs
- Expiration dates and submission limits
- Password protection
- Domain restrictions
- Anonymous submissions support

### Collaboration Features
- Multi-user form editing
- Role-based permissions (Viewer, Editor, Admin)
- Real-time collaboration tracking

## LLM Analysis System

### Analysis Types
1. **Sentiment Analysis** - Emotional tone and satisfaction
2. **Classification** - Automatic categorization
3. **Key Information Extraction** - Important data points
4. **Summary Generation** - Concise response summaries
5. **Custom Analysis** - User-defined analysis prompts

### Background Processing
- Asynchronous analysis using Bull queues
- Retry mechanisms for failed analyses
- Progress tracking and status updates
- Cost estimation and monitoring

### Analysis Pipeline
```
Submission Created → Queue Analysis Job → LLM Processing → Results Stored → Insights Generated
```

## Background Job System

### Job Types
- **LLM Analysis** - AI-powered response analysis
- **Email Notifications** - User alerts and updates
- **Data Export** - CSV/JSON export generation
- **Form Backup** - Automated form backups

### Queue Management
- Priority-based job processing
- Automatic retry with exponential backoff
- Job monitoring and statistics
- Queue health monitoring

## Security Features

### Authentication
- JWT-based stateless authentication
- Secure password hashing with bcrypt
- Role-based access control (RBAC)
- Session management

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection
- CORS configuration
- Rate limiting

### Privacy
- Anonymous submission support
- Data encryption at rest
- Audit logging
- GDPR-compliant data handling

## Performance Optimizations

### Database
- Optimized Prisma queries with proper includes
- Database indexes on frequently queried fields
- Connection pooling
- Query result caching

### API
- Efficient pagination
- Field selection optimization
- Response compression
- Request deduplication

### Background Processing
- Distributed job processing
- Queue prioritization
- Resource-aware job scheduling
- Automatic scaling capabilities

## Deployment Architecture

### Environment Configuration
- Development, staging, and production environments
- Environment-specific configurations
- Secret management
- Feature flags

### Scaling Strategy
- Horizontal scaling support
- Stateless application design
- Database connection pooling
- Redis cluster support

### Monitoring
- Application performance monitoring
- Queue health monitoring
- Error tracking and alerting
- Usage analytics

## Development Workflow

### Setup Commands
```bash
# Install dependencies
pnpm install

# Set up database
pnpm run migrate

# Generate Prisma client
pnpm run generate

# Start development server with workers
pnpm run dev

# Run server only
pnpm start

# Run workers only  
pnpm run workers
```

### Environment Variables
See `.env.example` for all required environment variables including:
- Database connection
- JWT secrets
- OpenAI API keys
- Redis configuration
- Email service settings

## API Usage Examples

### Form Creation
```typescript
const form = await trpc.forms.create.mutate({
  title: "Employee Onboarding",
  description: "New hire information collection",
  schema: {
    fields: [
      { id: "name", type: "text", label: "Full Name", required: true },
      { id: "email", type: "email", label: "Email", required: true }
    ]
  }
});
```

### Form Sharing
```typescript
const sharedLink = await trpc.forms.createSharedLink.mutate({
  formId: "form-id",
  settings: {
    accessType: "PUBLIC",
    expiresAt: new Date("2024-12-31"),
    maxSubmissions: 100
  }
});
```

### Submission Analysis
```typescript
const analysis = await trpc.llmAnalysis.analyzeSubmission.mutate({
  submissionId: "submission-id",
  analysisTypes: ["SENTIMENT", "CLASSIFICATION"]
});
```

## Future Enhancements

### Planned Features
- Real-time collaboration via WebSockets
- Advanced analytics dashboard
- Custom analysis model integration
- Multi-language support
- Enhanced export formats

### Scalability Improvements
- Microservices architecture
- GraphQL federation
- Advanced caching strategies
- Container orchestration

## Support and Documentation

- API documentation available via tRPC introspection
- Development setup guide in README.md
- Troubleshooting guide for common issues
- Performance tuning recommendations

---

This architecture provides a solid foundation for a scalable, secure, and feature-rich form management system with advanced AI capabilities.