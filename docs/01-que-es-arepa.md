# Qué es AREPA

AREPA significa **Applied Regression, Estimation & Predictive Analytics**.

Es un proyecto académico que recorre el ciclo de un modelo, no solo el entrenamiento:

1. Llegan tres tablas (dólar, glucosa, energía).
2. Se revisan y se dejan listas para modelar.
3. Se ajusta una regresión lineal múltiple en cada una.
4. El modelo se guarda en un archivo.
5. Una API lo carga y responde predicciones.
6. Cada predicción **puede** quedar anotada en PostgreSQL (historial y analíticas); si no hay base, la API igual devuelve el número predicho.

La regresión lineal es el modelo que pide el taller. No se cambia por un modelo más complejo en la API, porque el objetivo es explicar una recta y servirla igual que se entrenó.

## Las tres preguntas

| Escenario | Se predice | A partir de |
|---|---|---|
| Dólar | precio del dólar | día, inflación, tasa de interés |
| Glucosa | glucosa en sangre (mg/dL) | edad, IMC, horas de actividad |
| Energía | consumo (kWh) | temperatura, hora, día de la semana |

## Dónde vive cada cosa

| Carpeta | Qué es |
|---|---|
| `data/raw/` | Los CSV tal como llegaron |
| `data/processed/` | Las mismas filas, con nombres en inglés y marcas de anomalía |
| `src/arepa/` | El código que limpia y entrena |
| `models/` | Los tres modelos ya entrenados (`.joblib`) |
| `backend/` | La API que predice |
| `docs/` | Esta explicación |

El siguiente texto es [cómo se limpian los datos](02-limpieza-de-datos.md).
