from rest_framework import serializers
from django.contrib.auth import get_user_model , authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q

from .models import UserLink, Thread, Message, Appointment,Article

User = get_user_model()



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='patient')
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    country = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    token = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'password2', 'role',
            'first_name', 'last_name', 'profile_picture', 'country', 'city', 'phone', 'token',
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
        }

    def get_token(self, obj):
        refresh = RefreshToken.for_user(obj)
        refresh['username'] = obj.username
        refresh['email'] = obj.email
        refresh['first_name'] = obj.first_name
        refresh['last_name'] = obj.last_name
        refresh['role'] = obj.role
        refresh['phone'] = str(obj.phone) if obj.phone else ''
        refresh['country'] = str(obj.country) if obj.country else ''
        refresh['city'] = str(obj.city) if obj.city else ''
        refresh['profile_picture'] = obj.profile_picture.url if obj.profile_picture else ''
        return {'refresh': str(refresh), 'access': str(refresh.access_token)}

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'role', 'phone', 'country', 'city', 'profile_picture')
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'role': {'required': False},
            'country': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'profile_picture': {'required': False, 'allow_null': True},
        }

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            if attr == 'profile_picture' and value is None:
                continue
            setattr(instance, attr, value)
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError({'detail': 'Username and password are required.'})

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({'detail': 'Invalid username'})

        user_auth = authenticate(username=username, password=password)
        if not user_auth:
            raise serializers.ValidationError({'detail': 'Wrong password'})

        self.user = user_auth  
        data = super().validate(attrs) 

        request = self.context.get('request')
        data.update({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': getattr(user, 'role', ''),
            'phone': str(getattr(user, 'phone', '')),
            'country': str(getattr(user, 'country', '')),
            'city': str(getattr(user, 'city', '')),
            'is_staff': user.is_staff,
            'profile_picture': request.build_absolute_uri(user.profile_picture.url) if getattr(user, 'profile_picture', None) and request else (user.profile_picture.url if getattr(user, 'profile_picture', None) else ''),
        })

        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['role'] = user.role
        token['phone'] = str(user.phone) if user.phone else ''
        token['country'] = str(user.country) if user.country else ''
        token['city'] = str(user.city) if user.city else ''
        token['is_staff'] = user.is_staff
        token['profile_picture'] = user.profile_picture.url if user.profile_picture else ''
        return token

# ------------------------------
# Appointment Serializer
# ------------------------------

class AppointmentSerializer(serializers.ModelSerializer):
    patient_username = serializers.ReadOnlyField(source='patient.username')
    doctor_username = serializers.ReadOnlyField(source='doctor.username')
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['doctor', 'prothesist']),
        required=False, allow_null=True
    )

    class Meta:
        model = Appointment
        fields = (
            'id', 'patient', 'patient_username', 'doctor', 'doctor_username',
            'scheduled_date', 'reason', 'status', 'created_at'
        )
        read_only_fields = ('status', 'created_at', 'patient_username', 'doctor_username', 'patient')


# ------------------------------
# UserLink & Community Serializers
# ------------------------------

class UserLinkSerializer(serializers.ModelSerializer):
    from_user_username = serializers.ReadOnlyField(source='from_user.username')
    to_user_username = serializers.ReadOnlyField(source='to_user.username')
    from_user_profile_picture = serializers.SerializerMethodField()
    from_user_role = serializers.ReadOnlyField(source='from_user.role')   
    to_user_role = serializers.ReadOnlyField(source='to_user.role') 
    to_user_profile_picture = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)

    class Meta:
        model = UserLink
        fields = (
            'id', 'from_user', 'from_user_username', 'from_user_role', 'from_user_profile_picture',
            'to_user', 'to_user_username', 'to_user_role', 'to_user_profile_picture',
            'link_type', 'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'from_user_username', 'to_user_username',
                            'from_user_role', 'to_user_role',
                            'from_user_profile_picture', 'to_user_profile_picture', 'status')

    def get_from_user_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.from_user.profile_picture:
            return request.build_absolute_uri(obj.from_user.profile_picture.url) if request else obj.from_user.profile_picture.url
        return ''

    def get_to_user_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.to_user.profile_picture:
            return request.build_absolute_uri(obj.to_user.profile_picture.url) if request else obj.to_user.profile_picture.url
        return ''


class CommunityUserSerializer(serializers.ModelSerializer):
    connection_status = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'profile_picture', 'connection_status')

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
        return ''

    def get_connection_status(self, obj):
        current_user = self.context.get('current_user')
        if not current_user:
            return 'none'
        link = UserLink.objects.filter(
            (Q(from_user=current_user) & Q(to_user=obj)) |
            (Q(from_user=obj) & Q(to_user=current_user))
        ).first()
        return link.status if link else 'none'


# ------------------------------
# Thread & Message Serializers
# ------------------------------

class UserMinimalSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'profile_picture')

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
        return ''


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    read_by = UserMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'thread', 'sender_id', 'sender_username', 'text', 'created_at', 'read_by')
        read_only_fields = ('created_at', 'sender_id', 'sender_username', 'read_by')



class ThreadSerializer(serializers.ModelSerializer):
    participants = UserMinimalSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ('id', 'participants', 'created_at', 'last_message', 'unread_count')

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.exclude(read_by=user).count()


class ThreadDetailSerializer(serializers.ModelSerializer):
    participants = UserMinimalSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ('id', 'participants', 'created_at', 'messages', 'unread_count')

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.exclude(read_by=user).count()
class GetOrCreateThreadSerializer(serializers.ModelSerializer):
    participants = UserMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = Thread
        fields = ('id', 'participants', 'created_at')
        


class PatientSummarySerializer(serializers.Serializer):
    totalPatients = serializers.IntegerField()       
    newThisMonth = serializers.IntegerField()       


# ------------------------------
# Link Summary (for small cards, optional)
# ------------------------------
class LinkSummarySerializer(serializers.Serializer):
    totalLinks = serializers.IntegerField()          


# ------------------------------
# Full Dashboard Summary
# ------------------------------
class DashboardSummarySerializer(serializers.Serializer):
    total_patients = serializers.IntegerField()
    new_patients_this_month = serializers.IntegerField()
    total_appointments = serializers.IntegerField()
    upcoming_appointments = serializers.IntegerField()
    appointments_by_status = serializers.DictField(child=serializers.IntegerField())
    patients_by_country = serializers.DictField(child=serializers.IntegerField())
    patients_by_city = serializers.DictField(child=serializers.IntegerField())
    next_appointment = serializers.DateTimeField(allow_null=True)


# ------------------------------
# Monthly patient trend (for chart)
# ------------------------------
class PatientTrendSerializer(serializers.Serializer):
    month = serializers.CharField()                  
    totalPatients = serializers.IntegerField()       


# ------------------------------
# Example: links by type (optional for charts/cards)
# ------------------------------
class LinksByTypeSerializer(serializers.Serializer):
    linkType = serializers.CharField()              
    total = serializers.IntegerField()





class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'cover_image', 'author', 'author_name', 'created_at']