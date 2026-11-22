# Tutorly API

Backend for Tutorly — a tuition marketplace connecting students and tutors.

## Stack

Node.js, Express, MongoDB (Mongoose), JWT + bcrypt authentication.

## Getting started

```bash
npm install
cp .env.example .env
# fill in MONGO_URI and JWT_SECRET
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

## Tests

```bash
npm test
```

Runs an end-to-end API smoke test against a temporary in-memory MongoDB. No external database needed. The first run downloads a MongoDB binary (a few hundred MB), so allow a few minutes.

## Seed demo data

```bash
npm run seed        # add/update demo accounts, safe to re-run
npm run seed:fresh  # wipe collections first, then seed
```

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tutorly.test` | `admin12345` |
| Student | `rahim@tutorly.test` | `demo12345` |
| Tutor (verified) | `nadia@tutorly.test` | `demo12345` |
| Tutor (unverified) | `farah@tutorly.test` | `demo12345` |

> These are development-only credentials. Do not run the seed script against a production database.

## API overview

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Service status |
| POST | `/api/auth/register` | public | Create account |
| POST | `/api/auth/login` | public | Get JWT |
| GET | `/api/auth/me` | private | Current user |
| PUT | `/api/auth/profile` | private | Update own details |
| GET | `/api/tutors` | public | Search tutors |
| GET | `/api/tutors/:id` | public | Tutor detail |
| GET/PUT | `/api/tutors/me` | tutor | Own teaching profile |
| GET | `/api/posts` | public | Approved tuition needs |
| POST | `/api/posts` | student | Create request (pending) |
| GET | `/api/posts/mine` | student | Own requests |
| GET/PUT/DELETE | `/api/posts/:id` | student | Own request detail/edit/remove |
| POST | `/api/applications` | tutor | Apply to an approved request |
| GET | `/api/applications/mine` | tutor | Sent applications |
| GET | `/api/applications/received` | student | Applications on own posts |
| PUT | `/api/applications/:id` | student | Accept or decline |
| GET | `/api/admin/stats` | admin | Platform counts |
| GET/PUT | `/api/admin/posts/...` | admin | Review queue |
| GET/PUT | `/api/admin/tutors/...` | admin | Verify tutors |
| GET/PUT | `/api/admin/users/...` | admin | Manage users |
| POST | `/api/tutors/me/documents` | tutor | Upload verification files (private) |
| GET/DELETE | `/api/tutors/me/documents/:name` | owner/admin | Open or remove a file |
| GET | `/api/reviews?tutorId=...` | public | Tutor feedback |
| POST | `/api/reviews` | student | Rate a tutor after an accepted application |
| GET | `/api/stats` | public | Live counts computed from the database |
