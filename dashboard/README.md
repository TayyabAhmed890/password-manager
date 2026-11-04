# Keynest Admin

Admin interface for managing user accounts. The dashboard uses the backend's
cookie-based admin authentication and does not receive vault passwords or
recovery secrets.

## Local development

1. Start the backend on `http://localhost:7000`.
2. Ensure the backend allows `http://localhost:5174` as its admin origin.
3. From this directory, run `npm install` once and then `npm run dev`.

The Vite development server proxies `/api` requests to the local backend.
Admin login is limited to five attempts per 15 minutes per IP and email. If
Upstash is not configured in development, rate limits use a bounded in-process
store; production requires the configured shared Upstash limiter.

Admins can change their password while signed in or reset it with their account
recovery code from the login page. Either operation invalidates existing
sessions and issues a new recovery code that must be saved.
Admins can also permanently delete their own profile from the sidebar after
confirming their current password.
The user list is cached in Upstash for 30 seconds and invalidated when an
account or its vault entry count changes.

## Vercel deployment

Deploy this directory as its own Vercel project with the project root set to
`dashboard`. Set the server-only `BACKEND_URL` environment variable to the
backend's HTTPS origin (for example, `https://api.example.com`); do not use a
`VITE_` prefix. Add the deployed dashboard origin to the backend's `ADMIN_URL`.
The Vercel API function at `api/proxy.js` forwards `/api/*` requests and cookies
without exposing the backend origin in the browser bundle. The explicit
`/api/:path*` rewrite is listed before the SPA fallback so API calls cannot
accidentally receive `index.html`.

## Checks

Run `npm test`, `npm run lint`, and `npm run build`.
