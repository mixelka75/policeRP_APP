"""
Утилиты для работы с валютами PoliceRP
"""

# Курсы валют
EXCHANGE_RATES = {
    "AR_TO_BT": 3,  # 1 АР = 3 БТ
}


def convert_ar_to_bt(ar_amount: int) -> int:
    """Конвертирует АР в БТ по текущему курсу"""
    return ar_amount * EXCHANGE_RATES["AR_TO_BT"]


def convert_bt_to_ar(bt_amount: int) -> int:
    """Конвертирует БТ в АР по текущему курсу"""
    return bt_amount // EXCHANGE_RATES["AR_TO_BT"]


def can_pay_with_bt(bt_balance: int, ar_amount: int) -> bool:
    """Проверяет, достаточно ли БТ для оплаты суммы в АР"""
    return bt_balance >= convert_ar_to_bt(ar_amount)