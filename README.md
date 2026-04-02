# 🏥 SmartQueue - Smart Queue Management System

A production-ready, full-stack digital queue management platform built with modern technologies. Users can book tokens remotely and track live queue status, while admins manage queues from a powerful dashboard.

![SmartQueue](https://img.shields.io/badge/SmartQueue-v1.0.0-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Express](https://img.shields.io/badge/Express-4-green) ![SQLite](https://img.shields.io/badge/SQLite-3-blue) ![Socket.io](https://img.shields.io/badge/Socket.io-4-black)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + TailwindCSS |
| **Backend** | Node.js + Express 4 |
| **Database** | SQLite (via better-sqlite3) — zero config |
| **Auth** | JWT (Access + Refresh Tokens) |
| **Realtime** | Socket.io |
| **Notifications** | Web Push API |

---

## 📁 Project Structure

```
Smart Queue Management System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # SQLite config + PG adapter
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── location.controller.js
│   │   │   ├── queue.controller.js
│   │   │   ├── token.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── notification.controller.js
│   │   ├── db/
│   │   │   ├── migrations/        # SQL migration files
│   │   │   ├── migrate.js         # Migration runner
│   │   │   └── seed.js            # Sample data
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT middleware
│   │   │   └── validate.js        # Request validation
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── location.routes.js
│   │   │   ├── queue.routes.js
│   │   │   ├── token.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── notification.routes.js
│   │   ├── socket/
│   │   │   └── index.js           # Socket.io handlers
│   │   └── server.js              # Express entry point
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── locations/page.tsx
│   │   │   ├── locations/[id]/page.tsx
│   │   │   ├── queue/[id]/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx       # Admin dashboard
│   │   │       ├── queues/page.tsx
│   │   │       ├── locations/page.tsx
│   │   │       └── analytics/page.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ToastProvider.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── .env.local
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/me` | Get profile |
| PUT | `/api/auth/profile` | Update profile |

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List locations (search, filter) |
| GET | `/api/locations/:id` | Get location with queues |
| POST | `/api/locations` | Create location (admin) |
| PUT | `/api/locations/:id` | Update location (admin) |
| DELETE | `/api/locations/:id` | Delete location (admin) |

### Queues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queues/:id` | Get queue with live status |
| POST | `/api/queues` | Create queue (admin) |
| PUT | `/api/queues/:id` | Update queue (admin) |
| DELETE | `/api/queues/:id` | Delete queue (admin) |
| PUT | `/api/queues/:id/reset` | Reset queue (admin) |

### Tokens
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tokens/book` | Book a digital token |
| GET | `/api/tokens/my` | Get active tokens |
| GET | `/api/tokens/history` | Get booking history |
| PUT | `/api/tokens/:id/cancel` | Cancel token |
| GET | `/api/tokens/queue/:queueId` | Queue tokens (admin) |
| PUT | `/api/tokens/call-next/:queueId` | Call next (admin) |
| PUT | `/api/tokens/:id/call` | Call specific token (admin) |
| PUT | `/api/tokens/:id/serve` | Mark serving (admin) |
| PUT | `/api/tokens/:id/complete` | Mark complete (admin) |
| PUT | `/api/tokens/:id/skip` | Skip token (admin) |
| PUT | `/api/tokens/:id/priority` | Set priority (admin) |

### Analytics (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/daily` | Daily counts |
| GET | `/api/analytics/wait-times` | Wait times by queue |
| GET | `/api/analytics/hourly` | Hourly distribution |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| POST | `/api/notifications/subscribe` | Push subscribe |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js 18+
- npm or yarn

> **No database installation needed!** SQLite is embedded and auto-created on first run.

### 1. Backend Setup

```bash
cd backend
npm install

# Run migrations (creates SQLite database automatically)
npm run migrate

# Seed sample data
npm run seed

# Start server
npm run dev
```

Server runs at: `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 5. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@smartqueue.com | password123 |
| **User** | john@example.com | password123 |

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = Your backend URL
- `NEXT_PUBLIC_SOCKET_URL` = Your backend URL

### Backend (Render)

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set build command: `npm install`
4. Set start command: `node src/server.js`
5. Add environment variables:
   - `JWT_SECRET` = Strong random string
   - `JWT_REFRESH_SECRET` = Another strong random string
   - `CORS_ORIGIN` = Your Vercel frontend URL
   - `NODE_ENV` = production

> **Note**: SQLite database file is stored locally. For cloud production, consider migrating to PostgreSQL or using a persistent volume.

---

## ✨ Features

### User Features
- ✅ Signup/Login with JWT authentication
- ✅ Browse locations (hospitals, clinics, offices, banks)
- ✅ Book digital tokens remotely
- ✅ Live queue position tracking (Socket.io)
- ✅ Estimated waiting time
- ✅ Cancel tokens
- ✅ Notifications when turn approaches
- ✅ Complete booking history

### Admin Features
- ✅ Admin dashboard with real-time stats
- ✅ Create/manage locations and queues
- ✅ Call next token
- ✅ Skip token
- ✅ Emergency priority handling
- ✅ Real-time queue control
- ✅ Analytics (daily counts, avg wait times, hourly distribution)

### System Features
- ✅ Role-based access control (user/admin)
- ✅ RESTful API architecture
- ✅ Real-time updates via Socket.io
- ✅ JWT authentication with token refresh
- ✅ Rate limiting and security headers
- ✅ Responsive design (mobile-first)
- ✅ Modern UI with animations

---

## 📜 License

MIT License — Feel free to use this for your projects.
