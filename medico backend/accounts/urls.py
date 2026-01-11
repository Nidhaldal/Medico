from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    ProfileView,
    list_users,
    delete_user,
    CustomTokenObtainPairView,
    create_appointment,
    list_appointments,reset_password,sync_password,
    update_appointment_status,
    UserLinkViewSet,
    ThreadViewSet,
    MessageViewSet,
    ThreadWithMessagesViewSet,
    log_appointment_attempt,
    reschedule_appointment,
    confirm_reschedule,
    check_prosthesis,
    DashboardViewSet,ArticleViewSet  
)

router = DefaultRouter()
router.register(r'user-links', UserLinkViewSet, basename="user-links")
router.register(r'threads', ThreadViewSet, basename="threads")
router.register(r'messages', MessageViewSet, basename="messages")
router.register(r'threads-with-messages', ThreadWithMessagesViewSet, basename="threads-with-messages")
router.register(r'dashboard', DashboardViewSet, basename="dashboard")  
router.register(r'articles', ArticleViewSet, basename='articles') 


urlpatterns = [
    # User endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('all-users/', list_users, name='list_users'),
    path('user/<int:pk>/', delete_user, name='delete_user'),
    path('reset-password/', reset_password, name='reset_password'),
    path('sync-password/', sync_password, name='sync_password'),

    # Appointment endpoints
    path('appointments/', create_appointment, name='create_appointment'),
    path('appointments/list/', list_appointments, name='list_appointments'),
    path('appointments/<int:pk>/status/', update_appointment_status, name='update_appointment_status'),
    path('log-appointment-attempt/', log_appointment_attempt, name='log-appointment-attempt'),
    path('appointments/<int:pk>/reschedule/', reschedule_appointment, name='reschedule_appointment'),
    path('appointments/<int:pk>/confirm-reschedule/', confirm_reschedule, name='confirm_reschedule'),

    path('check-prosthesis/', check_prosthesis, name='check_prosthesis'),

    path('', include(router.urls)),
]
