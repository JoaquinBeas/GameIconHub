# backend/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailService:
    def __init__(self):
        self.sender_email = "dumb.user.mailer@gmail.com"  # Google account generated with random phone number, not relationed with me. Idgaf if hacked.
        self.app_password = "fpfk rsmu lygr pwqz" 

    def send_contact_email(self, user_email: str, message: str):
        msg = MIMEMultipart()
        msg["From"] = self.sender_email
        msg["To"] = "iconhub.help@gmail.com"
        msg["Subject"] = "Nuevo mensaje de contacto desde GAME ICON HUB"

        body = f"User: {user_email}\nText: {message}"
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(self.sender_email, self.app_password)
            server.send_message(msg)
