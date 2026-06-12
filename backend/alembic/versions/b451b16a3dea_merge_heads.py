"""merge heads

Revision ID: b451b16a3dea
Revises: 3329e9853434, 63a5757f19c7, 821d9b6405a8, f345023f1d4f
Create Date: 2026-06-12 17:20:35.921563
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import app.database  # GUID() custom type used in column definitions


# revision identifiers, used by Alembic.
revision: str = 'b451b16a3dea'
down_revision: Union[str, None] = ('3329e9853434', '63a5757f19c7', '821d9b6405a8', 'f345023f1d4f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
