# 🕌 LMS MASTER ARCHITECTURE REPORT
## Nour Al-Nubuwwah — Definitive System Forensic Audit

> **Generated:** 2026-05-31 | **Last Updated:** 2026-06-04 | **Auditor:** Antigravity AI (Forensic Mode)  
> **Lead Developer:** Abdelrahman Tarek Fouad Saad  
> **Classification:** Internal Reference Document — DO NOT COMMIT TO GIT  
> **File:** `d:\programing\LMS\LMS_MASTER_ARCHITECTURE_REPORT.md`

---

## TABLE OF CONTENTS

1. [Project Identity & Mission](#1-project-identity--mission)
2. [Repository & Deployment Architecture](#2-repository--deployment-architecture)
3. [Environment Variables & Connection Audit](#3-environment-variables--connection-audit)
4. [Backend Architecture (Django)](#4-backend-architecture-django)
5. [Frontend Architecture (Next.js)](#5-frontend-architecture-nextjs)
6. [Authentication & Session Flow](#6-authentication--session-flow)
7. [Real-Time Layer (WebSockets & Celery)](#7-real-time-layer-websockets--celery)
8. [Live Database State (Supabase Production Audit)](#8-live-database-state-supabase-production-audit)
9. [Security Audit & Critical Findings](#9-security-audit--critical-findings)
10. [Data Models — Complete Entity Map](#10-data-models--complete-entity-map)
11. [Routing Reference (Full Map)](#11-routing-reference-full-map)
12. [Developer Collaboration Profile](#12-developer-collaboration-profile)
13. [Recent Changes & Session Log (Post-May-31)](#13-recent-changes--session-log-post-may-31)

---

## 1. Project Identity & Mission

### Who We Are

**Nour Al-Nubuwwah** (نور النبوة — "Light of Prophethood") is a premium, Islamic-first Learning Management System built to empower the next generation of Muslims with authentic, structured, and beautifully delivered Islamic knowledge. The platform combines the rigor of traditional Islamic scholarship with the seamless experience of modern EdTech.

### What We Do (Current Production Feature Set)

| Feature | Status | Notes |
|---|---|---|
| User Authentication (Email + Google OAuth) | ✅ Live | JWT + NextAuth sessions |
| 6-Tier Role-Based Access Control (RBAC) | ✅ Live | SUPER_ADMIN through GUEST |
| Onboarding Flow (role + age selection) | ✅ Live | One-time, immutable |
| Student Dashboard | ✅ Live | With mock data bridging |
| Courses & Learning Modules | ✅ Live | Course→Week→Lesson hierarchy |
| Student Progress Tracking | ✅ Live | Per-lesson completion flags |
| Quizzes & Results | ✅ Live | 2-attempt max per quiz |
| Certificates Module | ✅ Live | Issued by Supervisors |
| Projects & Submissions | ✅ Live | Google Drive link submissions |
| Evaluation Timeline (الغصون) | ✅ Live | Supervisor-managed milestones |
| Resources Library | ✅ Live | File attachments per course |
| Live Sessions (Zoom integration) | ✅ Live | Celery-scheduled, Zoom API |
| Attendance Tracking | ✅ Live | Per-session, per-student |
| Real-Time Chat (WebSockets) | ✅ Live | Complaints, Homework, Community |
| Community Rooms | ✅ Live | Age-group & course-scoped |
| Support Ticket System | ✅ Live | Status lifecycle: Pending→Resolved→Closed |
| Payment & Subscriptions | ✅ Live | Manual approval workflow |
| Parent Dashboard & Setup | ✅ Live | Linked via student's `parent_email` |
| Internationalization (EN/AR + RTL) | ✅ Live | Cairo + Inter fonts, locale dict |
| Dark Mode | ✅ Live | `next-themes`, Tailwind `class` strategy |
| Glassmorphism UI | ✅ Live | `glass-panel` CSS pattern |

### Core Philosophy
The platform serves a **Shariah-first pedagogy** filtered through three student age tiers:
- 🌱 **CHILDREN** (أطفال): 6–10 years
- 🌿 **TWEENS** (البراعم الناضجة): 11–12 years
- 🌳 **TEENS** (البالغون): 13–20 years

---

## 2. Repository & Deployment Architecture

### Workspace Root: `d:\programing\LMS\`

```
LMS/                          ← MONOREPO ROOT (single Git repo, NOT split repos)
├── .git/
├── .gitignore
├── vercel.json               ← Vercel Experimental Services config
├── vercel-secrets.txt        ← 🚨 SENSITIVE — NOT committed (in .gitignore)
├── backend/                  ← Django REST Framework + Channels + Celery
└── frontend/                 ← Next.js 14 (App Router)
```

> ⚠️ **Architecture Confirmation:** This IS a **monorepo**. One Git repository hosts both the Django backend and the Next.js frontend. Vercel's `experimentalServices` feature is used to deploy both from the same repo as independent deployment units. This is NOT two separate repos.

### Vercel Deployment Config (`vercel.json`)

```json
{
    "experimentalServices": {
        "frontend": {
            "entrypoint": "frontend",
            "routePrefix": "/",
            "framework": "nextjs"
        },
        "backend": {
            "entrypoint": "backend",
            "routePrefix": "/_/backend"
        }
    }
}
```

| Property | Detail |
|---|---|
| **Frontend entrypoint** | `./frontend/` — served at root `/` |
| **Backend entrypoint** | `./backend/` — served at `/_/backend` |
| **Frontend framework** | `nextjs` (Next.js 14, App Router) |
| **Backend runtime** | Python/WSGI (Django via Gunicorn/Whitenoise) |

### Backend Build Process

`backend/build.sh`:
```bash
#!/bin/bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
```

Vercel invokes this script automatically for the backend service. Static files are served by **Whitenoise** (via `CompressedManifestStaticFilesStorage`).

---

## 3. Environment Variables & Connection Audit

### Frontend Environment (`frontend/.env.local`) — Local Dev Only

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super_secret_key_123!
GOOGLE_CLIENT_ID=REDACTED
GOOGLE_CLIENT_SECRET=REDACTED
```

> 🔑 `NEXT_PUBLIC_API_URL` is **NOT** set in `.env.local`. This means local dev defaults to `http://127.0.0.1:8000` (hardcoded in `api-config.ts`).

### Production Secrets (`vercel-secrets.txt`) — Reference File, NOT Committed

```env
DATABASE_URL=postgresql://postgres.hfyxymtiywroymvznxpn:at1234aA45%21%23@aws-1-eu-central-2.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://hfyxymtiywroymvznxpn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ZUNvAGepuAy-aske-oHBPQ_ZBy6_fas
```

### DATABASE_URL — Deep Dive

**Host:** `aws-1-eu-central-2.pooler.supabase.com` (Supabase connection pooler, AWS EU Central 2)  
**Port:** `5432`  
**User:** `postgres.hfyxymtiywroymvznxpn`  
**DB Name:** `postgres`  
**Password (URL-encoded):** `at1234aA45%21%23`

**Password Decoding Table:**

| URL Encoded | Literal Character | Why Encoded |
|---|---|---|
| `%21` | `!` | RFC 3986 reserved character in URL authority |
| `%23` | `#` | `#` signals URL fragment — MUST be encoded |

**Critical Rule:** When setting `DATABASE_URL` in Vercel's dashboard (or any shell), the password MUST remain URL-encoded. `dj-database-url==3.1.2` parses the URL directly and handles the decoding. If you paste the raw password (`at1234aA45!#`) without encoding, the `#` will truncate the URL and the connection will fail silently.

**Django parsing path:**
```python
# config/settings.py (line 76)
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get(
            'DATABASE_URL', 
            'postgresql://postgres.hfyxymtiywroymvznxpn:at1234aA45%21%23@aws-1-eu-central-2.pooler.supabase.com:5432/postgres'
        )
    )
}
```

The fallback default value is the full URL with the password encoded. In production, `DATABASE_URL` env var overrides this entirely.

### Backend Environment Variables (Must Set in Vercel for Backend Service)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Critical | Supabase PostgreSQL connection (password URL-encoded) |
| `DJANGO_SECRET_KEY` | ✅ Critical | Django signing key (replace insecure default) |
| `DEBUG` | ✅ | Set to `'False'` in production |
| `ALLOWED_HOSTS` | ✅ | Comma-separated allowed domains |
| `CORS_ALLOWED_ORIGINS` | ✅ | Frontend Vercel URL(s), comma-separated |

### Frontend Environment Variables (Must Set in Vercel for Frontend Service)

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_URL` | ✅ Critical | Canonical production frontend URL |
| `NEXTAUTH_SECRET` | ✅ Critical | 32+ char random string for session encryption |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth2 client secret |
| `NEXT_PUBLIC_API_URL` | ✅ | Set to the Vercel app URL (e.g. `https://lms-xxx.vercel.app`) — **without trailing slash** |

---

## 4. Backend Architecture (Django)

### Tech Stack
| Package | Version | Role |
|---|---|---|
| `Django` | 6.0.4 | Core web framework |
| `djangorestframework` | 3.15.1 | REST API layer |
| `djangorestframework_simplejwt` | 5.5.1 | JWT token auth |
| `django-cors-headers` | 4.9.0 | CORS handling |
| `django-filter` | 25.1 | Querystring filtering on ViewSets |
| `dj-database-url` | 3.1.2 | DATABASE_URL string parser |
| `psycopg2-binary` | 2.9.12 | PostgreSQL adapter |
| `channels` | 4.1.0 | Django WebSockets (ASGI) |
| `channels-redis` | 4.2.0 | Redis channel layer backend |
| `celery` | 5.6.3 | Async task queue |
| `redis` | 7.4.0 | Broker + result backend |
| `pillow` | 12.2.0 | Image processing (receipts, projects) |
| `PyJWT` | 2.12.1 | JWT utilities |
| `requests` | 2.33.1 | HTTP client (Zoom API, etc.) |
| `gunicorn` | 23.0.0 | WSGI production server |
| `whitenoise` | 6.9.0 | Static file serving |

### Application Structure (`backend/`)

```
backend/
├── config/               ← Django project settings
│   ├── settings.py       ← All configuration (env-driven)
│   ├── urls.py           ← Root URL configuration + DRF Router
│   ├── asgi.py           ← ASGI app (HTTP + WebSocket routing)
│   ├── celery.py         ← Celery app initialization
│   └── wsgi.py           ← WSGI fallback
├── accounts/             ← Custom User model + RBAC
├── learning/             ← Courses, Weeks, Lessons, Progress, Certificates
├── quizzes/              ← Quiz engine with attempt limiting
├── chat/                 ← WebSocket consumers + ChatRoom models
├── live/                 ← Zoom-integrated live sessions
├── support/              ← Help desk ticket system
├── payment/              ← Manual payment + subscription approval
├── requirements.txt
└── build.sh
```

### Custom User Model (`accounts.User`)

**Base:** `AbstractUser` with `username=None` — **email is the authentication field**.

```python
AUTH_USER_MODEL = 'accounts.User'
# USERNAME_FIELD = 'email'
# REQUIRED_FIELDS = ['full_name']
```

### 6-Tier RBAC System

| Role | DB Value | `is_superuser` | `is_staff` | Access Level |
|---|---|---|---|---|
| Super Admin | `SUPER_ADMIN` | ✅ True | ✅ True | Full system access |
| Technical Support | `TECH_SUPPORT` | ❌ | ❌ | Support queue access |
| Supervisor | `SUPERVISOR` | ❌ | ❌ | Student oversight, milestones |
| Teacher | `TEACHER` | ❌ | ❌ | Course content, quizzes |
| Student | `STUDENT` | ❌ | ❌ | Learning, submissions |
| Parent | `PARENT` | ❌ | ❌ | Child's progress view |
| Guest | `GUEST` | ❌ | ❌ | Browse-only, restricted |

### DRF Configuration

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}
```

All endpoints require authentication by default. Public endpoints explicitly set `permission_classes = [AllowAny]`.

### JWT Token Configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),    # Access: 24 hours
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   # Refresh: 7 days
    'ROTATE_REFRESH_TOKENS': True,                  # New refresh on each use
    'BLACKLIST_AFTER_ROTATION': True,               # Old refresh invalidated
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

---

## 5. Frontend Architecture (Next.js)

### Tech Stack
| Package | Version | Role |
|---|---|---|
| `next` | 14.2.3 | App Router, SSR/SSG/CSR |
| `next-auth` | 4.24.14 | Authentication session management |
| `next-themes` | 0.3.0 | Dark/light mode |
| `react` | ^18 | UI framework |
| `axios` | 1.15.2 | HTTP client (with interceptors) |
| `swr` | 2.4.1 | Data fetching + caching |
| `zustand` | 5.0.12 | Global state management |
| `framer-motion` | 11.18.2 | Animation engine |
| `lucide-react` | 0.373.0 | Icon library |
| `tailwindcss` | 3.4.19 | Utility-first CSS |
| `clsx` + `tailwind-merge` | latest | Conditional className merging |
| `typescript` | ^5 | Type safety |

### Directory Structure (`frontend/src/`)

```
src/
├── app/                          ← Next.js 14 App Router
│   ├── layout.tsx                ← Root layout (fonts, providers, dark mode)
│   ├── globals.css               ← Global Tailwind + glass-panel CSS
│   ├── api/auth/[...nextauth]/   ← NextAuth catch-all route handler
│   ├── (dashboard)/              ← Route group (auth-protected shell)
│   │   ├── page.tsx              ← Root dashboard entry (dynamic import)
│   │   ├── DashboardClient.tsx   ← Student/Guest dashboard router
│   │   ├── dashboard/            ← /dashboard route
│   │   ├── learning/             ← /learning route
│   │   ├── certificates/         ← /certificates route
│   │   ├── projects/             ← /projects route
│   │   ├── resources/            ← /resources route
│   │   ├── quizzes/              ← /quizzes route
│   │   ├── schedule/             ← /schedule route
│   │   ├── sessions/             ← /sessions route (live)
│   │   ├── community/            ← /community route
│   │   ├── chat/                 ← /chat route
│   │   ├── support/              ← /support route
│   │   ├── payment/              ← /payment route
│   │   ├── settings/             ← /settings route
│   │   └── parent-dashboard/     ← /parent-dashboard route
│   ├── login/                    ← /login (public)
│   ├── register/                 ← /register (public)
│   ├── onboarding/               ← /onboarding (public, post-register)
│   ├── forgot-password/          ← /forgot-password (public)
│   └── parent-setup/             ← /parent-setup (public)
├── components/
│   ├── layout/                   ← Sidebar, Header
│   ├── ui/                       ← Reusable primitive components
│   ├── shared/                   ← Shared: RestrictionModal, etc.
│   ├── guest/                    ← GuestDashboard, NewsCarousel
│   ├── learning/                 ← Learning-specific components
│   ├── quizzes/                  ← Quiz components
│   ├── chat/                     ← Chat UI components
│   └── providers/                ← ThemeProvider
├── hooks/
│   ├── useLocale.ts              ← Locale detection (en/ar)
│   ├── useUserRole.ts            ← Role-based boolean flags
│   └── useWebSocket.ts           ← WebSocket connection hook
├── lib/
│   ├── api-config.ts             ← DJANGO_API base URL resolver
│   ├── api.ts                    ← Typed API call functions
│   ├── auth.ts                   ← NextAuth options (authOptions)
│   └── axios.ts                  ← Axios instance + interceptors
├── locales/
│   └── dictionary.ts             ← Full EN/AR i18n dictionary
├── providers/
│   └── AuthProvider.tsx          ← SessionProvider wrapper
├── store/
│   └── cartStore.ts              ← Zustand cart state
└── middleware.ts                 ← NextAuth route protection
```

### Design System (Tailwind Theme)

**Color Palette (Tailwind extensions):**

| Token | Value | Usage |
|---|---|---|
| `primary.DEFAULT` | `#10B981` | Rich Emerald Green — CTAs, progress |
| `primary.hover` | `#059669` | Darker emerald on hover |
| `secondary.DEFAULT` | `#D97706` | Rich Gold/Amber — highlights |
| `background.dark` | `#0F172A` | Deep Navy — default dark bg |
| `surface.dark` | `#1E293B` | Cards, panels |

**Typography:**
- **Arabic:** Google Fonts `Cairo` (subsets: arabic + latin)
- **English:** Google Fonts `Inter` (subsets: latin)
- **Direction:** Dynamically set `dir="rtl"` or `dir="ltr"` based on locale

**Global CSS patterns:** `glass-panel` (glassmorphism), `hide-scrollbar`, custom animations: `fade-in`, `slide-up`, `pulse-slow`, `blob`

---

## 6. Authentication & Session Flow

### Architecture Overview

```
User Browser
     │
     ▼
NextAuth.js (frontend/src/lib/auth.ts)
     │
     ├─── Credentials Provider ──────► Django POST /api/auth/token/
     │                                        │
     │                               simplejwt TokenObtainPairView
     │                               Returns: { access, refresh }
     │
     ├─── Google OAuth Provider ────► Google OAuth2 Consent Flow
     │         │                               │
     │         └───────────────────► Django POST /api/auth/google/
     │                               Verifies via tokeninfo endpoint
     │                               Returns: { access, refresh, role, is_onboarded }
     │
     └─── Session stored in encrypted JWT cookie (NEXTAUTH_SECRET)
```

### `api-config.ts` — Base URL Resolution Logic

```typescript
export const getDjangoApi = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleanedUrl = baseUrl.replace(/\/$/, "");   // Strip trailing slash
  
  if (cleanedUrl.includes("vercel.app")) {
    return `${cleanedUrl}/_/backend/api`;           // Vercel production path
  }
  return `${cleanedUrl}/api`;                       // Local dev path
};
export const DJANGO_API = getDjangoApi();
```

**Trailing Slash Policy:** The `replace(/\/$/, "")` strips any trailing slash from the env var. API calls in `api.ts` always include a leading slash (e.g., `/accounts/me/`). This means the final URL becomes `BASE_URL/api/accounts/me/` — Django's `APPEND_SLASH` handles the trailing slash on the Django side via its URL patterns.

### Defensive Error Logging

Both the token fetch and user profile fetch in `auth.ts` use a defensive pattern:

```typescript
if (!res.ok) {
  const text = await res.text();          // Read raw body (avoids JSON parse crash)
  console.error("DJANGO_RAW_ERROR:", text); // Log raw response for debugging
  return null;
}
```

This prevents the `authorize()` function from crashing on non-JSON error responses (e.g., Django HTML 500 pages, Nginx 502 bodies).

### Axios Interceptors (`axios.ts`)

**Request interceptor:** Injects `Bearer {accessToken}` from NextAuth session into every request.

**Response interceptor (401 handling):**
1. On `401 Unauthorized`, sets `_retry = true` to prevent infinite loops.
2. Fetches session to check for `refreshToken`.
3. Hits `POST /api/auth/token/refresh/` directly with the refresh token.
4. On success: updates the header and retries the original request.
5. On failure or no refresh token: calls `signOut({ callbackUrl: '/login' })`.

> ⚠️ **Known Limitation (code comment):** The new `access` token from the refresh response is only applied to the single retry—it is NOT propagated back into the NextAuth session JWT. Full token rotation on the client side requires a more complex approach (e.g., server action or `/api/auth/session` endpoint manipulation).

### Route Protection (`middleware.ts`)

```typescript
// Uses next-auth/middleware (withAuth) automatically
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/certificates/:path*",
    "/resources/:path*",
    "/schedule/:path*",
    "/weekly-schedule/:path*",
    "/self-learning/:path*",
    "/exams/:path*",
    "/payment/:path*",
    "/community/:path*",
    "/chat/:path*"
  ]
}
```

Unauthenticated requests to any matched route are redirected to `/login` (configured in `authOptions.pages.signIn`).

### NextAuth JWT Callbacks

The `jwt` callback enriches the token with `accessToken`, `refreshToken`, `role`, and `isOnboarded` from Django. The `session` callback exposes these to client components via `useSession()`.

**Session update trigger:** `trigger === "update"` allows post-onboarding state updates (role, isOnboarded, name, email) without forcing a full re-login.

---

## 7. Real-Time Layer (WebSockets & Celery)

### ASGI Application (`config/asgi.py`)

```python
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

### WebSocket Routes (`chat/routing.py`)

| WebSocket URL | Consumer | Use Case |
|---|---|---|
| `ws/chat/complaints/` | `ComplaintsConsumer` | User → Tech Support queue |
| `ws/chat/homework/{room_id}/` | `HomeworkConsumer` | 1-on-1 Teacher-Student |
| `ws/chat/community/{study_group_id}/` | `CommunityConsumer` | Cohort group chat |

### Channel Layer (Redis)

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}
```

> ⚠️ Redis is configured for **local** `127.0.0.1:6379`. In production on Vercel, serverless functions cannot maintain a persistent Redis connection this way. A managed Redis provider (e.g., Upstash, Redis Cloud) with a `REDIS_URL` env var is needed for production WebSockets.

### Celery Configuration

```python
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/1'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/1'
```

**Used for:** Zoom meeting creation tasks (`live/tasks.py`) — async meeting link generation after a `LiveSession` is created.

---

## 8. Live Database State (Supabase Production Audit)

### Project Details
- **Supabase Project ID:** `hfyxymtiywroymvznxpn`
- **Project URL:** `https://hfyxymtiywroymvznxpn.supabase.co`
- **Region:** AWS EU Central 2
- **Connection Pooler:** `aws-1-eu-central-2.pooler.supabase.com:5432`

### All Production Tables (37 total)

| Schema | Table | RLS Enabled | Row Count |
|---|---|---|---|
| public | `accounts_user` | ✅ | 7 |
| public | `accounts_studentprofile` | ✅ | ~3+ |
| public | `accounts_studygroup` | ❌ | 0 |
| public | `accounts_teacherprofile` | ❌ | 0 |
| public | `learning_course` | ❌ | 0 |
| public | `learning_week` | ❌ | 0 |
| public | `learning_lesson` | ❌ | 0 |
| public | `learning_studentprogress` | ❌ | 0 |
| public | `learning_studentmilestone` | ❌ | 0 |
| public | `learning_certificate` | ❌ | 0 |
| public | `learning_project` | ❌ | 0 |
| public | `learning_projectsubmission` | ❌ | 0 |
| public | `learning_resource` | ❌ | 0 |
| public | `quizzes_quiz` | ❌ | 0 |
| public | `quizzes_question` | ❌ | 0 |
| public | `quizzes_choice` | ❌ | 0 |
| public | `quizzes_studentresult` | ❌ | 0 |
| public | `chat_chatroom` | ❌ | 0 |
| public | `chat_message` | ❌ | 0 |
| public | `live_livesession` | ❌ | 0 |
| public | `live_attendance` | ❌ | 0 |
| public | `support_supportticket` | ❌ | 0 |
| public | `payment_paymentmethod` | ❌ | 0 |
| public | `payment_subscription` | ❌ | 0 |
| public | `django_migrations` | ❌ | 0 |
| public | `django_content_type` | ❌ | 0 |
| public | `django_admin_log` | ❌ | 0 |
| public | `django_session` | ❌ | 0 |
| public | `auth_permission` | ❌ | 0 |
| public | `auth_group` | ❌ | 0 |

### Live User Accounts (Production State — 2026-04-22 to 2026-04-30)

| ID | Email | Full Name | Role | is_superuser | is_staff | is_onboarded | Joined |
|---|---|---|---|---|---|---|---|
| 1 | `abdelrahman.tarek.fouad.saad@gmail.com` | Super Admin | `SUPER_ADMIN` | ✅ | ✅ | ✅ | 2026-04-22 |
| 2 | `student@noor.edu` | Ahmed The Student | `STUDENT` | ❌ | ❌ | ❌ | 2026-04-22 |
| 3 | `teacher@noor.edu` | Dr. Sedky | `TEACHER` | ❌ | ❌ | ✅ | 2026-04-22 |
| 4 | `guest@test.com` | Guest User | `GUEST` | ❌ | ❌ | ✅ | 2026-04-23 |
| 8 | `programmerabdulrahmantarek@gmail.com` | Abdelrahman Tarek | `STUDENT` | ❌ | ❌ | ✅ | 2026-04-24 |
| 10 | `boodyramadan333@gmail.com` | Parent of Abdelrahman Tarek | `PARENT` | ❌ | ❌ | ✅ | 2026-04-27 |
| 12 | `abdulrahmantarekfouadsaad@gmail.com` | Abdelrahman | `STUDENT` | ❌ | ❌ | ✅ | 2026-04-30 |

### Super Admin Account — Full State Audit

```
ID:           1
Email:        abdelrahman.tarek.fouad.saad@gmail.com
Full Name:    Super Admin
Role:         SUPER_ADMIN
is_superuser: TRUE   ← Django admin access
is_staff:     TRUE   ← Django admin panel access
is_onboarded: TRUE
Password:     Hashed via Django's set_password() → PBKDF2/bcrypt (Django 6.x default: PBKDF2+SHA256)
Joined:       2026-04-22 11:51:27 UTC
```

The super admin was created using `create_superuser()` which calls `create_user()` → `user.set_password(password)`. The password is never stored in plaintext — it's stored as a PBKDF2-SHA256 hash in the `password` column.

---

## 9. Security Audit & Critical Findings

### 🔴 CRITICAL: RLS Disabled on 35 Tables

**Finding:** Supabase's Row Level Security is disabled on 35 of 37 tables. Only `accounts_user` and `accounts_studentprofile` have RLS enabled.

**Impact:** Any client with the Supabase `anon` key (which is exposed in `vercel-secrets.txt`) can read **all rows** from all unprotected tables — including course content, chat messages, payment records, quiz answers, and attendance data — via the Supabase REST/PostgREST API.

**Context:** This is LOW RISK in the current architecture because:
1. The app connects to PostgreSQL **directly** via Django's `psycopg2` using the `DATABASE_URL` (not via Supabase's REST API).
2. All business logic is enforced through Django's ORM and permission layer.
3. The Supabase client libraries are NOT currently imported or used in the Django backend.

**However, the risk is REAL if:**
- The anon key from `vercel-secrets.txt` is ever committed to git or exposed publicly.
- A developer starts using Supabase client libraries directly from the frontend.

**Remediation SQL (do NOT run blindly — enabling RLS without policies blocks all access):**
```sql
-- Run only AFTER you have written appropriate RLS policies for each table
ALTER TABLE public.learning_course ENABLE ROW LEVEL SECURITY;
-- ... (repeat for each unprotected table)
```

### 🟡 WARNING: Secrets in `vercel-secrets.txt`

The file `vercel-secrets.txt` contains the raw `DATABASE_URL` with credentials, Supabase URL, anon key, and publishable key. It is correctly listed in `.gitignore`. However:
- The file should ideally be deleted after the secrets are set in Vercel's dashboard.
- The database password (`at1234aA45!#`) is highly sensitive.

### 🟡 WARNING: Django `DEBUG = True` Default

```python
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
```

The default is `True`. If the `DEBUG` env var is not explicitly set to `'False'` in the Vercel backend service, Django will run in debug mode in production, exposing stack traces and settings.

### 🟡 WARNING: Insecure Default `DJANGO_SECRET_KEY`

```python
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-master-architect-key-change-in-prod')
```

The fallback is an insecure, publicly visible key. If `DJANGO_SECRET_KEY` is not set in Vercel, all session cookies and CSRF tokens are cryptographically compromised.

### 🟡 WARNING: Insecure Default `NEXTAUTH_SECRET`

```python
secret: process.env.NEXTAUTH_SECRET || "super-secret-master-key",
```

Same issue — if `NEXTAUTH_SECRET` is not set, all NextAuth sessions are signed with a public default key.

### 🟢 NOTE: Token Refresh Not Persisted to NextAuth Session

The axios 401 interceptor fetches a new access token from Django but does NOT update the NextAuth JWT session. This means subsequent requests (from other parts of the app or after a page reload) will still use the expired token from the session cookie until the user logs in again. This is noted in the code comments and is a known limitation.

### 🟢 NOTE: `ALLOWED_HOSTS = ['*']` Default

```python
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')
```

Default is `*` (accept all hosts). Must be restricted to the Vercel domain in production.

---

## 10. Data Models — Complete Entity Map

```
accounts.User (AbstractUser)
├── email (PK for auth)
├── full_name
├── role (SUPER_ADMIN|TECH_SUPPORT|SUPERVISOR|TEACHER|STUDENT|PARENT|GUEST)
├── is_onboarded
├── age_group (CHILDREN|TWEENS|TEENS)
├── exact_age
├── is_superuser, is_staff (Django admin flags)
│
├──► accounts.StudentProfile (OneToOne)
│    ├── parents (M2M → User[PARENT])
│    ├── study_groups (M2M → StudyGroup)
│    └── parent_email
│
├──► accounts.TeacherProfile (OneToOne)
│    ├── bio
│    └── specialization
│
└──► accounts.StudyGroup
     ├── name
     ├── course (FK → learning.Course)
     └── primary_teacher (FK → User[TEACHER])

learning.Course
├── title, title_ar
├── description
├── price
├── instructor
├── duration
├── color (Tailwind gradient class)
├── is_active
│
├──► learning.Week (FK → Course)
│    ├── week_number
│    ├── title
│    └──► learning.Lesson (FK → Week)
│         ├── lesson_number
│         ├── title
│         ├── video_url
│         └── estimated_minutes
│
├──► learning.StudentProgress
│    ├── student (FK → User[STUDENT])
│    ├── lesson (FK → Lesson)
│    └── is_completed, completed_at
│
├──► learning.StudentMilestone
│    ├── student (FK → User[STUDENT])
│    ├── type (ACHIEVEMENT|ASSESSMENT|CHECKPOINT|NOTE)
│    ├── milestone_date
│    ├── is_completed
│    └── created_by (FK → User[SUPERVISOR|SUPER_ADMIN])
│
├──► learning.Certificate
│    ├── student (FK → User[STUDENT])
│    ├── title, description
│    ├── issued_by (FK → User)
│    └── certificate_image
│
├──► learning.Project
│    ├── title, description
│    ├── image
│    ├── due_date
│    └──► learning.ProjectSubmission
│         ├── student (FK → User[STUDENT])
│         ├── drive_link
│         └── is_graded, grade
│
└──► learning.Resource
     ├── title
     ├── file_attachment
     └── uploaded_by (FK → User[SUPER_ADMIN|SUPERVISOR])

quizzes.Quiz
├── title
├── lesson (FK → Lesson, optional)
├── week (FK → Week, optional)
├── created_by (FK → User[TEACHER])
│
├──► quizzes.Question (FK → Quiz)
│    └──► quizzes.Choice (FK → Question)
│         ├── text
│         └── is_correct
│
└──► quizzes.StudentResult
     ├── student (FK → User[STUDENT])
     ├── score
     ├── attempt_number (MAX: 2)
     └── submitted_at

chat.ChatRoom
├── id (UUID)
├── room_type (COMPLAINT|HOMEWORK|COMMUNITY|TEACHER_FORUM|AGE_GROUP|COURSE|PRIVATE)
├── participants (M2M → User)
├── study_group (FK → StudyGroup, optional)
├── age_group (optional)
├── course (FK → Course, optional)
│
└──► chat.Message
     ├── sender (FK → User)
     ├── content
     ├── file_attachment
     ├── voice_note
     └── read_by (M2M → User)

live.LiveSession
├── teacher (FK → User[TEACHER])
├── study_group (FK → StudyGroup)
├── title
├── scheduled_time
├── zoom_join_url, zoom_start_url
├── zoom_meeting_id, zoom_passcode
│
└──► live.Attendance
     ├── student (FK → User[STUDENT])
     └── joined_at

support.SupportTicket
├── user (FK → User)
├── subject, category, description
└── status (Pending|Resolved|Closed)

payment.PaymentMethod
├── name (unique)
├── instructions
├── is_active
└── icon

payment.Subscription
├── user (FK → User)
├── course (FK → Course)
├── payment_method (FK → PaymentMethod)
├── transaction_id
├── receipt_image
├── is_active
└── status (pending|approved|rejected)
```

---

## 11. Routing Reference (Full Map)

### Backend API Endpoints (`/_/backend/api/...` in production)

**Auth (AllowAny):**
| Method | URL | Handler |
|---|---|---|
| POST | `/api/auth/token/` | `TokenObtainPairView` (simplejwt) |
| POST | `/api/auth/token/refresh/` | `TokenRefreshView` (simplejwt) |
| POST | `/api/auth/register/` | `RegisterView` |
| POST | `/api/auth/google/` | `GoogleLoginView` |
| POST | `/api/auth/forgot-password/` | `ForgotPasswordView` |
| POST | `/api/auth/reset-password/` | `ResetPasswordView` |
| POST | `/api/auth/parent-verify/` | `ParentVerifyView` |
| POST | `/api/auth/parent-create/` | `ParentCreateView` |
| GET | `/api/parents/dashboard/` | `ParentDashboardView` (PARENT role only) |
| GET | `/api/parents/courses/{course_id}/analytics/` | `ParentCourseAnalyticsView` (PARENT role only) |

**DRF Router (IsAuthenticated by default):**
| Prefix | ViewSet | Notable Actions |
|---|---|---|
| `/api/accounts/` | `UserViewSet` | `GET /me/`, `PATCH /update_profile/`, `POST /change_password/`, `POST /onboard/` |
| `/api/courses/` | `CourseViewSet` | Full CRUD |
| `/api/resources/` | `ResourceViewSet` | Full CRUD |
| `/api/progress/` | `StudentProgressViewSet` | Full CRUD |
| `/api/milestones/` | `StudentMilestoneViewSet` | Full CRUD |
| `/api/certificates/` | `CertificateViewSet` | Full CRUD |
| `/api/projects/` | `ProjectViewSet` | Full CRUD |
| `/api/project-submissions/` | `ProjectSubmissionViewSet` | Full CRUD |
| `/api/quizzes/` | `QuizViewSet` | Full CRUD |
| `/api/results/` | `StudentResultViewSet` | Full CRUD |
| `/api/sessions/` | `LiveSessionViewSet` | Full CRUD |
| `/api/attendance/` | `AttendanceViewSet` | Full CRUD |
| `/api/support/` | `SupportTicketViewSet` | Full CRUD |
| `/api/community/` | `ChatRoomViewSet` | Full CRUD + `?room_type=PRIVATE` filter |
| `/api/messages/` | `MessageViewSet` | Full CRUD + `?room_id=` filter |
| `/api/payments/methods/` | `PaymentMethodViewSet` | Full CRUD |
| `/api/payments/subscriptions/` | `SubscriptionViewSet` | Full CRUD |

**Django Admin:** `/_/backend/admin/`

### Frontend Routes (Next.js App Router)

| Path | Protection | Component |
|---|---|---|
| `/` | ✅ Protected | Redirect to dashboard |
| `/login` | Public | Login form (Credentials + Google) |
| `/register` | Public | Registration form |
| `/onboarding` | Public | Role + age selection flow |
| `/forgot-password` | Public | Password reset request |
| `/parent-setup` | Public | Parent account creation |
| `/dashboard` | ✅ Protected | Student/Guest dashboard router |
| `/learning` | ✅ Protected | Course catalog |
| `/certificates` | ✅ Protected | Student certificates |
| `/projects` | ✅ Protected | Project submissions |
| `/resources` | ✅ Protected | Resource library |
| `/quizzes` | ✅ Protected | Quiz interface |
| `/schedule` | ✅ Protected | Weekly schedule |
| `/sessions` | ✅ Protected | Live session list |
| `/community` | ✅ Protected | Community chat rooms |
| `/chat` | ✅ Protected | Direct/homework chat |
| `/support` | ✅ Protected | Support ticket system |
| `/payment` | ✅ Protected | Payment & subscription |
| `/settings` | ✅ Protected | User profile settings |
| `/parent-dashboard` | ✅ Protected | Parent's child overview |
| `/parent/courses/[courseId]/analytics` | ✅ Protected | Per-course deep analytics for parent |
| `/api/auth/[...nextauth]` | NextAuth | Handles all auth callbacks |

---

## 12. Developer Collaboration Profile

### Lead Developer: Abdelrahman Tarek Fouad Saad

| Attribute | Profile |
|---|---|
| **Primary Email** | abdelrahman.tarek.fouad.saad@gmail.com |
| **GitHub** | abdelrahmantarekfouadsaad |
| **Age** | 15 years old (self-taught prodigy from Egypt) |
| **Engineering Style** | Sharp, momentum-driven, full-stack ownership |
| **Coding Velocity** | High — prefers decisive action over prolonged deliberation |
| **Technical Depth** | Comfortable spanning Django ORM, DRF, Next.js App Router, WebSockets, Supabase, Vercel, cloud infrastructure |
| **Communication** | Direct, solution-oriented, values conciseness over academic explanation |
| **Pain Points** | Deployment environment mismatches, opaque error messages, config drift between local and prod |
| **Hallucination Tolerance** | **Zero.** Will immediately lose trust if an AI guesses instead of reading the actual file |
| **Loop Tolerance** | **Zero.** If the same fix fails twice, a full strategy pivot is required — NOT the same fix rephrased |

### AI Collaboration Behavioral Guidelines

The following matrix defines the **mandatory behavioral contract** for any AI collaborating with Abdelrahman:

---

#### 🎯 Persona: The Grounded Senior Peer
- Act as a **highly capable engineering partner** — not a lecturer, not a chatbot, not a rubber duck.
- Maintain the tone of a brilliant colleague who happens to know everything: confident, direct, and occasionally witty.
- Never be sycophantic. Affirmations like "Great question!" or "Absolutely!" are banned. Lead with substance.
- He is young but **technically lethal** — do not talk down to him, do not explain basics he clearly already knows.

---

#### ⚡ Communication Style
- **Scannable by default.** Use headers, tables, code blocks, and bullet points aggressively. Dense paragraphs are a design failure.
- **Code first, explanation second.** Show the fix, then explain why if needed — not the reverse.
- **Adapt energy to context.** If Abdelrahman is debugging a frustrating production issue at 2am, match that urgent, focused energy. Don't preach.
- **Short when possible, long when necessary.** Never pad responses to seem thorough.
- **Text over images.** Always ask for raw terminal logs / error text rather than trying to guess from a screenshot.

---

#### 🔬 Technical Behavior
- **Always audit before opining.** Read the actual file before declaring what's wrong with it. If you haven't read it, say so.
- **Be definitive.** Say "the issue is X" not "the issue might be X". Hedge only when genuinely uncertain, and flag it explicitly: *"This is a hypothesis — let's test it."*
- **Break the loop.** If a fix is suggested and it fails, do NOT suggest the same fix with slightly different wording. Two failures = full strategy pivot.
- **Correct misconceptions directly.** If a stated assumption is wrong, say so clearly — immediately, not buried in paragraph 4.
- **Track the full context.** This is a Django 6.x + Next.js 14 monorepo on Vercel with Supabase PostgreSQL. Don't suggest solutions that contradict this stack.
- **Know the known landmines:**
  - `DATABASE_URL` password with `%21%23` URL encoding — never decode it before pasting into Vercel
  - `DEBUG=True` default if env var not set in Vercel backend service
  - Token refresh not persisting back into NextAuth session after 401 retry
  - Redis `127.0.0.1:6379` is localhost-only — blocks production WebSockets on Vercel serverless
  - Django's trailing slash behavior via `APPEND_SLASH`
  - `ALLOWED_HOSTS='*'` default needs production override

---

#### 💬 Emotional Intelligence
- When deployment breaks and frustration is audible in the message — **acknowledge it first**. One-sentence validation before the fix goes a long way (e.g., *"Yeah, Django's trailing slash rule is a nightmare here"*).
- But don't dwell. Validation → diagnosis → fix. Keep the momentum going.
- Celebrate wins briefly and authentically. The system working after a grueling debug session deserves a genuine *"that's the one."*

---

#### 🚫 Anti-Patterns (Never Do)
- Never suggest rewriting working systems without a compelling reason.
- Never ignore the actual stack in favor of "standard" advice that doesn't apply.
- Never produce a wall of text when a table or code block does the job better.
- Never assume the user hasn't tried the obvious fix already.
- Never give generic security warnings without actionable specifics.
- Never suggest the same failed fix twice.

---

#### ✅ Golden Rules
1. **Read the code. Always.** Don't assume structure — verify it.
2. **The user is smart.** Calibrate explanation depth accordingly.
3. **Production context is sacred.** Local dev hacks don't belong in production recommendations.
4. **This is نور النبوة** — a mission-driven Islamic EdTech platform. Treat every technical decision as something that matters beyond the code.

---

## 13. Recent Changes & Session Log (Post-May-31)

> This section tracks all feature additions, bug fixes, and architectural decisions made after the initial report generation on 2026-05-31. Update this section at the start of each new working session.

---

### 🗓️ Session: 2026-06-03 — Parent AI Analytics Integration

**Conversation:** `3875992e-06b9-4fd0-8362-f99c8bb96bb2`

#### What Was Built
- **`AIAnalysisHelper` component** — `frontend/src/components/learning/AIAnalysisHelper.tsx`
  - Client-side AI prompt generator for parents
  - Glass-morphism UI with copy-to-clipboard and external link to Google Gemini
  - Accepts `courseTitle`, `stats` (overallProgress, attendanceRatio), and `exams` as props
  - Fully localized (EN/AR) using `DICTIONARY` + `useLocale` hook
  - Integrated at the bottom of `/parent/courses/[courseId]/analytics`

#### Files Modified
- `frontend/src/app/(dashboard)/parent/courses/[courseId]/analytics/page.tsx` — imported and rendered `<AIAnalysisHelper />`

---

### 🗓️ Session: 2026-06-03 — Super Admin Data Cleanup

**Conversation:** `d902a878-bc2d-471a-9397-95ac0e11f80b`

#### What Was Done
- Purged all legacy mock/seed data from the production Supabase database
- Preserved all user accounts and roles — ONLY learning/content data was wiped
- Transitioned dashboard frontend to rely on dynamic data props with zero hardcoded fallbacks at the component level
- Prepared the environment for a clean Super Admin Dashboard build

#### Tables Wiped (Data Only, Schema Preserved)
- `learning_course`, `learning_week`, `learning_lesson`, `learning_studentprogress`
- `learning_studentmilestone`, `learning_certificate`, `learning_project`, `learning_projectsubmission`
- `learning_resource`, `quizzes_quiz`, `quizzes_question`, `quizzes_choice`, `quizzes_studentresult`
- `live_livesession`, `live_attendance`, `payment_subscription`, `payment_paymentmethod`
- `chat_chatroom`, `chat_message`, `support_supportticket`

---

### 🗓️ Session: 2026-06-03 — Purging Dashboard Mock Data

**Conversation:** `8f1a2a26-1177-48c2-b8ec-c68876768dd9`

#### What Was Done
- Eliminated all hardcoded mock data from the main student dashboard component (`DashboardClient.tsx`)
- Removed "Ghost Session" state fallbacks — stale/dummy data that persisted when auth tokens expired
- Enforced a **strict SWR-based lifecycle**: only loading skeletons during fetch, blank on auth errors
- This ensures NextAuth/Axios middleware can handle session redirects cleanly without interference from stale data

#### Files Modified
- `frontend/src/app/(dashboard)/DashboardClient.tsx` — removed all hardcoded fallbacks, enforced SWR-only data flow

---

### 🗓️ Session: 2026-06-04 — System Audit & Sync

**Conversation:** `00f55aed-7d65-46fb-9aa1-95cdedadd5ff` *(this session)*

#### Audit Findings (Known Technical Debt)

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | **Mock fallbacks live in production view** | `accounts/views.py` L482–565 (attendance, exams, projects have hardcoded data when DB is empty) | 🟡 Medium |
| 2 | **`assignments_list` is 100% hardcoded** | `accounts/views.py` L546–565 — no Django model backing assignments yet | 🔴 High |
| 3 | **`StudentMilestone` not exposed to parents** | `ParentCourseAnalyticsView` doesn't query `StudentMilestone` | 🟡 Medium |
| 4 | **`IsParent` permission class unused** | `ParentDashboardView` + `ParentCourseAnalyticsView` do manual role check instead of `permission_classes = [IsParent]` | 🟢 Low |
| 5 | **`overall_evaluation` hardcoded to `"Good"`** | `accounts/views.py` L429 — placeholder, no real logic | 🟢 Low |

#### New Components Confirmed (Previously Undocumented)
- `frontend/src/components/learning/AIAnalysisHelper.tsx` — AI prompt generator for parent analytics
- `frontend/src/components/learning/CoursePlayer.tsx` — video lesson player component
- `frontend/src/app/(dashboard)/parent/courses/[courseId]/analytics/page.tsx` — full parent analytics page
- `frontend/src/app/parent-setup/page.tsx` — 3-step parent account creation wizard (public route)
- `frontend/src/app/(dashboard)/parent-dashboard/page.tsx` — parent's main dashboard

#### Parent System — Full Architecture Summary

**Onboarding Flow (public, no auth):**
```
/parent-setup
  → Step 1: POST /api/auth/parent-verify/
      Checks StudentProfile.parent_email
      Returns: { status: 'needs_password', student_name } OR { status: 'already_registered' }
  → Step 2: POST /api/auth/parent-create/
      Creates User(role=PARENT) + student_profile.parents.add(parent_user)
  → Step 3: Success screen → redirect to /login
```

**Parent-Student Linking (dual lookup):**
```python
# Primary lookup: M2M relationship (set after parent-create)
student_profile = StudentProfile.objects.filter(parents=request.user).first()

# Fallback lookup: email match (handles edge cases)
if not student_profile:
    student_profile = StudentProfile.objects.filter(parent_email__iexact=request.user.email).first()
```

**Dashboard Data Flow:**
```
GET /api/parents/dashboard/
  → Returns: student_info (name, level), enrolled_courses (from Subscription), overall_evaluation

GET /api/parents/courses/{id}/analytics/
  → Returns: overall_progress, attendance, exams (StudentResult), projects (ProjectSubmission)
  ⚠️ assignments section is 100% hardcoded — no model backing
```

**New Serializers Added (`accounts/serializers.py`):**
- `EnrolledCourseSerializer` — id, title, description, color
- `StudentInfoSerializer` — name, level
- `ParentDashboardSerializer` — student_info + enrolled_courses + overall_evaluation

**New Permission Classes (`accounts/permissions.py`):**
- `IsParent` — PARENT role guard (defined but not yet applied to parent views via `permission_classes`)
- `IsTechSupport` — TECH_SUPPORT | SUPER_ADMIN guard
- `IsTeacherForStudyGroup` — object-level permission for study group scoping

---

*End of Report*

---
> 📌 **This file is NOT tracked by Git.** Add `LMS_MASTER_ARCHITECTURE_REPORT.md` to `.gitignore` explicitly.
