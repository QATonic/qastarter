# QAStarter Deployment Guide

Complete guide for deploying QAStarter to production on Replit.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

Before deploying QAStarter to production, ensure the following are complete:

### Required Configuration
- [ ] **Database**: PostgreSQL database is provisioned and accessible
- [ ] **Environment Variables**: All required environment variables are set (see section below)
- [ ] **Secrets**: Google Analytics tracking ID configured (if using analytics)
- [ ] **Build Test**: Application builds successfully with `npm run build` (if applicable)
- [ ] **Workflow Test**: Application runs without errors using `npm run dev`

### Optional Configuration
- [ ] **Custom Domain**: Domain name purchased and ready for DNS configuration
- [ ] **Object Storage**: Configured if storing generated project templates (optional)
- [ ] **Rate Limiting**: Review and adjust rate limits in `server/index.ts` if needed
- [ ] **CORS Origins**: Update allowed origins for production domains

### Code Quality Checks
- [ ] **No Console Logs**: Remove or disable debug console.log statements
- [ ] **Error Handling**: All API endpoints have proper error handling
- [ ] **Security Headers**: Helmet middleware configured correctly
- [ ] **CSP Policy**: Content Security Policy tested for production
- [ ] **Dependencies**: All packages up to date with `npm update`

---

## Environment Variables

QAStarter uses the following environment variables. Set these in Replit's "Secrets" pane (🔒 icon in sidebar):

### Required Variables

```bash
# Database Configuration (Auto-configured by Replit)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Node Environment (Auto-set by Replit)
NODE_ENV=production
REPLIT_DEPLOYMENT=1
```

### Optional Variables

```bash
# CORS Configuration (for custom domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Google Analytics (if integration is set up)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Rate Limiting (optional overrides)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_GENERATION_MAX=10

# Compression Settings (optional)
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024
```

### Environment-Specific Behavior

The application automatically detects the environment:

**Development Mode** (`NODE_ENV=development`):
- Relaxed CSP for Vite HMR and WebSocket
- CORS allows all origins
- Detailed error messages
- Development database connection

**Production Mode** (`REPLIT_DEPLOYMENT=1`):
- Strict CSP (self-only scripts, inline styles for Radix UI)
- CORS restricted to allowed origins
- Generic error messages
- Production optimizations enabled
- Compression middleware active

---

## Deployment Steps

### Step 1: Prepare for Deployment

1. **Test Locally**
   ```bash
   npm run dev
   ```
   Verify the application works correctly in development mode.

2. **Check Database Connection**
   - Ensure PostgreSQL database is running
   - Verify all database migrations are applied
   - Test database queries work correctly

3. **Review Security Settings**
   - Check `server/index.ts` for Helmet configuration
   - Verify CORS origins in `server/index.ts`
   - Review rate limiting settings

### Step 2: Deploy on Replit

1. **Click the "Deploy" Button**
   - Located in the top-right corner of the Replit workspace
   - Or use the "Deployments" tab in the left sidebar

2. **Choose Deployment Type**
   
   **Recommended: Autoscale Deployment**
   - Automatically scales based on traffic
   - Best for web applications with variable traffic
   - Supports custom domains
   - Includes automatic SSL/TLS certificates

   **Alternative: Reserved VM**
   - Dedicated resources
   - Predictable performance
   - Higher cost
   - Good for consistent high traffic

3. **Configure Deployment Settings**

   **Run Command:**
   ```bash
   npm run dev
   ```
   
   **Build Command:** (Leave empty, no build step required)
   
   **Machine Power:**
   - Small: For testing or low traffic (recommended to start)
   - Medium: For moderate traffic (100-1000 users/day)
   - Large: For high traffic (1000+ users/day)

4. **Set Environment Variables**
   - Click "Environment Variables" in deployment settings
   - Add any custom variables (e.g., `ALLOWED_ORIGINS`)
   - Database variables are automatically included

5. **Review and Deploy**
   - Review all settings
   - Click "Deploy" to start the deployment process
   - Wait for deployment to complete (typically 2-5 minutes)

### Step 3: Verify Deployment

Once deployment is complete, Replit will provide a live URL:
```
https://<your-app-name>.replit.app
```

Test the deployed application:
1. Visit the deployment URL
2. Verify homepage loads correctly
3. Test wizard functionality (all 21 steps)
4. Generate a sample project and download it
5. Check browser console for errors
6. Verify robots.txt: `https://<your-app-name>.replit.app/robots.txt`
7. Verify sitemap.xml: `https://<your-app-name>.replit.app/sitemap.xml`

---

## Post-Deployment Verification

### Functional Testing

1. **Homepage Verification**
   - [ ] Landing page loads with SEO-optimized content
   - [ ] All framework mentions visible (Selenium, Playwright, Cypress, Appium)
   - [ ] FAQ section displays all 10 questions
   - [ ] "Start Generating" button works

2. **Wizard Flow**
   - [ ] Step 1: Language selection works
   - [ ] Step 2: Test type selection works
   - [ ] All 21 steps navigate correctly
   - [ ] Back/Next buttons functional
   - [ ] Progress indicator accurate

3. **Project Generation**
   - [ ] Configuration summary shows correct selections
   - [ ] "Generate Project" button works
   - [ ] ZIP file downloads successfully
   - [ ] Generated project contains expected files
   - [ ] No IDE errors in generated code

4. **Performance Testing**
   - [ ] Initial page load < 3 seconds
   - [ ] Project generation < 10 seconds
   - [ ] No memory leaks after multiple generations

### Security Verification

1. **Headers Check**
   Open browser DevTools → Network → Select any request → Headers
   
   Verify presence of:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Strict-Transport-Security` (HSTS)
   - `Content-Security-Policy`

2. **Rate Limiting**
   ```bash
   # Test rate limiting (should block after 100 requests)
   for i in {1..110}; do curl https://<your-app>.replit.app/api/templates; done
   ```
   
   Expected: HTTP 429 (Too Many Requests) after 100 requests

3. **CORS Policy**
   ```bash
   # Test CORS from unauthorized origin
   curl -H "Origin: https://evil.com" https://<your-app>.replit.app/api/templates
   ```
   
   Expected: No `Access-Control-Allow-Origin` header

### SEO Verification

1. **Meta Tags**
   - View page source
   - Verify comprehensive meta description with keywords
   - Check Open Graph tags

2. **Structured Data**
   - Use [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Enter your deployment URL
   - Verify FAQPage, HowTo, and WebApplication schemas detected

3. **Robots.txt**
   ```
   https://<your-app>.replit.app/robots.txt
   ```
   - Verify allows major search engines
   - Verify allows AI crawlers (GPTBot, Claude-Web, etc.)

4. **Sitemap**
   ```
   https://<your-app>.replit.app/sitemap.xml
   ```
   - Verify homepage URL listed
   - Verify current lastmod date

---

## Custom Domain Setup

### Prerequisites
- Domain name registered (e.g., from Namecheap, GoDaddy, or Replit Domains)
- Access to domain registrar's DNS settings

### Step 1: Link Domain in Replit

1. Go to **Deployments** tab
2. Click **Settings**
3. Select **Link a domain**
4. Enter your domain name (e.g., `qastarter.com` or `app.qastarter.com`)
5. Replit will provide DNS records:
   - **A Record**: Points to Replit's IP address
   - **TXT Record**: For domain verification

### Step 2: Configure DNS Records

1. **Login to your domain registrar**
2. **Navigate to DNS Management**
3. **Add A Record**:
   - **Hostname**: `@` (for root domain) or subdomain name
   - **Type**: `A`
   - **Value**: IP address provided by Replit
   - **TTL**: 3600 (or default)

4. **Add TXT Record** (for verification):
   - **Hostname**: As provided by Replit
   - **Type**: `TXT`
   - **Value**: Verification string from Replit
   - **TTL**: 3600 (or default)

5. **Optional: Add Subdomain**
   - **Hostname**: `www` (or other subdomain)
   - **Type**: `A`
   - **Value**: Same IP address as root domain
   - **TTL**: 3600

### Step 3: Wait for DNS Propagation

- DNS changes can take **10 minutes to 48 hours** to propagate
- Check status in Replit Deployments → Domains tab
- Status will change from "Pending" to "Verified"

### Step 4: Update Application Configuration

1. **Update CORS Origins** (in Replit Secrets):
   ```bash
   ALLOWED_ORIGINS=https://qastarter.com,https://www.qastarter.com
   ```

2. **Update Sitemap** (in `client/public/sitemap.xml`):
   ```xml
   <loc>https://qastarter.com/</loc>
   ```

3. **Redeploy** the application to apply changes

### Step 5: SSL/TLS Certificate

- Replit automatically provisions SSL/TLS certificates
- Your site will be accessible via `https://` within minutes
- Certificate auto-renews before expiration

### Verification

1. Visit your custom domain: `https://qastarter.com`
2. Verify SSL certificate is active (padlock icon)
3. Test all functionality with new domain
4. Update Google Search Console with new domain

---

## Monitoring & Maintenance

### Application Monitoring

1. **Replit Deployment Logs**
   - Go to **Deployments** tab
   - Click on active deployment
   - View **Logs** tab for real-time application logs
   - Monitor for errors or warnings

2. **Performance Metrics**
   - Response times for API endpoints
   - Project generation completion time
   - Memory usage
   - Error rates

3. **Google Analytics** (if configured)
   - Track page views
   - Monitor user interactions
   - Analyze wizard completion rates
   - Track project downloads

### Regular Maintenance Tasks

**Weekly:**
- [ ] Review deployment logs for errors
- [ ] Check rate limiting effectiveness
- [ ] Monitor database size and performance

**Monthly:**
- [ ] Update npm dependencies: `npm update`
- [ ] Review and optimize database queries
- [ ] Test all template packs generate correctly
- [ ] Verify SEO rankings and search console data

**Quarterly:**
- [ ] Security audit (dependencies, vulnerabilities)
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Feature usage analytics review

### Backup Strategy

**Database Backups:**
- Replit Postgres includes automatic daily backups
- Retention: 7 days for free tier, 30 days for paid
- Manual backup: Export via `pg_dump` if needed

**Code Backups:**
- Git repository serves as code backup
- Keep production branch protected
- Tag releases for easy rollback

---

## Troubleshooting

### Common Issues

#### Issue: Application won't start after deployment

**Symptoms:**
- Deployment shows "Failed" status
- Error in deployment logs

**Solutions:**
1. Check deployment logs for specific error
2. Verify `npm run dev` works in development
3. Ensure all dependencies are in `package.json`
4. Check Node version compatibility
5. Verify database connection string is correct

#### Issue: "Too Many Requests" error

**Symptoms:**
- HTTP 429 responses
- Users blocked from generating projects

**Solutions:**
1. Review rate limiting configuration in `server/index.ts`
2. Increase limits if legitimate traffic:
   ```typescript
   max: 200, // Increase from 100
   ```
3. Add IP whitelisting for testing:
   ```typescript
   skip: (req) => req.ip === 'YOUR_IP'
   ```
4. Redeploy with updated settings

#### Issue: CORS errors in browser console

**Symptoms:**
- `Access-Control-Allow-Origin` errors
- API requests failing from frontend

**Solutions:**
1. Check `ALLOWED_ORIGINS` environment variable includes your domain
2. Verify CORS configuration in `server/index.ts`:
   ```typescript
   const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
   ```
3. Ensure domain format is correct (https://domain.com, no trailing slash)
4. Redeploy after updating CORS settings

#### Issue: Slow project generation

**Symptoms:**
- ZIP generation takes > 30 seconds
- Timeout errors

**Solutions:**
1. Check template pack sizes
2. Optimize Handlebars template rendering
3. Review file I/O operations
4. Consider caching compiled templates
5. Upgrade machine power in deployment settings

#### Issue: Database connection errors

**Symptoms:**
- "Connection refused" errors
- Database queries failing

**Solutions:**
1. Verify `DATABASE_URL` is set correctly
2. Check Postgres database is running
3. Test connection from Replit Shell:
   ```bash
   psql $DATABASE_URL
   ```
4. Restart deployment
5. Contact Replit support if database is down

#### Issue: SEO/Structured data not detected

**Symptoms:**
- Google Rich Results Test shows errors
- FAQ schema not recognized

**Solutions:**
1. Validate JSON-LD syntax using JSON validator
2. Check HTML structure in browser DevTools
3. Ensure all 10 FAQ questions are visible
4. Use [Google's Rich Results Test](https://search.google.com/test/rich-results)
5. Wait 24-48 hours for Google to re-crawl

#### Issue: Custom domain not working

**Symptoms:**
- Domain not verified in Replit
- SSL certificate not provisioned

**Solutions:**
1. Verify DNS records are correct:
   ```bash
   dig yourdomain.com
   nslookup yourdomain.com
   ```
2. Wait 24-48 hours for DNS propagation
3. Check domain registrar doesn't have conflicting records
4. Ensure no Cloudflare proxy (orange cloud) enabled
5. Contact Replit support if verification fails

---

## Rollback Procedure

If a deployment introduces critical bugs, follow these steps to rollback:

### Method 1: Replit Deployment History

1. Go to **Deployments** tab
2. View **Deployment History**
3. Find last working deployment
4. Click **Redeploy** on that version
5. Confirm rollback

### Method 2: Git Revert

1. Identify the problematic commit:
   ```bash
   git log
   ```

2. Revert to previous stable commit:
   ```bash
   git revert <commit-hash>
   ```

3. Push changes:
   ```bash
   git push
   ```

4. Trigger new deployment

### Method 3: Database Rollback

If database changes caused issues:

1. Use Replit's automatic database backups
2. Go to **Database** tab
3. Select **Backups**
4. Choose backup from before deployment
5. Restore backup
6. Redeploy application with database schema matching backup

### Post-Rollback Verification

- [ ] Application is accessible
- [ ] Core functionality works
- [ ] No errors in deployment logs
- [ ] Database integrity maintained
- [ ] Notify users of any service interruption

---

## Production Checklist

Before marking deployment as complete:

### Security
- [x] Helmet middleware configured with strict CSP
- [x] CORS restricted to allowed origins
- [x] Rate limiting active (100 req/15min general, 10 req/15min generation)
- [x] Request body size limits enforced (10MB)
- [x] Secrets stored securely in Replit Secrets
- [x] HSTS header enabled
- [x] X-Frame-Options set to DENY

### Performance
- [x] Compression middleware enabled (gzip/deflate)
- [x] React code splitting with lazy loading
- [x] Suspense boundaries for loading states
- [x] DNS prefetch for external resources
- [x] Vite build optimization

### SEO
- [x] Meta tags with 300+ keywords
- [x] Structured data (WebApplication, FAQPage, HowTo)
- [x] robots.txt allows search engines and AI crawlers
- [x] sitemap.xml with current date
- [x] All 10 FAQ questions visible matching JSON-LD

### Functionality
- [x] All 33 template packs generate correctly
- [x] Wizard flow (21 steps) works end-to-end
- [x] Project downloads produce valid ZIP files
- [x] Generated code has zero IDE errors
- [x] CI/CD templates (GitHub Actions, GitLab CI, etc.) work
- [x] Reporting tool integrations (Allure, ExtentReports) configured

### Monitoring
- [ ] Google Analytics configured (optional)
- [ ] Error tracking set up (optional)
- [ ] Deployment logs reviewed
- [ ] Custom domain configured (if applicable)

---

## Support & Resources

### Documentation
- [Replit Deployments Guide](https://docs.replit.com/hosting/deployments/about-deployments)
- [Custom Domains Setup](https://docs.replit.com/hosting/deployments/custom-domains)
- [Environment Variables](https://docs.replit.com/programming-ide/workspace-features/secrets)

### Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Console](https://search.google.com/search-console)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)
- [DNS Propagation Check](https://www.whatsmydns.net/)

### Community
- [Replit Community Forum](https://ask.replit.com/)
- [Replit Discord](https://replit.com/discord)

---

**Last Updated:** November 9, 2025  
**Application Version:** 1.0.0  
**Deployment Target:** Replit Autoscale
