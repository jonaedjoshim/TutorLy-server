# Tutorly API

Backend for Tutorly — a tuition marketplace connecting students and tutors.

## Stack

Node.js, Express, MongoDB (Mongoose), JWT authentication.

## Getting started

```bash
npm install
cp .env.example .env
# fill in MONGO_URI and JWT_SECRET
npm run dev
```

Health check: `GET http://localhost:5000/api/health`
