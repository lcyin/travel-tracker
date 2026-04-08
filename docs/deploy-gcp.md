# GCP Deployment Guide

Deploy the Travel Tracker NestJS API to **Cloud Run** backed by **Cloud SQL (PostgreSQL)**, with images stored in **Artifact Registry** and secrets managed via **Secret Manager**.

---

## Prerequisites

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- Docker installed
- A GCP project created

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

## Step 1 – Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

---

## Step 2 – Create Artifact Registry Repository

Replace `REGION` with your preferred region (e.g. `asia-east1`, `us-central1`).

```bash
REGION=asia-east1
PROJECT=$(gcloud config get-value project)

gcloud artifacts repositories create travel-tracker \
  --repository-format=docker \
  --location=$REGION \
  --description="Travel Tracker Docker images"
```

---

## Step 3 – Create Cloud SQL (PostgreSQL 16)

```bash
# Create instance (db-g1-small is the cheapest non-shared option with reliable performance)
gcloud sql instances create travel-tracker-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=$REGION \
  --availability-type=zonal \
  --no-backup

# Create database
gcloud sql databases create travel_tracker --instance=travel-tracker-db

# Create app user (use a strong password)
DB_PASSWORD=$(openssl rand -base64 24)
echo "DB Password: $DB_PASSWORD"  # Save this!
gcloud sql users create app_user \
  --instance=travel-tracker-db \
  --password="$DB_PASSWORD"
```

---

## Step 4 – Store Secrets in Secret Manager

```bash
# Database password
echo -n "$DB_PASSWORD" | gcloud secrets create DB_PASSWORD --data-file=-

# JWT secrets (use strong random values)
echo -n "$(openssl rand -base64 48)" | gcloud secrets create JWT_SECRET --data-file=-

# Gemini API key (from https://aistudio.google.com/app/apikey)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

---

## Step 5 – Build & Push Docker Image

```bash
IMAGE=$REGION-docker.pkg.dev/$PROJECT/travel-tracker/app

# Authenticate Docker with Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push
docker build -t $IMAGE:latest .
docker push $IMAGE:latest
```

---

## Step 6 – Grant Cloud Run Access to Secrets & Cloud SQL

```bash
# Get the Cloud Run service account email (created after first deploy)
# For now grant to the project compute service account
SA="$(gcloud projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding DB_PASSWORD \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
```

---

## Step 7 – Deploy to Cloud Run

```bash
CLOUDSQL_CONNECTION=$(gcloud sql instances describe travel-tracker-db \
  --format='value(connectionName)')

gcloud run deploy travel-tracker \
  --image=$IMAGE:latest \
  --platform=managed \
  --region=$REGION \
  --add-cloudsql-instances=$CLOUDSQL_CONNECTION \
  --set-env-vars="\
DB_HOST=/cloudsql/$CLOUDSQL_CONNECTION,\
DB_PORT=5432,\
DB_USERNAME=app_user,\
DB_NAME=travel_tracker,\
JWT_EXPIRATION=15m,\
JWT_REFRESH_EXPIRATION=7d" \
  --set-secrets="\
DB_PASSWORD=DB_PASSWORD:latest,\
JWT_SECRET=JWT_SECRET:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --allow-unauthenticated \
  --min-instances=1 \
  --memory=512Mi \
  --cpu=1 \
  --port=8080
```

> `DB_HOST` uses the Unix socket path `/cloudsql/...` — Cloud Run connects to Cloud SQL this way without a VPC.

After deploy, Cloud Run outputs a URL like `https://travel-tracker-xxxx-xx.a.run.app`.

---

## Step 8 – Verify

```bash
SERVICE_URL=$(gcloud run services describe travel-tracker \
  --region=$REGION --format='value(status.url)')

# Health check
curl $SERVICE_URL/health

# Swagger docs
echo "Open: $SERVICE_URL/docs"

# Web app
echo "Open: $SERVICE_URL"
```

---

## Updating the App (Re-deploy)

```bash
docker build -t $IMAGE:latest .
docker push $IMAGE:latest
gcloud run deploy travel-tracker --image=$IMAGE:latest --region=$REGION
```

---

## ⚠️ Known Limitation: File Uploads

Receipt image uploads currently write to local disk (`/uploads/receipts/`).  
**Cloud Run containers are ephemeral — files will be lost on restart.**

To fix before using receipts in production:
1. Create a Cloud Storage bucket
2. Replace disk writes with `@google-cloud/storage` SDK uploads
3. Return signed URLs instead of local paths

---

## Cost Estimate (light usage)

| Service | Tier | ~Monthly Cost |
|---------|------|--------------|
| Cloud Run | 1 min instance, 512Mi | ~$10-15 |
| Cloud SQL | db-g1-small, zonal | ~$25 |
| Artifact Registry | < 1GB | ~$0.10 |
| Secret Manager | 3 secrets | ~$0.18 |
| **Total** | | **~$35-40/mo** |

To reduce cost: use `--min-instances=0` (cold starts of ~2-3s) and `db-f1-micro` (~$7/mo but limited connections).
