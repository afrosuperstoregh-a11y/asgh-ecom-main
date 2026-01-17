# E-commerce Platform

A modern, scalable e-commerce platform built with Next.js, React, TypeScript, and Docker.

## Features

- **Phase 0: Foundation & Infrastructure**
  - Dockerized development environment
  - PostgreSQL database
  - Redis for caching
  - Typesense for search
  - Hot-reload support

- **Phase 1: Core MVP**
  - Product catalog
  - Shopping cart
  - Checkout with Stripe
  - Order management
  - User authentication

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Node.js (v18+)
- npm (v9+)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Access the applications**
   - Client: http://localhost:3000
   - API: http://localhost:3001
   - Adminer (Database GUI): http://localhost:8080

## Development

### Client
- Location: `/client`
- Framework: Next.js 13+ with TypeScript
- Styling: Tailwind CSS
- State Management: React Query
- Form Handling: React Hook Form

### API
- Location: `/api`
- Framework: Next.js API Routes
- Database: PostgreSQL with Prisma
- Authentication: NextAuth.js
- Validation: Zod

## Database

### Prisma Migrations
To create and apply migrations:

```bash
docker-compose exec api npx prisma migrate dev --name init
```

### Prisma Studio
To access the database GUI:

```bash
docker-compose exec api npx prisma studio
```

## Testing

### Run tests
```bash
docker-compose exec api npm test
```

### Run linter
```bash
docker-compose exec api npm run lint
```

## Production Deployment

1. Update environment variables for production
2. Build the production images:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```
3. Start the services:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Environment Variables

See `.env.example` for all available environment variables.

## License

MIT
