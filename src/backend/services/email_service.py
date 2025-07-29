# backend/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailService:
    def __init__(self):
        self.sender_email = "iconhub.help@gmail.com" #TODO: ESCONDER ESTO
        self.app_password = "lzll rmgo refp jumq" #TODO: ESCONDER ESTO

    def send_contact_email(self, user_email: str, message: str):
        msg = MIMEMultipart()
        msg["From"] = self.sender_email
        msg["To"] = self.sender_email
        msg["Subject"] = "Nuevo mensaje de contacto desde GAME ICON HUB"

        body = f"User: {user_email}\nText: {message}"
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(self.sender_email, self.app_password)
            server.send_message(msg)
