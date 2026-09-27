# Limpieza de datos

La data sucia está en `data/raw/`. La data tratada está en `data/processed/`. En estos tres archivos la diferencia no es que se hayan borrado filas. Es que cada fila queda revisada y etiquetada.

## Qué se encontró

| Archivo | Filas | Nulos | Duplicados | Valores imposibles |
|---|---:|---:|---:|---:|
| `dolar_data.csv` | 500 | 0 | 0 | 0 |
| `glucosa_data.csv` | 2 000 | 0 | 0 | 0 |
| `energia_data.csv` | 10 000 | 0 | 0 | 0 |

Un valor imposible es, por ejemplo, una hora 37, un IMC de 999 o un consumo negativo. Esos sí se eliminarían, porque no pueden ocurrir. Aquí no apareció ninguno, así que no se eliminó ninguna fila.

## Qué es una anomalía

El rango intercuartílico (IQR) marca los valores que caen lejos del centro de la columna. Sirve para mirar la cola. No es una orden de borrado: esa valla se inventó para el diagrama de caja, no para decidir qué entra al modelo.

En la industria se separan dos casos:

- **Error de captura.** El instrumento o la persona escribió algo que no puede existir. Se corrige o se saca.
- **Evento real extremo.** Un día de mucha inflación, una glucosa alta, un pico de temperatura. Se queda, porque es parte de lo que el modelo va a ver cuando esté en uso.

AREPA hace eso. Las colas se etiquetan (`normal`, `rare_legitimate`, `real_extreme`) y el modelo publicado se entrena con todas las filas válidas.

## Cómo se comprueba que no tumban la recta

Hay dos comprobaciones, y ninguna reemplaza al modelo que se entrega:

- **Sensibilidad.** Se vuelve a entrenar sin las filas marcadas por IQR. Si el R² casi no cambia, esas filas no estaban dominando el ajuste.
- **Distancia de Cook.** Mide cuánto se mueve la recta si se quita una sola fila. El aviso fuerte es un valor mayor que 1. En estos datos el máximo es 0.05.
- **Huber.** Es una regresión que les baja el peso a las colas sin borrarlas. El R² queda casi igual que el de la regresión ordinaria, así que servir Huber en la API no aportaría nada y dejaría de ser el modelo que pide el taller.

El detalle numérico está en `report/data_treatment.md`.

Siguiente: [la regresión lineal](03-regresion-lineal.md) (matemática del ajuste, métricas y algoritmos del repo).
