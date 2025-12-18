# Manual Testing Procedures - Milestone 1

Complete step-by-step guide for manually testing Database & Authentication features.

## Table of Contents

1. [Database Seed Tests](#database-seed-tests) (2 tests)
2. [Email Delivery Tests](#email-delivery-tests) (5 tests)
3. [Test Results Template](#test-results-template)
4. [Bug Reporting Format](#bug-reporting-format)

---

## Prerequisites

### Required Access

- Supabase Dashboard access
- Resend account access (for email verification)
- Local development environment running

### Environment Setup

Ensure `.env.local` contains:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
CONTACT_ADMIN_EMAIL=noreply@biosketch.art
```

### Start Development Server

```bash
npm run dev
```

Server should be running at `http://localhost:8080`

---

## Database Seed Tests

### Test DB-1: Fresh Database Seed

**Objective**: Verify seed script successfully populates database with initial data

**Prerequisites**:
- Fresh Supabase project or cleared database tables

**Steps**:

1. Open terminal in project root directory

2. Run seed script:
   ```bash
   npm run seed
   ```

3. **Verify Console Output**:
   - Should see success messages for:
     - Icon categories created/updated
     - Sample icons created
     - Blog data seeded
     - Testimonials created
     - Admin role assigned
   - No error messages should appear

4. **Verify Database Data via Supabase Dashboard**:

   a. **Icon Categories** (Table: `icon_categories`)
   - Navigate to: Table Editor → icon_categories
   - Expected: 12 categories
   - Verify categories include: Medical, Laboratory, Biology, Chemistry, etc.
   - SQL verification:
     ```sql
     SELECT COUNT(*) FROM icon_categories;
     -- Expected: 12
     ```

   b. **Sample Icons** (Table: `icons`)
   - Navigate to: Table Editor → icons
   - Expected: Multiple sample icons
   - Verify icons have proper structure (name, category_id, svg_data)
   - SQL verification:
     ```sql
     SELECT COUNT(*) FROM icons;
     -- Expected: > 0
     ```

   c. **Blog Data** (Tables: `blog_posts`, `blog_categories`, `blog_tags`)
   - Navigate to: Table Editor → blog_posts
   - Expected: Sample blog posts
   - Verify posts have titles, content, authors
   - SQL verification:
     ```sql
     SELECT COUNT(*) FROM blog_posts;
     SELECT COUNT(*) FROM blog_categories;
     SELECT COUNT(*) FROM blog_tags;
     -- Expected: Multiple entries in each
     ```

   d. **Testimonials** (Table: `testimonials`)
   - Navigate to: Table Editor → testimonials
   - Expected: Sample testimonials
   - Verify testimonials have proper structure
   - SQL verification:
     ```sql
     SELECT COUNT(*) FROM testimonials;
     -- Expected: > 0
     ```

   e. **Admin Roles** (Table: `profiles`)
   - Navigate to: Table Editor → profiles
   - Expected: At least one admin user
   - Verify role = 'admin'
   - SQL verification:
     ```sql
     SELECT COUNT(*) FROM profiles WHERE role = 'admin';
     -- Expected: >= 1
     ```

5. **Take Screenshots**:
   - Screenshot of console output
   - Screenshot of each table with row counts
   - Save in test results folder

**Expected Result**: All tables populated correctly, no errors in console

**Pass Criteria**:
- ✅ Seed script completes without errors
- ✅ 12 icon categories exist
- ✅ Sample icons exist
- ✅ Blog data exists
- ✅ Testimonials exist
- ✅ At least one admin user exists

---

### Test DB-2: Idempotency Verification

**Objective**: Verify seed script can be run multiple times without creating duplicates

**Prerequisites**:
- Completed Test DB-1
- Database already seeded

**Steps**:

1. Note current row counts:
   ```sql
   SELECT COUNT(*) FROM icon_categories;
   SELECT COUNT(*) FROM icons;
   SELECT COUNT(*) FROM blog_posts;
   SELECT COUNT(*) FROM testimonials;
   ```

2. Run seed script again:
   ```bash
   npm run seed
   ```

3. Verify console output shows updates (not inserts) for existing data

4. Check row counts again - they should be the same or only increased for new entries

5. Verify no duplicate entries:
   ```sql
   -- Check for duplicate icon categories
   SELECT name, COUNT(*)
   FROM icon_categories
   GROUP BY name
   HAVING COUNT(*) > 1;
   -- Expected: 0 rows

   -- Check for duplicate blog posts
   SELECT title, COUNT(*)
   FROM blog_posts
   GROUP BY title
   HAVING COUNT(*) > 1;
   -- Expected: 0 rows
   ```

**Expected Result**: Row counts remain consistent, no duplicates created

**Pass Criteria**:
- ✅ Seed script completes without errors
- ✅ Row counts remain the same or only increase for new data
- ✅ No duplicate categories
- ✅ No duplicate blog posts
- ✅ Upsert behavior working correctly

---

## Email Delivery Tests

### Test EM-1: Signup Verification Email

**Objective**: Verify signup verification email is sent with correct branding and content

**Prerequisites**:
- Development server running at `http://localhost:8080`
- Access to email inbox (use your personal email or test email service)

**Steps**:

1. Navigate to `http://localhost:8080/auth`

2. Click "Sign Up" tab (if not already selected)

3. Enter test credentials:
   - Email: `your-email@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`

4. Click "Sign Up" button

5. Verify immediate redirect to `/auth/verify-email`

6. **Check Email Inbox** (within 30 seconds):

   a. **Email Received**:
   - From: `BioSketch <noreply@biosketch.art>`
   - To: Your email address
   - Subject: `Confirm your BioSketch account`

   b. **Email Content**:
   - ✅ BioSketch logo visible at top
   - ✅ Heading: "Welcome to BioSketch!"
   - ✅ Body text: "Thanks for signing up! Please confirm your email address to get started."
   - ✅ Green "Confirm Email Address" button
   - ✅ Footer with support email: support@biosketch.art
   - ✅ Professional styling (centered, proper spacing, readable fonts)

   c. **Email Formatting**:
   - ✅ HTML email (not plain text)
   - ✅ Responsive design
   - ✅ Logo loads correctly
   - ✅ Button is clickable

7. **Take Screenshots**:
   - Full email in inbox
   - Email content with logo and button visible
   - Save for test results

**Expected Result**: Professional branded email received within 30 seconds

**Pass Criteria**:
- ✅ Email received within 30 seconds
- ✅ Correct sender and subject
- ✅ Logo displays correctly
- ✅ All content elements present
- ✅ Professional appearance

---

### Test EM-2: Verification Link Functionality

**Objective**: Verify email verification link works and confirms account

**Prerequisites**:
- Completed Test EM-1
- Verification email received

**Steps**:

1. Open verification email from Test EM-1

2. Click "Confirm Email Address" button

3. **Verify Redirect**:
   - Should redirect to application
   - URL should not show error page
   - Should land on projects page or home page

4. **Verify in Supabase Dashboard**:
   - Navigate to: Authentication → Users
   - Find your test user
   - Check `email_confirmed_at` field
   - Should have a timestamp (not null)

5. **Test Sign-In**:
   - Navigate to `http://localhost:8080/auth`
   - Sign in with test credentials
   - Should successfully authenticate
   - Should NOT redirect to verify-email page

**Expected Result**: Account confirmed, user can sign in successfully

**Pass Criteria**:
- ✅ Verification link redirects correctly
- ✅ `email_confirmed_at` timestamp set in database
- ✅ User can sign in without verification prompt

---

### Test EM-3: Password Reset Email

**Objective**: Verify password reset email is sent with correct branding and content

**Prerequisites**:
- Development server running
- Existing verified user account (from EM-2)

**Steps**:

1. Navigate to `http://localhost:8080/auth`

2. Click "Forgot password?" link

3. Enter email address of verified test user

4. Click "Send Reset Link" button

5. Verify confirmation message appears

6. **Check Email Inbox** (within 30 seconds):

   a. **Email Received**:
   - From: `BioSketch <noreply@biosketch.art>`
   - Subject: `Reset your BioSketch password`

   b. **Email Content**:
   - ✅ BioSketch logo visible at top
   - ✅ Heading: "Reset Your Password"
   - ✅ Body text: "We received a request to reset your password..."
   - ✅ Green "Reset Password" button
   - ✅ Expiration notice: "This link will expire in 24 hours"
   - ✅ Footer with support email
   - ✅ Security notice: "If you didn't request this..."

   c. **Email Styling**:
   - ✅ Matches signup email style
   - ✅ Professional appearance
   - ✅ Logo and button render correctly

7. **Take Screenshots**:
   - Full reset email
   - Save for test results

**Expected Result**: Professional password reset email received within 30 seconds

**Pass Criteria**:
- ✅ Email received within 30 seconds
- ✅ Correct sender and subject
- ✅ All content elements present
- ✅ Expiration notice included
- ✅ Consistent branding with signup email

---

### Test EM-4: Password Reset Link Functionality

**Objective**: Verify password reset link works and allows password change

**Prerequisites**:
- Completed Test EM-3
- Password reset email received

**Steps**:

1. Open password reset email from Test EM-3

2. Click "Reset Password" button

3. **Verify Password Reset Form**:
   - Should display password reset page
   - Form should have password field(s)
   - Should show password requirements

4. **Set New Password**:
   - Enter new password: `NewTestPassword456!`
   - Confirm new password: `NewTestPassword456!`
   - Submit form

5. **Verify Success**:
   - Should show success message or redirect
   - Should be able to sign in with new password

6. **Test Old Password Rejected**:
   - Sign out
   - Try to sign in with old password (`TestPassword123!`)
   - Should fail with error message

7. **Test New Password Works**:
   - Sign in with new password (`NewTestPassword456!`)
   - Should successfully authenticate

**Expected Result**: Password successfully changed, old password no longer works

**Pass Criteria**:
- ✅ Reset link opens password form
- ✅ New password can be set
- ✅ Old password no longer works
- ✅ New password works for sign-in

---

### Test EM-5: Unverified Email Sign-In Flow

**Objective**: Verify auto-resend functionality for unverified email attempts

**Prerequisites**:
- Development server running

**Steps**:

1. Create new account without verifying:
   - Navigate to `http://localhost:8080/auth`
   - Sign up with new email: `unverified-test@example.com`
   - Password: `TestPassword789!`
   - Note: DO NOT click verification link in email

2. **Attempt Sign-In**:
   - Navigate back to `/auth`
   - Try to sign in with unverified account credentials

3. **Verify Auto-Resend Behavior**:
   - Should detect unverified email
   - Should automatically resend verification email
   - Should redirect to `/auth/verify-email?resent=true`

4. **Check Verify Email Page**:
   - ✅ Displays "Check Your Email" heading
   - ✅ Shows email address sent to
   - ✅ Shows resent confirmation (if resent=true parameter)
   - ✅ "Return to Sign In" link visible

5. **Check Email Inbox**:
   - Should receive SECOND verification email
   - Should be identical to first email
   - Both emails should have working verification links

6. **Test Verification Link**:
   - Click verification link in second email
   - Should confirm account
   - Should be able to sign in successfully

**Expected Result**: Auto-resend works, user can verify via second email

**Pass Criteria**:
- ✅ Unverified sign-in attempt detected
- ✅ Auto-redirect to verify-email page
- ✅ Second verification email sent
- ✅ Second email link works
- ✅ Account can be verified and signed in

---

## Test Results Template

Use this template to track manual test execution:

| Test ID | Test Name                          | Status | Date       | Tester | Notes                    |
|---------|------------------------------------|--------|------------|--------|--------------------------|
| DB-1    | Fresh Database Seed                | ⬜     | YYYY-MM-DD |        |                          |
| DB-2    | Idempotency Verification           | ⬜     | YYYY-MM-DD |        |                          |
| EM-1    | Signup Verification Email          | ⬜     | YYYY-MM-DD |        |                          |
| EM-2    | Verification Link Functionality    | ⬜     | YYYY-MM-DD |        |                          |
| EM-3    | Password Reset Email               | ⬜     | YYYY-MM-DD |        |                          |
| EM-4    | Password Reset Link Functionality  | ⬜     | YYYY-MM-DD |        |                          |
| EM-5    | Unverified Email Sign-In Flow      | ⬜     | YYYY-MM-DD |        |                          |

**Status Key**:
- ⬜ Not Started
- 🟡 In Progress
- ✅ Pass
- ❌ Fail
- ⏸️ Blocked

**Overall Pass Rate**: ___ / 7 tests passed (___%)

---

## Bug Reporting Format

If a test fails, use this format to report bugs:

### Bug Report Template

```markdown
**Bug ID**: BUG-[NUMBER]
**Test ID**: [DB-1, EM-1, etc.]
**Severity**: [Critical / High / Medium / Low]
**Environment**: [Local Development / Staging / Production]

**Summary**: [One-line description of the issue]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach screenshots if applicable]

**Console Logs**:
```
[Paste relevant console output]
```

**Database State** (if applicable):
```sql
-- Relevant queries and results
```

**Browser/OS** (for email tests):
- Browser: [Chrome 120, Safari 17, etc.]
- OS: [macOS 14, Windows 11, etc.]
- Email Client: [Gmail, Outlook, Apple Mail, etc.]

**Additional Notes**:
[Any other relevant information]
```

---

## Sign-Off Checklist

Before marking Milestone 1 testing complete:

- [ ] All 2 database tests passed
- [ ] All 5 email tests passed
- [ ] Screenshots captured and saved
- [ ] Test results documented
- [ ] Any bugs reported using proper format
- [ ] Critical bugs resolved or documented for next sprint
- [ ] Test results shared with team

---

## Contact & Support

**For Questions**:
- Review automated test suites first: `tests/database/`, `tests/e2e/`
- Check project README: `tests/README.md`
- Contact development team

**Resources**:
- Supabase Dashboard: [Project URL]
- Resend Dashboard: https://resend.com/emails
- Local Application: http://localhost:8080

---

*Document Version: 1.0*
*Last Updated: 2025-12-18*
