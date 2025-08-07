from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Header, Response
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.crud import payment, fine_crud
from app.models.user import User
from app.models.fine import Fine
from app.schemas.payment import (
    PaymentCreate, 
    PaymentResponse, 
    PaymentWebhook,
    SPWorldsPaymentCreate,
    SPWorldsPaymentItem
)
from app.clients.spworlds import spworlds_client
from app.clients.bt_api import bt_client
from app.utils.currency import convert_ar_to_bt

router = APIRouter()


@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать платеж для оплаты штрафов
    """
    # Проверяем, что пользователь может оплачивать штрафы этого паспорта
    # Для обычных жителей - только свои штрафы
    if current_user.role != "admin":
        from app.models.passport import Passport
        user_fines = db.query(Fine).join(Passport).filter(
            Fine.id.in_(payment_data.fine_ids),
            Passport.discord_id == str(current_user.discord_id)
        ).all()
        
        if len(user_fines) != len(payment_data.fine_ids):
            raise HTTPException(
                status_code=403,
                detail="Вы можете оплачивать только свои штрафы"
            )
    
    # Получаем неоплаченные штрафы
    fines = db.query(Fine).filter(
        Fine.id.in_(payment_data.fine_ids),
        Fine.is_paid == False
    ).all()
    
    if not fines:
        raise HTTPException(
            status_code=400,
            detail="Нет неоплаченных штрафов для оплаты"
        )
    
    if len(fines) != len(payment_data.fine_ids):
        raise HTTPException(
            status_code=400,
            detail="Некоторые штрафы уже оплачены или не существуют"
        )
    
    # Рассчитываем общую сумму (1 рубль = 1 AR)
    total_ar = sum(max(1, int(fine.amount)) for fine in fines)  # Минимум 1 AR за штраф
    
    if total_ar > 10000:  # Лимит SP-Worlds в AR
        raise HTTPException(
            status_code=400,
            detail="Сумма платежа превышает максимальный лимит (10,000 AR)"
        )
    
    # Создаем платеж в базе данных
    db_payment = payment.create_payment(
        db, 
        payment_in=payment_data,
        total_amount=total_ar  # Сохраняем в базе в AR
    )
    
    # Формируем данные для SP-Worlds
    payment_items = [
        SPWorldsPaymentItem(
            name=f"Штраф #{fine.id}",
            count=1,
            price=max(1, int(fine.amount)),  # Конвертация рублей в AR, минимум 1 AR
            comment=fine.article[:60] if fine.article else None
        )
        for fine in fines
    ]
    
    spworlds_payment = SPWorldsPaymentCreate(
        items=payment_items,
        redirectUrl=settings.PAYMENT_SUCCESS_REDIRECT_URL,
        webhookUrl=settings.PAYMENT_WEBHOOK_URL,
        data=str(db_payment.id)  # ID нашего платежа как метаданные
    )
    
    # Создаем платеж в SP-Worlds
    spworlds_response = await spworlds_client.create_payment(spworlds_payment)
    
    if not spworlds_response.success:
        # Удаляем платеж из БД если не удалось создать в SP-Worlds
        db.delete(db_payment)
        db.commit()
        
        raise HTTPException(
            status_code=400,
            detail=f"Ошибка создания платежа: {spworlds_response.message}"
        )
    
    # Обновляем платеж с данными от SP-Worlds
    db_payment.payment_url = spworlds_response.url
    db_payment.expires_at = datetime.now() + timedelta(hours=24)  # Платеж действует 24 часа
    db.commit()
    db.refresh(db_payment)
    
    return PaymentResponse(
        id=db_payment.id,
        passport_id=db_payment.passport_id,
        fine_ids=json.loads(db_payment.fine_ids),
        total_amount=db_payment.total_amount,
        status=db_payment.status,
        payment_url=db_payment.payment_url,
        created_at=db_payment.created_at,
        expires_at=db_payment.expires_at
    )


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    x_body_hash: str = Header(None, alias="X-Body-Hash")
):
    """
    Webhook для получения уведомлений о платежах от SP-Worlds
    """
    # Добавляем заголовок для пропуска предупреждения ngrok
    response.headers["ngrok-skip-browser-warning"] = "true"
    
    if not x_body_hash:
        raise HTTPException(status_code=400, detail="Missing X-Body-Hash header")
    
    # Читаем тело запроса
    body = await request.body()
    
    # Валидируем подпись
    if not spworlds_client.validate_webhook_signature(body, x_body_hash):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Парсим данные webhook'а
    try:
        webhook_data = PaymentWebhook.model_validate_json(body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook data: {e}")
    
    # Находим платеж по метаданным
    payment_id = webhook_data.data
    if not payment_id:
        raise HTTPException(status_code=400, detail="No payment ID in webhook data")
    
    try:
        payment_id = int(payment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment ID format")
    
    db_payment = payment.get(db, id=payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if db_payment.status == "completed":
        return {"status": "already_processed"}
    
    # Завершаем платеж
    completed_payment = payment.complete_payment(
        db,
        payment=db_payment,
        payer_nickname=webhook_data.payer,
        webhook_data=body.decode('utf-8')
    )
    
    return {"status": "success", "payment_id": completed_payment.id}


@router.get("/", response_model=List[PaymentResponse])
def get_user_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить все платежи текущего пользователя
    """
    # Получаем паспорта пользователя
    from app.models.passport import Passport
    user_passports = db.query(Fine).join(Passport).filter(
        Passport.discord_id == str(current_user.discord_id)
    ).with_entities(Fine.passport_id).distinct().all()
    
    passport_ids = [p.passport_id for p in user_passports]
    
    if not passport_ids:
        return []
    
    # Получаем платежи по паспортам
    payments = []
    for passport_id in passport_ids:
        passport_payments = payment.get_by_passport(db, passport_id=passport_id)
        payments.extend(passport_payments)
    
    return [
        PaymentResponse(
            id=p.id,
            passport_id=p.passport_id,
            fine_ids=json.loads(p.fine_ids),
            total_amount=p.total_amount,
            status=p.status,
            payment_url=p.payment_url,
            payer_nickname=p.payer_nickname,
            created_at=p.created_at,
            paid_at=p.paid_at,
            expires_at=p.expires_at
        )
        for p in payments
    ]


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить информацию о платеже
    """
    db_payment = payment.get(db, id=payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Проверяем права доступа
    if current_user.role != "admin":
        # Проверяем, что платеж принадлежит пользователю
        from app.models.passport import Passport
        user_passport = db.query(Passport).filter(
            Passport.discord_id == str(current_user.discord_id),
            Passport.id == db_payment.passport_id
        ).first()
        
        if not user_passport:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return PaymentResponse(
        id=db_payment.id,
        passport_id=db_payment.passport_id,
        fine_ids=json.loads(db_payment.fine_ids),
        total_amount=db_payment.total_amount,
        status=db_payment.status,
        payment_url=db_payment.payment_url,
        payer_nickname=db_payment.payer_nickname,
        created_at=db_payment.created_at,
        paid_at=db_payment.paid_at,
        expires_at=db_payment.expires_at
    )


@router.post("/pay-with-bt")
async def pay_fines_with_bt(
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Оплатить штрафы баллами труда
    """
    fine_ids = request_data.get("fine_ids", [])
    
    if not fine_ids:
        raise HTTPException(
            status_code=400,
            detail="Не указаны штрафы для оплаты"
        )
    
    # Проверяем, что пользователь может оплачивать штрафы этого паспорта
    # Для обычных жителей - только свои штрафы
    if current_user.role != "admin":
        from app.models.passport import Passport
        user_fines = db.query(Fine).join(Passport).filter(
            Fine.id.in_(fine_ids),
            Passport.discord_id == str(current_user.discord_id)
        ).all()
        
        if len(user_fines) != len(fine_ids):
            raise HTTPException(
                status_code=403,
                detail="Вы можете оплачивать только свои штрафы"
            )
    
    # Получаем неоплаченные штрафы
    fines = db.query(Fine).filter(
        Fine.id.in_(fine_ids),
        Fine.is_paid == False
    ).all()
    
    if not fines:
        raise HTTPException(
            status_code=400,
            detail="Нет неоплаченных штрафов для оплаты"
        )
    
    if len(fines) != len(fine_ids):
        raise HTTPException(
            status_code=400,
            detail="Некоторые штрафы уже оплачены или не существуют"
        )
    
    # Рассчитываем общую сумму в БТ
    total_ar = sum(fine.amount for fine in fines)
    total_bt_required = convert_ar_to_bt(total_ar)
    
    # Проверяем баланс БТ пользователя
    user_bt_balance = await bt_client.get_user_bt(str(current_user.discord_id))
    
    if user_bt_balance is None:
        raise HTTPException(
            status_code=400,
            detail="Не удалось получить баланс баллов труда"
        )
    
    if user_bt_balance < total_bt_required:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно баллов труда. Требуется {total_bt_required} БТ, доступно {user_bt_balance} БТ"
        )
    
    # Списываем БТ
    bt_success = await bt_client.subtract_bt(str(current_user.discord_id), total_bt_required)
    
    if not bt_success:
        raise HTTPException(
            status_code=400,
            detail="Не удалось списать баллы труда"
        )
    
    # Помечаем штрафы как оплаченные
    for fine in fines:
        fine.is_paid = True
        fine.paid_at = datetime.now()
        # fine.payment_method = "bt"  # Если есть такое поле
        db.add(fine)
    
    # Получаем новый баланс БТ
    new_bt_balance = await bt_client.get_user_bt(str(current_user.discord_id))
    
    db.commit()
    
    # Логируем операцию
    from app.utils.logger import ActionLogger
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="PAY_FINES_WITH_BT",
        entity_type="payment",
        details={
            "fine_ids": fine_ids,
            "total_amount_ar": total_ar,
            "total_amount_bt": total_bt_required,
            "exchange_rate": "1 АР = 3 БТ",
            "old_balance": user_bt_balance,
            "new_balance": new_bt_balance or (user_bt_balance - total_bt_required),
            "fines_count": len(fines)
        }
    )
    
    return {
        "success": True,
        "new_balance": new_bt_balance or (user_bt_balance - total_bt_required),
        "message": f"Оплачено {len(fines)} штрафов на сумму {total_ar} АР ({total_bt_required} БТ)"
    }