# scikit-learn has no Alpine wheel, so it is compiled in a stage that is thrown away.
# The running image stays Alpine and does not include the compiler or the wheel cache.
FROM python:3.12-alpine AS builder

RUN apk add --no-cache build-base gfortran openblas-dev

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-alpine

RUN apk add --no-cache libgomp libstdc++ openblas

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/usr/local/bin:$PATH" \
    PYTHONPATH=/app/src

COPY --from=builder /install /usr/local
COPY backend ./backend
COPY src ./src
COPY models ./models
COPY alembic.ini .
COPY alembic ./alembic
RUN chmod +x backend/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["backend/entrypoint.sh"]
