# GCP Deployment Guide (Consolidated)

Deploy the Travel Tracker NestJS API to Cloud Run with Cloud SQL (PostgreSQL), Artifact Registry, and Secret Manager.

This guide is a single end-to-end workflow with safe defaults and idempotent commands where possible.

## Prerequisites

- Google Cloud CLI installed and authenticated
- Docker installed and running
- A GCP project you can administer

```bash
gcloud auth login
gcloud auth list
```

## 0) Set Environment Variables and Validate Context

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-east1"
export REPO="travel-tracker"
export SERVICE="travel-tracker"
export INSTANCE="travel-tracker-db"
export DB_NAME="travel_tracker"
export DB_USER="app_user"

# Cost-friendly starter for Enterprise edition
export DB_TIER="db-f1-micro"

# Optional: if your org enforces Enterprise Plus, use this instead:
# export DB_TIER="db-perf-optimized-N-2"

# Runtime image path
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/app"

gcloud config set project "$PROJECT_ID"
gcloud config get-value project
```

## 1) Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

## 2) Create Artifact Registry Repository (Idempotent)

```bash
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 || \
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Travel Tracker Docker images"
```

## 3) Create Cloud SQL PostgreSQL Instance

Use explicit edition + engine to avoid accidental defaults.

```bash
gcloud sql instances create "$INSTANCE" \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier="$DB_TIER" \
  --region="$REGION" \
  --availability-type=zonal \
  --no-backup
```

Create database and app user:

```bash
gcloud sql databases create "$DB_NAME" --instance="$INSTANCE"

DB_PASSWORD="$(openssl rand -base64 24)"
echo "DB password generated. Save this securely."

gcloud sql users create "$DB_USER" \
  --instance="$INSTANCE" \
  --password="$DB_PASSWORD"
```

## 4) Create Secrets and Add Secret Versions

Important: Cloud Run references `:latest`, so each secret must have at least one version.

```bash
# Create secrets if missing
gcloud secrets describe DB_PASSWORD >/dev/null 2>&1 || gcloud secrets create DB_PASSWORD --replication-policy="automatic"
gcloud secrets describe JWT_SECRET >/dev/null 2>&1 || gcloud secrets create JWT_SECRET --replication-policy="automatic"
gcloud secrets describe GEMINI_API_KEY >/dev/null 2>&1 || gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add secret versions
echo -n "$DB_PASSWORD" | gcloud secrets versions add DB_PASSWORD --data-file=-
echo -n "$(openssl rand -base64 48)" | gcloud secrets versions add JWT_SECRET --data-file=-
# Replace with your real Gemini key:
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

## 5) Build and Push Docker Image

```bash
gcloud auth configure-docker "${REGION}-docker.pkg.dev"

docker build -t "${IMAGE}:latest" .
docker push "${IMAGE}:latest"
```

## 6) Grant Runtime IAM Permissions

Cloud Run runtime service account needs:
- Secret access (`roles/secretmanager.secretAccessor`)
- Cloud SQL connectivity (`roles/cloudsql.client`)

```bash
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in DB_PASSWORD JWT_SECRET GEMINI_API_KEY; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor"
done

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/cloudsql.client"
```

## 7) Deploy to Cloud Run

```bash
CLOUDSQL_CONNECTION="$(gcloud sql instances describe "$INSTANCE" --format='value(connectionName)')"

gcloud run deploy "$SERVICE" \
  --image="${IMAGE}:latest" \
  --platform=managed \
  --region="$REGION" \
  --add-cloudsql-instances="$CLOUDSQL_CONNECTION" \
  --set-env-vars="DB_HOST=/cloudsql/${CLOUDSQL_CONNECTION},DB_PORT=5432,DB_USERNAME=${DB_USER},DB_NAME=${DB_NAME},JWT_EXPIRATION=15m,JWT_REFRESH_EXPIRATION=7d" \
  --set-secrets="DB_PASSWORD=DB_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --allow-unauthenticated \
  --min-instances=1 \
  --memory=512Mi \
  --cpu=1 \
  --port=8080
```

Notes:
- `DB_HOST` uses Unix socket path `/cloudsql/...` for Cloud SQL connectivity.
- Keep line-continuation backslashes (`\`) when splitting commands across lines.

## 8) Verify Deployment

```bash
SERVICE_URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')"

echo "Service URL: ${SERVICE_URL}"
curl "${SERVICE_URL}/health"
echo "Swagger: ${SERVICE_URL}/docs"
```

## Re-deploy Workflow

```bash
docker build -t "${IMAGE}:latest" .
docker push "${IMAGE}:latest"
gcloud run deploy "$SERVICE" --image="${IMAGE}:latest" --region="$REGION"
```

## Common Pitfalls

- `zsh: command not found: --flag`
  - Cause: multiline command missing trailing `\`
  - Fix: keep all continuation backslashes or run command on one line

- `Invalid Tier ... for (ENTERPRISE_PLUS)`
  - Cause: machine type incompatible with inferred/forced edition
  - Fix: set `--edition=ENTERPRISE` and a compatible tier, or use Enterprise Plus-compatible tiers

- `Permission denied on secret ...`
  - Cause: runtime service account missing secret access
  - Fix: grant `roles/secretmanager.secretAccessor` on required secrets

- `Secret ... versions/latest was not found`
  - Cause: secret exists but has no versions
  - Fix: add at least one version via `gcloud secrets versions add ...`

## Cost Notes

- Lower cost:
  - Cloud Run `--min-instances=0` (accepts cold starts)
  - Smaller Cloud SQL tier when supported
- Performance/stability trade-off:
  - Increase DB tier if connection limits or CPU become bottlenecks

## Known Limitation

Receipt uploads currently write to local container disk (`/uploads/receipts/`).
Cloud Run containers are ephemeral, so files are not durable.

For production durability:
1. Create a Cloud Storage bucket
2. Upload receipts with `@google-cloud/storage`
3. Store/return signed URLs instead of local file paths
