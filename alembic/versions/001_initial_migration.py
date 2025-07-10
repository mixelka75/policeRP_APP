"""initial migration with correct enums

Revision ID: 2025_07_10_1500_initial
Revises:
Create Date: 2025-07-10 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2025_07_10_1500_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums with correct values
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'police')")
    op.execute("CREATE TYPE gender AS ENUM ('male', 'female')")

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('admin', 'police', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create passports table
    op.create_table('passports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('nickname', sa.String(length=50), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.Enum('male', 'female', name='gender'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_passports_first_name'), 'passports', ['first_name'], unique=False)
    op.create_index(op.f('ix_passports_id'), 'passports', ['id'], unique=False)
    op.create_index(op.f('ix_passports_last_name'), 'passports', ['last_name'], unique=False)
    op.create_index(op.f('ix_passports_nickname'), 'passports', ['nickname'], unique=True)

    # Create logs table
    op.create_table('logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_logs_id'), 'logs', ['id'], unique=False)
    op.create_index(op.f('ix_logs_user_id'), 'logs', ['user_id'], unique=False)

    # Create fines table
    op.create_table('fines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('passport_id', sa.Integer(), nullable=False),
        sa.Column('article', sa.String(length=200), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by_user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['passport_id'], ['passports.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fines_created_by_user_id'), 'fines', ['created_by_user_id'], unique=False)
    op.create_index(op.f('ix_fines_id'), 'fines', ['id'], unique=False)
    op.create_index(op.f('ix_fines_passport_id'), 'fines', ['passport_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_fines_passport_id'), table_name='fines')
    op.drop_index(op.f('ix_fines_id'), table_name='fines')
    op.drop_index(op.f('ix_fines_created_by_user_id'), table_name='fines')
    op.drop_table('fines')

    op.drop_index(op.f('ix_logs_user_id'), table_name='logs')
    op.drop_index(op.f('ix_logs_id'), table_name='logs')
    op.drop_table('logs')

    op.drop_index(op.f('ix_passports_nickname'), table_name='passports')
    op.drop_index(op.f('ix_passports_last_name'), table_name='passports')
    op.drop_index(op.f('ix_passports_id'), table_name='passports')
    op.drop_index(op.f('ix_passports_first_name'), table_name='passports')
    op.drop_table('passports')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

    # Drop enums
    op.execute("DROP TYPE IF EXISTS gender")
    op.execute("DROP TYPE IF EXISTS userrole")