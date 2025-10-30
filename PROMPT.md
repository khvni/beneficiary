# Beneficiary Management System - MyFundAction

## 1. PROJECT CONTEXT

### About MyFundAction
MyFundAction (Yayasan Kebajikan Muslim) is a youth-driven Malaysian NGO established in 2014, dedicated to helping low-income groups, underprivileged communities, and senior citizens. The organization operates globally across 5 countries with:
- **18,000+ active volunteers** (90% youth)
- **180 full-time staff members**
- **Global operations** in Malaysia, New Zealand, Egypt, Indonesia, Africa, and Japan
- **Islamic charity focus** including programs like Homeless Care, food distribution, shelter services, and more

### Problem Statement
MyFundAction currently manages **4,000+ new beneficiaries monthly** using Google Forms and Excel spreadsheets. This manual process is:
- **Inefficient**: Data entry duplication, manual tracking, difficult reporting
- **Error-prone**: Inconsistent data formats, missing information, validation issues
- **Unscalable**: Cannot handle growing database and increasing staff/volunteer usage
- **Limited accessibility**: 180 staff and 18,000 volunteers need seamless access

The organization needs a **centralized, efficient, reliable system** to manage beneficiaries and track services provided to them, inspired by their Homeless Care Programme but customizable for various use cases (food distribution, shelter services, healthcare, education, etc.).

### Current State & Pain Points
- Data scattered across multiple Google Forms
- Excel spreadsheets prone to corruption and version conflicts
- No real-time visibility into beneficiary status
- Difficult to track service history per beneficiary
- No mobile-friendly interface for field workers
- Limited reporting and analytics capabilities
- No integration with other systems (volunteer management, CRM, projects)

### Success Metrics for MVP
- **Beneficiary creation**: < 2 minutes per beneficiary (vs. 10+ minutes currently)
- **Data accuracy**: 95%+ validation pass rate on imports
- **Mobile usage**: 70%+ of field entries from mobile devices
- **User adoption**: 80%+ of staff actively using within 30 days
- **Service tracking**: 100% of services linked to beneficiaries
- **Reporting**: Generate reports in < 10 seconds

---

## 2. TECHNICAL ARCHITECTURE

### Tech Stack

**Frontend:**
- Next.js 15 (App Router) with React 19
- TypeScript (strict mode)
- Shadcn UI + Tailwind CSS + Radix UI
- React Hook Form + Zod validation
- next-intl (English + Bahasa Malaysia)

**Backend:**
- Next.js API Routes (serverless)
- Prisma ORM
- Vercel Postgres (development)
- Supabase PostgreSQL (production - cost-effective at scale)

**Authentication:**
- NextAuth v5 (Auth.js)
- Role-based access control (RBAC)
- Roles: Super Admin, Admin, Staff, Field Worker, Volunteer (read-only)

**File Storage:**
- Vercel Blob (development)
- Cloudinary (production - beneficiary photos, documents)

**Email/Notifications:**
- Resend for email notifications
- Web Push API for browser notifications

**State Management:**
- Zustand for global UI state
- React Query for server state management

**Testing:**
- Vitest for unit/integration tests
- Playwright MCP for E2E testing

**Analytics & Monitoring:**
- Vercel Analytics
- Sentry for error tracking
- Posthog for user behavior analytics

### Suggested Prisma Schema

```prisma
// schema.prisma

model Beneficiary {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Personal Information
  firstName     String
  lastName      String
  dateOfBirth   DateTime?
  gender        Gender?
  nationality   String?
  idNumber      String?  @unique // IC number or passport

  // Contact Information
  phone         String?
  email         String?
  address       String?
  city          String?
  state         String?
  postcode      String?

  // Emergency Contact
  emergencyName  String?
  emergencyPhone String?
  emergencyRelation String?

  // Beneficiary Details
  category      BeneficiaryCategory
  status        BeneficiaryStatus @default(ACTIVE)
  priority      Priority @default(MEDIUM)
  notes         String?  @db.Text
  tags          String[] // ["homeless", "elderly", "disabled"]

  // Photos & Documents
  photoUrl      String?
  documents     Document[]

  // Relationships
  cases         Case[]
  services      Service[]
  createdBy     User   @relation("BeneficiaryCreator", fields: [createdById], references: [id])
  createdById   String
  assignedTo    User?  @relation("BeneficiaryAssignee", fields: [assignedToId], references: [id])
  assignedToId  String?

  // Metadata
  source        String? // "google_form", "manual_entry", "referral"
  externalId    String? // For migration from old system

  @@index([status])
  @@index([category])
  @@index([createdAt])
}

model Case {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  title         String
  description   String   @db.Text
  type          CaseType
  priority      Priority @default(MEDIUM)
  status        CaseStatus @default(OPEN)

  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)
  beneficiaryId String

  assignedTo    User[]   @relation("CaseAssignees")
  createdBy     User     @relation("CaseCreator", fields: [createdById], references: [id])
  createdById   String

  services      Service[]

  resolvedAt    DateTime?

  @@index([status])
  @@index([beneficiaryId])
}

model Service {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  type          ServiceType
  date          DateTime
  description   String?  @db.Text
  quantity      Int?     // e.g., number of meals, nights of shelter
  cost          Decimal? @db.Decimal(10, 2)

  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)
  beneficiaryId String

  case          Case?    @relation(fields: [caseId], references: [id])
  caseId        String?

  providedBy    User     @relation(fields: [providedById], references: [id])
  providedById  String

  location      String?
  notes         String?  @db.Text

  @@index([type])
  @@index([beneficiaryId])
  @@index([date])
}

model Document {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())

  name          String
  type          String   // "id_card", "medical_report", "photo", etc.
  url           String
  size          Int      // bytes
  mimeType      String

  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)
  beneficiaryId String

  uploadedBy    User     @relation(fields: [uploadedById], references: [id])
  uploadedById  String
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  role          UserRole
  organization  String?  // For partners
  phone         String?

  // Relations
  createdBeneficiaries Beneficiary[] @relation("BeneficiaryCreator")
  assignedBeneficiaries Beneficiary[] @relation("BeneficiaryAssignee")
  createdCases  Case[]   @relation("CaseCreator")
  assignedCases Case[]   @relation("CaseAssignees")
  providedServices Service[]
  uploadedDocuments Document[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum BeneficiaryCategory {
  HOMELESS
  ELDERLY
  DISABLED
  LOW_INCOME
  REFUGEE
  ORPHAN
  SICK
  OTHER
}

enum BeneficiaryStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
  DECEASED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum CaseType {
  FOOD
  SHELTER
  HEALTHCARE
  EDUCATION
  IDENTITY_DOCUMENTS
  EMPLOYMENT
  OTHER
}

enum CaseStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum ServiceType {
  FOOD_DISTRIBUTION
  SHELTER_ADMISSION
  SHELTER_EXIT
  MEDICAL_CHECKUP
  COUNSELING
  EDUCATION
  FINANCIAL_AID
  RESCUE
  OTHER
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  STAFF
  FIELD_WORKER
  VOLUNTEER
}
```

### Authentication & Authorization Strategy

**Roles & Permissions:**
- **Super Admin**: Full system access, user management, settings
- **Admin**: Manage beneficiaries, cases, services, reports (limited settings)
- **Staff**: Create/edit beneficiaries, manage assigned cases, view reports
- **Field Worker**: Mobile-focused, create beneficiaries, log services, view assigned cases
- **Volunteer**: Read-only access to assigned beneficiaries/cases

**Row-Level Security:**
- Users can only see beneficiaries/cases assigned to them (unless Admin+)
- Organization-based filtering for partner organizations
- Audit logs for all CRUD operations on sensitive data

### API Design Patterns

**RESTful API Routes:**
```
/api/beneficiaries
  GET    - List beneficiaries (paginated, filtered)
  POST   - Create beneficiary

/api/beneficiaries/[id]
  GET    - Get single beneficiary
  PATCH  - Update beneficiary
  DELETE - Soft delete (archive)

/api/beneficiaries/[id]/services
  GET    - List services for beneficiary
  POST   - Log new service

/api/beneficiaries/[id]/cases
  GET    - List cases for beneficiary
  POST   - Create case

/api/cases
  GET    - List cases (paginated, filtered)
  POST   - Create case

/api/cases/[id]
  GET    - Get single case
  PATCH  - Update case status
  DELETE - Soft delete

/api/import
  POST   - Import beneficiaries from CSV/JSON

/api/export
  POST   - Export beneficiaries to CSV/Excel

/api/reports
  GET    - Generate reports (services by type, beneficiaries by category, etc.)
```

---

## 3. MVP FEATURE SPECIFICATION

### Must-Have (Phase 1 - MVP Demo)

**Beneficiary Management:**
- ✅ Create new beneficiary with comprehensive form
- ✅ View beneficiary list (table view with search, filter, sort)
- ✅ View beneficiary details page (profile, services history, cases)
- ✅ Edit beneficiary information
- ✅ Soft delete (archive) beneficiaries
- ✅ Upload beneficiary photo
- ✅ Tag system for categorization

**Case Management:**
- ✅ Create cases linked to beneficiaries
- ✅ Assign cases to staff/volunteers
- ✅ Update case status (Open → In Progress → Resolved → Closed)
- ✅ View case list and details

**Service Tracking:**
- ✅ Log services provided to beneficiaries
- ✅ Link services to cases
- ✅ View service history per beneficiary
- ✅ Basic service types (Food, Shelter, Healthcare, etc.)

**Data Import:**
- ✅ CSV import from Google Forms exports
- ✅ Data validation and error reporting
- ✅ Bulk import with preview

**Basic Reporting:**
- ✅ Beneficiaries by category
- ✅ Services by type (last 30 days)
- ✅ Active cases summary

**Authentication:**
- ✅ Email/password login
- ✅ Role-based access control
- ✅ User management (Admin only)

**Mobile-Friendly:**
- ✅ Responsive design (mobile-first)
- ✅ Touch-friendly forms
- ✅ Quick-add beneficiary (simplified form)

### Should-Have (Phase 2 - Post-Demo)

- Multiple beneficiary photos/documents upload
- Advanced search (full-text search across all fields)
- Beneficiary deduplication detection
- Case assignment workflow (notifications)
- Service templates/presets
- Custom fields per beneficiary category
- Advanced reporting with date ranges, filters
- Export to Excel with formatting
- Audit logs and activity history
- Email notifications for case updates
- WhatsApp integration for notifications
- PWA (offline support for field workers)

### Could-Have (Future Enhancements)

- Mobile app (React Native/Capacitor)
- Geo-location tracking for rescues
- Photo recognition (AI-assisted beneficiary matching)
- Integration with volunteer management system
- Integration with CRM (donor linking)
- SMS notifications
- Multi-language support (expand beyond English/Bahasa)
- Custom reporting builder
- Data visualization dashboards
- Beneficiary self-service portal
- Family/household grouping

### Out of Scope

- Payment processing (handled by separate system)
- Inventory management
- Donation tracking (CRM handles this)
- Volunteer scheduling (handled by volunteer-mgmt system)
- Project management features

---

## 4. MCP SERVER UTILIZATION GUIDE

### sequential-thinking
**Use for:**
- Complex architectural decisions (e.g., "How should we structure beneficiary categories for maximum flexibility?")
- Database schema design validation
- Performance optimization strategies
- Debugging complex state management issues
- Planning multi-step migrations

**Example:**
```
Use sequential-thinking to analyze: "What's the best approach for importing 10,000+ beneficiaries from multiple Google Forms with inconsistent data formats?"
```

### filesystem
**Use for:**
- Reading multiple component files simultaneously
- Batch file operations (creating components, utilities)
- Project structure analysis
- Finding specific code patterns across files

### fetch
**Use for:**
- Researching Next.js 15 App Router best practices
- Finding Prisma migration examples
- Studying React Hook Form + Zod patterns
- Looking up Shadcn UI component documentation

### deepwiki
**Use for:**
- Exploring Frappe Changemakers repo (github.com/frappe/changemakers)
- Studying similar beneficiary management systems
- Understanding best practices from established projects

**Example repos to explore:**
- frappe/changemakers - Beneficiary management inspiration
- TailAdmin/free-nextjs-admin-dashboard - Dashboard UI patterns
- shadcn-ui/* - Component patterns

### allpepper-memory-bank
**Use for:**
- Storing project decisions and architecture choices
- Documenting custom patterns and conventions
- Tracking migration strategies from Google Forms
- Recording learned lessons during development

**Files to create:**
- `architecture-decisions.md` - Key technical choices
- `data-migration-plan.md` - Google Forms import strategy
- `beneficiary-categories.md` - Category definitions
- `service-types.md` - Service type taxonomy

### playwright (MCP)
**Use for:**
- E2E testing critical user flows:
  - Beneficiary creation workflow
  - Case management workflow
  - Data import process
  - Login and authentication
- Automated visual regression testing
- Screenshot generation for documentation

**Example test:**
```typescript
// Test beneficiary creation workflow
test('create beneficiary from field worker role', async ({ page }) => {
  await page.goto('/beneficiaries/new');
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'Beneficiary');
  await page.selectOption('[name="category"]', 'HOMELESS');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/beneficiaries\/[a-z0-9]+/);
});
```

### puppeteer
**Use for:**
- Browser automation for testing
- Generating PDF reports
- Screenshot capture for admin dashboards

---

## 5. REFERENCE IMPLEMENTATIONS

### GitHub Repositories to Clone/Reference

**Primary Reference:**
1. **Frappe Changemakers** - https://github.com/frappe/changemakers
   - Concepts: Beneficiary, Cases, Services, Rescue, Shelter tracking
   - Study their data model and workflow
   - **Note**: Python/Frappe framework, adapt concepts to Next.js

**Next.js Templates:**
2. **TailAdmin Next.js** - https://github.com/TailAdmin/free-nextjs-admin-dashboard
   - Use as base template for admin dashboard
   - 400+ UI components, form patterns
   - Table, charts, authentication UI

3. **Next Shadcn Dashboard Starter** - https://github.com/Kiranism/next-shadcn-dashboard-starter
   - Modern Next.js 15 + Shadcn UI
   - Clean architecture patterns

**Form & Data Management:**
4. **Taxonomy** - https://github.com/shadcn-ui/taxonomy
   - Shadcn UI patterns
   - Form handling examples
   - Authentication flows

### Similar Projects to Study

- **Primero** (open-source case management for child protection)
- **OpenMRS** (medical records system - service tracking patterns)
- **Salesforce NPSP** (nonprofit beneficiary/contact management concepts)

### Recommended Tutorials/Docs

- **Next.js 15 App Router**: https://nextjs.org/docs
- **Prisma with Next.js**: https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql
- **NextAuth v5**: https://authjs.dev/getting-started/installation
- **Shadcn UI**: https://ui.shadcn.com/docs
- **React Hook Form + Zod**: https://react-hook-form.com/get-started#SchemaValidation

---

## 6. DATA MIGRATION & INTEGRATION

### Import from Google Forms/Excel

**Current Data Format:**
- Google Forms responses exported as CSV
- Columns vary by form (inconsistent structure)
- Estimated 20+ different Google Forms in use
- ~4,000 new entries per month across all forms

**Migration Strategy:**

**Phase 1: Data Audit**
1. Export all Google Forms responses as CSV
2. Use MCP filesystem to analyze CSV structures
3. Create mapping document: Google Forms fields → Beneficiary model
4. Identify missing required fields
5. Document data quality issues

**Phase 2: CSV Import Utility**
Create `/api/import` endpoint with:
- CSV parsing (use `papaparse` library)
- Column mapping UI (map CSV columns to beneficiary fields)
- Data validation (Zod schemas)
- Error reporting (row-by-row validation results)
- Preview mode (show first 10 mapped entries)
- Batch import (process in chunks of 100)

**Example CSV Import Flow:**
```typescript
// lib/import/csv-parser.ts
import Papa from 'papaparse';

export async function parseBeneficiaryCSV(file: File) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Validate each row with Zod
        const validated = results.data.map((row) => {
          return beneficiarySchema.safeParse(mapCSVRow(row));
        });
        resolve(validated);
      },
      error: reject,
    });
  });
}
```

**Phase 3: Deduplication**
- Detect duplicates based on:
  - Phone number (primary)
  - IC/Passport number
  - Name + DOB combination
- Show duplicate candidates before import
- Merge or skip strategy

**Data Validation Rules:**
- Required fields: firstName, lastName, category
- Phone format: Malaysian (+60) validation
- IC number: Malaysian format validation
- Email: RFC 5322 validation
- Date of birth: Must be in past, reasonable age range

### Integration with Other MyFundAction Systems

**Volunteer Management Integration:**
- Link beneficiaries to volunteers (assigned field workers)
- Share user authentication (single sign-on)
- Sync volunteer availability for case assignments

**CRM Integration:**
- Link beneficiaries to donors (funding source tracking)
- Share contact data models
- Sync for holistic supporter view

**Project Dashboard Integration:**
- Beneficiary services can be linked to projects
- Project metrics include beneficiary impact
- Real-time updates on services provided

**Shared Data Models:**
```typescript
// types/shared.ts (shared across all 6 projects)
export interface Address {
  street?: string;
  city: string;
  state: string;
  postcode?: string;
  country: string;
}

export interface Contact {
  phone?: string;
  email?: string;
  preferredContact: 'phone' | 'email' | 'whatsapp';
}

export interface AuditLog {
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: object;
}
```

---

## 7. GIT WORKTREE WORKFLOW

### Setting Up Worktree for Isolated Development

**Why Worktrees?**
- Develop all 6 projects simultaneously with separate Claude Code instances
- Keep main repository clean
- Switch between projects without stashing changes
- Easy testing of cross-project integrations

**Create Worktree:**
```bash
# From main repository root: /Users/khani/Desktop/projs/myfundaction-protos

# Create worktree for beneficiary system
git worktree add -b beneficiary/main ../myfundaction-worktrees/beneficiary beneficiary

# Navigate to worktree
cd ../myfundaction-worktrees/beneficiary

# Open in VS Code (or your editor)
code .

# Start Claude Code in this directory
claude-code
```

**Worktree Structure:**
```
myfundaction-protos/          (main repo)
├── beneficiary/              (this project)
├── volunteer-mgmt/
├── projs-dashboard/
└── ...

myfundaction-worktrees/       (worktrees)
├── beneficiary/              (isolated working tree)
├── volunteer-mgmt/
├── projs-dashboard/
└── ...
```

### Branch Naming Conventions

**Main branch per project:**
- `beneficiary/main`
- `volunteer-mgmt/main`
- `projs-dashboard/main`
- etc.

**Feature branches:**
- `beneficiary/feat/import-csv`
- `beneficiary/feat/case-management`
- `beneficiary/fix/phone-validation`
- `beneficiary/chore/update-deps`

**Conventional Commits:**
```bash
git commit -m "feat(beneficiary): add CSV import with validation"
git commit -m "fix(beneficiary): correct phone number format validation"
git commit -m "docs(beneficiary): update API documentation"
git commit -m "test(beneficiary): add E2E tests for beneficiary creation"
```

### Commit Strategy

**IMPORTANT: Commit frequently as you build!**

**After each significant change:**
```bash
# Add files
git add .

# Commit with descriptive message
git commit -m "feat(beneficiary): implement beneficiary list with pagination"

# Push to remote (for backup and collaboration)
git push origin beneficiary/main
```

**Commit Checklist:**
- ✅ After creating new components
- ✅ After implementing new features
- ✅ After writing tests
- ✅ After fixing bugs
- ✅ Before switching to another task
- ✅ At least 3-5 times per hour during active development

**Good commit messages:**
```
✅ "feat(beneficiary): add Prisma schema for beneficiaries, cases, services"
✅ "feat(beneficiary): create beneficiary form with validation"
✅ "feat(beneficiary): implement CSV import preview UI"
✅ "fix(beneficiary): correct date format in service logs"
✅ "test(beneficiary): add unit tests for beneficiary validation"
```

**Bad commit messages:**
```
❌ "update"
❌ "wip"
❌ "changes"
❌ "fix stuff"
```

### TodoWrite Tool Usage

**Use TodoWrite throughout development:**

```typescript
// Example: Breaking down beneficiary form implementation
TodoWrite([
  { content: "Create Prisma schema for Beneficiary model", status: "completed" },
  { content: "Create beneficiary form component", status: "in_progress" },
  { content: "Add Zod validation for form fields", status: "pending" },
  { content: "Implement form submission API route", status: "pending" },
  { content: "Add photo upload functionality", status: "pending" },
  { content: "Write unit tests for validation", status: "pending" },
]);
```

**Update todos as you progress** - mark completed, add new ones as discovered.

---

## 8. DEPLOYMENT STRATEGY

### Vercel Project Setup

**Create New Vercel Project:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from beneficiary directory
cd /path/to/worktree/beneficiary
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: myfundaction-beneficiary
# - Directory: ./
# - Build command: next build
# - Output directory: .next
# - Development command: next dev
```

**Vercel Project Settings:**
- **Framework Preset**: Next.js
- **Node Version**: 18.x or 20.x
- **Build Command**: `next build`
- **Install Command**: `npm install` or `yarn install`
- **Root Directory**: `./` (or `beneficiary/` if deploying from main repo)

### Environment Variables

**Required for Development (.env.local):**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/beneficiary_dev"
DIRECT_URL="postgresql://user:password@localhost:5432/beneficiary_dev" # Prisma migrations

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_token_here"

# Email (Resend)
RESEND_API_KEY="re_your_key_here"

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_your_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

**Required for Production (Vercel Dashboard):**
```bash
# Supabase Database
DATABASE_URL="postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://beneficiary.myfundaction.org"
NEXTAUTH_SECRET="strong-production-secret-here"

# Cloudinary (file storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Resend
RESEND_API_KEY="re_production_key"

# Sentry
SENTRY_DSN="https://xxx@yyy.ingest.sentry.io/zzz"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="production_key"
```

### Database Migrations

**Local Development:**
```bash
# Create migration
npx prisma migrate dev --name add_beneficiary_model

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

**Production (Vercel):**
```bash
# Add to package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

**Or use Vercel Build Command:**
```bash
prisma migrate deploy && prisma generate && next build
```

### Performance Optimization

**Next.js Configuration:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For CSV uploads
    },
  },
};

module.exports = nextConfig;
```

**ISR (Incremental Static Regeneration):**
```typescript
// app/beneficiaries/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BeneficiariesPage() {
  const beneficiaries = await prisma.beneficiary.findMany();
  // ...
}
```

**Edge Functions for API Routes:**
```typescript
// app/api/beneficiaries/route.ts
export const runtime = 'edge'; // Deploy to edge

export async function GET(request: Request) {
  // ...
}
```

**Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src={beneficiary.photoUrl}
  alt={beneficiary.name}
  width={200}
  height={200}
  className="rounded-full"
  priority={false} // Lazy load
/>
```

### Custom Domain Configuration

**Vercel Dashboard:**
1. Go to Project Settings → Domains
2. Add custom domain: `beneficiary.myfundaction.org`
3. Configure DNS (CNAME or A record)
4. Automatic HTTPS via Let's Encrypt

**DNS Records (Cloudflare/Route53/etc.):**
```
Type: CNAME
Name: beneficiary
Value: cname.vercel-dns.com
```

---

## 9. SECURITY & COMPLIANCE

### Data Encryption

**At Rest:**
- Vercel Postgres: Encrypted by default
- Supabase: AES-256 encryption
- Cloudinary: Encrypted storage

**In Transit:**
- HTTPS enforced (Vercel automatic)
- TLS 1.3 for database connections

**Sensitive Fields:**
```typescript
// Encrypt sensitive data before storing
import { encrypt, decrypt } from '@/lib/crypto';

// Store encrypted IC number
const encryptedIC = await encrypt(beneficiary.idNumber);

// Prisma schema
model Beneficiary {
  idNumberEncrypted String? // Store encrypted
}
```

### Role-Based Access Control (RBAC)

**Middleware Protection:**
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;

      if (path.startsWith('/admin')) {
        return token?.role === 'SUPER_ADMIN' || token?.role === 'ADMIN';
      }

      if (path.startsWith('/beneficiaries/new')) {
        return ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER'].includes(token?.role);
      }

      return !!token; // Authenticated
    },
  },
});

export const config = {
  matcher: ['/beneficiaries/:path*', '/admin/:path*', '/api/:path*'],
};
```

**API Route Protection:**
```typescript
// app/api/beneficiaries/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!['ADMIN', 'STAFF', 'FIELD_WORKER'].includes(session.user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Proceed with beneficiary creation
}
```

### Audit Logging

**Track Critical Actions:**
```typescript
// lib/audit.ts
export async function logAudit(action: string, details: object) {
  await prisma.auditLog.create({
    data: {
      action,
      details,
      userId: session.user.id,
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date(),
    },
  });
}

// Usage
await logAudit('BENEFICIARY_CREATED', { beneficiaryId: newBeneficiary.id });
await logAudit('BENEFICIARY_UPDATED', { beneficiaryId, changes: diff });
await logAudit('BENEFICIARY_DELETED', { beneficiaryId });
```

**Audit Log Model:**
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  action      String
  details     Json
  userId      String
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())

  @@index([userId])
  @@index([timestamp])
}
```

### File Upload Security

**Validation:**
```typescript
// lib/upload.ts
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WEBP allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum 5MB.');
  }

  return true;
}
```

**Virus Scanning (Production):**
```typescript
// Use Cloudinary's virus scanning
import { v2 as cloudinary } from 'cloudinary';

const result = await cloudinary.uploader.upload(file, {
  resource_type: 'image',
  phash: true, // Perceptual hash for duplicate detection
  moderation: 'aws_rek', // AI moderation
});
```

### Rate Limiting

**API Routes:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

// Usage in API route
export async function POST(req: Request) {
  const identifier = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // Proceed
}
```

### GDPR/Data Privacy Compliance

**Right to be Forgotten:**
```typescript
// app/api/beneficiaries/[id]/anonymize/route.ts
export async function POST(req: Request, { params }) {
  // Replace personal data with anonymized values
  await prisma.beneficiary.update({
    where: { id: params.id },
    data: {
      firstName: 'ANONYMIZED',
      lastName: 'ANONYMIZED',
      phone: null,
      email: null,
      address: null,
      photoUrl: null,
      notes: 'Data anonymized per user request',
    },
  });
}
```

**Data Export:**
```typescript
// app/api/beneficiaries/[id]/export/route.ts
export async function GET(req: Request, { params }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: { services: true, cases: true, documents: true },
  });

  return new Response(JSON.stringify(beneficiary), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="beneficiary-${params.id}.json"`,
    },
  });
}
```

---

## 10. TESTING APPROACH

### Unit Testing (Vitest)

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Example Tests:**
```typescript
// __tests__/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { beneficiarySchema } from '@/lib/validation';

describe('Beneficiary Validation', () => {
  it('should validate a valid beneficiary', () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      category: 'HOMELESS',
    };

    const result = beneficiarySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone format', () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      category: 'HOMELESS',
      phone: '123', // Invalid
    };

    const result = beneficiarySchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

**Component Tests:**
```typescript
// __tests__/components/BeneficiaryForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BeneficiaryForm } from '@/components/BeneficiaryForm';

describe('BeneficiaryForm', () => {
  it('should render form fields', () => {
    render(<BeneficiaryForm />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
  });

  it('should show validation errors', async () => {
    render(<BeneficiaryForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
  });
});
```

### Integration Testing

**API Route Tests:**
```typescript
// __tests__/api/beneficiaries.test.ts
import { POST } from '@/app/api/beneficiaries/route';

describe('POST /api/beneficiaries', () => {
  it('should create a beneficiary', async () => {
    const req = new Request('http://localhost:3000/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Beneficiary',
        category: 'HOMELESS',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.firstName).toBe('Test');
  });
});
```

### E2E Testing with Playwright MCP

**Use the Playwright MCP server for E2E tests:**

```typescript
// tests/e2e/beneficiary-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Beneficiary Management Workflow', () => {
  test('complete beneficiary creation flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'staff@myfundaction.org');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to create beneficiary
    await page.goto('/beneficiaries/new');

    // Fill form
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.selectOption('[name="category"]', 'HOMELESS');
    await page.fill('[name="phone"]', '+60123456789');

    // Upload photo
    await page.setInputFiles('[name="photo"]', 'tests/fixtures/profile.jpg');

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to beneficiary detail page
    await expect(page).toHaveURL(/\/beneficiaries\/[a-z0-9]+/);
    await expect(page.locator('h1')).toContainText('John Doe');
  });

  test('CSV import workflow', async ({ page }) => {
    await page.goto('/beneficiaries/import');

    // Upload CSV
    await page.setInputFiles('[name="csvFile"]', 'tests/fixtures/beneficiaries.csv');

    // Wait for preview
    await expect(page.locator('.import-preview')).toBeVisible();

    // Verify preview shows correct data
    await expect(page.locator('.preview-row')).toHaveCount(10);

    // Confirm import
    await page.click('button:has-text("Import")');

    // Verify success message
    await expect(page.locator('.success-message')).toContainText('10 beneficiaries imported');
  });
});
```

**Run E2E tests with Playwright MCP:**
- Use the `mcp__playwright__browser_*` tools
- Capture screenshots at key points
- Test critical user journeys

### Load Testing

**Considerations:**
- 4,000+ beneficiaries per month = ~133/day
- Peak: 180 staff + 18,000 volunteers (potential concurrent users)
- Test with k6 or Artillery

**Example Load Test (k6):**
```javascript
// tests/load/beneficiaries.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('https://beneficiary.myfundaction.org/api/beneficiaries');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 11. MALAYSIAN CONTEXT

### i18n Setup (Bahasa Malaysia + English)

**Install next-intl:**
```bash
npm install next-intl
```

**Configuration:**
```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

**Messages:**
```json
// messages/en.json
{
  "beneficiary": {
    "title": "Beneficiaries",
    "create": "Create Beneficiary",
    "firstName": "First Name",
    "lastName": "Last Name",
    "category": "Category",
    "categories": {
      "homeless": "Homeless",
      "elderly": "Elderly",
      "disabled": "Disabled"
    }
  }
}

// messages/ms.json
{
  "beneficiary": {
    "title": "Penerima Manfaat",
    "create": "Cipta Penerima Manfaat",
    "firstName": "Nama Pertama",
    "lastName": "Nama Keluarga",
    "category": "Kategori",
    "categories": {
      "homeless": "Gelandangan",
      "elderly": "Warga Emas",
      "disabled": "Orang Kurang Upaya"
    }
  }
}
```

**Usage:**
```typescript
import { useTranslations } from 'next-intl';

export default function BeneficiaryPage() {
  const t = useTranslations('beneficiary');

  return <h1>{t('title')}</h1>;
}
```

### Malaysian Phone Number Format

**Validation:**
```typescript
// lib/validation.ts
import { z } from 'zod';

export const malaysianPhoneSchema = z
  .string()
  .regex(/^\+60\d{9,10}$/, 'Invalid Malaysian phone number. Format: +60123456789');

// Example usage
const beneficiarySchema = z.object({
  phone: malaysianPhoneSchema.optional(),
});
```

**Formatting:**
```typescript
// lib/format.ts
export function formatMalaysianPhone(phone: string): string {
  // +60123456789 → +60 12-345 6789
  return phone.replace(/(\+60)(\d{2})(\d{3})(\d{4})/, '$1 $2-$3 $4');
}
```

### Islamic Calendar Integration

**For Qurbani timing (not primary for beneficiary system, but good to know):**
```bash
npm install moment-hijri
```

**Example:**
```typescript
import moment from 'moment-hijri';

const islamicDate = moment().format('iYYYY/iM/iD');
// e.g., "1446/12/10" (Dhul Hijjah 10, 1446)
```

### WhatsApp Sharing Integration

**Deep Links:**
```typescript
// lib/whatsapp.ts
export function shareToWhatsApp(text: string, phone?: string) {
  const encoded = encodeURIComponent(text);
  const url = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank');
}

// Usage: Share beneficiary case update
shareToWhatsApp(
  `Beneficiary ${beneficiary.name} has been assigned case #${case.id}. Please follow up.`,
  '+60123456789'
);
```

**WhatsApp Click-to-Chat Button:**
```tsx
// components/WhatsAppButton.tsx
export function WhatsAppButton({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone.replace(/\+/g, '')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-green-600 hover:text-green-700"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </a>
  );
}
```

---

## 12. MONITORING & ANALYTICS

### Vercel Analytics

**Install:**
```bash
npm install @vercel/analytics
```

**Setup:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Track Custom Events:**
```typescript
import { track } from '@vercel/analytics';

// Track beneficiary creation
track('beneficiary_created', {
  category: beneficiary.category,
  source: 'manual_entry',
});

// Track CSV import
track('csv_import_completed', {
  count: importedBeneficiaries.length,
  errors: errorCount,
});
```

### Sentry Error Tracking

**Install:**
```bash
npm install @sentry/nextjs
```

**Setup:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Custom Error Logging:**
```typescript
try {
  await createBeneficiary(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'beneficiary_creation' },
    user: { id: session.user.id },
  });
  throw error;
}
```

### Posthog User Behavior Analytics

**Install:**
```bash
npm install posthog-js
```

**Setup:**
```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

export { posthog };
```

**Track Events:**
```typescript
import { posthog } from '@/lib/posthog';

// Track feature usage
posthog.capture('beneficiary_created', {
  category: beneficiary.category,
  user_role: session.user.role,
});

// Identify user
posthog.identify(session.user.id, {
  email: session.user.email,
  role: session.user.role,
  organization: session.user.organization,
});
```

### Custom Dashboards for NGO Metrics

**Key Metrics to Track:**
- Beneficiaries created per day/week/month
- Services provided by type
- Case resolution time
- User activity (staff, field workers, volunteers)
- Data quality metrics (completeness, duplicates)

**Implementation:**
```typescript
// app/api/metrics/route.ts
export async function GET(req: Request) {
  const [totalBeneficiaries, activeCases, servicesThisMonth] = await Promise.all([
    prisma.beneficiary.count(),
    prisma.case.count({ where: { status: 'OPEN' } }),
    prisma.service.count({
      where: {
        createdAt: { gte: new Date(new Date().setDate(1)) }, // Start of month
      },
    }),
  ]);

  return Response.json({
    totalBeneficiaries,
    activeCases,
    servicesThisMonth,
  });
}
```

### Uptime Monitoring

**Use UptimeRobot or Better Uptime:**
- Monitor `https://beneficiary.myfundaction.org/api/health`
- Alert via Email, SMS, Slack if downtime

**Health Check Endpoint:**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({ status: 'healthy' }, { status: 200 });
  } catch (error) {
    return Response.json({ status: 'unhealthy', error }, { status: 500 });
  }
}
```

---

## FINAL INSTRUCTIONS

### Development Checklist

- [ ] Clone TailAdmin Next.js template or start fresh with `npx create-next-app@latest`
- [ ] Set up Prisma with the suggested schema
- [ ] Implement NextAuth with RBAC
- [ ] Create beneficiary CRUD operations (Create, Read, Update, Delete)
- [ ] Build CSV import utility with validation
- [ ] Implement case management features
- [ ] Add service tracking functionality
- [ ] Set up file uploads (photos, documents)
- [ ] Create reporting endpoints
- [ ] Write unit tests for critical functions
- [ ] Write E2E tests with Playwright MCP
- [ ] Set up i18n (English + Bahasa Malaysia)
- [ ] Deploy to Vercel
- [ ] Configure production database (Supabase)
- [ ] Set up monitoring (Sentry, Posthog, Vercel Analytics)
- [ ] Test with real data import from Google Forms

### Remember:

1. **Commit frequently** - at least 3-5 times per hour
2. **Use TodoWrite** to track your progress
3. **Use MCP tools**:
   - sequential-thinking for complex decisions
   - filesystem for multi-file operations
   - fetch/deepwiki for research
   - allpepper-memory-bank to document decisions
   - playwright for E2E testing
4. **Mobile-first design** - field workers are primary users
5. **Security first** - beneficiary data is sensitive
6. **Test thoroughly** - this system will impact 4,000+ lives monthly

Good luck building! 🚀
