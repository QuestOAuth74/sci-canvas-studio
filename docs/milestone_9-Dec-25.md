# BioSketch - Development Milestone

**Date:** 9 December 2025
**Price:** $1,495 USD

---

## Table of Contents

1. [Database Work](#1-database-work)
2. [Authentication & Email Verification](#2-authentication--email-verification)
3. [AI Provider Refactor](#3-ai-provider-refactor)
4. [Canvas Editor](#4-canvas-editor)
5. [Community Features](#5-community-features)
6. [Blog System](#6-blog-system)
7. [Admin Dashboard](#7-admin-dashboard)
8. [Profile & Settings](#8-profile--settings)
9. [Contact & Submissions](#9-contact--submissions)

---

## 1. Database Work

### Current State

- Migrations contained hardcoded seed data that failed on fresh databases
- ~130 RLS policies exist across tables with good foundation but gaps
- No seed script existed for populating initial data

### Tasks

**Seed Script:**

- Remove seed data from migrations (`20251018034147`, `20251018033349`, `20251018213609`)
- Create `scripts/seed.ts` using service role key
- Add `npm run seed` script to package.json

**RLS Policy Fixes:**

- Add missing INSERT policy for `profiles` table (currently relies only on trigger)
- Allow unauthenticated users to view `icons` and `icon_categories` (for public landing page showcase)
- Verify no conflicts between overlapping `canvas_projects` SELECT policies (5 policies exist: owner, public, approved, admin, collaborator)
- Ensure `login_attempts` policies work correctly with edge functions using service role

### Tests

- Unauthenticated user can read icons and categories
- Authenticated user can only view own projects + public projects
- User cannot access another user's private project
- Admin can access all resources
- Collaborator can access shared projects

---

## 2. Authentication & Email Verification

### Current State

- Supabase Auth is configured (email templates may already be configured in Supabase Dashboard - unknown without project access)
- Login attempts tracked in `login_attempts` table
- Profile creation happens on user signup via trigger
- Existing UX for email verification:
  - Sign-up shows toast: "Account created! Please check your email to verify."
  - Password reset shows toast: "Check your email - We've sent you a password reset link"
  - Auth page handles `recovery` type in URL hash to show password update form
- No custom Edge Function for branded email delivery
- No dedicated verify email page - users stay on auth page after signup

### Tasks

- Set up Resend account and obtain API key for branded email delivery
- Create Supabase Edge Function `send-email` to handle auth emails via Resend
- Configure Edge Function in `supabase/config.toml`
- Implement branded email templates for `signup` and `recovery`
- Create user-facing verify email page at `/auth/verify-email`
- Update sign-up flow to redirect to verify email page after submission
- Implement sign-in handling for unverified emails:
  - Catch "email not confirmed" error
  - Auto-resend verification email via `supabase.auth.resend()`
  - Redirect to verify email page with toast notification
- Enable Send Email hook in Supabase Dashboard (Authentication > Hooks)

### Tests

**Signup & Verification:**

- User can sign up with email and password
- Sign-up redirects to `/auth/verify-email` after form submission
- Verify email page displays "Check your email" heading and return link
- User can verify account via email link

**Unverified Email Handling:**

- Sign-in with unverified email shows error or redirects to verify page
- Verification email is automatically resent on failed sign-in attempt

**Login & Session:**

- User can log in with valid credentials
- User sees error message with invalid credentials
- User session persists across page refresh
- User can log out and session is cleared

**Password Reset:**

- User can request password reset
- Password reset page allows setting new password

**Test Helper:**

- Create `confirmUserEmail(email)` utility using Supabase Admin API for programmatically verifying users in E2E tests

---

## 3. AI Provider Refactor

### Current State

- AI features use Lovable AI Gateway (`ai.gateway.lovable.dev`) which proxies to Google Gemini
- `LOVABLE_API_KEY` stored as Supabase Edge Function secret
- Three AI-powered features:
  - AI Icon Generator (`generate-icon-from-reference`) - uses `google/gemini-2.5-flash-image-preview`
  - AI Figure Generator (`generate-figure-from-reference`) - analyzes diagrams and recreates with icons
  - PowerPoint Generation (`generate-powerpoint`) - configurable Manus AI or Lovable AI
- Admin settings page allows switching between Manus and Lovable providers
- Usage tracking in `ai_generation_usage` table with monthly quotas

### Tasks

- Set up OpenRouter account and obtain API key
- Add `OPENROUTER_API_KEY` as Supabase Edge Function secret
- Update `generate-icon-from-reference` Edge Function:
  - Replace Lovable AI Gateway URL with OpenRouter API (`https://openrouter.ai/api/v1`)
  - Update authentication header format for OpenRouter
  - Select appropriate image generation model (e.g., `google/gemini-2.0-flash-exp:free` or similar)
- Update `generate-figure-from-reference` Edge Function with OpenRouter
- Update `generate-powerpoint` Edge Function to use OpenRouter as Lovable replacement
- Update admin AI settings page to reflect new provider options
- Remove `LOVABLE_API_KEY` from Edge Function secrets after migration
- Update `ai_provider_settings` table default values if needed

### Tests

- AI icon generation produces valid output via OpenRouter
- AI figure generation analyzes and recreates diagrams correctly
- PowerPoint generation works with OpenRouter provider
- Rate limiting and quota tracking still function correctly
- Error handling displays appropriate messages for OpenRouter errors

---

## 4. Canvas Editor

### Current State

- Fabric.js-based canvas with extensive drawing tools (selection, text, shapes, lines, connectors)
- Properties panel for styling, layers panel for z-order management
- Grid system with snap-to-grid, undo/redo history, auto-save
- Icon library with categorized SVG icons and user asset uploads
- AI figure and icon generation with usage quota tracking
- Export to PNG/JPEG/SVG with DPI and quality options
- Project sharing via URL, PowerPoint generation
- Projects stored in `canvas_projects` table with version history

### Tests

**Drawing Tools:**

- User can create, select, and modify objects
- User can use undo/redo to navigate history
- Grid snapping works when enabled
- Scientific connectors work correctly (inhibition, activation, phosphorylation markers)
- Orthogonal line tool creates right-angle connections
- Curved line tool creates smooth bezier curves
- Multi-object selection and grouping works
- Alignment guides appear when moving objects
- Command palette opens and executes actions

**Layers:**

- Layer visibility toggle hides/shows objects
- Layer lock prevents object modification
- Layer reordering changes z-index correctly

**Icon Library & Assets:**

- User can browse and search icons
- User can drag icon onto canvas
- User can upload and delete custom assets

**Projects:**

- User can create and save a new project
- User can open and edit existing project
- User can delete a project
- User can view and rollback to previous version
- Changes auto-save to database
- Project thumbnail generates correctly
- Project metadata (keywords, citations) saves and displays

**AI Features:**

- User can generate AI figure from prompt
- User can generate AI icon from prompt
- User is blocked when quota exceeded
- Error message shown on API failure

**Export & Sharing:**

- User can export canvas as PNG/JPEG/SVG
- User can export with transparent background
- User can select export DPI (150, 300, 600)
- JPEG quality slider affects output file size
- Selection-only export includes only selected objects
- User can share project via URL
- Shared URL loads project correctly

---

## 5. Community Features

### Current State

- Community page displays public projects with filtering and search
- Projects can be liked, downloaded, and cloned
- Author profiles show user's public work
- Trending and featured projects sections

### Tests

- User can browse community projects
- User can search and filter projects
- User can like and unlike projects
- User can clone a public project
- Trending projects section displays correctly
- Author profile shows correct projects and stats
- Verified creator badge appears on eligible profiles

---

## 6. Blog System

### Current State

- Blog posts with TipTap rich text content
- Categories and tags for organization
- Blog listing with pagination
- Admin interface for creating/editing posts
- SEO metadata and view counting

### Tests

- User can browse blog posts
- User can filter by category and tag
- User can read individual blog post
- Admin can create and edit blog posts
- Admin can manage categories and tags

---

## 7. Admin Dashboard

### Current State

- Admin dashboard with navigation to sub-sections
- Analytics dashboard, icon manager, testimonial manager
- Email notifications, AI settings, rate limits configuration
- Project approval interface

### Tests

- Non-admin user cannot access admin routes
- Admin can view analytics dashboard
- Admin can add/edit/delete icons
- Admin can approve/reject testimonials
- Admin can approve/reject icon submissions
- Admin can configure AI settings
- Admin can approve/reject community projects
- PowerPoint template builder creates valid templates

---

## 8. Profile & Settings

### Current State

- User profile page with avatar, bio, stats
- Profile editing, avatar upload with Gravatar fallback
- Account settings (email preferences, notifications)

### Tests

- User can view their profile
- User can edit profile information
- User can upload profile avatar
- User can update email preferences
- Profile changes persist after refresh

---

## 9. Contact & Submissions

### Current State

- Contact page with hCaptcha integration
- Icon submission system at `/my-submissions`
- Tool feedback collection

### Tests

- Contact form submits successfully with valid hCaptcha
- User can submit icon for review
- User can view their submission status at `/my-submissions`
- Tool feedback form submits correctly

---

## Notes

**Hover tilt effects:** The app currently tilts elements on hover. This should be removed or replaced with subtler effects (scale, shadow, border). Tilt effects reduce click accuracy, cause discomfort for users with vestibular disorders, and don't respect `prefers-reduced-motion`. They also feel dated by modern design standards.
