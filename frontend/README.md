# AREPA — Web UI

Next.js app for the three regression exercises. The API must be running on port 8000 (see the repo [README](../README.md)).

## Install (pnpm, recomendado)

```bash
cp .env.example .env.local
corepack enable   # una vez por máquina, si Node lo trae
pnpm install
pnpm dev
```

Open http://localhost:3000.

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
