# Backend admin dashboard

Admin user-list responses are cached in Upstash for 30 seconds and invalidated
when a user registers or is deleted, or when their vault entry count changes.
Production also uses Upstash for admin login rate limiting (five attempts per
15 minutes per IP and normalized email). In local non-production runs, rate
limiting falls back to a bounded process-local store.

Each user can save at most 10 vault entries. Creation reserves a per-user
counter and stores the encrypted entry in one MongoDB transaction, so concurrent
requests cannot exceed the limit. Existing users' counters are initialized from
their stored entries when first needed. `GET /api/store?search=<text>` performs
a bounded, case-insensitive search over website and email metadata only; it
never searches passwords or returns encryption fields.

Admins can change their password through the authenticated
`POST /api/auth/admin/change-password` route or reset it with their recovery
code through `POST /api/auth/admin/forgot-password`. Both operations rotate the
recovery code and invalidate existing sessions.

An authenticated admin can delete their own account through
`DELETE /api/auth/admin/profile` after providing their current password.
