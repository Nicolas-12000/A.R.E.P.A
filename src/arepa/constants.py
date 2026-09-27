from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
FIGURES_DIR = PROJECT_ROOT / "report" / "figures"

RAW_DATA_PATHS = {
    "dollar": DATA_RAW / "dolar_data.csv",
    "glucose": DATA_RAW / "glucosa_data.csv",
    "energy": DATA_RAW / "energia_data.csv",
}

PROCESSED_DATA_PATHS = {
    "dollar": DATA_PROCESSED / "dollar.csv",
    "glucose": DATA_PROCESSED / "glucose.csv",
    "energy": DATA_PROCESSED / "energy.csv",
}

COLUMN_MAPS = {
    "dollar": {
        "Dia": "day",
        "Inflacion": "inflation_rate",
        "Tasa_interes": "interest_rate",
        "Precio_Dolar": "dollar_price",
    },
    "glucose": {
        "Edad": "age",
        "IMC": "bmi",
        "Actividad_Fisica": "physical_activity_hours",
        "Nivel_Glucosa": "glucose_level",
    },
    "energy": {
        "Temperatura": "temperature",
        "Hora": "hour",
        "Dia_Semana": "day_of_week",
        "Consumo_Energia": "energy_consumption",
    },
}

TARGET_COLUMNS = {
    "dollar": "dollar_price",
    "glucose": "glucose_level",
    "energy": "energy_consumption",
}

FEATURE_COLUMNS = {
    "dollar": ["day", "inflation_rate", "interest_rate"],
    "glucose": ["age", "bmi", "physical_activity_hours"],
    "energy": ["temperature", "hour_sin", "hour_cos", "day_of_week"],
}

MODEL_ARTIFACTS = {
    "dollar": MODELS_DIR / "dollar_model.joblib",
    "glucose": MODELS_DIR / "glucose_model.joblib",
    "energy": MODELS_DIR / "energy_model.joblib",
}

RANDOM_STATE = 42
TEST_SIZE = 0.2
