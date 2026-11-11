# Keynest Browser Extension

Independent Chrome-first browser extension project for connecting browser logins to the existing Keynest vault.

## Current state

This repository contains the WXT + React + TypeScript scaffold and a minimal branded popup. It does not yet authenticate, inspect forms, save credentials, or autofill. No broad host permissions are enabled in the manifest.

The generated extension icons are placeholders and must be replaced with Keynest artwork before distribution.

## Development

Requirements: Node.js 20.19+ or 22.12+ (Node 24 is also supported) and npm.

```sh
npm install
npm run dev
npm run compile
npm run build
```

WXT starts a development browser with the unpacked extension. Use `npm run zip` when preparing a distributable archive.

## Planned structure

```text
entrypoints/
  background.ts             # MV3 service worker
  popup/                    # React popup and extension controls
src/
  features/
    auth/                   # Pairing, extension session, lock and sign-out
    save-login/             # Form detection and save confirmation flow
    autofill/               # Origin matching and user-triggered filling
    vault/                  # Extension-facing vault operations
  shared/
    api/                    # Typed backend client
    components/             # Shared popup UI
    lib/                    # Origin checks and safe browser helpers
    types/                  # API and domain types
tests/
  unit/                     # Validation, origin matching, API behavior
  e2e/                      # Browser scenarios
```

## MVP scope and delivery plan

Target: Chrome on Manifest V3 first. Firefox and additional browsers are a later compatibility phase.

### Phase 1 — Extension identity and local setup

- Keep the extension isolated from the existing frontend, dashboard, and backend packages.
- Confirm generated manifest, popup, service worker, build, and unpacked local load.
- Keep permissions empty/minimal until each feature needs them.

### Phase 2 — Secure account pairing

- Add an authenticated pairing action in the Keynest web app that issues a short-lived, single-use code.
- Exchange the code from the extension for a dedicated revocable extension session; never embed backend secrets or reuse the website's long-lived session token.
- Store only the minimum session material in extension storage; support lock, sign-out, expiry, and server-side revoke.
- Add backend tests for one-time use, expiry, replay, and revocation before exposing the flow.

### Phase 3 — Match and list vault entries

- Add backend endpoints for retrieving entries scoped to an exact normalized website origin.
- Treat legacy records without a verified origin as manual-only until the user associates a site.
- Show matching accounts in the popup; never send a credential to a page just because its domain looks similar.

### Phase 4 — User-confirmed autofill

- Start filling only after an explicit user action (popup selection or shortcut).
- Restrict injection to the active tab and validated matching origin; do not auto-submit forms.
- Support common username/password fields and provide a clear fallback when the form cannot be identified.

### Phase 5 — Save newly entered logins

- Detect likely login submissions and offer a save/update confirmation.
- Ask the user before sending credentials to Keynest; avoid saving on page load or silently capturing form data.
- Handle duplicate matches, failed requests, navigation, and cleared/expired sessions.

### Phase 6 — Test and release readiness

- Unit-test origin normalization, API errors, session expiry, and form detection.
- Browser-test pairing, save confirmation, matching fill, wrong-origin rejection, sign-out, and permission behavior.
- Manually verify representative common forms and document unsupported cases before store submission.

## MVP security and acceptance criteria

- Exact origin match by default; no implicit subdomain expansion.
- Autofill requires a user gesture and never submits the form.
- Save requires explicit confirmation; passwords are excluded from logs, telemetry, and error messages.
- Untrusted pages cannot request arbitrary vault entries or receive credentials for another origin.
- Extension sessions can expire and be revoked independently from ordinary website sessions.
- No production credential is stored in this extension package or shipped to the browser.
- Tests prove that a mismatched origin receives no password and concurrent/replayed pairing codes cannot create extra sessions.

## Decisions to settle before feature implementation

1. Pairing UX and how users revoke connected browsers.
2. How to obtain a trustworthy origin for existing saved logins.
3. Whether save-after-submit needs optional per-site access or broad host permissions. Prefer the least permission that supports the agreed UX.
4. The backend threat model: the current server-mediated vault can decrypt entries for an authorized request; server-blind end-to-end encryption would be a separate architecture project.

## Rough estimate

Previously discussed estimate: about 3–5 weeks for a usable Chrome MVP with backend integration and common-form coverage, followed by extra time for wider browser/site QA and store review. Actual timing depends on the pairing flow, permissions decision, and testing coverage.
