# A.R.E.P.A.

**Applied Regression, Estimation & Predictive Analytics**

Multi-domain linear regression: CRISP-DM offline training, `.joblib` artifacts, a **FastAPI** inference API, and a **Next.js** web UI for the three exercises.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141-teal)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)

## Layout

```
├── backend/app/       # FastAPI (v1 predict + metadata)
├── frontend/          # Next.js 15 (App Router): forms, results, figures
├── src/arepa/         # ML pipeline (load, clean, train, export)
├── notebooks/         # 01–03 analysis per domain
├── models/            # Serialized pipelines (.joblib)
├── data/raw/          # Dirty CSVs
├── data/processed/    # Treated frames
├── report/figures/    # Scatter and correlation plots used by the UI
├── docs/              # Walkthrough for someone new to the project
├── tests/
└── scripts/train_models.py
```

## Models (hold-out 20 %)

| Model | R² | MSE | RMSE |
|-------|-----|-----|------|
| Dollar | 0.996 | 2377 | 48.8 |
| Glucose | 0.681 | 234 | 15.3 |
| Energy | 0.785 | 894 | 29.9 |

Guía desde cero: [docs/00-empezar-aqui.md](docs/00-empezar-aqui.md) · índice en [docs/](docs/README.md).

**Clone and run:** this repo ships the datasets (`data/raw/`, `data/processed/`), trained `.joblib` files in `models/`, and report PNGs in `report/figures/`. You do **not** need external downloads or `train_models.py` to use the API or the Next.js UI—only if you want to retrain or change the pipeline.

## Local setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt   # installs deps + editable `arepa` from src/

python scripts/train_models.py        # optional refresh
alembic upgrade head                  # tables on the Postgres already running
uvicorn backend.app.main:app --reload --port 8000
```

**Docker (new clone):** Postgres + API in one command — no local Python/Postgres required.

```bash
cp .env.example .env
docker compose up --build
```

If you already run Postgres on `:5432`, start only the API: `docker compose up api --build --no-deps` and point `AREPA_DATABASE_URL` at `host.docker.internal` (see `.env.example` and [docs/05-postgres-y-docker.md](docs/05-postgres-y-docker.md)).

API docs: http://localhost:8000/docs

**Stack completo en desarrollo:** Docker empaqueta **Postgres + API**. La UI Next.js puede usar la API (`NEXT_PUBLIC_AREPA_MODE=api` o `auto`) o **modo local** (predicción + historial en el navegador, sin backend). Figuras: `report/figures/` → `frontend/public/figures/` en build.

## Web UI (Next.js)

**Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 4. Config: `frontend/.env.example` (`NEXT_PUBLIC_AREPA_MODE`, `NEXT_PUBLIC_API_URL`).

**Con API (desarrollo clásico):** Node 20+, API en `:8000`.

```bash
cd frontend
cp .env.example .env.local
corepack enable          # once per machine (Node 16.13+)
pnpm install
pnpm dev
```

Open http://localhost:3000.

| Script | Command |
|--------|---------|
| Dev server | `pnpm dev` |
| Production build | `pnpm build` && `pnpm start` |
| Lint | `pnpm lint` |

**npm** also works (`npm install` / `npm run dev`) via `package-lock.json`; prefer **pnpm** (`pnpm-lock.yaml`) when you can. After changing `package.json`, refresh both lockfiles so they stay aligned.

For each exercise you can type the inputs, see the prediction with R², MSE and RMSE, read how each coefficient moves the result, and open the scatter and correlation figures. Design: [frontend/DESIGN.md](frontend/DESIGN.md) · install & Vercel: [frontend/README.md](frontend/README.md) · **modo local / despliegue solo front:** [docs/07-vercel-y-modo-local.md](docs/07-vercel-y-modo-local.md).

## Deploy UI on Vercel (no API required)

1. Vercel **Root Directory:** `frontend`
2. Set `NEXT_PUBLIC_AREPA_MODE=local`
3. Commit `frontend/public/models/bundle.json` and figures under `frontend/public/figures/` (or rely on `prebuild` copying from `report/figures/`)

Regenerate browser bundle after retraining: `python scripts/export_frontend_bundle.py`

## Tests & CI

```bash
pytest -q
ruff check backend tests src scripts
```

GitHub Actions runs ruff and pytest. Docker uses the slimmer `requirements.txt`.

## Docker

```bash
docker build -t arepa-api -f backend/Dockerfile .
docker run --rm -p 8000:8000 arepa-api
```

## License

MIT — [LICENSE](LICENSE)
