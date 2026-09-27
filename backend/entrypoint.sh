#!/bin/sh
set -e

if [ -n "$AREPA_DATABASE_URL" ]; then
  alembic upgrade head
fi

exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
