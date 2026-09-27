# Tratamiento de datos

La data sucia está en `data/raw/`. La data tratada está en `data/processed/`.
Solo se elimina un registro si el valor es físicamente imposible.
El IQR marca colas para revisarlas. No autoriza a sacarlas del ajuste.
El modelo publicado es la regresión lineal con todas las filas válidas.
La distancia de Cook dice qué filas sí mueven la recta. Huber es la comprobación robusta: baja el peso de la cola sin borrarla.

## dollar

- Fuente sucia: `data/raw/dolar_data.csv`
- Filas sucias: 500
- Filas tratadas: 500
- Filas eliminadas: 0
- Duplicados exactos: 0
- Errores de captura: 0
- Categorías conservadas: {'normal': 490, 'real_extreme': 10}
- Flags IQR (conservados): {'day': 0, 'inflation_rate': 4, 'interest_rate': 7, 'dollar_price': 0}
- Modelo publicado (todas las filas válidas): R²=0.9963, MSE=2376.97, RMSE=48.75
- Sensibilidad sin filas marcadas por IQR: R²=0.9959, MSE=2560.50, RMSE=50.60
- Huber (mismo split, pesos menores en la cola): R²=0.9962, MSE=2451.22, RMSE=49.51
- Cook's distance > 0.0100 en entrenamiento: 25 de 400 (máximo 0.0502)

| Variable | Coeficiente (unidad original) | Coeficiente estandarizado |
|---|---:|---:|
| day | 4.9843 | 699.8238 |
| inflation_rate | -870.7317 | -4.2677 |
| interest_rate | -1.3774 | -0.6598 |
| intercept | 3985.7833 | 5202.6976 |

## glucose

- Fuente sucia: `data/raw/glucosa_data.csv`
- Filas sucias: 2000
- Filas tratadas: 2000
- Filas eliminadas: 0
- Duplicados exactos: 0
- Errores de captura: 0
- Categorías conservadas: {'normal': 1981, 'rare_legitimate': 16, 'real_extreme': 3}
- Flags IQR (conservados): {'age': 0, 'bmi': 16, 'physical_activity_hours': 0, 'glucose_level': 3}
- Modelo publicado (todas las filas válidas): R²=0.6814, MSE=233.69, RMSE=15.29
- Sensibilidad sin filas marcadas por IQR: R²=0.6948, MSE=223.90, RMSE=14.96
- Huber (mismo split, pesos menores en la cola): R²=0.6808, MSE=234.12, RMSE=15.30
- Cook's distance > 0.0025 en entrenamiento: 90 de 1600 (máximo 0.0127)

| Variable | Coeficiente (unidad original) | Coeficiente estandarizado |
|---|---:|---:|
| age | 1.2266 | 21.5708 |
| bmi | 0.9334 | 3.7225 |
| physical_activity_hours | -2.0853 | -6.1061 |
| intercept | 65.8609 | 139.8141 |

## energy

- Fuente sucia: `data/raw/energia_data.csv`
- Filas sucias: 10000
- Filas tratadas: 10000
- Filas eliminadas: 0
- Duplicados exactos: 0
- Errores de captura: 0
- Categorías conservadas: {'normal': 9867, 'real_extreme': 133}
- Flags IQR (conservados): {'temperature': 90, 'hour': 0, 'day_of_week': 0, 'energy_consumption': 66}
- Modelo publicado (todas las filas válidas): R²=0.7851, MSE=894.41, RMSE=29.91
- Sensibilidad sin filas marcadas por IQR: R²=0.7773, MSE=830.99, RMSE=28.83
- Huber (mismo split, pesos menores en la cola): R²=0.7851, MSE=894.51, RMSE=29.91
- Cook's distance > 0.0005 en entrenamiento: 408 de 8000 (máximo 0.0030)

| Variable | Coeficiente (unidad original) | Coeficiente estandarizado |
|---|---:|---:|
| temperature | 9.8701 | 49.2495 |
| hour_sin | -38.3106 | -26.9944 |
| hour_cos | -4.8718 | -3.4570 |
| day_of_week | -3.0667 | -6.1450 |
| intercept | 166.0834 | 400.1086 |

