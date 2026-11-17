# Keynest — Frontend Web Application Documentation

Modern, responsive client web application for **Keynest Password Manager** built with React 19, Vite, Tailwind CSS v4, Lucide React, and React Router DOM v7. Designed with a clean, high-contrast monochrome aesthetic, fluid animations, robust error states, and zero-compromise credential security.

---

## 🏗️ Architecture & Folder Structure

The frontend adopts a **feature-driven folder structure**, decoupling business domains (Auth, Landing, Vault) for maintainability:

```
frontend/
├── api/
│   └── proxy.js             # Vercel serverless proxy route forwarding /api/* to backend
├── public/
│   ├── favicon.svg          # App brand icon
│   └── icons.svg
├── src/
│   ├── main.jsx             # React DOM root render
│   ├── app/
│   │   ├── App.jsx          # Route registration, layout providers & fallback boundaries
│   │   ├── AuthContext.jsx  # Global authentication context (session check, login, logout state)
│   │   ├── auth-context.js  # React Context object definition
│   │   ├── useAuth.js       # Hook providing access to auth state & actions
│   │   ├── RouteGuards.jsx  # Protected route wrappers (RequireAuth, GuestOnly)
│   │   └── NotFoundPage.jsx # 404 error page
│   ├── features/
│   │   ├── auth/            # Authentication Domain
│   │   │   ├── api/authApi.js         # Fetch client for auth endpoints (/api/auth/*)
│   │   │   ├── components/
│   │   │   │   ├── AuthLayout.jsx     # Shared split-screen layout with branding & side notes
│   │   │   │   ├── OneTimeRecoveryCode.jsx # Monospace code display with instant copy feedback
│   │   │   │   └── PasswordField.jsx  # Reusable input with eye toggle & accessibility labels
│   │   │   ├── data/authContent.js    # Centralized UI text strings & form labels
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx      # Login page with field validation & loading indicators
│   │   │   │   ├── RegisterPage.jsx   # Registration page displaying one-time recovery modal
│   │   │   │   └── ForgotPasswordPage.jsx # Recovery code verification & rotated code screen
│   │   │   └── utils/
│   │   │       ├── authValidation.js  # Email regex, length bounds & password policy checks
│   │   │       └── displayName.js     # Extracts clean user display name from name or email
│   │   ├── landing/         # Marketing & Public Landing Domain
│   │   │   ├── components/
│   │   │   │   ├── Navbar.jsx         # Pill-styled floating navigation bar
│   │   │   │   ├── Hero.jsx           # Value proposition headline & quick CTA triggers
│   │   │   │   ├── Cards.jsx          # Feature cards explaining security & vault mechanics
│   │   │   │   ├── Footer.jsx         # App footer with brand references
│   │   │   │   └── ScrollToTopButton.jsx # Accessible scroll-to-top interaction
│   │   │   ├── data/landingContent.js # Landing page copy & marketing messaging
│   │   │   └── pages/HomePage.jsx     # Main public index landing page
│   │   └── vault/           # Password Vault Domain
│   │       ├── api/vaultApi.js        # API client for vault CRUD (/api/store/*)
│   │       ├── components/
│   │       │   ├── VaultLayout.jsx    # Responsive collapsible sidebar, dark mode & modal coordinator
│   │       │   ├── AccountSettingsDialog.jsx # Modal for password update & permanent account deletion
│   │       │   ├── UpdateVaultPasswordDialog.jsx # In-place credential editing dialog
│   │       │   ├── VaultToastContext.jsx # Toast notification provider
│   │       │   └── useVaultToast.js   # Hook for triggering success/error banners
│   │       └── pages/
│   │           ├── PasswordPage.jsx   # Primary vault dashboard (credential list, copy, reveal, search)
│   │           └── CreatePasswordPage.jsx # New credential creation form (max 10 count enforcement)
│   └── styles/
│       └── global.css       # Tailwind CSS v4 directives, custom theme variables & dark-mode overrides
└── tests/                   # Automated unit & integration tests
```

---

## 🎨 Design System & UX Standards

1. **Neo-Minimalist Theme:**
   * High-contrast monochrome styling (`bg-white`, `border-neutral-200`, `text-neutral-950`).
   * Clean rounded borders (`rounded-2xl`, `rounded-xl`) and pill-shaped action buttons.
2. **User-Specific Multi-Theme Persistence:**
   * Features both **Light Mode** and **Dark Mode**.
   * Persisted per user ID (`keynest-vault-theme-<userId>`) so multiple users sharing the same computer or browser never overwrite each other's theme preferences.
3. **Collapsible Responsive Sidebar:**
   * Expands on large viewports for descriptive navigation.
   * Collapses smoothly into an icon-only dock with interactive tooltips, including action buttons for **Delete Profile** and **Log Out**.
4. **Guarded Confirmations:**
   * Destructive and session-ending actions (such as logging out or deleting credentials/account) require modal confirmation to prevent accidental clicks.

---

## 🛡️ Route Protection Architecture

* **`GuestOnly` Wrapper:** Wraps `/`, `/login`, and `/register`. Logged-in users navigating to these pages are automatically redirected to their vault at `/passwords`.
* **`RequireAuth` Wrapper:** Wraps all vault routes (`/passwords`, `/passwords/create`). Requests to these paths without an active session cookie are redirected to `/login`, storing the intended destination in `location.state` for post-login return.

---

## 💻 Local Development & Build

### Requirements
* Node.js v18+
* Backend running locally on `http://localhost:7000`

### Setup
```bash
cd frontend
npm install
npm run dev
```
The application will launch on `http://localhost:5173`. Vite automatically proxies `/api` calls to the local backend if configured or communicates with `credentials: 'include'` for cross-origin cookie sharing.

### Production Build
```bash
npm run build
```
Generates a minified, tree-shaken static bundle in `dist/` ready for hosting on Vercel or any modern CDN.

### Automated Tests
```bash
npm test
```
Executes test suites covering authentication validations, display name sanitization, byte length constraints, and proxy edge handling.
