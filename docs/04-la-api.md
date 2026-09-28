# La API

El entrenamiento ocurre una vez, en la máquina de quien prepara los modelos. Cuando alguien pide una predicción, la API no vuelve a entrenar. Abre el `.joblib` y aplica la misma recta.

Eso es lo que se espera en un servicio: el modelo es un artefacto. Cambiar los datos y reentrenar es otro paso, no una petición HTTP.

## Arranque

**Con Docker** (Postgres incluido): ver [Empezar aquí](00-empezar-aqui.md).

**Con Python en el host:**

```bash
source .venv/bin/activate
pip install -r requirements-dev.txt
export PYTHONPATH=src
# Opcional: export AREPA_DATABASE_URL=postgresql+psycopg://...
alembic upgrade head   # solo si hay Postgres
uvicorn backend.app.main:app --reload --port 8000
```

- Documentación interactiva: http://localhost:8000/docs  
- Contrato OpenAPI (JSON): http://localhost:8000/openapi.json  
- Raíz: http://localhost:8000/ (enlaces útiles)

Variables de entorno usan el prefijo **`AREPA_`** (por ejemplo `AREPA_DATABASE_URL`). Plantilla: `.env.example`.

## Rutas

| Método | Ruta | Qué hace | Requiere base |
|---|---|---|---|
| GET | `/v1/health` | Modelos cargados y estado de Postgres | No |
| POST | `/v1/predict/dollar` | Predice precio del dólar | No |
| POST | `/v1/predict/glucose` | Predice glucosa | No |
| POST | `/v1/predict/energy` | Predice consumo (kWh) | No |
| GET | `/v1/models` | Catálogo de los 3 ejercicios (MSE/R² desde `model_metadata` en Postgres) | No* |
| GET | `/v1/models/{nombre}/metadata` | Coeficientes e interpretación (desde `.joblib`) | No |

\*Si hay base, las métricas del listado vienen de la tabla sincronizada al arrancar; si no, del artefacto cargado.
| GET | `/v1/predictions/history` | Últimas predicciones guardadas | Sí |
| GET | `/v1/analytics/summary` | Conteos y promedios por modelo | Sí |

`{nombre}` es `dollar`, `glucose` o `energy`.

## Códigos de respuesta

| Código | Cuándo |
|---|---|
| **200** | Petición correcta |
| **422** | JSON inválido o fuera de rango (por ejemplo edad 0, hora 25) |
| **404** | Modelo desconocido en metadata o history |
| **503** | Modelo no cargado (falta `.joblib`) **o** ruta de historial/analytics sin base configurada |

Las predicciones **no** devuelven 503 por fallo de base: el número se calcula igual; ver `stored_in_history` abajo.

## Ejemplo de predicción

```bash
curl -s -X POST http://localhost:8000/v1/predict/dollar \
  -H 'Content-Type: application/json' \
  -d '{"day":120,"inflation_rate":0.02,"interest_rate":5.0}'
```

Respuesta típica:

```json
{
  "prediction": 4123.45,
  "model_name": "dollar",
  "target": "dollar_price",
  "model_r2": 0.996,
  "model_mse": 2377.0,
  "model_rmse": 48.8,
  "stored_in_history": true
}
```

- **`prediction`**: resultado de la regresión.  
- **`model_r2` / `model_mse` / `model_rmse`**: calidad del modelo en el hold-out de entrenamiento (para mostrar en UI o informe).  
- **`stored_in_history`**: `true` si la fila se guardó en `predictions_log`; `false` si no hay base o falló el insert (la predicción sigue siendo válida).

## Salud del servicio

`GET /v1/health` devuelve `status: ok` cuando los tres modelos están cargados **y** la base no está en error. Si la URL de Postgres está mal o el servidor caído, verás `database: error` y `status: degraded`, pero `/predict` puede seguir respondiendo.

Detalle de los tres estados de `database` (`disabled`, `ok`, `error`): [Glosario — health](06-glosario-y-preguntas.md).

## CORS (frontend)

La app en `frontend/` (Next.js) llama a la API desde el navegador. Por defecto se aceptan `http://localhost:3000`, `http://127.0.0.1:3000` y, con regex, otros puertos en **localhost y redes privadas** (útil en WSL o probando desde el móvil en la misma Wi‑Fi). Lista fija adicional: `AREPA_CORS_ORIGINS` (JSON en `.env`).

## Qué hace el backend por dentro

- Validar rangos en el cuerpo JSON (Pydantic).
- Armar la fila con los mismos nombres de columnas del entrenamiento.
- En energía, convertir la hora con `encode_hour` (`src/arepa/features.py`) antes de predecir.
- Opcionalmente insertar en Postgres y exponer historial/analytics.

No hay endpoint de entrenamiento, colas ni Huber en producción (solo OLS lineal).

Siguiente: [PostgreSQL y Docker](05-postgres-y-docker.md).
