"""fix_gender_enum_case

Fixes gender enum case mismatch between Python model and database.
Python model uses lowercase values ('male', 'female') but DB enum uses
uppercase ('MALE', 'FEMALE').

Revision ID: a9c6ede9644d
Revises: 001
Create Date: 2025-07-10 14:32:34.071067

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a9c6ede9644d'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Исправляем enum gender: заменяем 'MALE'/'FEMALE' на 'male'/'female'
    """
    # Создаем новый enum тип с правильными значениями (lowercase)
    new_gender_enum = postgresql.ENUM('male', 'female', name='gender_new')
    new_gender_enum.create(op.get_bind())

    # Добавляем временную колонку с новым enum типом
    op.add_column('passports', sa.Column('gender_temp', new_gender_enum,
                                         nullable=True))

    # Обновляем данные: преобразуем старые значения в новые
    op.execute("""
        UPDATE passports
        SET gender_temp = CASE
            WHEN gender::text = 'MALE' THEN 'male'::gender_new
            WHEN gender::text = 'FEMALE' THEN 'female'::gender_new
            ELSE NULL
        END
    """)

    # Удаляем старую колонку
    op.drop_column('passports', 'gender')

    # Переименовываем временную колонку в оригинальное имя
    op.alter_column('passports', 'gender_temp', new_column_name='gender')

    # Делаем колонку NOT NULL после обновления данных
    op.alter_column('passports', 'gender', nullable=False)

    # Удаляем старый enum тип и переименовываем новый
    op.execute("DROP TYPE gender")
    op.execute("ALTER TYPE gender_new RENAME TO gender")


def downgrade() -> None:
    """
    Откатываем изменения: возвращаем enum с заглавными буквами
    """
    # Создаем старый enum тип с заглавными буквами
    old_gender_enum = postgresql.ENUM('MALE', 'FEMALE', name='gender_old')
    old_gender_enum.create(op.get_bind())

    # Добавляем временную колонку со старым enum типом
    op.add_column('passports', sa.Column('gender_temp', old_gender_enum,
                                         nullable=True))

    # Обновляем данные: преобразуем новые значения в старые
    op.execute("""
        UPDATE passports
        SET gender_temp = CASE
            WHEN gender::text = 'male' THEN 'MALE'::gender_old
            WHEN gender::text = 'female' THEN 'FEMALE'::gender_old
            ELSE NULL
        END
    """)

    # Удаляем новую колонку
    op.drop_column('passports', 'gender')

    # Переименовываем временную колонку в оригинальное имя
    op.alter_column('passports', 'gender_temp', new_column_name='gender')

    # Делаем колонку NOT NULL после обновления данных
    op.alter_column('passports', 'gender', nullable=False)

    # Удаляем новый enum тип и переименовываем старый
    op.execute("DROP TYPE gender")
    op.execute("ALTER TYPE gender_old RENAME TO gender")
