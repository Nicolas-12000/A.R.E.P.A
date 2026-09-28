---
version: alpha
name: Plano
description: Identidad visual de AREPA — un plano cartesiano donde se lee la recta ajustada.
colors:
  primary: "#1B2A27"
  on-primary: "#F4F3EC"
  secondary: "#5A6762"
  tertiary: "#16615B"
  on-tertiary: "#FFFFFF"
  tertiary-container: "#0F4B46"
  neutral: "#F4F3EC"
  surface: "#FFFFFB"
  outline: "#DEDDD1"
  mark: "#E9A21B"
  positive: "#52701B"
  mora: "#A8395A"
  error: "#B42318"
typography:
  display:
    fontFamily: Fraunces
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
  title:
    fontFamily: Fraunces
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.01em
  heading:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: IBM Plex Mono
    fontSize: 0.6875rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.08em
  num-xl:
    fontFamily: IBM Plex Mono
    fontSize: 2.5rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: '"tnum"'
  num-md:
    fontFamily: IBM Plex Mono
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: '"tnum"'
rounded:
  sm: 4px
  md: 8px
  lg: 14px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-caps}"
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.heading}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary}"
  segment:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    height: 44px
  segment-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.num-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  input-error:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
  prediction-value:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.num-xl}"
  metric-chip:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
    padding: 8px
  top-feature-badge:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
  impact-bar-positive:
    backgroundColor: "{colors.positive}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  impact-bar-negative:
    backgroundColor: "{colors.mora}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  status-online:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.positive}"
    rounded: "{rounded.full}"
  skeleton:
    backgroundColor: "{colors.outline}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
---

## Overview

**Un plano donde se lee la recta.** AREPA ajusta tres regresiones lineales; la interfaz
debe verse como esa figura: papel milimetrado, ejes en tinta, una sola recta y el punto
que se está estimando. Números exactos, jerarquía clara, cero decoración.

La pieza protagonista no es un gráfico decorativo sino **la ecuación**: cada
predicción se muestra junto con su descomposición `ŷ = β₀ + Σ βᵢ·xᵢ`, sus métricas
(R², MSE, RMSE) y la variable de mayor impacto. La UI enseña el modelo, no lo esconde.

Mobile first: el diseño se piensa desde 320 px de ancho y se expande a dos columnas en
pantallas grandes. La densidad es alta pero respirada: agrupar, no apilar.

## Colors

**Aguacate y maíz.** Una paleta de mercado —hoja de plátano, maíz, mora— pasada por
papel de algodón. Ni beige-y-terracota ni azul-y-violeta: nada que se lea como plantilla.

**Cómo armonizan.** Tres acentos sobre neutros que tiran levemente al verde:

1. **Papel e tinta:** fondo, superficie, retícula y tinta comparten un matiz verde
   grisáceo y solo cambian de luminosidad. Por eso el verde petróleo "pertenece" al
   papel y el ámbar de la arepa resalta sin chocar.
2. **Petróleo (acción):** el único color que invita a hacer algo. En las figuras son
   los puntos observados.
3. **Maíz (marca):** el ámbar de la mascota. Marca lo importante y es la recta en las
   figuras. Casi opuesto al petróleo, así que los dos se equilibran.
4. **Oliva y mora (signo):** el coeficiente que sube y el que baja. Oliva vive cerca del
   maíz y mora cerca del sonrojo de la mascota; ninguno es petróleo, así que un dato
   nunca se confunde con un botón.

**Tintes, no tokens nuevos.** Los fondos suaves salen del mismo token con opacidad
(`bg-mark/15`, `ring-tertiary/20`, `bg-positive/10`). Así cualquier tinte hereda la
armonía y la paleta no crece. Las figuras de `report/figures/` usan los mismos valores
(`src/arepa/visualization.py`).

- **Primary (#1B2A27) — Tinta:** títulos, texto, contorno de la mascota y el pie de página.
- **Secondary (#5A6762) — Eje:** leyendas, metadatos, ayudas de campo. Pasa AA sobre neutral y surface.
- **Tertiary (#16615B) — Petróleo:** botón Calcular, ejercicio activo, foco y enlaces. Hover en **#0F4B46**.
- **Neutral (#F4F3EC) — Papel:** fondo de página.
- **Surface (#FFFFFB):** tarjetas, campos y fondo de las figuras.
- **Outline (#DEDDD1):** bordes, divisores, retícula y skeletons. Nunca para texto.
- **Mark (#E9A21B) — Maíz:** la mascota, la variable de mayor impacto y los avisos. Solo como fondo o trazo; jamás como texto sobre fondos claros.
- **Positive (#52701B) — Oliva:** coeficientes que suben la predicción y el estado "en línea".
- **Mora (#A8395A):** coeficientes que bajan la predicción y el sonrojo de la mascota.
- **Error (#B42318):** validación y fallos de red. Solo como texto o borde, siempre acompañado de un mensaje; nunca como relleno de un área grande.

## Typography

Tres familias con un rol cada una:

- **Fraunces** (display, title): la voz del enunciado —nombre del ejercicio, títulos de sección. `display` sube a 3rem desde `lg`. Los números nunca van en esta familia.
- **IBM Plex Sans** (heading, body): lectura clara en tamaños pequeños; pariente técnico de Plex Mono.
- **IBM Plex Mono** (label-caps, num-xl, num-md): **todo número va en mono con cifras tabulares** (`tnum`) para que columnas, coeficientes y métricas se alineen. `label-caps` en mayúsculas para etiquetas de metadatos.

La predicción usa `num-xl`: es el elemento más grande de la pantalla después del título.
`display` pasa de 2.25rem a 3rem y `num-xl` de 2.5rem a 3.25rem desde `lg`.
La tabla de la ecuación y los comandos usan `text-code` (13 px) en móvil y 14 px desde `sm`.
Los campos usan `num-md` a **16 px como mínimo**: por debajo, iOS Safari hace zoom al enfocar.

## Layout

Base de espaciado de 4 px (la misma escala de Tailwind): `xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 40.

**Mobile first.** Los estilos base son los del teléfono (320–639 px); cada breakpoint
solo *añade*. Se usan los breakpoints por defecto de Tailwind, sin valores sueltos:

| Breakpoint | Desde | Qué cambia |
|---|---|---|
| base | 0 | Una columna, márgenes de 16 px, botón a todo el ancho, campos apilados. Encabezado: marca + historial + estado de la API, nada más (el historial se abre como hoja). Orden: título → selector de ejercicio → formulario → resultado → interpretación → figuras. |
| `sm` | 640 px | Márgenes de 24 px; campos en 2 columnas. |
| `md` | 768 px | Campos en 3 columnas; resultado e interpretación lado a lado. |
| `lg` | 1024 px | 12 columnas: título grande (`type-hero`, hasta 4.5rem) en 8 con su fila propia; selector de ejercicio debajo; formulario 5 + resultado e interpretación 7; figuras a todo el ancho. Campos vuelven a 1 columna. Sube la escala tipográfica. |
| `xl` | 1280 px | Nada nuevo: el contenedor se queda en 1152 px y se centra. |

Además de ancho, se respetan otras condiciones del dispositivo:

- `hover:` solo aplica en dispositivos con puntero fino (comportamiento de Tailwind v4); en táctil no quedan estados "pegados".
- `prefers-reduced-motion`: sin brillo en skeletons, sin giro en spinners, scroll sin animación.
- Muescas de iOS: el encabezado respeta `env(safe-area-inset-*)`; la altura usa `dvh`.
- Objetivos táctiles de al menos 44 px; el selector de 3 segmentos cabe en 320 px sin scroll horizontal.
- Al calcular en pantallas menores a `lg`, el resultado se desplaza a la vista.
- El fondo de página lleva una retícula milimetrada tenue (24 px, outline al 45 %), eco del plano cartesiano de la regresión. Solo en el lienzo, nunca dentro de tarjetas.

## Elevation & Depth

Plano por defecto. La profundidad se comunica con **bordes de 1 px en outline** y
cambios de superficie (neutral → surface), no con sombras. Una única sombra suave
se permite en la tarjeta de resultado para marcarla como foco de la pantalla.

## Shapes

Esquinas contenidas: `sm` 4 px en chips y skeletons, `md` 8 px en campos y botones,
`lg` 14 px en tarjetas, `full` solo en barras de impacto e indicadores de estado.
Nada de formas orgánicas ni ilustraciones: la forma la dan los datos.

## Components

- **Tarjetas de ejercicio (segment / segment-active):** radios nativos con el R² y las filas de cada modelo, un mini tablero del dataset. La activa lleva borde y número en petróleo; flechas del teclado funcionan sin JavaScript extra.
- **Pie de página:** banda en tinta que cierra la página; mascota, nombre completo y enlaces en maíz (el único lugar donde el maíz es texto, porque el fondo es oscuro).
- **Campo (input / input-error):** etiqueta en `heading`, unidad a la derecha, ayuda en `body-sm` con el rango de entrenamiento. Acepta coma o punto decimal. Un valor fuera del rango de entrenamiento muestra aviso (no bloquea): la recta extrapola.
- **Botón primario:** ancho completo en móvil, 48 px de alto, color de la recta.
- **Tarjeta de resultado:** etiqueta `label-caps`, valor en `num-xl` con unidad, banda ± RMSE, chips de métricas y calificación del ajuste (alto ≥ 0.90, bueno ≥ 0.75, moderado por debajo).
- **Barras de impacto:** coeficientes estandarizados normalizados al máximo; verde si suben, mora si bajan, eje para efectos cíclicos (hora = amplitud de seno y coseno). La variable dominante lleva la insignia del punto.
- **Ecuación:** tabla mono con término, valor, coeficiente y aporte; la suma cierra en ŷ.
- **Skeleton:** bloques en outline con brillo lento; reproducen la geometría final para que nada salte al cargar. Respeta `prefers-reduced-motion`.
- **Estado de API:** píldora con punto oliva (en línea), maíz (parcial) o error (sin conexión) y ayuda para arrancar el backend.

## Do's and Don'ts

- **Do** mostrar R² y RMSE junto a cada predicción; un número sin su error es media verdad.
- **Do** escribir la interfaz en español y los números con formato `es-CO`.
- **Do** usar skeletons con la forma del contenido final en cada carga.
- **Do** avisar cuando una entrada sale del rango de entrenamiento.
- **Don't** introducir un segundo color de acción; la recta es el único.
- **Don't** usar el ámbar del punto como texto ni como botón.
- **Don't** usar sombras para separar tarjetas; usa borde y superficie.
- **Don't** redondear métricas hacia arriba ni ocultar un ajuste moderado (glucosa R² ≈ 0.68).
- **Don't** escribir `@media (min-width: …)` a mano: usa los breakpoints de Tailwind (`sm:`, `md:`, `lg:` o `@variant lg` en CSS).

## Implementation

Tailwind CSS v4, configurado solo en CSS:

- `src/app/tokens.css` se **genera** desde este archivo con `npm run design:tokens` (colores y radios). No se edita a mano.
- `src/app/globals.css` define las utilidades tipográficas `type-*`, conectadas a las fuentes de `next/font`, más `graph-paper` y `skeleton`.
- `npm run design:lint` valida este archivo (referencias rotas, contraste WCAG, orden de secciones).
