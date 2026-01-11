# views.py
from django.conf import settings
from django.utils.dateparse import parse_datetime
from datetime import datetime
from django.utils import timezone as dj_timezone  

from ai_model.pose_model import predict_prosthesis
from rest_framework.permissions import AllowAny
import torch
from django.db.models import Count
from datetime import timedelta
import logging
import firebase_admin
from firebase_admin import auth as firebase_auth
import pycountry
import cv2
from base64 import b64encode
from dateutil.relativedelta import relativedelta
from django.contrib.auth.hashers import make_password

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action,parser_classes, authentication_classes
from rest_framework.parsers import MultiPartParser, FormParser
import traceback
from rest_framework.views import APIView

from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import os

from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
import requests

from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    AppointmentSerializer,
    UserLinkSerializer,
    ThreadSerializer,
    MessageSerializer,
    CommunityUserSerializer,
    ThreadDetailSerializer,
    DashboardSummarySerializer,
    PatientSummarySerializer,
    PatientTrendSerializer,
    LinkSummarySerializer,
    ArticleSerializer
)
from .utils import send_welcome_email,send_password_reset_email
from .permissions import IsAdminRole
from .models import Appointment, UserLink, Thread, Message,Article
from ai_model.pose_model import predict_prosthesis
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password(request):
    username = request.data.get('username')
    if not username:
        return Response({'detail': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
        email = user.email

        if not email:
            return Response({'detail': 'User does not have an email registered.'}, status=status.HTTP_400_BAD_REQUEST)

        action_code_settings = firebase_auth.ActionCodeSettings(
            url='http://localhost:4200/auth/reset-password', 
            handle_code_in_app=True
        )

        link = firebase_auth.generate_password_reset_link(email, action_code_settings=action_code_settings)

        
        if '?' in link:
            link += f'&email={email}'
        else:
            link += f'?email={email}'

        send_password_reset_email(email, link)

        return Response({'detail': 'Password reset email sent. Check your inbox.'}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except firebase_auth.FirebaseError as e:
        print('Firebase error:', str(e))
        return Response({'detail': 'Failed to generate password reset link.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print('Unexpected error:', str(e))
        return Response({'detail': 'An error occurred while sending the password reset email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def sync_password(request):
    """
    Sync new password from Firebase to Django backend safely
    """
    id_token = request.data.get('idToken')
    new_password = request.data.get('newPassword')
    username = request.data.get('username')

    if not id_token or not new_password or not username:
        return Response({'detail': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token.get('email')

        if not email:
            return Response({'detail': 'Token missing email'}, status=status.HTTP_400_BAD_REQUEST)

        print("Syncing password for:", {"username": username, "email": email})

        users = User.objects.filter(username=username, email=email)
        print("Matched users count:", users.count())

        if not users.exists():
            return Response({'detail': 'User not found in Django'}, status=status.HTTP_404_NOT_FOUND)

        user = users.first()

        user.password = make_password(new_password)
        user.save()

        return Response({'detail': 'Password synced successfully'}, status=status.HTTP_200_OK)

    except firebase_auth.FirebaseError:
        return Response({'detail': 'Invalid Firebase token'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print('Error syncing password:', str(e))
        return Response({'detail': 'Failed to sync password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardViewSet(viewsets.GenericViewSet):
    """
    Provides summaries for patients, appointments, and links.
    All actions are exposed via @action(detail=False)
    Nothing executes at import time.
    """
    permission_classes = [IsAuthenticated]

    def _get_user_scope(self, user):
        """
        Returns patients and appointments querysets based on user role
        """
        now = dj_timezone.now()

        if user.role == "admin":
            patients = User.objects.filter(role="patient")
            appointments = Appointment.objects.all()
        elif user.role in ["doctor", "prothesist", "kinetherapist"]:
            patients = User.objects.filter(appointments_as_patient__doctor=user).distinct()
            appointments = Appointment.objects.filter(doctor=user)
        elif user.role == "patient":
            patients = User.objects.filter(id=user.id)
            appointments = Appointment.objects.filter(patient=user)
        else:
            patients = User.objects.none()
            appointments = Appointment.objects.none()

        return patients, appointments, now

    @action(detail=False, methods=['get'], url_path='links-summary')
    def links_summary(self, request):
        user = request.user

        sent_links = UserLink.objects.filter(from_user=user)
        received_links = UserLink.objects.filter(to_user=user)

        data = {
            "total_links_sent": sent_links.count(),
            "total_links_received": received_links.count(),
            "pending_sent": sent_links.filter(status="pending").count(),
            "accepted_sent": sent_links.filter(status="accepted").count(),
            "pending_received": received_links.filter(status="pending").count(),
            "accepted_received": received_links.filter(status="accepted").count(),
            "new_this_month_sent": sent_links.filter(
                created_at__month=dj_timezone.now().month
            ).count(),
            "new_this_month_received": received_links.filter(
                created_at__month=dj_timezone.now().month
            ).count()
        }

        return Response(data)

    @action(detail=False, methods=['get'], url_path='patients-summary')
    def patients_summary(self, request):
        user = request.user
        patients, _, _ = self._get_user_scope(user)

        month_str = request.query_params.get('month')
        if not month_str:
            return Response({"error": "Month parameter is required"}, status=400)
        try:
            year, month = map(int, month_str.split('-'))
            current_month = datetime(year, month, 1)
        except ValueError:
            return Response({"error": "Invalid month format. Use YYYY-MM"}, status=400)

        total_patients = patients.count()
        new_patients_this_month = patients.filter(
            date_joined__year=year,
            date_joined__month=month
        ).count()

        last_six_months_totals = []
        for i in range(5, -1, -1):
            dt = current_month - relativedelta(months=i)
            count = patients.filter(
                date_joined__year=dt.year,
                date_joined__month=dt.month
            ).count()
            last_six_months_totals.append(count)

        data = {
            "total_patients": total_patients,
            "new_patients_this_month": new_patients_this_month,
            "last_six_months_totals": last_six_months_totals,
        }

        return Response(data)

    @action(detail=False, methods=['get'], url_path='patient-nationality-map')
    def patient_nationality_map(self, request):
        user = request.user
        patients, _, _ = self._get_user_scope(user)

        nationality_map = {}
        for patient in patients:
            country = getattr(patient, "country", None) or "Unknown"
            if hasattr(country, "code"):
                country_code = country.code
            else:
                country_code = str(country)

            try:
                country_obj = pycountry.countries.get(alpha_2=country_code.upper())
                country_name = country_obj.name if country_obj else country_code
            except Exception:
                country_name = country_code

            nationality_map[str(country_name)] = nationality_map.get(str(country_name), 0) + 1

        return Response(nationality_map)

    @action(detail=False, methods=['get'], url_path='appointments-summary')
    def appointments_summary(self, request):
        """
        Returns appointment summary including pending, accepted, and rejected counts,
        grouped by period (week, month, year).
        """
        user = request.user
        _, appointments, now = self._get_user_scope(user)

        period = request.query_params.get('period', 'month')  
        data = []

        if period == 'week':
            start_date = now - timedelta(days=6)
            date_format = "%a"
        elif period == 'year':
            start_date = now - relativedelta(months=11)
            date_format = "%b"
        else:  
            start_date = now - relativedelta(weeks=3)
            date_format = "W%U"

        previous_total = 0
        cursor = start_date

        while cursor <= now:
            if period == 'year':
                period_start = datetime(cursor.year, cursor.month, 1, tzinfo=dj_timezone.utc)
                period_end = period_start + relativedelta(months=1)
                label = cursor.strftime(date_format)
                cursor += relativedelta(months=1)
            elif period == 'month':
                period_start = cursor
                period_end = cursor + timedelta(weeks=1)
                label = f"Week {cursor.strftime('%U')}"
                cursor += timedelta(weeks=1)
            else:  # week
                period_start = cursor
                period_end = cursor + timedelta(days=1)
                label = cursor.strftime(date_format)
                cursor += timedelta(days=1)

            total = appointments.filter(
                scheduled_date__gte=period_start,
                scheduled_date__lt=period_end
            ).count()
            pending = appointments.filter(
                scheduled_date__gte=period_start,
                scheduled_date__lt=period_end,
                status='pending'
            ).count()
            accepted = appointments.filter(
                scheduled_date__gte=period_start,
                scheduled_date__lt=period_end,
                status='accepted'
            ).count()
            rejected = appointments.filter(
                scheduled_date__gte=period_start,
                scheduled_date__lt=period_end,
                status='rejected'
            ).count()

            if previous_total == 0:
                growth = 0
            else:
                growth = round(((total - previous_total) / previous_total) * 100, 2)

            delta_up = total >= previous_total
            previous_total = total

            data.append({
                "date": label,
                "total": total,
                "pending": pending,
                "accepted": accepted,
                "rejected": rejected,
                "growth": growth,
                "deltaUp": delta_up,
            })

        return Response(data)
    

# =========================
# User APIs
# =========================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
     
        user = serializer.save()
        
        
        send_welcome_email(user.email, user.username)

        
        try:
            firebase_auth.create_user(
                email=user.email,
                password=serializer.validated_data['password'],  
                display_name=user.username
            )
            print("✅ Firebase user created successfully")
        except firebase_auth.AuthError as e:
            print(f"❌ Firebase user creation failed: {e}")


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', request.method == 'PATCH')
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data)




# =========================
# Token Login
# =========================

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Token endpoint with optional captcha verification.

    Behaviour:
    - In DEBUG: skip captcha verification (so local/dev logins won't break).
    - In production (DEBUG=False): if captcha_token provided, verify it; if it's "test_token" treat as valid.
      If provided and invalid -> 400.
    - This keeps login flexible for dev while allowing captcha enforcement in prod.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def post(self, request, *args, **kwargs):
        captcha_token = request.data.get('captcha_token')

        
        if settings.DEBUG:
            is_captcha_valid = True
        else:
           
            if captcha_token == "test_token":
                is_captcha_valid = True
            else:
                
                if captcha_token:
                    is_captcha_valid = self.verify_recaptcha(captcha_token)
                else:
                    
                    is_captcha_valid = True

        if not is_captcha_valid:
            return Response({'detail': 'Invalid CAPTCHA'}, status=status.HTTP_400_BAD_REQUEST)

        return super().post(request, *args, **kwargs)

    @staticmethod
    def verify_recaptcha(token):
        try:
            response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={'secret': settings.RECAPTCHA_SECRET_KEY, 'response': token},
                timeout=5
            )
            return response.json().get('success', False)
        except Exception:
            return False


# =========================
# Admin User Management
# =========================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminRole])
def list_users(request):
    users = User.objects.all()
    serializer = RegisterSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, IsAdminRole])
def delete_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# =========================
# Appointments
# =========================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_appointment(request):
    print("DEBUG incoming data:", request.data)  

    user = request.user
    if user.role != 'patient':
        return Response({'detail': 'Only patients can create appointments'}, status=403)

    serializer = AppointmentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    appointment = serializer.save(patient=user)

    
    if appointment.doctor:
        channel_layer = get_channel_layer()
        group_name = f"appointments_user_{appointment.doctor.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "appointment_event",
                "event": "new_appointment",
                "appointment": AppointmentSerializer(appointment).data,
            }
        )

    return Response(serializer.data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_appointment_attempt(request):
    doctor_id = request.data.get('doctor_id')
    patient_id = request.data.get('patient_id')

    if not doctor_id or not patient_id:
        return Response({'detail': 'Missing doctor_id or patient_id'}, status=status.HTTP_400_BAD_REQUEST)

    
    print(f"Debug: Patient {patient_id} attempted to book with Doctor {doctor_id}")

    return Response({'detail': 'Attempt logged'}, status=status.HTTP_200_OK)




@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_appointments(request):
    user = request.user
    if user.role in ['doctor', 'prothesist']:
        appointments = Appointment.objects.filter(doctor=user)
    elif user.role == 'patient':
        appointments = Appointment.objects.filter(patient=user)
    elif user.role == 'admin':
        appointments = Appointment.objects.all()
    else:
        appointments = Appointment.objects.none()

    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reschedule_appointment(request, pk):
    """
    Allows a doctor/prothesist/kine to propose a new appointment date.
    Patient must confirm or reject this reschedule.
    """  
    
    print("DEBUG reschedule payload:", request.data)

    user = request.user

   
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found'}, status=404)

    
    if user.role not in ['doctor', 'prothesist', 'kinetherapist']:
        return Response({'detail': 'Only medical staff can reschedule'}, status=403)

    if appointment.doctor != user:
        return Response({'detail': 'You are not assigned to this appointment'}, status=403)

    
    date = request.data.get('date')
    hour = request.data.get('hour')
    minute = request.data.get('minute')

    if date is None or hour is None or minute is None:
        return Response({'detail': 'date, hour, and minute are required'}, status=400)

    try:
       
        new_datetime = datetime.strptime(
            f"{date} {int(hour):02d}:{int(minute):02d}",
            "%Y-%m-%d %H:%M"
        )
        print("DEBUG raw new_datetime (naive):", new_datetime, "tzinfo:", new_datetime.tzinfo)

     
        new_datetime = dj_timezone.make_aware(new_datetime, dj_timezone.get_current_timezone())
        print("DEBUG aware new_datetime:", new_datetime, "tzinfo:", new_datetime.tzinfo)

    except Exception as e:
        return Response({'detail': f'Invalid date/time format: {e}'}, status=400)

    
    now = dj_timezone.now()
    print("DEBUG current timezone-aware now:", now, "tzinfo:", now.tzinfo)

    if new_datetime <= now:
        return Response({'detail': 'Cannot reschedule to past time'}, status=400)

    
    appointment.scheduled_date = new_datetime
    appointment.status = "reschedule_pending"  
    appointment.save()
    print(
        "DEBUG appointment saved:",
        appointment.id,
        "new scheduled_date:",
        appointment.scheduled_date,
        "status set to:",
        appointment.status,
    )

    serializer = AppointmentSerializer(appointment)
    return Response(
        {
            "detail": "Reschedule proposed. Awaiting patient confirmation.",
            "appointment": serializer.data,
        },
        status=200
    )
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def confirm_reschedule(request, pk):
    """
    Allows a patient to confirm or reject a doctor's reschedule proposal.
    """
    user = request.user

    
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found'}, status=404)

    
    if appointment.patient != user:
        return Response({'detail': 'Only the patient can confirm reschedules'}, status=403)

  
    if appointment.status != "reschedule_pending":
        return Response({'detail': 'No reschedule is pending for this appointment'}, status=400)

    
    decision = request.data.get("decision")  
    if decision not in ["accept", "reject"]:
        return Response({'detail': 'decision must be either "accept" or "reject"'}, status=400)

    if decision == "accept":
        appointment.status = "approved"   
        message = "Rescheduled appointment accepted"
    else:
        appointment.status = "rejected"   
        message = "Rescheduled appointment rejected"

    appointment.save()
    serializer = AppointmentSerializer(appointment)

    return Response(
        {
            "detail": message,
            "appointment": serializer.data,
        },
        status=200
    )



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, pk):
    """
    Accept or reject an appointment (doctor/prothesist/kine only).
    """
    user = request.user

    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

   
    if user.role not in ['doctor', 'prothesist', 'kinetherapist']:
        return Response({'detail': 'Only medical staff can update status'}, status=status.HTTP_403_FORBIDDEN)

    if appointment.doctor != user:
        return Response({'detail': 'You are not assigned to this appointment'}, status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get('status')
    if new_status not in ['accepted', 'rejected']:
        return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    appointment.status = new_status
    appointment.save()

    serializer = AppointmentSerializer(appointment)
    return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# UserLink / Community
# =========================
class UserLinkViewSet(viewsets.ModelViewSet):
    """
    Handles connection requests between users.
    Only allows visibility and actions for links related to current user.
    """
    queryset = UserLink.objects.all()
    serializer_class = UserLinkSerializer
    permission_classes = [IsAuthenticated]

    def _send_notification(self, user_id, event, link):
        """
        Send WebSocket notification to a specific user.
        Use a dedicated group name for userlink notifications.
        """
        try:
            channel_layer = get_channel_layer()
            group_name = f"userlink_user_{user_id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "userlink_event",
                    "event": event,
                    "link": UserLinkSerializer(link, context={'request': self.request}).data,
                }
            )
        except Exception:
            
            pass

    def get_queryset(self):
        user = self.request.user
        return UserLink.objects.filter(Q(from_user=user) | Q(to_user=user))

    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user, status='pending')

    @action(detail=False, methods=['GET'])
    def my_links(self, request):
        links = self.get_queryset()
        serializer = self.get_serializer(links, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['DELETE'])
    def remove_link(self, request, pk=None):
        user = request.user
        try:
            link = UserLink.objects.get(pk=pk)
            if link.from_user != user and link.to_user != user:
                return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
            link.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserLink.DoesNotExist:
            return Response({"detail": "Link not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['POST'])
    def accept(self, request, pk=None):
        user = request.user
        try:
            link = UserLink.objects.get(pk=pk)
            if link.to_user != user:
                return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
            link.status = 'accepted'
            link.save()
            self._send_notification(link.from_user.id, "request_accepted", link)

            serializer = self.get_serializer(link)
            return Response(serializer.data)
        except UserLink.DoesNotExist:
            return Response({"detail": "Link not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['POST'])
    def reject(self, request, pk=None):
        user = request.user
        try:
            link = UserLink.objects.get(pk=pk)
            if link.to_user != user:
                return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
            self._send_notification(link.from_user.id, "request_rejected", link)

            link.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserLink.DoesNotExist:
            return Response({"detail": "Link not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['POST'])
    def cancel(self, request, pk=None):
        user = request.user
        try:
            link = UserLink.objects.get(pk=pk)
            if link.from_user != user:
                return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
            if link.status != 'pending':
                return Response({"detail": "Only pending requests can be cancelled"}, status=status.HTTP_400_BAD_REQUEST)
            self._send_notification(link.to_user.id, "request_canceled", link)

            link.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserLink.DoesNotExist:
            return Response({"detail": "Link not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'])
    def community(self, request):
        current_user = request.user
        all_users = User.objects.exclude(id=current_user.id)
        serializer = CommunityUserSerializer(
            all_users,
            many=True,
            context={'request': request, 'current_user': current_user}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def notifications(self, request):
        """Return pending requests and accepted requests for the current user"""
        user = request.user

        
        pending_requests = UserLink.objects.filter(to_user=user, status='pending')

        
        accepted_requests = UserLink.objects.filter(from_user=user, status='accepted')

        notifications = []

       
        for link in pending_requests:
            serializer = UserLinkSerializer(link, context={'request': request})
            data = serializer.data
            data['type'] = 'request'
            data['from_user'] = {
                'id': link.from_user.id,
                'username': link.from_user.username,
                'profile_picture': serializer.data['from_user_profile_picture'],
            }
            data['created_at'] = link.created_at
            notifications.append(data)

        
        for link in accepted_requests:
            serializer = UserLinkSerializer(link, context={'request': request})
            data = serializer.data
            data['type'] = 'accepted'
            data['from_user'] = {
                'id': link.to_user.id,
                'username': link.to_user.username,
                'profile_picture': serializer.data['to_user_profile_picture'],
            }
            data['created_at'] = link.updated_at
            notifications.append(data)

        notifications.sort(key=lambda n: n['created_at'], reverse=True)
        return Response(notifications)


# =========================
# Threads & Messages
# =========================
class ThreadViewSet(viewsets.ModelViewSet):
    """
    Handles creating threads, listing threads, and marking messages as read.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Thread.objects.filter(participants=user).distinct()

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return ThreadDetailSerializer
        return ThreadSerializer

    def perform_create(self, serializer):
        thread = serializer.save()
        thread.participants.add(self.request.user)

    @action(detail=True, methods=['POST'])
    def mark_read(self, request, pk=None):
        """
        Mark all messages in the thread as read by the current user.
        """
        user = request.user
        thread = self.get_object()
        unread_messages = thread.messages.exclude(read_by=user)
        for msg in unread_messages:
            msg.read_by.add(user)  # use add() for ManyToManyField

        return Response({'detail': 'Messages marked as read'}, status=status.HTTP_200_OK)


class MessageViewSet(viewsets.ModelViewSet):
    """
    Handles creating and listing messages within threads.
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(thread__participants=user).distinct()

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        
        message.read_by.add(self.request.user)


class ThreadWithMessagesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides a read-only view of threads with all messages included.
    """
    serializer_class = ThreadDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Thread.objects.filter(participants=user).prefetch_related('messages').distinct()

    @action(detail=False, methods=['get', 'post'], url_path='get_or_create_with_user')
    def get_or_create_with_user(self, request):
        """
        Get existing thread with another user or create one if it doesn't exist.
        Supports:
          - GET ?user_id=<int>
          - POST { "user_id": <int> }
        """
        current_user = request.user

       
        user_id = request.query_params.get('user_id') if request.method == 'GET' else request.data.get('user_id')

        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        
        thread = Thread.objects.filter(participants=current_user)\
                               .filter(participants=other_user)\
                               .distinct()\
                               .first()

        if not thread:
           
            thread = Thread.objects.create()
            thread.participants.add(current_user, other_user)

        serializer = ThreadSerializer(thread, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK) 
    
logger = logging.getLogger(__name__)

try:
    from ai_model.pose_model import model
except ImportError:
    model = None
    logger.warning("[WARNING] YOLOv8 model not found.")


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@parser_classes([MultiPartParser, FormParser])
def check_prosthesis(request):
    tmp_path = None
    try:
        if 'image' not in request.FILES:
            logger.error("[ERROR] No image uploaded")
            return Response({"error": "No image uploaded"}, status=400)

        uploaded_file = request.FILES['image']
        valid_ext = ['.jpg', '.jpeg', '.png']
        _, ext = os.path.splitext(uploaded_file.name.lower())
        if ext not in valid_ext:
            logger.error(f"[ERROR] Invalid file type: {uploaded_file.name}")
            return Response({"error": "Invalid file type. Please upload JPG or PNG."}, status=400)

        upload_dir = os.path.join(settings.BASE_DIR, 'media', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        tmp_path = os.path.join(upload_dir, uploaded_file.name)
        with open(tmp_path, 'wb+') as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)

        logger.info(f"[INFO] Saved uploaded file to {tmp_path}")

        output_data = predict_prosthesis(tmp_path, save_image=False)

        annotated_img = cv2.imread(tmp_path)
        for detection in output_data:
            for person_kp in detection["keypoints"]:
                for kp in person_kp:
                    x, y = int(kp[0]), int(kp[1])
                    cv2.circle(annotated_img, (x, y), 5, (0, 255, 0), -1)

        prosthesis_good = any(
            len(person_kp) >= 16 and person_kp[15][1] > person_kp[13][1]  
            for detection in output_data
            for person_kp in detection["keypoints"]
        )
        classification = "good" if prosthesis_good else "bad"
        logger.info(f"[INFO] Classification: {classification}")

        # Convert annotated image to base64
        _, buffer = cv2.imencode('.jpg', annotated_img)
        img_b64 = b64encode(buffer).decode('utf-8')
        img_data_uri = f"data:image/jpeg;base64,{img_b64}"

        return Response({
            "classification": classification,
            "detections": output_data,
            "debug_message": f"Running model on {uploaded_file.name}",
            "annotated_image": img_data_uri
        }, status=200)

    except Exception as e:
        logger.error(f"[ERROR] Exception in check_prosthesis: {e}", exc_info=True)
        return Response({"error": str(e)}, status=500)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
            logger.debug(f"[DEBUG] Removed temporary file {tmp_path}")
            
            
            
            
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
            
            
