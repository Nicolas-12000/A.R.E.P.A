"""Create prediction log and model metadata tables."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_prediction_tables"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "predictions_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("model_name", sa.String(length=20), nullable=False),
        sa.Column("input_payload", postgresql.JSONB(), nullable=False),
        sa.Column("prediction", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_predictions_log_model_name", "predictions_log", ["model_name"])
    op.create_table(
        "model_metadata",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("model_name", sa.String(length=20), nullable=False),
        sa.Column("r2_score", sa.Float(), nullable=False),
        sa.Column("mse", sa.Float(), nullable=False),
        sa.Column("rmse", sa.Float(), nullable=True),
        sa.Column("trained_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("version", sa.String(length=10), nullable=False, server_default="v1"),
        sa.UniqueConstraint("model_name"),
    )


def downgrade() -> None:
    op.drop_table("model_metadata")
    op.drop_index("ix_predictions_log_model_name", table_name="predictions_log")
    op.drop_table("predictions_log")
