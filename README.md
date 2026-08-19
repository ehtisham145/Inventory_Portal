# Al Merak Review & Approval Portal

A role-based proposal/message review and approval system for Al Merak. Main Admin creates
companies, users and proposals; Managers prepare and send proposals for review; Company
Users approve, reject, or request changes via a secure, tokenized review link delivered by
email and WhatsApp.

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend    | Django 6, Django REST Framework |
| Auth       | JWT (djangorestframework-simplejwt) |
| Database   | PostgreSQL |
| Email      | Django SMTP email backend (console backend in development) |
| WhatsApp   | `wa.me` click-to-chat links (MVP; swappable for WhatsApp Business API later) |

## Folder Structure

```
al-merak-approval-portal/
├── backend/            Django + DRF API (completely independent from frontend)
│   ├── config/         Settings, URLs, WSGI/ASGI
│   ├── accounts/       Custom User model, JWT auth, users API, seed_data command
│   ├── companies/      Company model + API
│   ├── proposals/      Proposal, Observation, Attachment models, status workflow, review API
│   ├── notifications/  Email + WhatsApp notification services
│   ├── activity_logs/  ProposalHistory model, dashboards, activity feed
│   └── manage.py
│
├── frontend/            Next.js App Router client (completely independent from backend)
│   ├── app/             Routes (login, admin/*, manager/*, company/*, review/[token])
│   ├── components/      ui/, layout/, proposals/, users/
│   ├── services/        Typed API clients per resource
│   ├── lib/              axios instance, JWT helpers
│   ├── hooks/            AuthProvider, ToastProvider
│   ├── types/            Shared TypeScript types
│   └── utils/            Formatting, status labels, validators
│
└── README.md
```

The two apps only talk to each other over HTTP (REST). Nothing is shared or imported across
the `backend/` and `frontend/` folders.

## User Roles

- **MAIN_ADMIN** — full control: manages companies, managers, company users, and all proposals.
- **MANAGER** — manages only proposals assigned to them; prepares and sends messages, handles
  change requests, resubmits.
- **COMPANY_USER** — reviews assigned proposals and approves / rejects / requests changes.

All permissions are enforced on the backend (DRF permission classes + queryset scoping).
The frontend role is never trusted for authorization — it only drives navigation/UI.

## Proposal Workflow

```
DRAFT → SENT → PENDING_REVIEW → APPROVED
                              → REJECTED
                              → CHANGES_REQUESTED → RESUBMITTED → PENDING_REVIEW → ...
```

Every transition is validated server-side (`backend/proposals/services.py`) and recorded in
`ProposalHistory`. The frontend can never set a status directly — it only calls action
endpoints (`send`, `resend`, `approve`, `reject`, `changes`).

## Backend Setup

### 1. Prerequisites

- Python 3.11+ (3.12 recommended)
- PostgreSQL 14+ running locally or accessible remotely

### 2. Create the database

```sql
CREATE DATABASE almerak_portal;
```

### 3. Install dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and adjust values (database credentials, SMTP, frontend URL):

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|----------|---------|
| `DJANGO_SECRET_KEY` | Django secret key — set a long random value in production |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection |
| `FRONTEND_URL` | Used to build review links, e.g. `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Origins allowed to call the API |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP credentials |
| `REVIEW_TOKEN_EXPIRY_DAYS` | How long a review link stays valid |

In `DEBUG=True` mode, email falls back to the console backend, so proposal emails are printed
to the terminal instead of requiring real SMTP credentials during development.

### 5. Run migrations and seed demo data

```bash
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

The API is now available at `http://localhost:8000/api/`.

### Demo credentials (created by `seed_data`)

| Role | Email | Password |
|------|-------|----------|
| Main Admin | admin@almerak.com | Admin@123 |
| Manager | manager@almerak.com | Manager@123 |
| Company User | user1@bluehorizon.example.com | Company@123 |
| Company User | user2@novaconstruction.example.com | Company@123 |

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

`.env.local` is already set up for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Point this at your deployed backend URL in production.

### 3. Run the dev server

```bash
npm run dev
```

The app is available at `http://localhost:3000`. Visiting `/` redirects to `/login`, and after
login users are routed to `/admin/dashboard`, `/manager/dashboard`, or `/company/dashboard`
based on their role.

## API Overview

All endpoints are prefixed with `/api/`.

**Auth**
`POST auth/login/` · `POST auth/refresh/` · `POST auth/logout/` · `GET auth/me/`

**Users**
`GET/POST users/` · `GET/PATCH/DELETE users/{id}/` (DELETE deactivates, does not hard-delete)

**Companies**
`GET/POST companies/` · `GET/PATCH/DELETE companies/{id}/` (DELETE sets status to INACTIVE)

**Proposals**
`GET/POST proposals/` · `GET/PATCH/DELETE proposals/{id}/`
`POST proposals/{id}/send/` · `POST proposals/{id}/resend/`
`GET proposals/{id}/history/` · `GET proposals/{id}/observations/`
`GET/POST proposals/{id}/attachments/`

**Public review (token-based, no login required)**
`GET review/{token}/` · `POST review/{token}/approve/`
`POST review/{token}/reject/` · `POST review/{token}/changes/`

**Dashboards & activity**
`GET dashboard/admin/` · `GET dashboard/manager/` · `GET dashboard/company/` · `GET activity/`

Every error response uses a consistent shape:

```json
{ "error": { "message": "Human readable message", "details": { "field": ["..."] } } }
```

## Permission System

- `IsMainAdmin` / `IsMainAdminOrManager` (`accounts/permissions.py`) gate write endpoints.
- Every list/detail queryset is scoped server-side by role (see `_scope_proposals` in
  `proposals/views.py` and equivalent logic in `companies/views.py`, `accounts/views.py`).
- `CanAccessProposal` (`proposals/permissions.py`) enforces object-level access so a Manager
  can only reach proposals assigned to them and a Company User only their own.
- The public `/review/{token}/` endpoints use no authentication at all — access is controlled
  entirely by possession of the cryptographically random, expiring `review_token`.

## Email Configuration

Emails are sent via `notifications/services.py::send_proposal_review_email`, using the HTML
template at `backend/notifications/templates/emails/proposal_review.html`. Configure real SMTP
credentials (e.g. a Gmail App Password) in `.env` for production; in development the console
backend prints the email instead of sending it.

## WhatsApp Configuration

`notifications/services.py::build_whatsapp_link` builds a `https://wa.me/{phone}?text=...`
click-to-chat URL from the company user's phone number — no WhatsApp Business API account is
required for this MVP. The function is isolated so it can be swapped for a real WhatsApp
Business API integration later without touching any call sites.

## Known Limitations / Next Steps

- `npm audit` flags Next.js 14.x advisories that mostly affect self-hosted middleware/Server
  Actions/image-optimizer features this MVP doesn't use; before a production deploy, re-run
  `npm audit` and upgrade to the latest patched Next.js release.
- File attachments are stored on local disk (`MEDIA_ROOT`) for the MVP — move to S3/Blob
  storage before production.
- WhatsApp sending is a manual click-to-chat link (no automated delivery yet, per spec).
