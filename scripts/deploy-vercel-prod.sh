#!/usr/bin/env sh
set -eu

echo "==> Build UI"
npm run ui:build

if [ -n "${VERCEL_TOKEN:-}" ]; then
  echo "==> Deploy Vercel (token)"
  npx vercel --prod --yes --token "$VERCEL_TOKEN"
else
  echo "==> Deploy Vercel (login interativo necessário)"
  npx vercel --prod --yes
fi

