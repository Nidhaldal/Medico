from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

from django_countries.fields import CountryField
from phonenumber_field.modelfields import PhoneNumberField


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('prothesist', 'Prothesist'),
        ('kinetherapist', 'Kinetherapist'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    first_name = models.CharField(max_length=150)  
    last_name = models.CharField(max_length=150)    
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)  
    country = CountryField(blank_label='(select country)', null=True, blank=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    phone = PhoneNumberField(blank=True, null=True)

    def save(self, *args, **kwargs):
       
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('reschedule_pending', 'Reschedule Pending'),  

        
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments_as_patient',
        limit_choices_to={'role': 'patient'}
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='appointments_as_doctor',
        limit_choices_to={'role__in': ['doctor', 'prothesist']}
    )
    scheduled_date = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        doctor_name = self.doctor.username if self.doctor else "No doctor assigned"
        return f"Appointment #{self.id} - {self.patient.username} with {doctor_name} on {self.scheduled_date}"


class UserLink(models.Model):
    LINK_TYPES = (
        ('doctor_patient', 'Doctor ↔ Patient'),
        ('prothesist_patient', 'Prothesist ↔ Patient'),
        ('kinetherapist_patient', 'Kinetherapist ↔ Patient'),
        ('doctor_prothesist', 'Doctor ↔ Prothesist'),
        ('doctor_kinetherapist', 'Doctor ↔ Kinetherapist'),
        ('prothesist_kinetherapist', 'Prothesist ↔ Kinetherapist'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
    )

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='links_created',
        null=True,
        blank=True
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='links_received',
        null=True,
        blank=True
    )
    link_type = models.CharField(
        max_length=50,
        choices=LINK_TYPES,
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('from_user', 'to_user', 'link_type')

    def __str__(self):
        return f"{self.from_user.username} → {self.to_user.username} ({self.link_type}, {self.status})"


class Thread(models.Model):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_threads'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        names = ', '.join([user.username for user in self.participants.all()])
        return f"Thread ({names})"

class Article(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField()  
    cover_image = models.ImageField(upload_to='articles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    
    
class Message(models.Model):
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='read_messages',
        blank=True
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.text[:50]}"

    
    def mark_as_read(self, user):
        self.read_by.add(user)
        
        
        

