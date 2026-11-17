# Keynest — Backend API Architecture & Documentation

Enterprise-grade, secure REST API for **Keynest Password Manager** built with Node.js, Express, MongoDB (Mongoose), and Redis (Upstash). Engineered with zero-knowledge encryption principles, strict session validation, and serverless compatibility for both local daemon runs and Vercel edge functions.

---

## 🏗️ Architecture Overview

The backend uses a layered architecture separating routing, controller business logic, data models, security middlewares, and cryptographic utilities:

```
backend/
├── api/
│   └── index.js             # Vercel Serverless Function entry point
├── server.js                # Local dev server entry point (calls app.listen on port 7000)
├── vercel.json              # Rewrites all requests (/(.*)) to api/index.js
├── src/
│   ├── index.js             # Express application setup, middlewares, router mounting & error handling
│   ├── config/
│   │   ├── clientOrigins.js # Allowed CORS domains (supports multiple web/dashboard origins)
│   │   └── validateEnv.js   # Validates required environment secrets on boot
│   ├── controllers/
│   │   ├── auth.controllers.js   # User auth, registration, login, recovery code rotation, session
│   │   ├── store.controllers.js  # Password vault CRUD, AES encryption flow, entry limit checks
│   │   └── admin.controllers.js  # Admin user management, paginated user metrics, deletion cascades
│   ├── db/
│   │   └── connectDB.js     # Cached MongoDB connection handling (cold & warm start optimizations)
│   ├── middlewares/
│   │   ├── auth.middleware.js           # JWT verification from httpOnly cookie or Authorization header
│   │   ├── admin.middleware.js          # Role-based access control (role === 'admin')
│   │   ├── rateLimit.middleware.js      # General login brute-force prevention
│   │   ├── adminLoginRateLimit.middleware.js # Isolated Redis-backed rate limiting for admin login
│   │   └── csrf.middleware.js           # Custom CSRF cookie verification
│   ├── models/
│   │   ├── user.model.js     # User accounts (email, bcrypt hash, tokenVersion, recoveryCodeHash)
│   │   ├── store.model.js    # Vault credentials (website, iv, encrypted username & password)
│   │   └── vaultKey.model.js # Encrypted user encryption keys
│   └── utils/
│       ├── encryption.js     # AES-256-GCM / CBC symmetric encryption/decryption routines
│       ├── recoveryCode.js   # Cryptographically secure 16-character atomic recovery codes
│       ├── authCookie.js     # Secure, httpOnly, sameSite cookie configuration
│       ├── token.js          # JWT creation, signing, audience validation, and verification
│       ├── vaultCache.js     # In-memory / Redis vault caching mechanisms
│       ├── vaultEntryLimit.js# Atomic counter enforcement (max 10 entries per user)
│       └── inputValidation.js# Strict input sanitation, email syntax, and password byte limitations
└── tests/                   # 22 comprehensive test suites (40+ automated security & unit tests)
```

---

## 🔒 Security & Cryptographic Features

### 1. Zero Data Leakage Password Hashing
* **Bcrypt 72-Byte Truncation Guard:** Bcrypt naturally ignores any bytes past byte 72. We enforce `Buffer.byteLength(password, 'utf8') <= 72` at the controller and validation level to prevent silent truncation attacks.
* **Salt Rounds:** Hashed with high-workfactor bcrypt salt.

### 2. Atomic One-Time Recovery Code Rotation
* When an account is registered or reset, a formatted one-time recovery code (e.g. `XXXX-XXXX-XXXX-XXXX`) is issued.
* **Zero plaintext storage:** Only the bcrypt hash of the recovery code is stored in the database.
* **Atomic Rotation:** When a password reset occurs via `POST /api/auth/forgot-password`, `User.findOneAndUpdate` atomically invalidates the old code hash and installs a new hash while incrementing `tokenVersion`, invalidating all active sessions.

### 3. AES-256 Vault Encryption
* User passwords and sensitive usernames are encrypted prior to database insertion.
* Cryptographic IV (Initialization Vector) is uniquely generated per entry. Raw plaintext credentials are never written to MongoDB.

### 4. Per-User Vault Entry Limits
* Free tier limits users to 10 stored credentials.
* Enforced atomically with concurrency safeguards to prevent race-condition bypasses.

### 5. Multi-Layer Rate Limiting
* Uses **Upstash Redis** in production (with a bounded in-memory fallback for local dev).
* Admin logins are restricted to **5 attempts per 15 minutes** keyed to IP and normalized email.

### 6. Centralized Safe Error Handling
* Express 5 centralized error middleware captures malformed JSON (400), payload overflow (413), and uncaught exceptions (500).
* In production (`NODE_ENV=production`), internal stack traces and database error messages are redacted into clean, safe generic responses.

---

## 🚀 Running Locally vs. Vercel Serverless

### Local Development Mode
Locally, the server runs continuously via `server.js`:
```bash
npm install
npm run start   # runs nodemon server.js on port 7000
```
`server.js` connects to MongoDB once and keeps `app.listen(PORT)` alive.

### Vercel Serverless Function Mode
On Vercel, requests are executed on-demand through serverless lambdas:
1. `vercel.json` rewrites all incoming requests to `api/index.js`.
2. `api/index.js` acts as the serverless handler, invoking `connectDB()` before passing `(req, res)` directly to Express.
3. `connectDB.js` inspects `mongoose.connection.readyState >= 1`. If warm, it reuses the existing socket connection instantly without reconnecting.
4. `src/index.js` never calls `app.listen()` directly, ensuring serverless invocations terminate cleanly without 504 gateway timeouts.

---

## 📡 API Reference

### Auth Endpoints (`/api/auth`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account and receive one-time recovery code | No |
| `POST` | `/api/auth/login` | Authenticate user & attach secure `token` cookie | No |
| `POST` | `/api/auth/logout` | Clear `token` cookie and invalidate session | Yes |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Yes |
| `POST` | `/api/auth/forgot-password` | Reset password using recovery code; returns rotated code | No |
| `POST` | `/api/auth/admin/change-password` | Change password for logged-in admin account | Admin |
| `POST` | `/api/auth/admin/forgot-password` | Reset admin password using admin recovery code | No |
| `DELETE` | `/api/auth/admin/profile` | Permanently delete admin account (requires current password) | Admin |

### Store / Vault Endpoints (`/api/store`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/store` | Retrieve all decrypted credentials for the active user | Yes |
| `POST` | `/api/store` | Encrypt and store a new credential (website, username, password) | Yes |
| `PATCH` | `/api/store/:id` | Update an existing credential in place | Yes |
| `DELETE` | `/api/store/:id` | Delete a stored credential by ID (IDOR protected) | Yes |

### Admin Endpoints (`/api/admin`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | List paginated users with vault statistics (cached in Redis) | Admin |
| `DELETE` | `/api/admin/users/:id` | Cascade delete a user account and all associated vault records | Admin |

---

## 🧪 Testing

Run the full automated test suite (mocking database and Redis connections):
```bash
npm test
```
All 40+ unit and integration tests verify:
* Bcrypt 72-byte buffer limits
* Atomic recovery code generation & single-use guarantee
* IDOR prevention across vault records
* Centralized error handler response formats
* Rate limiting & CSRF validation
