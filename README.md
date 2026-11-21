# CivicResolve

CivicResolve is a civic issue reporting and management portal that connects residents with municipal officers. Citizens submit and track local issues; authorized officers review the Firestore complaint queue and publish status updates.

## The problem

Civic issues such as damaged roads, water leaks, overflowing waste, and broken streetlights are often reported through disconnected channels. Residents have little visibility into whether an issue was received or acted on, while municipal teams lack a single, searchable queue.

## The solution

CivicResolve provides a shared workflow for submitting, classifying, routing, and tracking reports. Firebase Authentication identifies users, Firestore stores complaints and status history, and AI-assisted classification offers decision support. Officers retain responsibility for decisions and status changes.

## Features

- Citizen and officer login portals using Firebase email/password authentication.
- Citizen registration and profile recovery.
- Complaint submission with location details, optional photo, and browser location assistance.
- Tracking IDs are returned only after the complaint is saved.
- Citizen-visible status timeline and real-time complaint updates.
- Officer dashboard populated from Firestore, with category, priority, status, and text filters.
- Dashboard counts and priority cards derived from the Firestore complaint feed.
- Officer-only status updates and private notes.
- Gemini classification with an explicitly labeled offline heuristic fallback.
- CSV export for officer review.
- Firestore and Storage rules restrict access by authenticated identity and verified officer status.

AI output is advisory. Officers make final decisions. Citizen submission writes the public complaint record; it does not write private officer assessments.

## Workflows

### Citizen

1. Select **Citizen Login** and register or sign in.
2. Submit the issue title, description, address, and optional location/photo.
3. Receive a tracking ID after Firestore confirms the complaint write.
4. Open **My Civic Ledger** to follow officer-published status updates.

### Officer

1. Sign in through **Officer Login** with a provisioned Firebase Authentication account.
2. The app verifies access by checking for `/officers/{uid}`.
3. Review complaints loaded from Firestore and filter by domain, priority, or status.
4. Publish citizen-visible status updates and keep private officer notes separate.

Officer access is not self-granted. An authorized administrator provisions the `/officers/{uid}` document through Firebase Console or a trusted administrative process. Public users cannot create or approve officer records.

## Technology

- React 18, TypeScript, Vite
- Tailwind CSS and Lucide React
- Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase AI Logic
- Vitest, React Testing Library, Firestore Emulator rules tests
- Docker multi-stage build and Nginx static hosting

## Local development

### Requirements

- Node.js 20 or newer and npm
- A Firebase project for live authentication and Firestore functionality

Install dependencies:

```powershell
npm ci
Copy-Item .env.example .env
```

Set the Firebase web app values in `.env`:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

The minimum required values are `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`. Storage, App Check, and Maps features require their corresponding configuration.

Run the app and checks:

```powershell
npm run dev
npm test
npm run build
```

The development server listens on port `3000`. Firestore rules emulator tests use `npm run test:rules` and require Java 21 or newer.

## Firebase configuration and security

1. Create a Firebase Web App and configure Email/Password sign-in.
2. Create the Firestore database and enable Storage if photo uploads are needed.
3. Set the Firebase web app values in the local `.env`.
4. Review the project ID before publishing rules. Deploy rules to the intended project:

```powershell
firebase deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
firebase deploy --only storage --project YOUR_FIREBASE_PROJECT_ID
```

5. In Firebase Console, provision each verified officer at `/officers/{uid}` using the UID of that person's Firebase Authentication account.

`VITE_*` values are compiled into browser JavaScript and are public client configuration, not server secrets. Restrict Firebase and Maps API keys according to their provider guidance. Never put service-account keys, Firebase Admin credentials, private keys, or passwords in `VITE_*` variables, source control, or Docker build arguments. `VITE_APPCHECK_DEBUG_TOKEN` is for local debugging only and is deliberately excluded from the production Docker build.

## Production Docker image

The multi-stage Dockerfile builds the Vite bundle with the supplied `VITE_*` arguments, then serves only `dist/` through Nginx on port `8080`. `.dockerignore` excludes local environment files, dependencies, build output, and credential files.

In PowerShell, load the public client configuration from your untracked `.env` into the current shell:

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$') {
    $name = $Matches[1]
    $value = $Matches[2].Trim().Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}
```

Build locally. Docker reads each build argument from the matching current-shell environment variable:

```powershell
docker build -t civicresolve:local `
  --build-arg VITE_FIREBASE_API_KEY `
  --build-arg VITE_FIREBASE_AUTH_DOMAIN `
  --build-arg VITE_FIREBASE_PROJECT_ID `
  --build-arg VITE_FIREBASE_STORAGE_BUCKET `
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID `
  --build-arg VITE_FIREBASE_APP_ID `
  --build-arg VITE_FIREBASE_MEASUREMENT_ID `
  --build-arg VITE_RECAPTCHA_ENTERPRISE_SITE_KEY `
  --build-arg VITE_GOOGLE_MAPS_API_KEY `
  .
```

The Nginx SPA fallback serves `index.html` for `/dashboard`, `/report`, `/track`, and `/admin`, so refreshing a client-side route works.

### Deploy to Cloud Run

These commands use Artifact Registry in `asia-south1`; create the repository once. Set the project ID to the Firebase project used by the build:

```powershell
$ProjectId = "YOUR_GOOGLE_CLOUD_PROJECT_ID"
$Region = "asia-south1"
$Repository = "civicresolve"
$Image = "$Region-docker.pkg.dev/$ProjectId/$Repository/civicresolve:latest"

gcloud auth login
gcloud config set project $ProjectId
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create $Repository `
  --repository-format=docker `
  --location=$Region
gcloud auth configure-docker "$Region-docker.pkg.dev"

# Tag the locally built image for Artifact Registry:
docker tag civicresolve:local $Image
docker push $Image
gcloud run deploy civicresolve `
  --image $Image `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 8080
```

If the Artifact Registry repository already exists, skip its `create` command. The public Cloud Run service serves the login page; Firebase Authentication and Firestore rules continue to enforce application access.

## Screenshots

Add genuine application screenshots to `docs/screenshots/` and replace these placeholders:

| Screen | Placeholder |
| --- | --- |
| Portal selection / login | `docs/screenshots/login.png` |
| Citizen dashboard | `docs/screenshots/citizen-dashboard.png` |
| Complaint submission | `docs/screenshots/complaint-submission.png` |
| Officer dashboard | `docs/screenshots/officer-dashboard.png` |
