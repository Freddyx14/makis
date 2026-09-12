#!/usr/bin/env bash
#
# Despliegue de Makis OS a Google Cloud Run.
#
#   ./scripts/deploy.sh
#
# Lee las variables de .env.local. Las NEXT_PUBLIC_* se pasan como build-args
# porque Next.js las incrusta en el bundle del cliente en tiempo de build;
# el resto van como variables de entorno del servicio.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-angelic-throne-502610-v3}"
REGION="${GCP_REGION:-southamerica-east1}"   # São Paulo: cerca de LATAM y de Supabase
SERVICE="makis"

ENV_FILE=".env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: falta $ENV_FILE. Copia .env.example y rellénalo." >&2
  exit 1
fi

# Carga .env.local sin ejecutar nada raro que haya dentro.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  EXA_API_KEY
  OPENAI_API_KEY
)
for var in "${required[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "error: $var está vacía en $ENV_FILE" >&2
    exit 1
  fi
done

echo "→ Proyecto: $PROJECT_ID"
echo "→ Región:   $REGION"
echo "→ Servicio: $SERVICE"
echo

gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source=. \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=3600 \
  --concurrency=40 \
  --min-instances=1 \
  --max-instances=4 \
  --build-env-vars-file=<(cat <<EOF
NEXT_PUBLIC_SUPABASE_URL: "$NEXT_PUBLIC_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY: "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
EOF
) \
  --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,EXA_API_KEY=$EXA_API_KEY,OPENAI_API_KEY=$OPENAI_API_KEY,RESEND_API_KEY=${RESEND_API_KEY:-},RESEND_FROM=${RESEND_FROM:-},MAKIS_DEMO_FALLBACK=${MAKIS_DEMO_FALLBACK:-false}"

echo
echo "URL del servicio:"
gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" --region="$REGION" \
  --format='value(status.url)'

cat <<'NOTE'

RECORDATORIOS
  --timeout=3600      el pipeline dura minutos; sin esto Cloud Run corta
  --min-instances=1   evita el arranque en frío justo en la demo (cuesta unos
                      céntimos al día; quítalo después del hackathon)

Tras el primer deploy, añade la URL del servicio en:
  Supabase → Authentication → URL Configuration → Redirect URLs
NOTE
