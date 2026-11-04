# Backend admin dashboard

Admin user-list responses are cached in Upstash for 30 seconds and invalidated
when a user registers or is deleted, or when their vault entry count changes.
Production also uses Upstash for admin login rate limiting (five attempts per
15 minutes per IP and normalized email). In local non-production runs, rate
limiting falls back to a bounded process-local store.

Admins can change their password through the authenticated
`POST /api/auth/admin/change-password` route or reset it with their recovery
code through `POST /api/auth/admin/forgot-password`. Both operations rotate the
recovery code and invalidate existing sessions.

An authenticated admin can delete their own account through
`DELETE /api/auth/admin/profile` after providing their current password.
