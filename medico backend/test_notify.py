# test_notify.py
import os
import django
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

# Step 1: configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()  # must call this before importing models

# Step 2: import your models and consumers
from accounts.models import Appointment
from accounts.consumers import notify_appointment
from accounts.serializers import AppointmentSerializer

# Step 3: get a test appointment (or create one)
appointment = Appointment.objects.first()  # pick the first one for testing
if not appointment:
    print("❌ No appointments found. Please create one first.")
    exit()

# Step 4: serialize and notify
data = AppointmentSerializer(appointment).data
user_id = appointment.patient.id  # real patient ID

# Send a fake "appointment_updated" event
notify_appointment(user_id, "appointment_updated", data)

print(f"✅ Notification sent to user {user_id}:")
print(json.dumps(data, indent=2))
