from django.core.mail import send_mail
from django.conf import settings
import logging

def send_custom_email(subject, message, recipient_list):
    try:
        send_mail(
            subject,
            message,
            'healthsync009@yourdomain.com',  
            recipient_list,
            fail_silently=False,
        )
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        return {"status": "failure", "message": str(e)}