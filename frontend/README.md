# AREPA — Web UI

Next.js app for the three regression exercises. Works **with or without** the FastAPI backend (modo local). See the repo [README](../README.md).

## Install (pnpm, recomendado)

```bash
cp .env.example .env.local
corepack enable   # una vez por máquina, si Node lo trae
pnpm install
pnpm dev
```

## Despliegue en Vercel (solo frontend)

1. En Vercel, **Root Directory** = `frontend`.
2. Variables de entorno:
   - `NEXT_PUBLIC_AREPA_MODE=local` (solo navegador, sin API) **o** `auto` (usa API si responde).
   - `NEXT_PUBLIC_API_URL` solo si tienes backend desplegado.
3. El build copia figuras a `public/figures` y usa `public/models/bundle.json` (coeficientes del informe).

Regenerar bundle tras reentrenar:

```bash
python scripts/export_frontend_bundle.py
```

Modos (`NEXT_PUBLIC_AREPA_MODE`):

| Valor | Comportamiento |
|-------|----------------|
| `auto` | Intenta API; si falla → **modo local** (predicción + historial en `localStorage`). |
| `local` | Siempre local (recomendado en Vercel sin backend). |
| `api` | Solo FastAPI (local/Docker). |

El indicador de estado muestra **Modo local** cuando no hay API.

## Alternativa con npm

Si no usas pnpm, `package-lock.json` sigue en el repo:

```bash
npm install
npm run dev
```

Cuando cambies dependencias en `package.json`, actualiza **ambos** locks (`pnpm install` y `npm install`) para que CI y el resto del equipo no se desincronicen.

## Scripts

| Comando | Uso |
|---------|-----|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |
| `pnpm design:lint` | Revisa `DESIGN.md` |
| `pnpm design:tokens` | Exporta tokens CSS |

Palette and layout notes: [DESIGN.md](./DESIGN.md).
