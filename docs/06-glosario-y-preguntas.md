# Glosario y preguntas frecuentes

## Glosario

| Término | Significado en AREPA |
|---|---|
| **CSV** | Archivo de tabla en texto (filas y columnas). Los datos “sucios” están en `data/raw/*.csv`. |
| **CRISP-DM** | Metodología de proyectos de datos (negocio → datos → modelado → evaluación → despliegue). Este repo sigue ese hilo: datos en `data/`, modelos en `models/`, servicio en `backend/`. |
| **Feature (variable)** | Columna de entrada: por ejemplo `day`, `age`, `temperature`. |
| **Target (objetivo)** | Lo que se predice: precio del dólar, glucosa, kWh. |
| **Pipeline** | En scikit-learn, una cadena de pasos (aquí: escalar → regresión lineal) guardada en un solo `.joblib`. |
| **StandardScaler** | Resta la media y divide por la desviación estándar de cada columna, usando las estadísticas del entrenamiento. |
| **OLS / MCO** | *Ordinary Least Squares* / *mínimos cuadrados ordinarios*: elige coeficientes minimizando la suma de residuos al cuadrado. Es lo que hace `LinearRegression` en sklearn. |
| **Residuo** | Diferencia `y − ŷ` en una fila; el cuadrado de los residuos es lo que OLS minimiza. |
| **Intercepto (β₀)** | Término constante de la recta; en AREPA conviene leerlo junto con coeficientes en unidades originales vía metadata. |
| **R²** | Entre 0 y 1 (puede ser negativo en modelos malos). Qué fracción de la variación explica la recta en datos de prueba. Fórmula e intuición en [Regresión lineal](03-regresion-lineal.md). |
| **MSE / RMSE** | Error cuadrático medio y su raíz. Mientras más bajo, mejor (RMSE en las mismas unidades que el target). |
| **Hold-out / train-test** | Parte de las filas entrena; otra parte solo evalúa, para no medir el error en las mismas filas usadas para ajustar. |
| **IQR** | Rango intercuartílico; sirve para **etiquetar** colas, no para borrar filas automáticamente en este proyecto. |
| **Alembic** | Herramienta que crea/actualiza tablas en Postgres según `alembic/versions/`. |
| **OpenAPI** | Descripción de la API en JSON: http://localhost:8000/openapi.json (Swagger UI en `/docs`). |

## Preguntas frecuentes

### ¿La documentación explica la matemática y los algoritmos?

Para **usar** la API basta [00-empezar-aqui](00-empezar-aqui.md). Para **entender el modelo**, lee [03-regresion-lineal](03-regresion-lineal.md): OLS/MCO, residuos, escalado, R²/MSE, por qué hay tres rectas, y qué hace Huber/Cook/statsmodels **sin** ir a producción. No sustituye un libro de econometría (intervalos de confianza, supuestos Gauss-Markov en detalle), pero sí cubre lo que el repo implementa y lo que conviene decir en un informe de taller.

### ¿Tengo que entrenar antes de predecir?

No para probar el proyecto. Los archivos en `models/` ya están listos. Entrenar de nuevo solo hace falta si cambias `data/` o el código en `src/arepa/`:

```bash
python scripts/train_models.py
```

### ¿La API reentrena cuando llamo a `/predict`?

No. Solo carga el `.joblib` y multiplica suma (recta). Reentrenar es offline.

### ¿Puedo usar la API sin PostgreSQL?

Sí. Sin `AREPA_DATABASE_URL` (o sin base accesible):

- **POST /v1/predict/** sigue respondiendo 200.
- La respuesta incluye `"stored_in_history": false`.
- **GET /v1/predictions/history** y **GET /v1/analytics/summary** responden **503** con un mensaje claro.

La predicción no depende del historial.

### ¿Qué significa `/v1/health`?

Ejemplo:

```json
{
  "status": "ok",
  "models_loaded": ["dollar", "glucose", "energy"],
  "database": "ok",
  "app": "AREPA"
}
```

| Campo | Valores | Interpretación |
|---|---|---|
| `status` | `ok` / `degraded` | `degraded` si falta algún modelo **o** la base está configurada pero no responde (`database: error`). |
| `database` | `disabled` / `ok` / `error` | `disabled` = no hay URL; `ok` = conecta; `error` = URL puesta pero falló el ping. |

Con base apagada pero URL configurada, las predicciones pueden seguir; el historial no se guarda y `stored_in_history` será `false`.

### ¿Hay usuarios, login o API keys?

No. Es un proyecto académico abierto en localhost. No expongas el puerto 8000 a internet sin añadir seguridad.

### ¿Por qué no está Huber en la API?

Huber es otra regresión (menos sensible a outliers). Se calculó al entrenar para comparar; el R² quedó prácticamente igual al OLS. El taller pide regresión lineal ordinaria en producción.

### ¿Qué es `host.docker.internal`?

Nombre especial para que un contenedor Docker llegue al Postgres (o cualquier servicio) que corre en **tu PC**, no dentro del contenedor de la API.

### ¿Dónde está el frontend?

En `frontend/`: Next.js con los tres ejercicios. **No va dentro de Docker Compose** (solo API + Postgres). Flujo típico: `docker compose up --build` y, en otra terminal, `cd frontend && pnpm install && pnpm dev` → http://localhost:3000. Sin UI, sigue valiendo `/docs` o `curl`.

### ¿Puedo desplegar solo el frontend en Vercel sin API?

Sí. Usa **`NEXT_PUBLIC_AREPA_MODE=local`**: la predicción usa `frontend/public/models/bundle.json` (coeficientes exportados, no `.joblib`) y el historial queda en el navegador. Las gráficas del informe se sirven desde `public/figures/`. Guía completa: [07-vercel-y-modo-local.md](07-vercel-y-modo-local.md).

### ¿Cómo corro los tests?

```bash
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```

Los tests usan SQLite en memoria para la base; no necesitas Postgres instalado.

### Algo falló en Docker

1. ¿Puerto 8000 ocupado? Cambia el mapeo en `docker-compose.yml` o para el otro proceso.
2. ¿Ya tienes Postgres en 5432? No levantes el servicio `db` de AREPA; usa `docker compose up api --build --no-deps` y la URL con `host.docker.internal` (ver [05-postgres-y-docker.md](05-postgres-y-docker.md)).
3. Revisa logs del contenedor `api`: migraciones Alembic y carga de modelos aparecen al inicio.

Volver al índice: [Aprender AREPA](README.md).
