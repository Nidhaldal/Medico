from django.db import migrations

def remove_dr_prefix(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    doctors = User.objects.filter(role='doctor', username__startswith='Dr ')
    for doctor in doctors:
        doctor.username = doctor.username[3:]  # strip "Dr "
        doctor.save(update_fields=['username'])

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_remove_message_is_read_message_read_by'),  # replace with your last migration
    ]

    operations = [
        migrations.RunPython(remove_dr_prefix),
    ]
