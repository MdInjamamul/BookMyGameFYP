# BookMyGame – Technical Report Index

**Project:** BookMyGame – Sports Venue Booking Platform  
**Technology Stack:** PERN (PostgreSQL + Express.js + React + Node.js)  
**Report Generated:** April 2026

---

## Report Structure

This `Report/` directory contains a comprehensive technical breakdown of the BookMyGame platform, organized into 10 focused chapters.

---

## Chapter Index

| File | Chapter | Topics Covered |
|------|---------|----------------|
| [01_PROJECT_ARCHITECTURE.md](01_PROJECT_ARCHITECTURE.md) | 1 | System architecture, PERN stack, folder structure, third-party services, REST API, Socket.IO, environment variables |
| [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md) | 2 | All 15 Prisma models, field definitions, data types, ENUMs, relationships, ERD, indexes |
| [03_AUTHENTICATION_AUTHORIZATION.md](03_AUTHENTICATION_AUTHORIZATION.md) | 3 | JWT auth, registration/login flow, email OTP, password reset, RBAC, ProtectedRoute, AuthContext, rate limiting |
| [04_VENUE_MANAGEMENT.md](04_VENUE_MANAGEMENT.md) | 4 | Venue creation, admin approval workflow, image upload (Cloudinary/local), operating hours, search/filter, dashboard stats |
| [05_SLOT_BOOKING_SYSTEM.md](05_SLOT_BOOKING_SYSTEM.md) | 5 | 11-step booking flow, 90s locking, double-booking prevention, 5-min cron expiry, booking lifecycle, refund tiers |
| [06_PAYMENT_INTEGRATION.md](06_PAYMENT_INTEGRATION.md) | 6 | Khalti ePay integration, initiation API, server-side verification, refund flow, idempotency, paisa conversion |
| [07_ADDITIONAL_FEATURES.md](07_ADDITIONAL_FEATURES.md) | 7 | Events, Reviews, Training Videos, Notification System, Email + QR Receipts, E-Commerce Shop, Leaflet Maps, Admin Dashboard |
| [08_SECURITY.md](08_SECURITY.md) | 8 | Helmet, CORS, 3-tier rate limiting, bcrypt, JWT best practices, input validation, SQL injection, file upload security, threat table |
| [09_API_REFERENCE.md](09_API_REFERENCE.md) | 9 | All 80+ endpoints across 15 route files with method, path, auth requirements, and example bodies |
| [10_TECHNICAL_DECISIONS.md](10_TECHNICAL_DECISIONS.md) | 10 | 12 design challenges with alternatives considered, rationale, and trade-offs |
| [11_FRONTEND_IMPLEMENTATION.md](11_FRONTEND_IMPLEMENTATION.md) | 11 | React 18 SPA, Axios interceptors, AuthContext, CartContext, ProtectedRoute, VenueSlotCalendar, BookingPage patterns, NotificationBell, all 40+ routes |
| [12_REALTIME_SYSTEM.md](12_REALTIME_SYSTEM.md) | 12 | Socket.IO server init, room architecture, complete notification event catalogue, persistence pattern, frontend connection, deduplication |
| [13_DATA_FLOW_DIAGRAMS.md](13_DATA_FLOW_DIAGRAMS.md) | 13 | ASCII sequence diagrams: registration, booking+payment, payment expiry, venue approval, review lifecycle, training upload, refund |
| [14_SETUP_AND_DEPLOYMENT.md](14_SETUP_AND_DEPLOYMENT.md) | 14 | Prerequisites, local dev setup, .env reference, Prisma workflow, admin creation, production checklist, Vercel/Netlify SPA config |
| [15_GLOSSARY_AND_REFERENCES.md](15_GLOSSARY_AND_REFERENCES.md) | 15 | 40+ term glossary, all dependency versions, ENUM reference, API response schemas, codebase metrics, key file index, academic references |

---

## Quick Reference: Tech Stack

### Backend
```
Node.js + Express.js    — HTTP Server
PostgreSQL              — Relational Database
Prisma ORM              — Database Access
Socket.IO               — Real-time WebSocket
JWT (jsonwebtoken)      — Authentication
bcrypt                  — Password Hashing
Khalti API              — Payment Gateway
Nodemailer              — Email (SMTP)
QRCode                  — QR Code Generation
Multer + Cloudinary     — File Uploads
node-cron               — Background Jobs
Helmet + CORS           — Security
express-rate-limit      — Rate Limiting
express-validator       — Input Validation
```

### Frontend
```
React 18 + Vite         — UI Framework + Build Tool
TailwindCSS             — Styling
React Router v6         — Client-side Routing
Axios                   — HTTP Client
Socket.IO Client        — Real-time Notifications
Leaflet.js              — Interactive Maps
React Hook Form         — Form Management
React Hot Toast         — User Notifications UI
```

---

## Key System Metrics (Estimated)

| Metric | Value |
|--------|-------|
| Backend files | ~60+ |
| Frontend pages | ~40+ |
| Database models | 15+ |
| API endpoints | 80+ |
| Cron jobs | 2 |
| User roles | 3 (user, operator, admin) |
| Payment gateway | Khalti (Nepal) |
| Email types | 5 |
| Real-time events | 12+ notification types |

---

## Key Architectural Highlights

1. **Layered architecture** — Controllers thin layer; business logic in Services
2. **Dual-mode file storage** — Cloudinary in production, local disk in dev
3. **Optimistic slot locking** — 90-second hold prevents double bookings
4. **Time-tiered refund policy** — 100% → 50% → 0% based on notice given
5. **Dual notification delivery** — Real-time Socket.IO + persistent DB record
6. **Defense-in-depth security** — Route-level RBAC + service-level ownership checks
7. **Idempotent payment verification** — Safe to call Khalti verify multiple times
8. **Automated booking lifecycle** — Cron jobs handle expiry and completion

---

## How to Use This Report for Your FYP

- **Introduction/Literature Review:** Reference Chapter 1 for architecture overview
- **System Design:** Use Chapter 1 (architecture diagram) and Chapter 2 (ERD)
- **Implementation Details:** Chapters 3–8 cover specific features with code snippets
- **API Documentation:** Chapter 9 can serve as an appendix
- **Evaluation/Critical Analysis:** Chapter 10 covers design decisions and trade-offs
