import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import threading
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = os.environ.get('SENDER_EMAIL', 'noreply@absigns.com')
        self.notification_email = os.environ.get('NOTIFICATION_EMAIL', 'acrylicbraillesigns@gmail.com')
        self.sender_password = os.environ.get('SENDER_PASSWORD', '')
    
    def _send_email_async(self, to_email: str, subject: str, body_html: str, body_text: str = None):
        """Send email in background thread - non-blocking"""
        try:
            # Log email content
            logger.info(f"📧 Sending email to: {to_email}, Subject: {subject}")
            
            # If no password is set, skip SMTP sending
            if not self.sender_password:
                logger.warning("⚠️ SMTP password not configured - Email logged but not sent")
                return True
            
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email
            
            if body_text:
                part1 = MIMEText(body_text, "plain")
                message.attach(part1)
            
            part2 = MIMEText(body_html, "html")
            message.attach(part2)
            
            # Try to send with timeout
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Email failed (non-critical): {str(e)}")
            # Don't raise - email failure should not break checkout
            return False
    
    def send_email(self, to_email: str, subject: str, body_html: str, body_text: str = None):
        """Send email asynchronously - returns immediately, doesn't block"""
        # Run email sending in background thread
        thread = threading.Thread(
            target=self._send_email_async,
            args=(to_email, subject, body_html, body_text),
            daemon=True
        )
        thread.start()
        logger.info(f"📧 Email queued for: {to_email}")
        return True  # Always return True - email is non-critical
    
    def send_contact_form_notification(self, form_data: Dict[str, Any]):
        """Send notification when contact form is submitted"""
        is_quote_request = 'Custom Quote Request' in form_data.get('subject', '')
        if is_quote_request:
            subject = f"Custom Quote Request from {form_data.get('name', 'Unknown')}"
        else:
            subject = f"Contact Form Submission from {form_data.get('name', 'Unknown')}"
        
        body_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>{subject}</h2>
            <p><strong>Name:</strong> {form_data.get('name', 'N/A')}</p>
            <p><strong>Email:</strong> {form_data.get('email', 'N/A')}</p>
            <p><strong>Phone:</strong> {form_data.get('phone', 'Not provided')}</p>
            <p><strong>Message:</strong></p>
            <p>{form_data.get('message', 'No message')}</p>
          </body>
        </html>
        """
        
        return self.send_email(self.notification_email, subject, body_html)
    
    def send_pre_order_notification(self, order_data: Dict[str, Any]) -> bool:
        """Send pre-order email - NON-BLOCKING"""
        try:
            subject = f"🔔 NEW PRE-ORDER - {order_data.get('customer_name', 'Customer')}"
            
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h1>🛒 PRE-ORDER INITIATED</h1>
                <p><strong>Customer:</strong> {order_data.get('customer_name', 'N/A')}</p>
                <p><strong>Email:</strong> {order_data.get('customer_email', 'N/A')}</p>
                <p><strong>Total:</strong> ${order_data.get('total', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                <p><em>Customer is proceeding to Stripe payment...</em></p>
            </body>
            </html>
            """
            
            return self.send_email(self.notification_email, subject, body_html)
        except Exception as e:
            logger.error(f"Pre-order email error (non-critical): {e}")
            return True  # Don't fail checkout
    
    def send_order_complete_notification(self, order_data: Dict[str, Any]) -> bool:
        """Send order complete email - NON-BLOCKING"""
        try:
            subject = f"✅ ORDER COMPLETE - {order_data.get('customer_name', 'Customer')}"
            
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h1 style="color: green;">✅ PAYMENT CONFIRMED</h1>
                <p><strong>Customer:</strong> {order_data.get('customer_name', 'N/A')}</p>
                <p><strong>Email:</strong> {order_data.get('customer_email', 'N/A')}</p>
                <p><strong>Amount Paid:</strong> ${order_data.get('amount', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                <p><strong>Order ID:</strong> {order_data.get('session_id', 'N/A')}</p>
                <p><em>Payment successful - proceed with manufacturing!</em></p>
            </body>
            </html>
            """
            
            # Send to business
            self.send_email(self.notification_email, subject, body_html)
            
            # Send confirmation to customer
            customer_subject = "Order Confirmation - Acrylic Braille Signs"
            customer_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h1>Thank You for Your Order!</h1>
                <p>Dear {order_data.get('customer_name', 'Customer')},</p>
                <p>Your payment of ${order_data.get('amount', 0):.2f} has been received.</p>
                <p>We will begin manufacturing your signage and send shipping updates soon.</p>
                <p>Contact us: acrylicbraillesigns@gmail.com | +1 (647) 278-2905</p>
            </body>
            </html>
            """
            self.send_email(order_data.get('customer_email'), customer_subject, customer_html)
            
            return True
        except Exception as e:
            logger.error(f"Order complete email error (non-critical): {e}")
            return True  # Don't fail checkout

# Create singleton instance
email_service = EmailService()
