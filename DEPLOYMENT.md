# Deployment Guide - MyFundAction Beneficiary Management System

## Overview

This guide will help you deploy the MyFundAction Beneficiary Management System to Vercel.

## Prerequisites

- A Vercel account (free tier works)
- A PostgreSQL database (Vercel Postgres or Supabase)
- GitHub account (repository already connected)

## Quick Start

### 1. Database Setup

#### Option A: Vercel Postgres (Development/Small Scale)

1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection strings

#### Option B: Supabase (Production/Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database
3. Copy the connection strings (pooled and direct)

### 2. Deploy to Vercel

#### Via Vercel Dashboard

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import the GitHub repository: `khvni/beneficiary`
   - Select the branch: `claude/core-functionality-typescript-011CUeph9qzhDF5FyBBQXzft`

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**

   Required variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   DIRECT_URL=postgresql://user:password@host:5432/database
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-generated-secret
   ```

   To generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### 3. Run Database Migrations

After deployment, run migrations using Vercel's terminal or locally:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or connect to your database directly
npx prisma migrate deploy
```

### 4. Seed the Database (Optional)

Add test data to get started:

```bash
npm run db:seed
```

This creates:
- 3 test users (Admin, Staff, Field Worker)
- 2 sample beneficiaries
- 2 sample cases
- 2 sample services

**Test Credentials:**
```
Admin:
  Email: admin@myfundaction.org
  Password: admin123

Staff:
  Email: staff@myfundaction.org
  Password: staff123

Field Worker:
  Email: fieldworker@myfundaction.org
  Password: field123
```

### 5. Verify Deployment

1. Visit your deployed URL: `https://your-project.vercel.app`
2. Try logging in with test credentials
3. Create a new beneficiary
4. Check the dashboard for statistics

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | Direct database connection for migrations | Same as DATABASE_URL |
| `NEXTAUTH_URL` | Your production URL | `https://beneficiary.myfundaction.org` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |

### Optional (for production features)

| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `RESEND_API_KEY` | Email notifications API key |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics key |
| `SENTRY_DSN` | Error tracking DSN |
| `CLOUDINARY_*` | Image upload credentials |

## Custom Domain Setup

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain: `beneficiary.myfundaction.org`
4. Update DNS records as instructed by Vercel
5. Update `NEXTAUTH_URL` environment variable

## Troubleshooting

### Build Failures

**Issue:** Prisma client generation fails
```bash
# Solution: Ensure DATABASE_URL is set in Vercel environment variables
# The build process runs: npx prisma generate && next build
```

**Issue:** Type errors during build
```bash
# Solution: Run locally to catch errors
npm run build
```

### Runtime Errors

**Issue:** Authentication not working
- Check `NEXTAUTH_URL` matches your deployment URL
- Verify `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

**Issue:** Database connection errors
- Verify `DATABASE_URL` is correct
- Check if database is accessible from Vercel's network
- For Supabase, ensure connection pooling is enabled

### Database Issues

**Issue:** Migrations not applied
```bash
# Run migrations manually
npx prisma migrate deploy
```

**Issue:** Database schema out of sync
```bash
# Reset and re-migrate (WARNING: This deletes all data)
npx prisma migrate reset
npx prisma migrate deploy
npm run db:seed
```

## Performance Optimization

### Database

1. **Add Indexes** (already configured in schema):
   - Beneficiary: status, category, createdAt
   - Case: status, beneficiaryId
   - Service: type, beneficiaryId, date

2. **Connection Pooling**:
   - For Supabase: Use the pooled connection string
   - For Vercel Postgres: Automatically handled

### Caching

The application uses:
- Next.js Incremental Static Regeneration (ISR) for dashboard
- Server-side caching for frequently accessed data

### CDN

Vercel automatically provides:
- Global CDN for static assets
- Edge caching for API routes
- Automatic image optimization

## Monitoring

### Built-in Analytics

1. **Vercel Analytics**: Automatically enabled
   - Page views and performance metrics
   - Web Vitals tracking

2. **Error Tracking**: Set up Sentry (optional)
   ```env
   SENTRY_DSN=your-sentry-dsn
   ```

3. **User Behavior**: Set up PostHog (optional)
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

## Security Checklist

- [ ] Change all default passwords in seed data
- [ ] Use strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Enable SSL/HTTPS (automatic with Vercel)
- [ ] Set up database backups (Supabase provides this)
- [ ] Configure CORS if needed
- [ ] Review and restrict API rate limits
- [ ] Enable audit logging in production

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm update
   git commit -am "chore: update dependencies"
   git push
   ```

2. **Database Backups**
   - Supabase: Automatic daily backups
   - Vercel Postgres: Configure in dashboard

3. **Monitor Usage**
   - Check Vercel analytics dashboard
   - Review database query performance
   - Monitor error rates in Sentry

### Scaling Considerations

The current setup supports:
- **4,000+ beneficiaries/month** ✅
- **180 staff + 18,000 volunteers** ✅
- **Concurrent users**: 100-1000 (Vercel scales automatically)

For higher scale:
- Upgrade database plan (Supabase Pro or higher)
- Consider database read replicas
- Implement Redis caching for frequent queries
- Use Vercel Pro for higher limits

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs
3. Check database connection logs
4. Refer to PROMPT.md for detailed specifications
5. Create an issue in the GitHub repository

## Next Steps

After successful deployment:

1. **Create Real Users**: Delete seed data and create actual user accounts
2. **Import Existing Data**: Use CSV import feature (to be implemented)
3. **Train Staff**: Provide access to user guides
4. **Monitor Performance**: Check dashboard metrics regularly
5. **Gather Feedback**: Collect user feedback for improvements

---

**Deployment Date**: 2025-10-31
**Version**: 0.1.0
**Built for**: MyFundAction (Yayasan Kebajikan Muslim)
