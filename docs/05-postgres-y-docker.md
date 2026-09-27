# PostgreSQL y Docker

## Para qué está la base

Postgres no guarda los CSV ni entrena el modelo. Guarda lo que hace la API en uso:

- `predictions_log`: qué modelo se llamó, qué números entraron y qué número salió.
- `model_metadata`: R², MSE y RMSE del artefacto desplegado (sync al arrancar). **`GET /v1/models`** lee esta tabla para que la interfaz web liste los tres ejercicios con su desempeño antes de predecir.

Con eso se puede responder "cuál escenario usa la gente" sin mezclar la bitácora con los datos de entrenamiento.

La conexión es síncrona (SQLAlchemy). El volumen de este proyecto no justifica un cliente asíncrono.

### Comportamiento sin base o con base caída

| Situación | `/v1/predict/*` | `stored_in_history` | `/v1/predictions/history` | `/v1/health` |
|---|---|---|---|---|
| Sin `AREPA_DATABASE_URL` | 200 | `false` | 503 | `database: disabled`, `status: ok` si modelos OK |
| URL configurada y Postgres bien | 200 | `true` | 200 | `database: ok` |
| URL configurada pero Postgres caído | 200 | `false` | 503 o error al consultar | `database: error`, `status: degraded` |

La predicción es el camino principal: un fallo al guardar el log **no** cambia el número ni devuelve 500 al cliente. El servidor registra el error en logs del contenedor/proceso.

## Docker para usuarios nuevos (recomendado)

Quien clone el repo no necesita instalar Python ni Postgres en el sistema. Solo Docker.

```bash
cp .env.example .env
docker compose up --build
```

Compose levanta dos contenedores:

| Servicio | Imagen | Puerto hacia tu PC |
|---|---|---|
| `db` | `postgres:17-alpine` | no se publica (solo red interna) |
| `api` | `arepa-api:alpine` | **8000** → http://localhost:8000/docs |

La base `arepa` y las tablas se crean solas (Alembic al arrancar la API). Los datos de Postgres quedan en el volumen `arepa_pg_data`.

Contraseña por defecto en el ejemplo: `arepa_dev` (cámbiala en `.env` si quieres).

## Si ya tienes Postgres en el PC

Por ejemplo el contenedor `postgres-db` en el puerto 5432. No levantes el servicio `db` de AREPA (evitas choque de puertos):

```bash
# Crea la base una vez en tu Postgres:  CREATE DATABASE arepa;
cp .env.example .env
# Edita .env: AREPA_DATABASE_URL=...@host.docker.internal:5432/arepa

docker compose up api --build --no-deps
```

Desde la API en Docker, `localhost` es el propio contenedor; por eso la URL usa `host.docker.internal` para llegar al Postgres del host.

## La imagen de la API

`backend/Dockerfile` parte de `python:3.12-alpine`. scikit-learn no publica wheel para Alpine, así que se compila en una etapa que se descarta. La imagen final no incluye el compilador (~700 MB por NumPy/SciPy/sklearn, no por Debian).

Al arrancar, el contenedor aplica la migración de Alembic (`alembic/versions/001_prediction_tables.py`) y después abre Uvicorn en el puerto 8000.

Para correr sin Docker, con la misma base:

```bash
source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn backend.app.main:app --reload --port 8000
```

## Qué leer después de usar la API

- `GET /v1/predictions/history?model=dollar&limit=20`
- `GET /v1/analytics/summary`

Si algo no cuadra (health, Docker, términos): [Glosario y preguntas](06-glosario-y-preguntas.md).
