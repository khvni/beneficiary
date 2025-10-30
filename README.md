# MyFundAction - Beneficiary Management System

A modern, centralized beneficiary and case management system built for MyFundAction NGO to manage 4,000+ beneficiaries monthly across global operations.

## Project Overview

This system replaces manual Google Forms and Excel spreadsheet processes with an efficient, scalable web application that serves:
- **180 full-time staff members**
- **18,000+ active volunteers** (90% youth)
- Operations across **5 countries** (Malaysia, New Zealand, Egypt, Indonesia, Africa, Japan)

## Tech Stack

### Frontend
- **Next.js 15** (App Router) with React 18
- **TypeScript** (strict mode)
- **Shadcn UI** + Tailwind CSS + Radix UI
- **React Hook Form** + Zod validation
- **Zustand** (global state) + React Query (server state)

### Backend
- **Next.js API Routes** (serverless)
- **Prisma ORM**
- **PostgreSQL** (Vercel Postgres for dev, Supabase for production)

### Authentication
- **NextAuth v5** (Auth.js)
- **Role-based access control (RBAC)**
- Roles: Super Admin, Admin, Staff, Field Worker, Volunteer

### Features
- Beneficiary registration and management
- Case tracking and assignment
- Service logging and history
- CSV import from Google Forms
- Real-time dashboard analytics
- Mobile-responsive design
- Multi-language support (English + Bahasa Malaysia planned)

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beneficiary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your database credentials and other required keys:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/beneficiary_dev"
   DIRECT_URL="postgresql://user:password@localhost:5432/beneficiary_dev"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
npm test             # Run unit tests with Vitest
npm run test:e2e     # Run E2E tests with Playwright
```

## Database Schema

The system uses the following core models:

- **Beneficiary**: Personal information, contact details, categorization
- **Case**: Issues/needs tracking with status management
- **Service**: Log of all services provided to beneficiaries
- **Document**: File attachments (photos, ID cards, etc.)
- **User**: Staff, volunteers, and administrators
- **AuditLog**: Track all critical actions

See `prisma/schema.prisma` for the complete schema.

## Project Structure

```
beneficiary/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── beneficiaries/ # Beneficiary management
│   │   ├── cases/         # Case management
│   │   ├── services/      # Service tracking
│   │   └── settings/      # User settings
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth endpoints
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # Shadcn UI components
│   └── nav.tsx            # Navigation component
├── lib/                   # Utilities and configurations
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # Helper functions
│   └── validation.ts      # Zod schemas
├── prisma/                # Database schema and migrations
│   └── schema.prisma      # Prisma schema
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Authentication & Authorization

### User Roles

- **SUPER_ADMIN**: Full system access, user management, settings
- **ADMIN**: Manage beneficiaries, cases, services, reports
- **STAFF**: Create/edit beneficiaries, manage assigned cases
- **FIELD_WORKER**: Mobile-focused, create beneficiaries, log services
- **VOLUNTEER**: Read-only access to assigned beneficiaries/cases

### Protected Routes

All routes under `/dashboard/*` require authentication. The middleware handles:
- Redirecting unauthenticated users to `/login`
- Redirecting authenticated users away from `/login`
- Role-based access control for specific routes

## Development Guidelines

### Adding a New Page

1. Create a new file in `app/(dashboard)/your-route/page.tsx`
2. Add the route to navigation in `components/nav.tsx`
3. Implement the page component with proper TypeScript types

### Creating API Endpoints

1. Create a file in `app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, `PATCH`, `DELETE` handlers
3. Use `requireAuth()` or `requireRole()` for authorization
4. Validate input with Zod schemas from `lib/validation.ts`

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Update TypeScript types as needed
4. Regenerate Prisma Client with `npx prisma generate`

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import project from GitHub
   - Set environment variables in Vercel dashboard
   - Deploy

3. **Set up database**
   - Use Vercel Postgres (dev) or Supabase (production)
   - Add `DATABASE_URL` and `DIRECT_URL` to environment variables

4. **Configure domains**
   - Add custom domain: `beneficiary.myfundaction.org`

### Environment Variables for Production

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection for migrations
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - Strong secret for JWT signing

Optional:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage
- `CLOUDINARY_*` - Cloudinary credentials for file uploads
- `RESEND_API_KEY` - Email notifications
- `SENTRY_DSN` - Error tracking
- `NEXT_PUBLIC_POSTHOG_KEY` - Analytics

## Success Metrics (MVP Goals)

- Beneficiary creation: **< 2 minutes** per beneficiary (vs. 10+ minutes currently)
- Data accuracy: **95%+ validation pass rate** on imports
- Mobile usage: **70%+ of field entries** from mobile devices
- User adoption: **80%+ of staff** actively using within 30 days
- Service tracking: **100% of services** linked to beneficiaries
- Reporting: Generate reports in **< 10 seconds**

## Roadmap

### Phase 1 - MVP (Current)
- ✅ Project scaffolding and setup
- ⏳ Beneficiary CRUD operations
- ⏳ Case management
- ⏳ Service tracking
- ⏳ CSV import functionality
- ⏳ Basic reporting dashboard

### Phase 2 - Post-Demo
- Advanced search and filtering
- Beneficiary deduplication
- Email/WhatsApp notifications
- Custom fields per category
- Advanced reporting with date ranges
- Export to Excel with formatting

### Phase 3 - Future
- Mobile app (React Native)
- Offline support (PWA)
- Geo-location for rescues
- AI-assisted photo matching
- Integration with volunteer management
- Multi-language support expansion

## Contributing

This project is part of the MyFundAction NGO initiative. For contributions:

1. Follow conventional commit format: `feat:`, `fix:`, `chore:`, etc.
2. Create feature branches from `main`
3. Write tests for new features
4. Update documentation as needed

## Support

For issues, questions, or feature requests:
- Create an issue in the repository
- Contact the development team
- Refer to PROMPT.md for detailed specifications

## License

Proprietary - MyFundAction (Yayasan Kebajikan Muslim)

---

**Built with ❤️ for MyFundAction NGO**
