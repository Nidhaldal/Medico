from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Appointment
from .serializers import AppointmentSerializer
from .consumers import notify_appointment


@receiver(post_save, sender=Appointment)
def appointment_created_or_updated(sender, instance, created, **kwargs):
    data = AppointmentSerializer(instance).data
    event_type = "appointment_created" if created else "appointment_updated"

    if instance.patient:
        notify_appointment(instance.patient.id, event_type, data, target="patient")

    if instance.doctor:
        notify_appointment(instance.doctor.id, event_type, data, target="doctor")


@receiver(post_delete, sender=Appointment)
def appointment_deleted(sender, instance, **kwargs):
    data = AppointmentSerializer(instance).data

    if instance.patient:
        notify_appointment(instance.patient.id, "appointment_deleted", data, target="patient")

    if instance.doctor:
        notify_appointment(instance.doctor.id, "appointment_deleted", data, target="doctor")
