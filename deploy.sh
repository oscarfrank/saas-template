#!/usr/bin/env bash
# Deploy: live next to artisan. App root = this file's directory (no DEPLOY_DIR / path to edit).
# From project root: ./deploy.sh [--composer] [--dump-autoload] [--migrate]

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

if [[ ! -f artisan ]]; then
  echo "error: expected artisan in ${APP_ROOT} (is this the Laravel project root?)" >&2
  exit 1
fi

DO_COMPOSER=0
DO_COMPOSER_DUMP=0
DO_MIGRATE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --composer)      DO_COMPOSER=1 ;;
    --dump-autoload) DO_COMPOSER_DUMP=1 ;;
    --migrate)      DO_MIGRATE=1 ;;
    *)
      echo "usage: $0 [--composer] [--dump-autoload] [--migrate]" >&2
      exit 1
      ;;
  esac
  shift
done

git pull

if [[ "$DO_COMPOSER" -eq 1 ]]; then
  composer install --no-dev --optimize-autoloader --no-interaction
fi

if [[ "$DO_COMPOSER_DUMP" -eq 1 ]]; then
  composer dump-autoload -o --no-interaction
fi

php artisan optimize:clear

if [[ "$DO_MIGRATE" -eq 1 ]]; then
  php artisan migrate --force --no-interaction
fi

php artisan queue:restart
