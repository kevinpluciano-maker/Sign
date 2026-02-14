import resend
import os
from typing import Dict, Any
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import logging
import threading

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')

class EmailService:
    def __init__(self):
        self.sender_email = "orders@acrylicbraillesigns.com"
        # Send to both Resend test email AND Gmail
        self.notification_emails = [
            "orders@puukirudel.resend.app",  # Resend test email (receives first)
            os.environ.get('NOTIFICATION_EMAIL', 'acrylicbraillesigns@gmail.com')  # Gmail
        ]
        self.from_email = "Acrylic Braille Signs <onboarding@resend.dev>"
    
    def _send_email_async(self, to_emails: list, subject: str, body_html: str):
        """Send email using Resend API in background thread"""
        try:
            if not resend.api_key:
                logger.warning("⚠️ RESEND_API_KEY not configured")
                return False
            
            # Ensure to_emails is a list
            if isinstance(to_emails, str):
                to_emails = [to_emails]
            
            params = {
                "from": self.from_email,
                "to": to_emails,
                "subject": subject,
                "html": body_html,
            }
            
            response = resend.Emails.send(params)
            logger.info(f"✅ Email sent successfully to {to_emails}, ID: {response.get('id', 'N/A')}")
            return True
        except Exception as e:
            logger.error(f"❌ Email failed: {str(e)}")
            return False
    
    def send_email(self, to_email, subject: str, body_html: str, body_text: str = None):
        """Send email asynchronously - non-blocking"""
        # Convert to list if string
        if isinstance(to_email, str):
            to_email = [to_email]
        
        thread = threading.Thread(
            target=self._send_email_async,
            args=(to_email, subject, body_html),
            daemon=True
        )
        thread.start()
        logger.info(f"📧 Email queued for: {to_email}")
        return True
    
    def send_notification_email(self, subject: str, body_html: str):
        """Send email to ALL notification addresses (Resend test + Gmail)"""
        return self.send_email(self.notification_emails, subject, body_html)
    
    def send_contact_form_notification(self, form_data: Dict[str, Any]):
        """Send notification when contact form is submitted"""
        is_quote_request = 'Custom Quote Request' in form_data.get('subject', '')
        subject = f"{'Custom Quote Request' if is_quote_request else 'Contact Form'} from {form_data.get('name', 'Unknown')}"
        
        additional_info = ""
        if form_data.get('company') or form_data.get('urgency') or form_data.get('budget'):
            additional_info = "<h3>Project Details</h3><ul>"
            if form_data.get('company') and form_data.get('company') != 'Not provided':
                additional_info += f"<li><strong>Company:</strong> {form_data.get('company')}</li>"
            if form_data.get('urgency'):
                additional_info += f"<li><strong>Timeline:</strong> {form_data.get('urgency')}</li>"
            if form_data.get('budget') and form_data.get('budget') != 'Not specified':
                additional_info += f"<li><strong>Budget:</strong> {form_data.get('budget')}</li>"
            additional_info += "</ul>"
        
        body_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">{subject}</h2>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Date & Time:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
              </div>
              
              <h3>Contact Information</h3>
              <ul>
                <li><strong>Name:</strong> {form_data.get('name', 'N/A')}</li>
                <li><strong>Email:</strong> {form_data.get('email', 'N/A')}</li>
                <li><strong>Phone:</strong> {form_data.get('phone', 'Not provided')}</li>
              </ul>
              
              {additional_info}
              
              <h3>Message</h3>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2563eb; border-radius: 5px;">
                {form_data.get('message', 'No message provided')}
              </div>
              
              <p style="margin-top: 20px; color: #666; font-size: 12px;">
                Reply directly to: {form_data.get('email', 'N/A')}
              </p>
            </div>
          </body>
        </html>
        """
        
        return self.send_email(self.notification_email, subject, body_html)
    
    def send_pre_order_notification(self, order_data: Dict[str, Any]) -> bool:
        """Send pre-order email when customer initiates checkout"""
        try:
            subject = f"🔔 NEW PRE-ORDER - {order_data.get('customer_name', 'Customer')} - ${order_data.get('total', 0):.2f}"
            
            # Build items HTML with full specifications
            items_html = ""
            for item in order_data.get('cart_items', []):
                specs = item.get('specifications', {})
                
                spec_details = []
                if specs.get('size'):
                    spec_details.append(f"<strong>Size:</strong> {specs.get('size')}")
                if specs.get('color'):
                    spec_details.append(f"<strong>Color:</strong> {specs.get('color')}")
                if specs.get('braille'):
                    spec_details.append(f"<strong>Braille:</strong> {specs.get('braille')}")
                if specs.get('shape'):
                    spec_details.append(f"<strong>Shape:</strong> {specs.get('shape')}")
                
                if specs.get('customizations'):
                    for key, value in specs.get('customizations', {}).items():
                        if value:
                            spec_details.append(f"<strong>{key}:</strong> {value}")
                
                spec_html = "<br>".join(spec_details) if spec_details else "<em>Standard specifications</em>"
                
                items_html += f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; text-align: left; vertical-align: top;">
                        <div style="font-weight: 600; margin-bottom: 5px;">{item.get('name', 'Unknown')}</div>
                        <div style="font-size: 13px; color: #6b7280; line-height: 1.6;">{spec_html}</div>
                    </td>
                    <td style="padding: 12px; text-align: center; vertical-align: top;">{item.get('quantity', 1)}</td>
                    <td style="padding: 12px; text-align: right; vertical-align: top; font-weight: 600;">{item.get('price', '$0.00')}</td>
                </tr>
                """
            
            shipping_addr = order_data.get('shipping_address', {})
            
            body_html = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0;">🛒 PRE-ORDER INITIATED</h1>
                        <p style="margin: 10px 0 0 0;">Customer is proceeding to payment</p>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
                        <div style="background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px;">⏳ AWAITING PAYMENT</div>
                        
                        <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                            <h3 style="margin-top: 0; color: #667eea;">📋 Customer Information</h3>
                            <p><strong>Name:</strong> {order_data.get('customer_name', 'N/A')}</p>
                            <p><strong>📧 Email:</strong> {order_data.get('customer_email', 'N/A')}</p>
                            <p><strong>💰 Total Amount:</strong> ${order_data.get('total', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                            <p><strong>🕐 Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                            <p><strong>🆔 Session ID:</strong> {order_data.get('session_id', 'N/A')}</p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                            <h3 style="margin-top: 0; color: #667eea;">📦 Shipping Address</h3>
                            <p>{shipping_addr.get('address', 'N/A')}</p>
                            <p>{shipping_addr.get('city', 'N/A')}, {shipping_addr.get('state', 'N/A')} {shipping_addr.get('zip', 'N/A')}</p>
                            <p>{shipping_addr.get('country', 'N/A')}</p>
                        </div>
                        
                        <h3 style="color: #667eea;">🛍️ Order Items</h3>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 12px; text-align: left;">Product</th>
                                    <th style="padding: 12px; text-align: center;">Qty</th>
                                    <th style="padding: 12px; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items_html}
                            </tbody>
                        </table>
                        
                        <div style="text-align: right; margin-top: 20px; background: #f9fafb; padding: 15px; border-radius: 8px;">
                            <p><strong>Subtotal:</strong> ${order_data.get('subtotal', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                            <p><strong>Tax (13%):</strong> ${order_data.get('tax', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                            <p><strong>Shipping:</strong> ${order_data.get('shipping', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                            <hr style="margin: 10px 0;">
                            <p style="font-size: 18px; color: #667eea;"><strong>TOTAL:</strong> ${order_data.get('total', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                        </div>
                        
                        <div style="background: #fef3c7; padding: 15px; margin-top: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>⚠️ Note:</strong> This is a PRE-ORDER notification. Customer has been redirected to Stripe for payment. 
                                You will receive an "ORDER COMPLETE" email once payment is confirmed.
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0;"><strong>Acrylic Braille Signs</strong></p>
                        <p style="margin: 5px 0;">📞 +1 (647) 278-2905 | 📧 acrylicbraillesigns@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return self.send_notification_email(subject, body_html)
            
        except Exception as e:
            logger.error(f"❌ Error sending pre-order notification: {str(e)}")
            return True  # Don't fail checkout
    
    def send_order_complete_notification(self, order_data: Dict[str, Any]) -> bool:
        """Send order complete email after successful payment"""
        try:
            subject = f"✅ ORDER COMPLETE - {order_data.get('customer_name', 'Customer')} - PAID ${order_data.get('amount', 0):.2f}"
            
            # Build items HTML
            items_html = ""
            for item in order_data.get('cart_items', []):
                specs = item.get('specifications', {})
                
                spec_details = []
                if specs.get('size'):
                    spec_details.append(f"<strong>Size:</strong> {specs.get('size')}")
                if specs.get('color'):
                    spec_details.append(f"<strong>Color:</strong> {specs.get('color')}")
                if specs.get('braille'):
                    spec_details.append(f"<strong>Braille:</strong> {specs.get('braille')}")
                if specs.get('shape'):
                    spec_details.append(f"<strong>Shape:</strong> {specs.get('shape')}")
                
                if specs.get('customizations'):
                    for key, value in specs.get('customizations', {}).items():
                        if value:
                            spec_details.append(f"<strong>{key}:</strong> {value}")
                
                spec_html = "<br>".join(spec_details) if spec_details else "<em>Standard specifications</em>"
                
                items_html += f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; text-align: left; vertical-align: top;">
                        <div style="font-weight: 600; margin-bottom: 5px;">{item.get('name', 'Unknown')}</div>
                        <div style="font-size: 13px; color: #6b7280; line-height: 1.6;">{spec_html}</div>
                    </td>
                    <td style="padding: 12px; text-align: center; vertical-align: top;">{item.get('quantity', 1)}</td>
                    <td style="padding: 12px; text-align: right; vertical-align: top; font-weight: 600;">{item.get('price', '$0.00')}</td>
                </tr>
                """
            
            shipping_addr = order_data.get('shipping_address', {})
            
            body_html = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0;">✅ ORDER COMPLETE</h1>
                        <p style="margin: 10px 0 0 0;">Payment Successful - Ready to Manufacture</p>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
                        <div style="background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px;">✅ PAYMENT CONFIRMED</div>
                        
                        <div style="background: #d1fae5; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                            <p style="margin: 0; color: #065f46;">
                                <strong>🎉 Great News!</strong> Payment has been successfully processed. You can now proceed with manufacturing this order.
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                            <h3 style="margin-top: 0; color: #10b981;">📋 Customer Information</h3>
                            <p><strong>Name:</strong> {order_data.get('customer_name', 'N/A')}</p>
                            <p><strong>📧 Email:</strong> {order_data.get('customer_email', 'N/A')}</p>
                            <p><strong>💰 Paid Amount:</strong> ${order_data.get('amount', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                            <p><strong>🆔 Order ID:</strong> {order_data.get('session_id', 'N/A')[-12:] if order_data.get('session_id') else 'N/A'}</p>
                            <p><strong>🕐 Completed:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                            <p><strong>💳 Status:</strong> <span style="color: #10b981; font-weight: bold;">PAID</span></p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                            <h3 style="margin-top: 0; color: #10b981;">📦 Shipping Address</h3>
                            <p>{shipping_addr.get('address', 'N/A')}</p>
                            <p>{shipping_addr.get('city', 'N/A')}, {shipping_addr.get('state', 'N/A')} {shipping_addr.get('zip', 'N/A')}</p>
                            <p>{shipping_addr.get('country', 'N/A')}</p>
                        </div>
                        
                        <h3 style="color: #10b981;">🛍️ Order Items</h3>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 12px; text-align: left;">Product</th>
                                    <th style="padding: 12px; text-align: center;">Qty</th>
                                    <th style="padding: 12px; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items_html}
                            </tbody>
                        </table>
                        
                        <div style="text-align: right; margin-top: 20px; background: #d1fae5; padding: 15px; border-radius: 8px;">
                            <p><strong>Subtotal:</strong> ${order_data.get('subtotal', 0):.2f}</p>
                            <p><strong>Tax:</strong> ${order_data.get('tax', 0):.2f}</p>
                            <p><strong>Shipping:</strong> ${order_data.get('shipping', 0):.2f}</p>
                            <hr style="margin: 10px 0;">
                            <p style="font-size: 20px; color: #10b981;"><strong>PAID TOTAL:</strong> ${order_data.get('amount', 0):.2f} {order_data.get('currency', 'CAD').upper()}</p>
                        </div>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0;"><strong>Acrylic Braille Signs</strong></p>
                        <p style="margin: 5px 0;">📞 +1 (647) 278-2905 | 📧 acrylicbraillesigns@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send to business owner
            self.send_email(self.notification_email, subject, body_html)
            
            # Send confirmation to customer
            customer_subject = f"Order Confirmation - Acrylic Braille Signs"
            customer_html = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0;">Thank You for Your Order!</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
                        <p>Dear {order_data.get('customer_name', 'Customer')},</p>
                        <p>Your order has been confirmed and payment of <strong>${order_data.get('amount', 0):.2f} {order_data.get('currency', 'CAD').upper()}</strong> has been successfully processed.</p>
                        
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Order ID:</strong> {order_data.get('session_id', 'N/A')[-12:] if order_data.get('session_id') else 'N/A'}</p>
                            <p><strong>Date:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
                        </div>
                        
                        <p>We will begin manufacturing your custom signage immediately and will send you shipping updates via email.</p>
                        
                        <h3>What's Next?</h3>
                        <ol>
                            <li>Our team will review your order details</li>
                            <li>We'll contact you if we need any clarification</li>
                            <li>Your signs will be manufactured with care</li>
                            <li>You'll receive tracking info when shipped</li>
                        </ol>
                        
                        <p>If you have any questions, please contact us:</p>
                        <p>📧 <a href="mailto:acrylicbraillesigns@gmail.com">acrylicbraillesigns@gmail.com</a><br>
                        📞 +1 (647) 278-2905</p>
                        
                        <p>Thank you for choosing Acrylic Braille Signs!</p>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0;"><strong>Acrylic Braille Signs</strong></p>
                        <p style="margin: 5px 0;">Professional ADA Compliant Signage</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            if order_data.get('customer_email'):
                self.send_email(order_data.get('customer_email'), customer_subject, customer_html)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending order complete notification: {str(e)}")
            return True  # Don't fail checkout

# Create singleton instance
email_service = EmailService()
