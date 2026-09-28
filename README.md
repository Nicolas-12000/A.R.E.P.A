# A.R.E.P.A.

**Applied Regression, Estimation & Predictive Analytics**

Multi-domain linear regression: CRISP-DM offline training, `.joblib` artifacts, and a **FastAPI** inference API.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141-teal)

## Layout

```
├── backend/app/       # FastAPI (v1 predict + metadata)
├── frontend/          # Next.js UI: pick an exercise, type values, read the fit
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

## Local setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

PYTHONPATH=src python scripts/train_models.py   # optional refresh
alembic upgrade head                            # tables on the Postgres already running
uvicorn backend.app.main:app --reload --port 8000
```

**Docker (new clone):** Postgres + API in one command — no local Python/Postgres required.

```bash
cp .env.example .env
docker compose up --build
```

If you already run Postgres on `:5432`, start only the API: `docker compose up api --build --no-deps` and point `AREPA_DATABASE_URL` at `host.docker.internal` (see `.env.example` and [docs/05-postgres-y-docker.md](docs/05-postgres-y-docker.md)).

API docs: http://localhost:8000/docs

## Web UI

The interface is the deliverable for the three exercises (dólar, glucosa, energía). With the API running:

```bash
cd frontend
cp .env.example .env.local
command npm install
command npm run dev
```

Open http://localhost:3000. `command npm` matters if your shell aliases `npm` to pnpm.

For each exercise you can type the inputs, see the prediction with R², MSE and RMSE, read how each coefficient moves the result, and open the scatter and correlation figures from `report/figures/`.

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
