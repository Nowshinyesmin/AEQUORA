from rest_framework import serializers
from django.db.models import Avg
from .models import (
    User, Resident, UserEmail, UserPhonenumber,
    Emergencyreport, Issuereport, Event, Service, Booking,  
    Community, Example, Eventparticipation, Issuevote, Issueassignment,
    Review, Authority, Notification, Serviceprovider, Payment
)

class CommunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = ['communityid', 'name']

class ExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Example
        fields = ['id', 'message']

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    phone_number = serializers.CharField()
    house_no = serializers.CharField(required=False, allow_blank=True)
    street = serializers.CharField(required=False, allow_blank=True)
    thana = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)

class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    community_name = serializers.CharField(source='communityid.name', read_only=True)
    email = serializers.SerializerMethodField()
    house_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    street = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    thana = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    district = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    twofactorcode = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'userid', 'firstname', 'lastname', 'email', 'role', 
            'date_of_birth', 'gender', 'communityid', 'community_name',
            'house_no', 'street', 'thana', 'district', 'emergency_contact',
            'twofactorcode'
        ]

    def get_email(self, obj):
        user_email_obj = obj.useremail_set.first()
        return user_email_obj.email if user_email_obj else None

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

    def update(self, instance, validated_data):
        instance.firstname = validated_data.get('firstname', instance.firstname)
        instance.lastname = validated_data.get('lastname', instance.lastname)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.gender = validated_data.get('gender', instance.gender)
        if 'twofactorcode' in validated_data:
            instance.twofactorcode = validated_data['twofactorcode']
        if 'communityid' in validated_data:
            instance.communityid = validated_data['communityid']
        instance.save()

        if hasattr(instance, 'resident'):
            resident = instance.resident
            if 'house_no' in validated_data: resident.house_no = validated_data['house_no']
            if 'street' in validated_data: resident.street = validated_data['street']
            if 'thana' in validated_data: resident.thana = validated_data['thana']
            if 'district' in validated_data: resident.district = validated_data['district']
            if 'emergency_contact' in validated_data: resident.emergency_contact = validated_data['emergency_contact']
            resident.save()
        return instance

class EmergencyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emergencyreport
        fields = ['sosid', 'emergencytype', 'description', 'location', 'photo', 'status', 'timestamp']
        read_only_fields = ['status', 'timestamp', 'photo']

class IssueReportSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    createdat = serializers.DateTimeField(read_only=True)
    class Meta:
        model = Issuereport
        fields = ['issueid', 'title', 'type', 'description', 'mapaddress', 'prioritylevel', 'status', 'createdat']

class EventSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()
    class Meta:
        model = Event
        fields = ['eventid', 'communityid', 'title', 'description', 'date', 'time', 'location', 'category', 'status', 'createdat', 'posted_by_name']
    
    def get_posted_by_name(self, obj):
        if obj.postedbyid: return f"{obj.postedbyid.firstname} {obj.postedbyid.lastname}"
        return "Unknown"

class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    class Meta:
        model = Service
        fields = ['serviceid', 'servicename', 'category', 'price', 'description', 'provider_name', 'availability']
    def get_provider_name(self, obj):
        if obj.providerid and obj.providerid.userid: return f"{obj.providerid.userid.firstname} {obj.providerid.userid.lastname}"
        return "Unknown Provider"

class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='serviceid.servicename', read_only=True)
    provider_name = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    bookingdate = serializers.DateField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = Booking
        fields = ['bookingid', 'serviceid', 'service_name', 'provider_name', 'bookingdate', 'servicedate', 'status', 'price']
    def get_provider_name(self, obj):
        if obj.providerid and obj.providerid.userid: return f"{obj.providerid.userid.firstname} {obj.providerid.userid.lastname}"
        return "Unknown"

class EventParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Eventparticipation
        fields = ['participationid', 'eventid', 'interesttype']

class AuthorityIssueSerializer(serializers.ModelSerializer):
    vote_count = serializers.IntegerField(read_only=True)
    upvotes = serializers.IntegerField(read_only=True)
    downvotes = serializers.IntegerField(read_only=True)
    assignedTo = serializers.SerializerMethodField()
    resident_name = serializers.SerializerMethodField()
    class Meta:
        model = Issuereport
        fields = ['issueid', 'title', 'type', 'description', 'mapaddress', 'prioritylevel', 'status', 'createdat', 'vote_count', 'upvotes', 'downvotes', 'assignedTo', 'resident_name']
    def get_resident_name(self, obj):
        if obj.residentid and obj.residentid.userid: return f"{obj.residentid.userid.firstname} {obj.residentid.userid.lastname}"
        return "Unknown"
    def get_assignedTo(self, obj):
        assignment = Issueassignment.objects.filter(issueid=obj).last()
        if assignment and assignment.authorityid: return assignment.authorityid.departmentname
        return "Unassigned"

class AuthorityEventSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()
    class Meta:
        model = Event
        fields = ['eventid', 'title', 'description', 'date', 'time', 'location', 'category', 'status', 'posted_by_name']
    def get_posted_by_name(self, obj):
        if obj.postedbyid: return f"{obj.postedbyid.firstname} {obj.postedbyid.lastname}"
        return "System"

class AuthoritySOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emergencyreport
        fields = '__all__'

class CommunityIssueSerializer(serializers.ModelSerializer):
    resident_name = serializers.SerializerMethodField()
    upvotes = serializers.SerializerMethodField()
    downvotes = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    class Meta:
        model = Issuereport
        fields = ['issueid', 'title', 'type', 'description', 'mapaddress', 'status', 'createdat', 'resident_name', 'upvotes', 'downvotes', 'user_vote']
    def get_resident_name(self, obj):
        if obj.residentid and obj.residentid.userid: return f"{obj.residentid.userid.firstname} {obj.residentid.userid.lastname}"
        return "Unknown"
    def get_upvotes(self, obj): return Issuevote.objects.filter(issueid=obj, votetype='up').count()
    def get_downvotes(self, obj): return Issuevote.objects.filter(issueid=obj, votetype='down').count()
    def get_user_vote(self, obj):
        user = self.context.get('request').user
        try:
            user_email = UserEmail.objects.get(email=user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            vote = Issuevote.objects.filter(issueid=obj, residentid=resident).first()
            return vote.votetype if vote else None
        except: return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['notificationid', 'message', 'type', 'link', 'isread', 'createdat']

class EventRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['title', 'description', 'date', 'time', 'location', 'category']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class AuthorityProfileSerializer(serializers.ModelSerializer):
    firstname = serializers.CharField(source='userid.firstname')
    lastname = serializers.CharField(source='userid.lastname')
    email = serializers.SerializerMethodField()
    
    communityid = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(), 
        source='userid.communityid', 
        required=False, 
        allow_null=True
    )

    departmentname = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Authority
        fields = [
            'authorityid', 'firstname', 'lastname', 'email', 
            'departmentname', 'designation', 'assignedarea',
            'houseno', 'street', 'thana', 'district',
            'communityid'
        ]

    def get_email(self, obj):
        user_email_obj = obj.userid.useremail_set.first()
        return user_email_obj.email if user_email_obj else None

    def update(self, instance, validated_data):
        user_data = validated_data.pop('userid', {})
        if user_data:
            user = instance.userid
            user.firstname = user_data.get('firstname', user.firstname)
            user.lastname = user_data.get('lastname', user.lastname)
            if 'communityid' in user_data:
                user.communityid = user_data['communityid']
            user.save()

        instance.departmentname = validated_data.get('departmentname', instance.departmentname)
        instance.designation = validated_data.get('designation', instance.designation)
        instance.assignedarea = validated_data.get('assignedarea', instance.assignedarea)
        instance.houseno = validated_data.get('houseno', instance.houseno)
        instance.street = validated_data.get('street', instance.street)
        instance.thana = validated_data.get('thana', instance.thana)
        instance.district = validated_data.get('district', instance.district)
        
        instance.save()
        return instance


class ProviderServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['serviceid', 'servicename', 'description', 'price', 'availability']


class ProviderBookingSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='residentid.userid.firstname', read_only=True)
    resident_lastname = serializers.CharField(source='residentid.userid.lastname', read_only=True)
    resident_address = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='serviceid.servicename', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['bookingid', 'resident_name', 'resident_lastname', 'resident_address', 'service_name', 'bookingdate', 'status', 'paymentstatus', 'price']

    def get_resident_address(self, obj):
        res = obj.residentid
        h_no = getattr(res, 'house_no', getattr(res, 'houseno', ''))
        parts = [h_no, res.street, res.thana, res.district]
        return ", ".join([p for p in parts if p]) if res else "N/A"

class ProviderProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='userid.firstname')
    last_name = serializers.CharField(source='userid.lastname')
    email = serializers.EmailField(source='userid.email', read_only=True)
    date_of_birth = serializers.DateField(source='userid.date_of_birth', required=False, allow_null=True)
    gender = serializers.CharField(source='userid.gender', required=False, allow_blank=True)
    
    community_id = serializers.PrimaryKeyRelatedField(
        source='userid.communityid', 
        queryset=Community.objects.all(),
        required=False, 
        allow_null=True
    )
    
    phone_number = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Serviceprovider
        fields = [
            'providerid', 'first_name', 'last_name', 'email', 'phone_number', 
            'date_of_birth', 'gender', 'community_id', 
            'subrole', 'availability_status', 'workinghours', 'service_area', 
            'certificationfile', 'rating'
        ]

    def get_phone_number(self, obj):
        try:
            return UserPhonenumber.objects.get(userid=obj.userid).phonenumber
        except UserPhonenumber.DoesNotExist:
            return ""

    def get_rating(self, obj):
        avg = Review.objects.filter(providerid=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

class ProviderReviewSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['reviewid', 'client_name', 'service_name', 'rating', 'description', 'createdat']

    def get_client_name(self, obj):
        try:
            return f"{obj.residentid.userid.firstname} {obj.residentid.userid.lastname}"
        except:
            return "Resident"

    def get_service_name(self, obj):
        try:
            if hasattr(obj, 'serviceid') and obj.serviceid:
                return obj.serviceid.servicename
            if hasattr(obj, 'bookingid') and obj.bookingid:
                return obj.bookingid.serviceid.servicename
        except:
            pass
        return "Service"