# Keynest Admin Console — Documentation

Secure administrative dashboard for **Keynest Password Manager**. Built with React 19, Vite, Tailwind CSS v4, Lucide React, and React Router DOM v7. Provides privileged administrators with real-time platform metrics, paginated user management, cascaded account deletion, and administrative credentials management.

---

## 🏗️ Architecture & Organization

The dashboard is structured into targeted feature modules with strict isolation from end-user vault storage:

```
dashboard/
├── api/
│   └── proxy.js             # Vercel serverless proxy preventing origin leak in browser bundles
├── src/
│   ├── App.jsx              # Router setup, admin route guards & toast notification wrapping
│   ├── main.jsx             # React DOM root render
│   ├── features/
│   │   ├── auth/            # Administrative Auth Module
│   │   │   ├── api/authApi.js             # Administrative auth endpoints (/api/auth/admin/*)
│   │   │   ├── components/AuthLayout.jsx  # Split-screen auth layout aligned with main application design
│   │   │   ├── pages/
│   │   │   │   ├── AdminLoginPage.jsx     # Admin credentials login with dedicated access verification
│   │   │   │   ├── AdminForgotPasswordPage.jsx # Admin recovery code reset with instant copy feedback
│   │   │   │   └── AdminChangePasswordPage.jsx # In-session admin password update with rotated recovery code
│   │   │   ├── AdminAuthContext.jsx       # Context verifying admin role session integrity
│   │   │   ├── adminAccount.js            # Strict validation ensuring user.role === 'admin'
│   │   │   └── passwordValidation.js      # Password byte limit and confirmation checks
│   │   ├── dashboard/       # Administrative Metrics Module
│   │   │   └── pages/AdminDashboardPage.jsx # Live user counts, device-time greeting & recent signups
│   │   └── users/           # User Directory & Audit Module
│   │       ├── api/usersApi.js            # Fetches paginated user lists & triggers account deletion
│   │       ├── pages/UsersPage.jsx        # Searchable, paginated data table with dual confirmation modals
│   │       └── utils/userList.js          # Case-insensitive filtering & pagination state derivation
│   └── shared/              # Reusable UI & Network Primitives
│       ├── components/
│       │   ├── AdminLayout.jsx            # Collapsible navigation drawer, header & profile controls
│       │   ├── AdminRoute.jsx             # Strict route guard protecting routes from non-admins
│       │   ├── Dialog.jsx                 # Accessible focus-trapping modal dialogue
│       │   └── ToastProvider.jsx          # Top-level operational feedback alerts
│       └── lib/
│           ├── apiClient.js               # Centralized fetch wrapper handling credentialed sessions
│           └── authErrors.js              # Intercepts 401s and distinguishes expired sessions
└── tests/                   # 26 automated unit and integration tests
```

---

## 🛡️ Administrative Security & Features

### 1. Zero Vault Access
* The admin API and console **never** receive user passwords, encryption IVs, or vault secrets.
* Admins are restricted solely to auditing account presence, registration dates, and total credential count metrics.

### 2. Time-Aware Personalized Workspace
* Dashboard header automatically adapts to the administrator's **local device clock (client timezone)**:
  * `05:00 - 11:59`: **Good morning**
  * `12:00 - 16:59`: **Good afternoon**
  * `17:00 - 21:59`: **Good evening**
  * `22:00 - 04:59`: **Good night**
* Administrator name is automatically sanitized, stripping digits and raw email characters to display a clean first name.

### 3. Role-Enforced Route Guard (`AdminRoute`)
* Requests are checked against `user.role === 'admin'`.
* Non-admin users attempting to open `/` or `/users` are strictly blocked and redirected to `/access-denied`.
* Unauthenticated sessions are redirected to `/login`.

### 4. Paginated Directory & Cascade Deletion
* Displays registered users in a responsive table (or mobile card list).
* In-place email search filtering resets automatically upon pagination changes to avoid deceptive empty views.
* Deleting a user account executes a cascade purge deleting the user record and all associated encrypted vault credentials atomically.

---

## 💻 Local Development & Build

### Requirements
* Backend running locally on `http://localhost:7000` with `http://localhost:5174` added to `ADMIN_URL` / `CLIENT_URL`.

### Setup
```bash
cd dashboard
npm install
npm run dev
```
Launches the admin development server on `http://localhost:5174`.

### Production Build
```bash
npm run build
```
Creates a production-ready, minified bundle in `dist/`.

### Automated Tests
```bash
npm test
```
Runs 26 automated tests verifying admin authentication verification, response structure validation, session expiry handling, and proxy headers.
