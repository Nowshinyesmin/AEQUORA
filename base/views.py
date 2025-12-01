from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User as DjangoAuthUser
from django.utils import timezone
from django.contrib.auth import authenticate
from .models import Payment

from .models import (
    User as AppUser,
    Resident,
    UserEmail,
    UserPhonenumber,
    Loginlog,
    Emergencyreport,
    Issuereport,
    Event,
    Service,
    Booking,
    Community
)

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    EmergencyReportSerializer,
    IssueReportSerializer,
    EventSerializer,
    ServiceSerializer,
    BookingSerializer
)

# --- AUTHENTICATION VIEWS (Public Access) ---

class CustomLoginView(APIView):
    # ALLOW ANYONE to access login
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not raw_email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1) Try authenticate assuming username == email
        user = authenticate(request, username=raw_email, password=password)

        # 2) If that fails, try to find by email column
        if user is None:
            auth_user = DjangoAuthUser.objects.filter(email__iexact=raw_email).first()
            if auth_user:
                user = authenticate(request, username=auth_user.username, password=password)

        # 3) Still no user -> invalid
        if user is None:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)

        # 4) Get/Create token
        token, _ = Token.objects.get_or_create(user=user)

        # 5) Map to AppUser
        app_user = None
        user_email = UserEmail.objects.select_related("userid").filter(email__iexact=raw_email).first()
        if user_email:
            app_user = user_email.userid

        # 6) Log login
        if app_user:
            Loginlog.objects.create(
                userid=app_user,
                user_role=app_user.role,
                logintime=timezone.now(),
            )

        return Response({
            "auth_token": token.key,
            "username": user.username,
            "email": user.email,
            "app_user_id": getattr(app_user, "userid", None),
            "role": getattr(app_user, "role", None),
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    # ALLOW ANYONE to register
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data["email"]

        # Check duplicate
        existing_auth = DjangoAuthUser.objects.filter(username__iexact=email).exists() or \
                        DjangoAuthUser.objects.filter(email__iexact=email).exists()
        if existing_auth:
            return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create Django Auth User
        auth_user = DjangoAuthUser.objects.create_user(username=email, email=email, password=data["password"])

        # Create AppUser
        app_user = AppUser.objects.create(
            firstname=data["first_name"],
            lastname=data["last_name"],
            role=data["role"],
            status="Active",
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
        )

        UserEmail.objects.create(userid=app_user, email=email)

        phone_number = data.get("phone_number")
        if phone_number:
            UserPhonenumber.objects.create(userid=app_user, phonenumber=phone_number)

        if data["role"] == "Resident":
            Resident.objects.create(
                userid=app_user,
                house_no=data.get("house_no", ""),
                street=data.get("street", ""),
                thana=data.get("thana", ""),
                district=data.get("district", ""),
                emergency_contact=data.get("phone_number", ""),
            )

        return Response({"message": "Account created successfully!"}, status=status.HTTP_201_CREATED)


# --- RESIDENT FEATURE VIEWS (Authenticated Access) ---

# 1. User Profile View (DEBUG VERSION)
# In base/views.py

# In base/views.py

class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_app_user(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            return user_email.userid
        except UserEmail.DoesNotExist:
            return None

    def get(self, request):
        app_user = self.get_app_user(request)
        if not app_user:
            return Response({"error": "User profile not found"}, status=404)
        
        serializer = UserProfileSerializer(app_user)
        return Response(serializer.data)

    def put(self, request):
        print("\n--- DEBUG: PROFILE UPDATE DATA ---")
        print(request.data)

        app_user = self.get_app_user(request)
        if not app_user:
            return Response({"error": "User profile not found"}, status=404)

        # Create a copy of the data so we can edit it
        data = request.data.copy()

        # --- FIX 1: Remove empty Community ID ---
        if 'communityid' in data and data['communityid'] == "":
            print("--- DEBUG: Removing empty community ID ---")
            del data['communityid']
            
        # --- FIX 2: Remove empty Date of Birth ---
        # If the date is empty string "", remove it so we don't crash the serializer
        if 'date_of_birth' in data and data['date_of_birth'] == "":
            print("--- DEBUG: Removing empty Date of Birth ---")
            del data['date_of_birth']

        serializer = UserProfileSerializer(app_user, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            print("--- DEBUG: PROFILE SAVED SUCCESSFULLY ---")
            return Response(serializer.data)
        
        print("\n--- DEBUG ERROR: PROFILE UPDATE FAILED ---")
        print(serializer.errors)
        print("----------------------------------------\n")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# 2. Emergency SOS View
# In base/views.py

from django.core.files.storage import default_storage # <--- Add this import at the top!

# In base/views.py
# 3. Emergency SOS View

class EmergencySOSView(generics.CreateAPIView):
    serializer_class = EmergencyReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    # --- FIX 1: Allow backend to read Files/Images ---
    parser_classes = [MultiPartParser, FormParser]

    # --- FIX 2: Debug Printing to see the exact error ---
    def create(self, request, *args, **kwargs):
        print("\n--- DEBUG: INCOMING SOS DATA ---")
        print(request.data)
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("\n--- DEBUG ERROR: VALIDATION FAILED ---")
            print(serializer.errors) 
            print("--------------------------------------\n")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user_email = UserEmail.objects.get(email=self.request.user.email)
        app_user = user_email.userid
        
        try:
            resident = Resident.objects.get(userid=app_user)
            community = app_user.communityid 
            if not community:
                raise serializers.ValidationError("You are not assigned to a community.")
            
            # --- Handle Photo Upload ---
            photo_path = None
            if 'photo' in self.request.FILES:
                image = self.request.FILES['photo']
                print(f"--- DEBUG: Saving Photo {image.name} ---")
                # Save file to 'media/sos_evidence/' folder
                file_name = default_storage.save(f"sos_evidence/{image.name}", image)
                # Generate the URL/Path string to save in DB
                photo_path = default_storage.url(file_name)
            # ---------------------------

            serializer.save(
                residentid=resident,
                communityid=community,
                photo=photo_path,
                status="Pending"
            )
            print("--- DEBUG: SOS Saved Successfully ---")

        except Resident.DoesNotExist:
            raise serializers.ValidationError("User is not a registered resident.")
        except Exception as e:
            print(f"--- DEBUG CRITICAL ERROR: {str(e)} ---")
            raise serializers.ValidationError(str(e))
# 3. Issue Reports View
class IssueReportView(generics.ListCreateAPIView):
    serializer_class = IssueReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_app_user(self):
        return UserEmail.objects.get(email=self.request.user.email).userid

    def get_queryset(self):
        app_user = self.get_app_user()
        try:
            resident = Resident.objects.get(userid=app_user)
            return Issuereport.objects.filter(residentid=resident).order_by('-createdat')
        except Resident.DoesNotExist:
            return Issuereport.objects.none()

    def perform_create(self, serializer):
        app_user = self.get_app_user()
        try:
            resident = Resident.objects.get(userid=app_user)
            community = app_user.communityid
            serializer.save(
                residentid=resident,
                communityid=community,
                status="Pending"
            )
        except Resident.DoesNotExist:
            raise serializers.ValidationError("User is not a resident.")


# 4. Events List View
class EventListView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            user_email = UserEmail.objects.get(email=self.request.user.email)
            app_user = user_email.userid
            community = app_user.communityid
            if community:
                return Event.objects.filter(communityid=community).order_by('-date')
            return Event.objects.none()
        except Exception:
            return Event.objects.none()


# 5. Service List View
class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            user_email = UserEmail.objects.get(email=self.request.user.email)
            app_user = user_email.userid
            community = app_user.communityid
            if community:
                # Return ALL services in community (Frontend will disable button if availability=False)
                return Service.objects.filter(communityid=community)
            return Service.objects.none()
        except Exception:
            return Service.objects.none()

# In base/views.py --- Replace the BookingView class

# In base/views.py

# In base/views.py

# In base/views.py

class BookingView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_app_user(self):
        return UserEmail.objects.get(email=self.request.user.email).userid

    def get_queryset(self):
        app_user = self.get_app_user()
        try:
            resident = Resident.objects.get(userid=app_user)
            return Booking.objects.filter(residentid=resident).order_by('-bookingdate')
        except Resident.DoesNotExist:
            return Booking.objects.none()

    # Override create to handle 400 validation errors cleanly
    def create(self, request, *args, **kwargs):
        print("\n--- DEBUG: INCOMING BOOKING DATA ---")
        print(request.data)
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("\n--- DEBUG ERROR: VALIDATION FAILED ---")
            print(serializer.errors)
            print("--------------------------------------\n")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        app_user = self.get_app_user()
        try:
            resident = Resident.objects.get(userid=app_user)
            community = app_user.communityid
            
            if not community:
                raise serializers.ValidationError("You must join a community before booking.")

            service_id = self.request.data.get('serviceid')
            payment_method = self.request.data.get('payment_method')

            # 1. Fetch the Service
            service = Service.objects.get(pk=service_id)
            
            # --- NEW FEATURE: CHECK & DECREASE AVAILABILITY ---
            
            # Check if service is available (True or > 0)
            if not service.availability: 
                print(f"--- DEBUG ERROR: Service {service.servicename} is unavailable ---")
                raise serializers.ValidationError("This service is currently unavailable/fully booked.")

            # Decrease Availability by 1
            # If it's Boolean: True (1) becomes False (0).
            # If you change your model to IntegerField later, 5 becomes 4.
            if service.availability:
                # We interpret the current value as an integer to subtract
                current_val = int(service.availability)
                if current_val > 0:
                    service.availability = current_val - 1
                    service.save() # Save the new availability to DB
                    print(f"--- DEBUG: Service availability decreased to {service.availability} ---")
            
            # --------------------------------------------------

            # 2. Save Booking
            booking_instance = serializer.save(
                residentid=resident,
                providerid=service.providerid,
                communityid=community,
                status="Pending",
                price=service.price,
                paymentstatus="Pending",
                bookingdate=timezone.now().date()
            )
            print(f"--- DEBUG: Booking Saved ID {booking_instance.bookingid} ---")

            # 3. Create Payment
            Payment.objects.create(
                bookingid=booking_instance,
                amount=service.price,
                method=payment_method,
                status="Pending"
            )

        except Resident.DoesNotExist:
            raise serializers.ValidationError("User is not a resident.")
        except Service.DoesNotExist:
            raise serializers.ValidationError("Service not found.")
        
# 1. Update Imports at the top to include CommunitySerializer
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    EmergencyReportSerializer,
    IssueReportSerializer,
    EventSerializer,
    ServiceSerializer,
    BookingSerializer,
    CommunitySerializer  # <--- Add this
)

# ... existing views ...

# 2. Add this new View Class at the bottom
class CommunityListView(generics.ListAPIView):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated] # Only logged-in users can see this
    # In base/views.py

from .serializers import EventParticipationSerializer # <--- Ensure this is imported
from .models import Eventparticipation # <--- Ensure this is imported

class EventParticipationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Fetch all events this resident has participated in"""
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            
            # Get all participation records for this resident
            participations = Eventparticipation.objects.filter(residentid=resident)
            serializer = EventParticipationSerializer(participations, many=True)
            return Response(serializer.data)
        except Exception:
            return Response([], status=200)

    def post(self, request):
        """Update participation status"""
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            
            event_id = request.data.get('eventid')
            action = request.data.get('action') # 'participate' or 'ignore'
            
            # Database limitation: interesttype is max 10 chars.
            # We map 'participate' -> 'Going'
            # We map 'ignore' -> 'Ignored'
            db_value = 'Going' if action == 'participate' else 'Ignored'
            
            event = Event.objects.get(pk=event_id)
            
            # Update existing record OR Create new one
            Eventparticipation.objects.update_or_create(
                eventid=event,
                residentid=resident,
                defaults={'interesttype': db_value}
            )
            
            return Response({'message': 'Success', 'status': db_value})
            
        except Exception as e:
            print("Error in EventParticipation:", e)
            return Response({'error': str(e)}, status=400)
        
        # In base/views.py

class ResidentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)

            # --- 1. Calculate Stats ---
            total_issues = Issuereport.objects.filter(residentid=resident).count()
            total_bookings = Booking.objects.filter(residentid=resident).count()
            # Only count events where the user is 'Going'
            total_events = Eventparticipation.objects.filter(residentid=resident, interesttype='Going').count()

            # --- 2. Gather Recent Activities ---
            activities = []

            # A. Fetch recent Issues (limit 5)
            issues = Issuereport.objects.filter(residentid=resident).order_by('-createdat')[:5]
            for i in issues:
                activities.append({
                    'id': f"issue_{i.issueid}",
                    'type': 'Issue',
                    'title': i.title,
                    'status': i.status,
                    'date': i.createdat, # DateTime
                    'description': f"Reported: {i.type}"
                })

            # B. Fetch recent Bookings (limit 5)
            bookings = Booking.objects.filter(residentid=resident).order_by('-createdat')[:5]
            for b in bookings:
                activities.append({
                    'id': f"booking_{b.bookingid}",
                    'type': 'Booking',
                    'title': b.serviceid.servicename,
                    'status': b.status,
                    'date': b.createdat, # DateTime
                    'description': f"Service Date: {b.servicedate}"
                })

            # C. Fetch recent Events Joined (limit 5)
            # Note: Participation doesn't have a timestamp, so we use the Event date
            events = Eventparticipation.objects.filter(residentid=resident, interesttype='Going').select_related('eventid')[:5]
            for e in events:
                activities.append({
                    'id': f"event_{e.participationid}",
                    'type': 'Event',
                    'title': e.eventid.title,
                    'status': 'Going',
                    # Using event date as the reference time since participation has no timestamp
                    'date': str(e.eventid.date), 
                    'description': f"Event on {e.eventid.date}"
                })

            # --- 3. Sort Combined Activities by Date (Newest First) ---
            # We handle string vs datetime comparison safely
            activities.sort(key=lambda x: str(x['date']), reverse=True)

            return Response({
                "stats": {
                    "issues": total_issues,
                    "bookings": total_bookings,
                    "events": total_events
                },
                "activities": activities[:10] # Return top 10 mixed activities
            })

        except Resident.DoesNotExist:
            return Response({"error": "Resident not found"}, status=404)
        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=400)