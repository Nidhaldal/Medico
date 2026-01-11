from django.core.mail import send_mail
from django.conf import settings
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
from PIL import Image
import torch

def send_welcome_email(user_email, username):
    subject = "Welcome to Medico"
    message = f"""
Hello {username},

Welcome to Medico! Your account was successfully created using this email.

If this wasn't you, please click the link below to notify our team:
👉 test link

Thanks for trusting us!

– Medico Team
"""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        fail_silently=False
    )

def send_password_reset_email(user_email, reset_link):
    subject = "Reset your Medico password"
    message = f"""
Hello,

You requested a password reset for your Medico account.

Click the link below to reset your password:
👉 {reset_link}

If you didn't request this, please ignore this email.

Thanks,
– Medico Team
"""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        fail_silently=False
    )

model_name = "google/vit-base-patch16-224"
model = AutoModelForImageClassification.from_pretrained(model_name)
extractor = AutoFeatureExtractor.from_pretrained(model_name)

def predict_prosthesis(img_path):
    """
    Predict if the prosthesis in the image is well placed.
    Returns "good" or "bad".
    """
    img = Image.open(img_path).convert("RGB")
    inputs = extractor(images=img, return_tensors="pt")
    outputs = model(**inputs)
    pred = torch.argmax(outputs.logits, dim=1)
    return "good" if pred.item() == 1 else "bad"