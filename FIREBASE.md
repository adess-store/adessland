# Firebase Firestore — coming-soon email signups

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use an existing one)
3. **Build → Firestore Database → Create database** (start in **production** mode)

## 2. Register the web app

1. Project **Settings** (gear) → **Your apps** → **Web** (`</>`)
2. Register the app and copy the `firebaseConfig` object

## 3. Add config to this site

```bash
cd coming-soon-site
copy firebase-config.example.js firebase-config.js
```

Edit `firebase-config.js` with your real `apiKey`, `projectId`, etc.

> `firebase-config.js` is gitignored so secrets stay local. Deploy it with your host or paste values in CI.

## 4. Deploy Firestore rules

From the repo root (with [Firebase CLI](https://firebase.google.com/docs/cli) installed):

```bash
firebase login
firebase init firestore
# Choose your project, set rules file to: coming-soon-site/firestore.rules
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into **Firestore → Rules** in the console and **Publish**.

## 5. View signups

**Firestore → Data → `waitlist`** — one document per email (document ID = email address):

- `email` (lowercase string)
- `createdAt` (server timestamp)

Duplicate signups show: “You're already on the list.”

## Vercel / static deploy

Upload `firebase-config.js` with your deploy (same folder as `index.html`), or inject config at build time. The site shows an error if config is missing.

## Optional hardening

- [Firebase App Check](https://firebase.google.com/docs/app-check) to reduce spam
- Rate limiting via Cloud Functions for duplicate/abuse checks
