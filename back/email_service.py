import mimetypes
from flask_mail import Mail, Message
from app import mail  # Import the mail instance from app.py
import qrcode
from io import BytesIO

# Initialize Mail (but attach it to the Flask app later)


class EmailService:
 

    def send_email(self, recipient, subject, body, attachment_path=None):
        """Function to send an email with an optional attachment."""
        msg = Message(
            subject=subject,
            recipients=[recipient],
            body=body,
            sender=mail.app.config['MAIL_DEFAULT_SENDER'],
        )

        # Attach file if provided
        if attachment_path:
            try:
                mime_type, _ = mimetypes.guess_type(attachment_path)
                mime_type = mime_type or "application/octet-stream"  # Default MIME type if unknown
                with open(attachment_path, "rb") as file:
                    msg.attach(
                        filename=attachment_path.split("/")[-1],  
                        content_type=mime_type,  
                        data=file.read(),
                    )
            except Exception as e:
                print(f"Error attaching file: {e}")  # Handle file errors

        # Send email with error handling
        try:
            mail.send(msg)
            print(f"Email sent successfully to {recipient}")
        except Exception as e:
            print(f"Error sending email: {e}")  # Handle mail errors 

    def send_email_with_qr(self, recipient, subject, body, qr_data):
        """Function to send an email with a QR code attachment."""
        msg = Message(
            subject=subject,
            recipients=[recipient],
            body=body,
            sender=mail.app.config['MAIL_DEFAULT_SENDER'],
        )

        # Generate QR code
        qr_img = qrcode.make(qr_data)
        img_io = BytesIO()
        qr_img.save(img_io, 'PNG')
        img_io.seek(0)

        # Attach QR code
        msg.attach(
            filename="qrcode.png",
            content_type="image/png",
            data=img_io.read()
        )

        # Send email with error handling
        try:
            mail.send(msg)
            print(f"Email with QR code sent successfully to {recipient}")
        except Exception as e:
            print(f"Error sending email with QR code: {e}") 