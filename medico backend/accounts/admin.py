from django.contrib import admin
from .models import User, Appointment

# -----------------------------
# User Admin
# -----------------------------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'country')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)


# -----------------------------
# Appointment Admin
# -----------------------------
@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'scheduled_date', 'status')
    list_filter = ('status', 'doctor', 'scheduled_date')
    search_fields = ('patient__username', 'doctor__username')
    actions = ['approve_appointments', 'reject_appointments']

    # Custom action to approve selected appointments
    def approve_appointments(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f"{updated} appointment(s) approved.")
    approve_appointments.short_description = "Approve selected appointments"

    # Custom action to reject selected appointments
    def reject_appointments(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f"{updated} appointment(s) rejected.")
    reject_appointments.short_description = "Reject selected appointments"
