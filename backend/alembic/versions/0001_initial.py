"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-06-13

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "billing_plans",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("sessions_included", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("name"),
    )


def downgrade():
    op.drop_table("billing_plans")