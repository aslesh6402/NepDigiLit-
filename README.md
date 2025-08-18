# NepDigiLit Portal

A comprehensive AI-powered educational platform for digital literacy and cybersecurity awareness, specifically designed for students in Bagmati Province, Nepal.

## Features

- **Interactive Learning Modules**: Comprehensive courses on digital literacy and cybersecurity
- **AI-Powered Assistant**: Personalized learning support and instant feedback
- **Progress Tracking**: Detailed analytics and achievement system
- **Teacher Dashboard**: Monitor student progress and class performance
- **Mobile Responsive**: Optimized for mobile devices and low-bandwidth networks
- **Multi-language Support**: English and Nepali language support

## Tech Stack

- **Frontend & Backend**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose
- **Authentication**: NextAuth.js
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd digital-literacy-portal
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration.

3. **Start with Docker (Recommended)**

   ```bash
   # Build and start all services
   npm run docker:up

   # Generate Prisma client and run migrations
   docker-compose exec app npx prisma generate
   docker-compose exec app npx prisma db push
   docker-compose exec app npx prisma db seed
   ```

4. **Or start locally**

   ```bash
   # Install dependencies
   npm install

   # Start PostgreSQL (ensure it's running)
   # Update DATABASE_URL in .env to point to your local PostgreSQL

   # Generate Prisma client and setup database
   npm run db:generate
   npm run db:push
   npx prisma db seed

   # Start development server
   npm run dev
   ```

5. **Access the application**
   - Web App: http://localhost:3000
   - Prisma Studio: http://localhost:5555 (run `npm run db:studio`)

## Docker Commands

```bash
# Build and start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
docker-compose logs -f

# Access app container
docker-compose exec app sh

# Access database
docker-compose exec postgres psql -U postgres -d digital_literacy
```

## Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npx prisma db seed
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── modules/           # Learning modules
│   └── dashboard/         # User dashboards
├── lib/                   # Utility libraries
│   ├── stores/            # Zustand stores
│   └── prisma.ts          # Prisma client
├── prisma/                # Database schema and migrations
├── components/            # Reusable React components
├── docker-compose.yml     # Docker services configuration
├── Dockerfile            # Application container
└── README.md
```

## API Endpoints

- `GET /api/modules` - Fetch all modules
- `GET /api/modules/[id]` - Fetch specific module
- `POST /api/progress` - Update user progress
- `GET /api/progress?userId=` - Fetch user progress
- `POST /api/chat` - AI chat interaction
- `POST /api/users` - Create new user

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
