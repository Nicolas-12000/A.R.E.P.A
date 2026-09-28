# La regresión lineal

Este capítulo explica **qué modelo se usa**, **por qué**, **cómo lo encuentra el código** y **cómo leer las métricas**. No hace falta dominar álgebra lineal; sí conviene seguir las fórmulas con calma.

## Idea en una frase

Supón que tienes muchas filas históricas: entradas `x` (día, edad, temperatura…) y un resultado `y` (precio, glucosa, kWh). La regresión lineal múltiple busca una **combinación lineal** de las entradas que se parezca lo más posible a esos `y` en el pasado, para predecir `y` en filas nuevas.

```text
ŷ = β₀ + β₁x₁ + β₂x₂ + … + βₚxₚ
```

- **`y`** (objetivo): lo que quieres predecir.  
- **`x₁…xₚ`** (features): lo que conoces en el momento de predecir.  
- **`β₀`**: intercepto (valor de referencia cuando las entradas están en su “centro” escalado).  
- **`βⱼ`**: cuánto sube o baja **ŷ** si **`xⱼ` sube una unidad** y el resto de variables no cambia (en las unidades originales, después de desescalar; ver más abajo).  
- **`ŷ`**: predicción (y con sombrero = estimación, no el valor real).

En AREPA hay **tres rectas distintas** (dólar, glucosa, energía), cada una con sus columnas definidas en `src/arepa/constants.py`.

## Por qué un modelo lineal en cada escenario

| Escenario | Pregunta de negocio | Por qué empezar con una recta |
|---|---|---|
| **Dólar** | ¿Cómo se relaciona el precio con el tiempo y variables macro? | Es un **baseline** interpretable: “si sube un punto la tasa, ¿cuánto se mueve el precio?”. En estos datos la recta explica casi toda la variación (R² ≈ 0.996). |
| **Glucosa** | ¿Cuánto se asocia la glucosa con edad, IMC y actividad? | La recta **no captura todo** (R² ≈ 0.68): hay factores que no están en la tabla (genética, dieta…). Aun así, el taller pide regresión lineal como modelo explícito y comparable. |
| **Energía** | ¿Cómo depende el consumo de temperatura, hora y día? | Consumo suele variar de forma **casi lineal** con la temperatura en rangos moderados; la hora se codifica aparte (seno/coseno) para no romper la idea de “vecindad” entre medianoche y la 1 h. |

Una recta es la opción del proyecto porque el curso evalúa **regresión lineal múltiple**, no porque sea el mejor posible algoritmo en todos los dominios. Cuando el error importa más (glucosa), el informe puede decir qué quedaría por probar (polinomios, otros modelos) **sin** cambiar lo que sirve la API.

## El algoritmo principal: mínimos cuadrados (OLS)

**OLS** (*Ordinary Least Squares*) = **MCO** (*mínimos cuadrados ordinarios*).

### Residuos

Para cada fila de entrenamiento `i`:

```text
eᵢ = yᵢ − ŷᵢ
```

`eᵢ` es el **residuo**: error de la recta en esa fila.

### Qué se minimiza

El algoritmo elige los `β` para que la **suma de residuos al cuadrado** sea lo más pequeña posible:

```text
minimizar  Σᵢ eᵢ²  =  Σᵢ (yᵢ − ŷᵢ)²
```

Por eso “cuadrados”: penaliza fuerte los errores grandes. No es mediana ni valor absoluto (eso sería otra familia, p. ej. Huber).

En código, el paso que **sirve en producción** es:

```text
StandardScaler  →  LinearRegression (sklearn)
```

`LinearRegression` en scikit-learn, con entradas escaladas, resuelve ese mismo problema OLS (equivalente numérico al ajuste por mínimos cuadrados).

### ¿Cómo lo calcula la máquina?

Sin entrar en invertir matrices: el sistema tiene una solución cerrada cuando hay suficientes filas y las columnas no son redundantes. sklearn usa álgebra numérica estable (SVD). No hay “épocas” ni gradiente como en una red neuronal: **un solo ajuste** sobre todo el conjunto de entrenamiento.

## Escalado antes de la recta

Cada columna se transforma con la media `μⱼ` y desviación estándar `σⱼ` **calculadas solo en entrenamiento**:

```text
zⱼ = (xⱼ − μⱼ) / σⱼ
```

La regresión se ajusta sobre `z`. Al predecir, la API aplica **el mismo** `μⱼ` y `σⱼ` guardados en el `.joblib`.

**Por qué:** día (~100), inflación (~0.02) y tasa (~5) no están en la misma escala. Escalar no cambia la predicción si lo haces de forma consistente, pero hace comparables los coeficientes en espacio estandarizado y estabiliza el cálculo.

| Escenario | Variable con mayor peso estandarizado (en nuestros datos) |
|---|---|
| Dólar | día |
| Glucosa | edad |
| Energía | temperatura |

Los coeficientes en unidades originales y estandarizados están en `report/data_treatment.md` y en `GET /v1/models/{nombre}/metadata`.

## La hora no es una recta en 1…24

La hora 24 y la 1 están cerca en el reloj, pero lejos si las tratas como números 24 y 1. Se mapea la hora `h` (1–24) a un ángulo y se usan:

```text
hour_sin = sin(2π · h / 24)
hour_cos = cos(2π · h / 24)
```

Así el modelo ve una **posición en un círculo**, no una línea infinita. Es una transformación fija **antes** de la parte lineal; la API usa la misma función `encode_hour` en `src/arepa/features.py` que el entrenamiento.

## Cómo se entrena aquí (pasos del repo)

```bash
python scripts/train_models.py
```

Código: `src/arepa/modeling.py`.

1. **Partición 80 % / 20 %** (`train_test_split`, `random_state=42`): el 20 % **no** se usa para calcular `β`; solo para medir error en datos “nuevos” simulados.
2. **Pipeline**: `StandardScaler` + `LinearRegression` → ajuste OLS sobre el 80 %.
3. **Evaluación** en el 20 % retenido: MSE, RMSE, R².
4. **Guardado** del pipeline completo en `models/*.joblib`.

El escalador va dentro del archivo. La API no recalcula medias: reaplica las del entrenamiento.

### Por qué separar train y test

Si midieras el error en las mismas filas con las que ajustaste `β`, el número sería **optimista** (memorización parcial). El hold-out del 20 % es una comprobación simple de generalización. No es validación cruzada; para este tamaño de proyecto suele bastar.

## Cómo leer MSE, RMSE y R²

En el conjunto de **prueba** (20 %):

**MSE** (error cuadrático medio):

```text
MSE = (1/n) Σᵢ (yᵢ − ŷᵢ)²
```

**RMSE** = √MSE, en las mismas unidades que `y` (pesos, mg/dL, kWh).

**R²** (coeficiente de determinación):

```text
R² = 1 − ( SS_res / SS_tot )
```

- `SS_res = Σᵢ (yᵢ − ŷᵢ)²` — lo que la recta **no** explica.  
- `SS_tot = Σᵢ (yᵢ − ȳ)²` — variación total de `y` alrededor de la media.  

Interpretación: **1** sería predicción perfecta en test; **0** sería tan bueno como predecir siempre la media `ȳ`; valores negativos indican un modelo peor que la media.

| Modelo | R² | MSE | RMSE |
|---|---:|---:|---:|
| Dólar | 0.996 | 2 377 | 48.8 |
| Glucosa | 0.681 | 234 | 15.3 |
| Energía | 0.785 | 894 | 29.9 |

Dólar: la recta casi reproduce el precio con estas variables. Glucosa: la recta explica una **parte** razonable; el resto es ruido u otras causas no medidas. Energía: término medio entre ambos.

## Otros algoritmos en el repo (no van a la API)

El artefacto publicado es **solo** OLS (pipeline sklearn). En entrenamiento se calculan además:

| Herramienta | Dónde | Para qué |
|---|---|---|
| **statsmodels OLS** | `fit_ols_inference` | Resumen inferencial, base para **distancia de Cook** (filas que moverían mucho la recta si se quitaran). |
| **Cook** | `influence_summary` | Diagnóstico; umbral orientativo `4/n`. En nuestros datos el máximo ≈ 0.05 (muy por debajo de 1). |
| **HuberRegressor** | segundo pipeline en `train_scenario` | Regresión **robusta**: baja peso a residuos grandes sin borrar filas. Se compara el R² con OLS; aquí casi igual → no se despliega. |
| **Reentreno sin IQR** | `exclude_outliers=True` | **Sensibilidad**: ver si las colas etiquetadas dominan el ajuste. |

Nada de eso reemplaza la recta OLS que carga FastAPI: el taller pide ese modelo y las comprobaciones confirman que no hace falta complicar el servicio.

Detalle de datos e IQR: [Limpieza de datos](02-limpieza-de-datos.md).

## Qué no hace esta recta

- No modela interacciones del tipo `x₁·x₂` (salvo lo que ya captura la codificación cíclica de la hora).  
- No es clasificación ni series temporales con memoria (el “día” en dólar es índice, no un ARIMA).  
- No garantiza causalidad: “asociado con” no es “provoca”.

Si el error de glucosa fuera crítico en producción, el siguiente paso sería **otro experimento** (más variables, otro algoritmo), manteniendo esta recta como referencia del curso.

## Predicción en la API (misma matemática)

1. Validar entradas (rangos).  
2. Construir la fila con los nombres de columna del entrenamiento (energía: `hour_sin`, `hour_cos`).  
3. El pipeline aplica scaler + `ŷ = β₀ + Σ βⱼ zⱼ`.  
4. Devolver `ŷ` y las métricas guardadas en el artefacto.

Siguiente: [La API](04-la-api.md). Más términos: [Glosario](06-glosario-y-preguntas.md).
