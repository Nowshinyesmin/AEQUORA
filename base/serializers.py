from rest_framework import serializers
from .models import (
    User, Resident, UserEmail, UserPhonenumber,
    Emergencyreport, Issuereport, Event, Service, Booking,  
    Community, Example, Eventparticipation,Issuevote, Issueassignment,
    Review, Authority
)
# In base/serializers.py

class CommunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = ['communityid', 'name']

# --- Existing Example Serializer ---
class ExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Example
        fields = ['id', 'message']

# --- Registration Serializer ---
class RegisterSerializer(serializers.Serializer):
    # User Login Fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    # Profile Fields
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    phone_number = serializers.CharField()
    
    # Address Fields (For Residents)
    house_no = serializers.CharField(required=False, allow_blank=True)
    street = serializers.CharField(required=False, allow_blank=True)
    thana = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)

# --- 1. User Profile & Sidebar Serializer ---
# In base/serializers.py

# In base/serializers.py

class UserProfileSerializer(serializers.ModelSerializer):
    """Used for Sidebar and Profile Settings"""
    role = serializers.CharField(read_only=True)
    community_name = serializers.CharField(source='communityid.name', read_only=True)
    email = serializers.SerializerMethodField()

    # Simple optional fields for Resident data
    house_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    street = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    thana = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    district = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # --- ADDED BACK: 2FA Code ---
    twofactorcode = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'userid', 'firstname', 'lastname', 'email', 'role', 
            'date_of_birth', 'gender', 'communityid', 'community_name',
            'house_no', 'street', 'thana', 'district', 'emergency_contact',
            'twofactorcode' # <--- Added here
        ]

    def get_email(self, obj):
        user_email_obj = obj.useremail_set.first()
        return user_email_obj.email if user_email_obj else None

    # READING
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if hasattr(instance, 'resident'):
            res = instance.resident
            data['house_no'] = res.house_no
            data['street'] = res.street
            data['thana'] = res.thana
            data['district'] = res.district
            data['emergency_contact'] = res.emergency_contact
        return data

    # WRITING
    def update(self, instance, validated_data):
        # A. Update USER Table fields
        instance.firstname = validated_data.get('firstname', instance.firstname)
        instance.lastname = validated_data.get('lastname', instance.lastname)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.gender = validated_data.get('gender', instance.gender)
        
        # --- Update 2FA Code ---
        if 'twofactorcode' in validated_data:
            instance.twofactorcode = validated_data['twofactorcode']
        
        # Handle Community Update
        if 'communityid' in validated_data:
            instance.communityid = validated_data['communityid']
            
        instance.save()

        # B. Update RESIDENT Table fields
        if hasattr(instance, 'resident'):
            resident = instance.resident
            if 'house_no' in validated_data: resident.house_no = validated_data['house_no']
            if 'street' in validated_data: resident.street = validated_data['street']
            if 'thana' in validated_data: resident.thana = validated_data['thana']
            if 'district' in validated_data: resident.district = validated_data['district']
            if 'emergency_contact' in validated_data: resident.emergency_contact = validated_data['emergency_contact']
            
            resident.save()
            
        return instance

# --- 2. Emergency SOS Serializer ---
# In base/serializers.py

class EmergencyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emergencyreport
        # Add 'photo' to fields
        fields = ['sosid', 'emergencytype', 'description', 'location', 'photo', 'status', 'timestamp']
        # We handle the photo file manually in the view, so keep it read_only here to avoid validation errors
        read_only_fields = ['status', 'timestamp', 'photo']
        
# --- 3. Issue Report Serializer ---
class IssueReportSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    createdat = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Issuereport
        fields = [
            'issueid', 'title', 'type', 'description', 
            'mapaddress', 'prioritylevel', 'status', 'createdat'
        ]

# --- 4. Event Serializer ---
class EventSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'eventid', 'title', 'description', 'date', 'time', 
            'location', 'category', 'posted_by_name'
        ]

    def get_posted_by_name(self, obj):
        if obj.postedbyid:
            return f"{obj.postedbyid.firstname} {obj.postedbyid.lastname}"
        return "Unknown"

# --- 5. Service Serializer ---
class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'serviceid', 'servicename', 'category', 'price', 
            'description', 'provider_name', 'availability'
        ]

    def get_provider_name(self, obj):
        if obj.providerid and obj.providerid.userid:
            return f"{obj.providerid.userid.firstname} {obj.providerid.userid.lastname}"
        return "Unknown Provider"

# In base/serializers.py

# In base/serializers.py

class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='serviceid.servicename', read_only=True)
    provider_name = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    
    # Read-only fields so validation doesn't block us
    bookingdate = serializers.DateField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    # --- FIX: REMOVED payment_method FROM HERE ---
    # We handle payment_method manually in the View, so we don't define it here.

    class Meta:
        model = Booking
        fields = [
            'bookingid', 'serviceid', 'service_name', 'provider_name',
            'bookingdate', 'servicedate', 'status', 'price'
            # --- FIX: REMOVED payment_method FROM HERE TOO ---
        ]

    def get_provider_name(self, obj):
        if obj.providerid and obj.providerid.userid:
            return f"{obj.providerid.userid.firstname} {obj.providerid.userid.lastname}"
        return "Unknown"
    # In base/serializers.py

class EventParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Eventparticipation  # Ensure this matches the import name from models
        fields = ['participationid', 'eventid', 'interesttype']


# Authority Feature Serializers (Sayeda Nusrat)

class AuthorityIssueSerializer(serializers.ModelSerializer):
    """
    Extends Issue data with vote counts and assignment details
    required by ManageIssues.jsx and CommunityVoting.jsx
    """
    vote_count = serializers.IntegerField(read_only=True)
    assignedTo = serializers.SerializerMethodField()
    resident_name = serializers.SerializerMethodField()

    class Meta:
        model = Issuereport
        fields = [
            'issueid', 'title', 'type', 'description', 
            'mapaddress', 'prioritylevel', 'status', 'createdat', 
            'vote_count', 'assignedTo', 'resident_name'
        ]

    def get_resident_name(self, obj):
        if obj.residentid and obj.residentid.userid:
            return f"{obj.residentid.userid.firstname} {obj.residentid.userid.lastname}"
        return "Unknown"

    def get_assignedTo(self, obj):
        # Fetch the department name from the IssueAssignment table
        assignment = Issueassignment.objects.filter(issueid=obj).last()
        if assignment and assignment.authorityid:
            return assignment.authorityid.departmentname
        return "Unassigned"

class AuthorityEventSerializer(serializers.ModelSerializer):
    """
    Handles Event creation and listing for Authority
    """
    posted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'eventid', 'title', 'description', 'date', 'time', 
            'location', 'category', 'status', 'posted_by_name'
        ]

    def get_posted_by_name(self, obj):
        if obj.postedbyid:
            return f"{obj.postedbyid.firstname} {obj.postedbyid.lastname}"
        return "System"

class AuthoritySOSSerializer(serializers.ModelSerializer):
    """
    For AuthorityEmergency.jsx
    """
    class Meta:
        model = Emergencyreport
        fields = '__all__'