# Vercel y modo local (frontend sin API)

Esta guía describe cómo publicar **solo la interfaz Next.js** y seguir prediciendo **sin FastAPI ni Postgres** en la nube.

## Idea en una frase

Los `.joblib` **no** van al navegador. Lo que sí va es un JSON con **coeficientes y métricas** (`frontend/public/models/bundle.json`), exportado desde `models/training_metrics.json`. La predicción usa la **misma ecuación lineal** que el informe (intercepto + βᵢxᵢ, con hora cíclica en energía).

Las **figuras** del informe (`report/figures/*.png`) se copian en el build a `frontend/public/figures/` y se muestran en la pestaña **Relaciones** de cada ejercicio (rutas `/figures/...`).

## Modos de ejecución

Variable de entorno: **`NEXT_PUBLIC_AREPA_MODE`** (ver `frontend/.env.example`).

| Valor | Uso |
|-------|-----|
| **`auto`** (por defecto) | Al cargar, prueba la API. Si no responde → **modo local**. |
| **`local`** | Siempre predice en el navegador. Recomendado en **Vercel** sin backend. |
| **`api`** | Solo FastAPI (como antes del modo local). |

En la cabecera de la app, el indicador muestra **Modo local** cuando no hay API.

## Qué funciona en modo local

| Función | Comportamiento |
|---------|----------------|
| Predicción | Sí, con `bundle.json` |
| R², MSE, RMSE, coeficientes, ecuación | Sí, del mismo bundle |
| Figuras scatter / correlación | Sí, desde `public/figures/` |
| Historial | Sí, en **`localStorage`** del navegador (hasta 50 entradas) |
| API `/docs`, Postgres | No necesarios |

Si más adelante despliegas la API y pones `auto` o `api`, el historial puede venir de Postgres; si la base no está, la app puede seguir usando el historial local.

## Desplegar en Vercel

1. Conecta el repositorio en [Vercel](https://vercel.com).
2. **Root Directory:** `frontend`
3. **Environment variables:**
   - `NEXT_PUBLIC_AREPA_MODE=local` (o `auto`)
   - `NEXT_PUBLIC_API_URL` — solo si tienes API pública (modo `auto`/`api`)
4. Deploy. El script **`prebuild`** ejecuta `scripts/sync-public-assets.mjs`, que copia PNG desde `../report/figures` a `public/figures`.

Conviene tener en git:

- `frontend/public/models/bundle.json`
- `frontend/public/figures/*.png` (o confiar en el `prebuild` con el repo completo clonado)

Detalle de scripts: [frontend/README.md](../frontend/README.md).

## Regenerar datos tras reentrenar

```bash
python scripts/train_models.py
python scripts/export_frontend_bundle.py
node frontend/scripts/sync-public-assets.mjs
git add models/ frontend/public/models/bundle.json frontend/public/figures/
```

`export_frontend_bundle.py` escribe coeficientes y métricas publicadas; no incluye pickle ni joblib.

## Código relevante

| Pieza | Ubicación |
|-------|-----------|
| Export JSON para el navegador | `scripts/export_frontend_bundle.py` |
| Copia de figuras al build | `frontend/scripts/sync-public-assets.mjs` |
| Predicción / fallback API | `frontend/src/lib/runtime/arepa-data.ts` |
| Ecuación (misma lógica que interpretación) | `frontend/src/lib/regression.ts` |
| Bundle servido estáticamente | `frontend/public/models/bundle.json` |

## ¿Sustituye al `.joblib`?

- **En producción solo-Vercel:** sí, para la demo y el encargo (mismos coeficientes del modelo publicado).
- **En desarrollo / API Docker:** el backend sigue usando `.joblib` con sklearn; es la fuente de verdad si cambias el pipeline.

Si los coeficientes del JSON y del joblib divergen, vuelve a ejecutar `train_models.py` y `export_frontend_bundle.py`.

## Preguntas frecuentes

**¿Por qué no subir los `.joblib` al front?**  
Son archivos de Python/sklearn; el navegador no los ejecuta.

**¿Se ven las gráficas del informe en Vercel?**  
Sí, si están en `public/figures/` (copiadas en build o commiteadas).

**¿Necesito Render/Railway para la API?**  
No, si usas `NEXT_PUBLIC_AREPA_MODE=local`. Sí, si quieres API real + historial en Postgres en servidor.
