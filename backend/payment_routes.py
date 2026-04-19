from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict
import stripe
import os
from datetime import datetime
import logging
from email_service import EmailService
from db import get_db

# Initialize email service
email_service = EmailService()

# Initialize router
payment_router = APIRouter(prefix="/api/payments", tags=["payments"])

# Stripe API Key (read lazily at first use)
def _get_stripe_key():
    key = os.environ.get('STRIPE_API_KEY')
    if key:
        stripe.api_key = key
    return key

_get_stripe_key()

logger = logging.getLogger(__name__)


# Request/Response Models
class PaymentRequest(BaseModel):
    cart_items: list
    customer_email: str
    customer_name: str
    shipping_address: Dict[str, str]
    billing_address: Dict[str, str]
    host_url: str
    subtotal: float
    tax: float
    shipping: float
    total: float
    currency: str = "cad"


class PaymentMethodRequest(BaseModel):
    payment_method: str = Field(..., description="Payment method: 'stripe' or 'paypal'")


@payment_router.post("/create-checkout-session")
async def create_checkout_session(payment_request: PaymentRequest):
    """Create a Stripe checkout session for the cart"""
    try:
        # Use the total amount provided by frontend (includes tax and shipping)
        total_amount = payment_request.total
        
        # Create success and cancel URLs
        host_url = payment_request.host_url
        success_url = f"{host_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/checkout"
        
        # Prepare metadata
        metadata = {
            "customer_email": payment_request.customer_email,
            "customer_name": payment_request.customer_name,
            "order_items": str(len(payment_request.cart_items)),
            "subtotal": str(payment_request.subtotal),
            "tax": str(payment_request.tax),
            "shipping": str(payment_request.shipping),
            "currency": payment_request.currency.upper(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': payment_request.currency.lower(),
                    'product_data': {
                        'name': f'Order - {len(payment_request.cart_items)} item(s)',
                        'description': f'Acrylic Braille Signs Order for {payment_request.customer_name}',
                    },
                    'unit_amount': int(total_amount * 100),  # Stripe uses cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=payment_request.customer_email,
            metadata=metadata
        )
        
        # Store transaction in database
        transaction_data = {
            "session_id": session.id,
            "payment_status": "initiated",
            "status": "pending",
            "amount": total_amount,
            "currency": payment_request.currency.upper(),
            "customer_email": payment_request.customer_email,
            "customer_name": payment_request.customer_name,
            "cart_items": payment_request.cart_items,
            "shipping_address": payment_request.shipping_address,
            "billing_address": payment_request.billing_address,
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await get_db().payment_transactions.insert_one(transaction_data)
        
        logger.info(f"✅ Created checkout session: {session.id}")
        
        # Send pre-order email notification
        try:
            pre_order_data = {
                "customer_name": payment_request.customer_name,
                "customer_email": payment_request.customer_email,
                "cart_items": payment_request.cart_items,
                "shipping_address": payment_request.shipping_address,
                "subtotal": payment_request.subtotal,
                "tax": payment_request.tax,
                "shipping": payment_request.shipping,
                "total": payment_request.total,
                "currency": payment_request.currency,
                "session_id": session.id
            }
            email_service.send_pre_order_notification(pre_order_data)
            logger.info("✅ Pre-order email sent")
        except Exception as email_error:
            logger.error(f"⚠️ Pre-order email failed: {str(email_error)}")
            # Don't fail the checkout if email fails
        
        return {
            "url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"❌ Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@payment_router.get("/checkout-status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Get the status of a checkout session"""
    try:
        # Get checkout session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        payment_status = session.payment_status  # 'paid', 'unpaid', 'no_payment_required'
        status = session.status  # 'open', 'complete', 'expired'
        
        # Update transaction in database
        existing_transaction = await get_db().payment_transactions.find_one({"session_id": session_id})
        
        if existing_transaction:
            # Only update if payment_status has changed to avoid duplicate processing
            if existing_transaction.get('payment_status') != payment_status:
                update_data = {
                    "payment_status": payment_status,
                    "status": status,
                    "updated_at": datetime.utcnow()
                }
                
                await get_db().payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": update_data}
                )
                
                logger.info(f"✅ Updated payment status for session {session_id}: {payment_status}")
                
                # Send order complete email if payment is successful
                if payment_status == "paid":
                    try:
                        order_complete_data = {
                            "customer_name": existing_transaction.get('customer_name'),
                            "customer_email": existing_transaction.get('customer_email'),
                            "cart_items": existing_transaction.get('cart_items', []),
                            "shipping_address": existing_transaction.get('shipping_address', {}),
                            "subtotal": existing_transaction.get('subtotal', 0),
                            "tax": existing_transaction.get('tax', 0),
                            "shipping": existing_transaction.get('shipping', 0),
                            "amount": session.amount_total / 100 if session.amount_total else 0,
                            "currency": session.currency.upper() if session.currency else 'CAD',
                            "session_id": session_id
                        }
                        email_service.send_order_complete_notification(order_complete_data)
                        logger.info("✅ Order complete email sent")
                    except Exception as email_error:
                        logger.error(f"⚠️ Order complete email failed: {str(email_error)}")
        
        return {
            "status": status,
            "payment_status": payment_status,
            "amount_total": session.amount_total / 100 if session.amount_total else 0,
            "currency": session.currency.upper() if session.currency else 'CAD',
            "metadata": dict(session.metadata) if session.metadata else {}
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"❌ Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error getting checkout status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@payment_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Bulletproof Stripe webhook: verifies signature when STRIPE_WEBHOOK_SECRET is set,
    fulfills the order in the DB on checkout.session.completed, sends emails,
    and is idempotent via `stripe_events` collection.
    """
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload=body, sig_header=signature, secret=webhook_secret
            )
        else:
            # No secret configured — trust the payload (dev/preview only). Log a warning.
            import json as _json
            event = stripe.Event.construct_from(_json.loads(body), stripe.api_key)
            logger.warning("STRIPE_WEBHOOK_SECRET not set — accepting unverified webhook")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook parse error: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")

    db = get_db()

    # Normalize: stripe.Webhook.construct_event returns a Stripe object whose keys may not
    # behave like plain dicts with .get(); convert to plain dict via attribute/fallback.
    try:
        event_id = event["id"] if hasattr(event, "__getitem__") else getattr(event, "id", None)
    except Exception:
        event_id = getattr(event, "id", None)
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event id")

    # Idempotency check
    already = await db.stripe_events.find_one({"id": event_id})
    if already:
        return {"status": "already_processed", "event_id": event_id}
    event_type = event["type"] if hasattr(event, "__getitem__") else getattr(event, "type", "")
    await db.stripe_events.insert_one(
        {"id": event_id, "type": event_type, "received_at": datetime.utcnow()}
    )

    if event_type == "checkout.session.completed":
        session = event["data"]["object"] if hasattr(event, "__getitem__") else event.data.object
        session_id = session["id"] if hasattr(session, "__getitem__") else session.id
        customer_email = (
            (session.get("customer_details") or {}).get("email")
            or session.get("customer_email")
            or ""
        )
        amount_total = (session.get("amount_total") or 0) / 100.0
        currency = (session.get("currency") or "cad").upper()

        # Update payment_transactions
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "payment_status": session.get("payment_status"),
                    "status": "complete",
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        # Create/upsert an Order record so admin dashboard sees it
        order_doc = {
            "order_id": session_id,
            "customer_email": customer_email,
            "customer_name": (session.get("customer_details") or {}).get("name", ""),
            "amount": amount_total,
            "total": f"{amount_total:.2f}",
            "currency": currency,
            "status": "paid",
            "items": (session.get("metadata") or {}),
            "timestamp": datetime.utcnow(),
        }
        await db.orders.update_one(
            {"order_id": session_id}, {"$set": order_doc}, upsert=True
        )

        # Send emails (non-blocking internally)
        try:
            email_service.send_order_complete_notification(
                {
                    "order_id": session_id,
                    "customer_email": customer_email,
                    "customer_name": order_doc["customer_name"],
                    "amount": amount_total,
                    "currency": currency,
                }
            )
        except Exception as e:
            logger.error(f"Order email failed: {e}")

        logger.info(f"✅ Webhook fulfilled order for session {session_id}")

    return {"status": "success", "event_id": event["id"]}


@payment_router.get("/order/{session_id}")
async def get_order_details(session_id: str):
    """Get order details by session ID"""
    try:
        transaction = await get_db().payment_transactions.find_one({"session_id": session_id})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Convert MongoDB _id to string
        transaction['_id'] = str(transaction['_id'])
        
        return transaction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting order details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
