# Empezar aquí

Este texto es para alguien que **no ha usado el repo** y quiere ver AREPA funcionar antes de leer el detalle técnico.

## Qué vas a obtener

Una API en tu PC que responde números predichos para tres escenarios (dólar, glucosa, consumo eléctrico). Los modelos ya vienen entrenados en la carpeta `models/`; no tienes que correr el entrenamiento para probar predicciones.

## Dos formas de arrancar

| Camino | Necesitas | Comando |
|---|---|---|
| **Docker (recomendado)** | [Docker](https://docs.docker.com/get-docker/) instalado | `cp .env.example .env` y luego `docker compose up --build` |
| **Python en tu máquina** | Python 3.12, venv | Ver sección [Sin Docker](#sin-docker-python-local) abajo |

Con Docker no instalas Postgres ni Python: Compose levanta la base y la API juntas.

## Primera predicción en cinco minutos (Docker)

1. Clona o descarga el repositorio y entra en la carpeta del proyecto.
2. Copia la plantilla de variables: `cp .env.example .env` (la contraseña de ejemplo es `arepa_dev`).
3. Ejecuta: `docker compose up --build` y espera a que aparezca que Uvicorn está en el puerto 8000.
4. Abre en el navegador: **http://localhost:8000/docs**
5. Expande **POST /v1/predict/dollar** → **Try it out** → deja el JSON de ejemplo o usa:

```json
{"day": 120, "inflation_rate": 0.02, "interest_rate": 5.0}
```

6. Pulsa **Execute**. Deberías ver un `prediction` (número) y `"stored_in_history": true` si la base guardó la fila.

Para comprobar el historial: en la misma página de docs, prueba **GET /v1/predictions/history**.

## Interfaz web (recomendado para el encargo)

Con la API ya en marcha (Docker o local en el puerto 8000):

```bash
cd frontend
cp .env.example .env.local
pnpm install    # o npm install
pnpm dev
```

Abre **http://localhost:3000**: eliges ejercicio, escribes valores, ves predicción, interpretación y figuras. Detalle en el [README del frontend](../frontend/README.md).

**Sin API (solo front):** puedes usar `NEXT_PUBLIC_AREPA_MODE=local` en `.env.local` y no levantar Docker; predicción e historial van en el navegador. Para publicar en Vercel, lee [Vercel y modo local](07-vercel-y-modo-local.md).

## Sin Docker (Python local)

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt

cp .env.example .env
# Opcional: AREPA_DATABASE_URL=postgresql+psycopg://postgres:arepa_dev@localhost:5432/arepa
# Si no tienes Postgres, puedes omitir la URL: las predicciones funcionan; el historial no.

alembic upgrade head               # solo si configuraste Postgres
uvicorn backend.app.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs

## Cómo leer el resto de la documentación

| Orden | Archivo | Para qué sirve |
|---|---|---|
| 1 | [Qué es AREPA](01-que-es-arepa.md) | Idea del proyecto y carpetas |
| 2 | [Limpieza de datos](02-limpieza-de-datos.md) | Qué se hizo con los CSV |
| 3 | [Regresión lineal](03-regresion-lineal.md) | Cómo se entrenó y qué significan R², MSE |
| 4 | [La API](04-la-api.md) | Rutas, errores, respuestas |
| 5 | [PostgreSQL y Docker](05-postgres-y-docker.md) | Base de datos y contenedores |
| 6 | [Glosario y preguntas](06-glosario-y-preguntas.md) | Términos y dudas frecuentes |
| 7 | [Vercel y modo local](07-vercel-y-modo-local.md) | Despliegue solo frontend, figuras, sin joblib en el navegador |

Si solo quieres **usar** la API, basta con este archivo y [La API](04-la-api.md). Si vas a **entregar un informe** o **reentrenar**, lee del 1 al 3.

## Palabras que verás seguido

- **API**: programa que escucha peticiones HTTP y devuelve JSON (aquí, predicciones).
- **`.joblib`**: archivo donde scikit-learn guarda el modelo ya entrenado.
- **Predicción**: un número que sale de aplicar la recta aprendida a los datos que tú envías.
- **PostgreSQL**: base de datos donde se guarda el *historial* de predicciones, no los CSV de entrenamiento.

Más definiciones en [Glosario y preguntas](06-glosario-y-preguntas.md).
