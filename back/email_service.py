import mimetypes
import qrcode
from io import BytesIO
from flask_mail import Mail, Message
from config2 import Config2
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Mail (but attach it to the Flask app later)
mail = Mail()

# def generate_qr_code(ticket_id):
#     """Generate QR code for a ticket"""
#     try:
#         # Create verification URL
#         verification_url = f"{Config2.BASE_URL}/verify/ticket/{ticket_id}"
        
#         # Create QR code
#         qr = qrcode.QRCode(
#             version=None,
#             error_correction=qrcode.constants.ERROR_CORRECT_H,
#             box_size=10,
#             border=4,
#         )
        
#         qr.add_data(verification_url)
#         qr.make(fit=True)
        
#         img = qr.make_image(
#             fill_color="#1a1a1a",
#             back_color="#ffffff"
#         )
        
#         # Convert to PNG
#         img_buffer = BytesIO()
#         img.save(img_buffer, format="PNG")
#         img_buffer.seek(0)
        
#         return img_buffer.getvalue()
        
#     except Exception as e:
#         logger.error(f"Error generating QR code: {str(e)}")
#         raise

# def create_ticket_email(ticket, user):
#     """Create email message for ticket"""
#     try:
#         event_date = ticket.event.start_datetime.strftime('%B %d, %Y %H:%M') if ticket.event.start_datetime else "Date to be announced"
        
#         html_content = f"""<!DOCTYPE html>
#         <html>
#         <head>
#             <meta charset="UTF-8">
#             <meta name="viewport" content="width=device-width, initial-scale=1.0">
#             <style>
#                 body {{
#                     margin: 0;
#                     padding: 0;
#                     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
#                     background-color: #f5f5f5;
#                 }}
#                 .email-container {{
#                     max-width: 600px;
#                     margin: 0 auto;
#                     background-color: #ffffff;
#                     border-radius: 12px;
#                     overflow: hidden;
#                     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
#                 }}
#                 .email-header {{
#                     background: linear-gradient(135deg, {Config2.BRAND_COLOR}, {Config2.BRAND_COLOR}99);
#                     color: white;
#                     padding: 30px 20px;
#                     text-align: center;
#                 }}
#                 .email-body {{
#                     padding: 30px;
#                     color: #333333;
#                 }}
#                 .ticket-details {{
#                     background-color: #f8f9fa;
#                     border-radius: 8px;
#                     padding: 20px;
#                     margin-bottom: 25px;
#                 }}
#                 .qr-section {{
#                     text-align: center;
#                     margin: 30px 0;
#                 }}
#             </style>
#         </head>
#         <body>
#             <div class="email-container">
#                 <div class="email-header">
#                     <h1>🎟 Your Ticket Confirmation</h1>
#                 </div>
#                 <div class="email-body">
#                     <div class="greeting">
#                         Hello {user.first_name} {user.last_name},
#                     </div>
#                     <div class="ticket-details">
#                         <h2>{ticket.event.title}</h2>
#                         <p><strong>Date & Time:</strong> {event_date}</p>
#                         <p><strong>Location:</strong> {ticket.event.location}</p>
#                         <p><strong>Quantity:</strong> {ticket.quantity}</p>
#                     </div>
#                     <div class="qr-section">
#                         <img src="cid:qr_code" alt="Ticket QR Code" style="max-width: 200px;">
#                         <p>Present this QR code at the event entrance</p>
#                     </div>
#                 </div>
#             </div>
#         </body>
#         </html>"""

#         msg = Message(
#             subject=f"🎟 Your Ticket for {ticket.event.title}",
#             recipients=[user.email],
#             sender=(Config2.EMAIL_SENDER_NAME, Config2.MAIL_USERNAME),
#             html=html_content
#         )
        
#         # Generate and attach QR code
#         qr_data = generate_qr_code(ticket.id)
#         msg.attach(
#             filename=f"ticket_{ticket.id}.png",
#             content_type="image/png",
#             data=qr_data,
#             headers=[("Content-ID", "<qr_code>")]
#         )
        
#         return msg
        
#     except Exception as e:
#         logger.error(f"Error creating ticket email: {str(e)}")
#         raise

# def send_ticket_qr_email(ticket):
#     """Send ticket email with QR code"""
#     try:
#         user = ticket.attendee.user
#         msg = create_ticket_email(ticket, user)
#         mail.send(msg)
#         logger.info(f"Ticket email sent successfully to {user.email}")
#         return True
#     except Exception as e:
#         logger.error(f"Error sending ticket email: {str(e)}")
#         raise

# def send_email(recipient, subject, body, attachment_path=None):
#     """Function to send a general email with an optional attachment."""
#     try:
#         msg = Message(
#             subject=subject,
#             recipients=[recipient],
#             body=body,
#             sender=Config2.MAIL_DEFAULT_SENDER,
#         )

#         # Attach file if provided
#         if attachment_path:
#             try:
#                 mime_type, _ = mimetypes.guess_type(attachment_path)
#                 mime_type = mime_type or "application/octet-stream"
#                 with open(attachment_path, "rb") as file:
#                     msg.attach(
#                         filename=attachment_path.split("/")[-1],
#                         content_type=mime_type,
#                         data=file.read(),
#                     )
#             except Exception as e:
#                 logger.error(f"Error attaching file: {e}")

#         mail.send(msg)
#         logger.info(f"Email sent successfully to {recipient}")
#         return True
#     except Exception as e:
#         logger.error(f"Error sending email: {e}")
#         raise