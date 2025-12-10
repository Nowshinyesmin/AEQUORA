from rest_framework.views import APIView
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User as DjangoAuthUser
from django.utils import timezone
from django.contrib.auth import authenticate
from django.core.files.storage import default_storage
from django.shortcuts import redirect
from django.db.models import Count, Avg, F, Q
import datetime
import requests
import json
import uuid

from .models import (
    User as AppUser, Resident, UserEmail, UserPhonenumber, Loginlog,
    Authority, Serviceprovider, Emergencyreport, Issuereport, Event,
    Eventparticipation, Service, Booking, Community, Payment,
    Review, Issueassignment, Issuevote, Authoritycommunity, Notification
)

from .serializers import (
    RegisterSerializer, UserProfileSerializer, EmergencyReportSerializer,
    IssueReportSerializer, EventSerializer, EventParticipationSerializer,
    ServiceSerializer, BookingSerializer, CommunitySerializer,
    CommunityIssueSerializer, NotificationSerializer, EventRequestSerializer,
    AuthorityIssueSerializer, AuthorityEventSerializer, AuthoritySOSSerializer,
    ChangePasswordSerializer, AuthorityProfileSerializer,
    
    # --- Service Provider Serializers ---
    ProviderServiceSerializer, ProviderBookingSerializer,
    ProviderProfileSerializer, ProviderReviewSerializer
)

# ---------------------------
# HARD-CODED ADMIN CREDENTIALS
# ---------------------------
ADMIN_EMAIL = "aequora@gmail.com"
ADMIN_PASSWORD = "123456"
ADMIN_TOKEN = "AEQUORA_ADMIN_SECRET_2025"

# Simple in-memory admin profile (for this project demo)
ADMIN_PROFILE = {
    "first_name": "Admin",
    "last_name": "User",
    "email": ADMIN_EMAIL,   # login email stays fixed
    "phone": "",
    "dob": "",              # YYYY-MM-DD
    "gender": "Male",
}


def is_admin_request(request):
    """
    Checks if the request is from the hard-coded admin.
    We rely on the token stored in localStorage and sent by the axios `api` client
    as `Authorization: Token <token>`.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Token "):
        token = auth_header.split(" ", 1)[1].strip()
        return token == ADMIN_TOKEN
    return False


# ==========================================
#  AUTHENTICATION & CORE VIEWS
# ==========================================

class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # 👈 add this line ONLY here

    def post(self, request):
        raw_email = (request.data.get("email") or "").strip()
        password = (request.data.get("password") or "")

        if not raw_email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---- HARD-CODED ADMIN CHECK (does not affect other users) ----
        if raw_email.lower() == ADMIN_EMAIL.lower() and password == ADMIN_PASSWORD:
            return Response(
                {
                    "auth_token": ADMIN_TOKEN,
                    "username": "Admin",
                    "email": ADMIN_EMAIL,
                    "app_user_id": None,
                    "role": "Admin",
                },
                status=status.HTTP_200_OK,
            )
        # ----------------------------------------------------------------

        user = authenticate(request, username=raw_email, password=password)

        if user is None:
            auth_user = DjangoAuthUser.objects.filter(email__iexact=raw_email).first()
            if auth_user:
                user = authenticate(
                    request,
                    username=auth_user.username,
                    password=password
                )

        if user is None:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        token, _ = Token.objects.get_or_create(user=user)

        app_user = None
        user_email = UserEmail.objects.select_related("userid").filter(
            email__iexact=raw_email
        ).first()
        if user_email:
            app_user = user_email.userid

        if app_user:
            Loginlog.objects.create(
                userid=app_user,
                user_role=app_user.role
            )

        return Response(
            {
                "auth_token": token.key,
                "username": user.username,
                "email": user.email,
                "app_user_id": getattr(app_user, "userid", None),
                "role": getattr(app_user, "role", None),
            },
            status=status.HTTP_200_OK
        )


class AdminProfileView(APIView):
    """
    Admin-only profile endpoints.
    GET  -> return current admin profile
    PUT  -> update profile fields (except login email)
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(ADMIN_PROFILE)

    def put(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data

        # we allow editing everything EXCEPT the login email
        for key in ["first_name", "last_name", "phone", "dob", "gender"]:
            if key in data:
                ADMIN_PROFILE[key] = data[key] or ""

        return Response(
            {
                "message": "Profile updated successfully.",
                "profile": ADMIN_PROFILE,
            },
            status=status.HTTP_200_OK,
        )


class AdminPasswordChangeView(APIView):
    """
    Admin-only password change.
    This updates the in-memory ADMIN_PASSWORD used by CustomLoginView.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        current = (request.data.get("currentPassword") or "").strip()
        new = (request.data.get("newPassword") or "").strip()
        confirm = (request.data.get("confirmPassword") or "").strip()

        if not current or not new:
            return Response(
                {"error": "Current and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        global ADMIN_PASSWORD
        if current != ADMIN_PASSWORD:
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new != confirm:
            return Response(
                {"error": "New password and confirm password do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new) < 6:
            return Response(
                {"error": "New password must be at least 6 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ADMIN_PASSWORD = new
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class AdminCreateCommunityView(APIView):
    """
    Simple endpoint to create a new Community row.
    Only the admin frontend calls this.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # no DRF token auth here

    def post(self, request):
        # Read fields from request
        name = (request.data.get("name") or "").strip()
        city = (request.data.get("city") or "").strip()
        district = (request.data.get("district") or "").strip()
        thana = (request.data.get("thana") or "").strip()
        postal = (request.data.get("postalCode") or "").strip()

        # Basic validation
        if not name:
            return Response(
                {"error": "Community name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Create the row in the Community table
            community = Community.objects.create(
                name=name,
                city=city,
                district=district,
                thana=thana,
                postalcode=postal,
            )

            return Response(
                {
                    "message": "Community created successfully!",
                    "communityID": community.communityid,
                    "community": {
                        "name": community.name,
                        "city": community.city,
                        "district": community.district,
                        "thana": community.thana,
                        "postalCode": community.postalcode,
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            # If anything goes wrong, send a readable message
            return Response(
                {"error": f"Server error while creating community: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminCommunityListView(APIView):
    """
    Admin-only list of all communities.
    Used by the Manage Communities page.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # skip DRF DB token auth, we use our own check

    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        communities = Community.objects.all().order_by("communityid")

        data = []
        for c in communities:
            created = getattr(c, "createdat", None)
            if created is not None:
                created_str = created.strftime("%Y-%m-%d %H:%M")
            else:
                created_str = ""

            data.append({
                "communityID": c.communityid,
                "communityName": c.name or "",
                "city": c.city or "",
                "district": c.district or "",
                "thana": c.thana or "",
                "postalCode": c.postalcode or "",
                "createdAt": created_str,
            })

        return Response(data, status=status.HTTP_200_OK)


class AdminCommunityDetailView(APIView):
    """
    Admin-only detail view for a single Community.
    Supports GET (optional), PUT (update), DELETE.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # we use our own token check

    def get_object(self, pk):
        try:
            return Community.objects.get(pk=pk)
        except Community.DoesNotExist:
            return None

    def _ensure_admin(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        return None

    def get(self, request, pk):
        # Optional: used if Edit page is opened directly without route state
        unauthorized = self._ensure_admin(request)
        if unauthorized:
            return unauthorized

        community = self.get_object(pk)
        if not community:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        created = getattr(community, "createdat", None)
        created_str = created.strftime("%Y-%m-%d %H:%M") if created else ""

        data = {
            "communityID": community.communityid,
            "communityName": community.name or "",
            "city": community.city or "",
            "district": community.district or "",
            "thana": community.thana or "",
            "postalCode": community.postalcode or "",
            "createdAt": created_str,
        }
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """Update community info."""
        unauthorized = self._ensure_admin(request)
        if unauthorized:
            return unauthorized

        community = self.get_object(pk)
        if not community:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        name = (request.data.get("name") or "").strip()
        city = (request.data.get("city") or "").strip()
        district = (request.data.get("district") or "").strip()
        thana = (request.data.get("thana") or "").strip()
        postal = (request.data.get("postalCode") or "").strip()

        if not name:
            return Response(
                {"error": "Community name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        community.name = name
        community.city = city
        community.district = district
        community.thana = thana
        community.postalcode = postal
        community.save()

        return Response({"message": "Community updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Delete community."""
        unauthorized = self._ensure_admin(request)
        if unauthorized:
            return unauthorized

        community = self.get_object(pk)
        if not community:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        community.delete()
        return Response({"message": "Community deleted successfully."}, status=status.HTTP_200_OK)


class AdminUserListView(APIView):
    """
    Admin-only list of all application users.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # use our custom token check

    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        # load all app users + their communities
        app_users = AppUser.objects.select_related("communityid").all()

        # map userID -> email from UserEmail table
        email_rows = UserEmail.objects.filter(userid__in=app_users).values("userid", "email")
        email_map = {row["userid"]: row["email"] for row in email_rows}

        data = []
        for u in app_users:
            community = getattr(u, "communityid", None)
            community_name = community.name if community else "-"

            created = getattr(u, "createdat", None)
            if created is None:
                created = getattr(u, "createdAt", None)
            created_str = created.strftime("%Y-%m-%d %H:%M") if created else ""

            full_name = f"{u.firstname or ''} {u.lastname or ''}".strip()

            data.append({
                "userID": u.userid,
                "fullName": full_name or "(No name)",
                "email": email_map.get(u.userid, ""),
                "role": u.role,
                "communityName": community_name,
                "status": u.status or "",
                "createdAt": created_str,
            })

        return Response(data, status=status.HTTP_200_OK)


class AdminUserStatusToggleView(APIView):
    """
    Admin-only: toggle a user's status between Active and Suspended.
    Called from the Manage Users table.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, pk):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = AppUser.objects.get(pk=pk)
        except AppUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle logic – adjust if you prefer "Inactive" instead of "Suspended"
        if user.status == "Active":
            user.status = "Suspended"
        else:
            user.status = "Active"
        user.save()

        return Response(
            {"message": "Status updated successfully.", "status": user.status},
            status=status.HTTP_200_OK,
        )


class AdminDashboardStatsView(APIView):
    """
    Simple stats for the admin dashboard.
    Uses the hard-coded admin token check just like the profile endpoints.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # we rely on our custom token check

    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        total_users = AppUser.objects.count()
        total_communities = Community.objects.count()
        # Pending event requests that are still waiting for approval
        pending_requests = Event.objects.filter(status="Pending").count()

        return Response(
            {
                "totalUsers": total_users,
                "totalCommunities": total_communities,
                "pendingRequests": pending_requests,
            },
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        raw = request.data
        email = data["email"]

        existing_auth = (
            DjangoAuthUser.objects.filter(username__iexact=email).exists()
            or DjangoAuthUser.objects.filter(email__iexact=email).exists()
        )
        if existing_auth:
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        auth_user = DjangoAuthUser.objects.create_user(
            username=email,
            email=email,
            password=data["password"]
        )

        app_user = AppUser.objects.create(
            firstname=data["first_name"],
            lastname=data["last_name"],
            password=auth_user.password,
            role=data["role"],
            status="Active",
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender")
        )

        UserEmail.objects.create(userid=app_user, email=email)

        phone_number = data.get("phone_number") or raw.get("phone_number")
        if phone_number:
            UserPhonenumber.objects.create(
                userid=app_user,
                phonenumber=phone_number
            )

        role = data["role"]

        if role == "Resident":
            Resident.objects.create(
                userid=app_user,
                house_no=data.get("house_no") or raw.get("house_no", ""),
                street=data.get("street") or raw.get("street", ""),
                thana=data.get("thana") or raw.get("thana", ""),
                district=data.get("district") or raw.get("district", ""),
                emergency_contact=(
                    data.get("emergency_contact")
                    or raw.get("emergency_contact")
                    or phone_number
                    or ""
                )
            )

        elif role == "Authority":
            Authority.objects.create(
                userid=app_user,
                departmentname=raw.get("department_name", ""),
                designation=raw.get("designation", ""),
                houseno=raw.get("office_house_no", ""),
                street=raw.get("office_street", ""),
                thana=raw.get("office_thana", ""),
                district=raw.get("office_district", "")
            )

        elif role == "ServiceProvider":
            service_area = (raw.get("service_area") or raw.get("serviceArea") or "")
            working_hours = (raw.get("working_hours") or raw.get("workingHours") or "")
            service_type = (raw.get("service_type") or raw.get("serviceType") or "")

            sp = Serviceprovider.objects.create(
                userid=app_user,
                service_area=service_area,
                workinghours=working_hours,
                subrole=service_type,
                availability_status="Available"
            )

            if service_type:
                community = app_user.communityid
                if not community:
                    community = Community.objects.first()
                if not community:
                    community = Community.objects.create(
                        name="Default Community",
                        city="",
                        district="",
                        thana="",
                        postalcode="0000"
                    )
                Service.objects.create(
                    providerid=sp,
                    communityid=community,
                    servicename=service_type,
                    category="General",
                    price=0,
                    availability=True,
                    description=""
                )

        return Response(
            {"message": "Account created successfully!"},
            status=status.HTTP_201_CREATED
        )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_pass = serializer.data.get("old_password")
            new_pass = serializer.data.get("new_password")

            if not user.check_password(old_pass):
                return Response(
                    {"error": "Incorrect current password."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_pass)
            user.save()

            try:
                user_email = UserEmail.objects.get(email=user.email)
                app_user = user_email.userid
                app_user.password = user.password
                app_user.save()
            except Exception as e:
                print("Error syncing password:", e)

            return Response(
                {"message": "Password updated successfully"},
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
#  RESIDENT FEATURE VIEWS
# ==========================================

class ResidentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)

            total_issues = Issuereport.objects.filter(
                residentid=resident
            ).count()
            total_bookings = Booking.objects.filter(
                residentid=resident,
                status__in=['Accepted', 'Completed']
            ).count()
            total_events = Eventparticipation.objects.filter(
                residentid=resident,
                interesttype='Going'
            ).count()

            activities = []

            issues = Issuereport.objects.filter(
                residentid=resident
            ).order_by('-createdat')[:5]
            for i in issues:
                activities.append({
                    'id': f"issue_{i.issueid}",
                    'type': 'Issue',
                    'title': i.title,
                    'status': i.status,
                    'date': i.createdat,
                    'description': f"Reported: {i.type}"
                })

            bookings = Booking.objects.filter(
                residentid=resident
            ).order_by('-createdat')[:5]
            for b in bookings:
                activities.append({
                    'id': f"booking_{b.bookingid}",
                    'type': 'Booking',
                    'title': b.serviceid.servicename,
                    'status': b.status,
                    'date': b.createdat,
                    'description': f"Service Date: {b.servicedate}"
                })

            events = Eventparticipation.objects.filter(
                residentid=resident,
                interesttype='Going'
            ).select_related('eventid')[:5]
            for e in events:
                activities.append({
                    'id': f"event_{e.participationid}",
                    'type': 'Event',
                    'title': e.eventid.title,
                    'status': 'Going',
                    'date': str(e.eventid.date),
                    'description': f"Event on {e.eventid.date}"
                })

            activities.sort(
                key=lambda x: str(x['date']),
                reverse=True
            )

            return Response({
                "stats": {
                    "issues": total_issues,
                    "bookings": total_bookings,
                    "events": total_events
                },
                "activities": activities[:10]
            })

        except Resident.DoesNotExist:
            return Response(
                {"error": "Resident not found"},
                status=404
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=400
            )


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
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        serializer = UserProfileSerializer(app_user)
        return Response(serializer.data)

    def put(self, request):
        app_user = self.get_app_user(request)
        if not app_user:
            return Response(
                {"error": "User profile not found"},
                status=404
            )

        data = request.data.copy()

        if 'communityid' in data and data['communityid'] == "":
            del data['communityid']
        if 'date_of_birth' in data and data['date_of_birth'] == "":
            del data['date_of_birth']

        serializer = UserProfileSerializer(
            app_user,
            data=data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CommunityListView(generics.ListAPIView):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]


class EmergencySOSView(generics.CreateAPIView):
    serializer_class = EmergencyReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer):
        user_email = UserEmail.objects.get(email=self.request.user.email)
        app_user = user_email.userid

        try:
            resident = Resident.objects.get(userid=app_user)
            community = app_user.communityid

            if not community:
                raise serializers.ValidationError(
                    "You are not assigned to a community."
                )

            photo_path = None
            if 'photo' in self.request.FILES:
                image = self.request.FILES['photo']
                file_name = default_storage.save(
                    f"sos_evidence/{image.name}",
                    image
                )
                photo_path = default_storage.url(file_name)

            serializer.save(
                residentid=resident,
                communityid=community,
                photo=photo_path,
                status="Pending"
            )

        except Resident.DoesNotExist:
            raise serializers.ValidationError(
                "User is not a registered resident."
            )
        except Exception as e:
            raise serializers.ValidationError(str(e))


class IssueReportView(generics.ListCreateAPIView):
    serializer_class = IssueReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_app_user(self):
        return UserEmail.objects.get(email=self.request.user.email).userid

    def get_queryset(self):
        app_user = self.get_app_user()
        try:
            resident = Resident.objects.get(userid=app_user)
            return Issuereport.objects.filter(
                residentid=resident
            ).order_by('-createdat')
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
            raise serializers.ValidationError(
                "User is not a resident."
            )


# In base/views.py (friend's modified EventListView)
class EventListView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        try:
            user_email = UserEmail.objects.get(email=self.request.user.email)
            app_user = user_email.userid
            community = app_user.communityid
            if community:
                return Event.objects.filter(communityid=community, status='Published').order_by('-date')
            return Event.objects.none()
        except Exception:
            return Event.objects.none()

class ResidentPendingEventsView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        try:
            user_email = UserEmail.objects.get(email=self.request.user.email)
            app_user = user_email.userid
            community = app_user.communityid
            if community:
                return Event.objects.filter(communityid=community, status='Pending', postedbyid=app_user).order_by('-createdat')
            return Event.objects.none()
        except Exception:
            return Event.objects.none()

class EventParticipationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            participations = Eventparticipation.objects.filter(residentid=resident)
            serializer = EventParticipationSerializer(participations, many=True)
            return Response(serializer.data)
        except Exception:
            return Response([], status=200)
    def post(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            event_id = request.data.get('eventid')
            action = request.data.get('action') 
            db_value = 'Going' if action == 'participate' else 'Ignored'
            event = Event.objects.get(pk=event_id)
            Eventparticipation.objects.update_or_create(eventid=event, residentid=resident, defaults={'interesttype': db_value})
            return Response({'message': 'Success', 'status': db_value})
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            user_email = UserEmail.objects.get(email=self.request.user.email)
            app_user = user_email.userid
            community = app_user.communityid

            if community:
                return Service.objects.filter(communityid=community)

            return Service.objects.none()
        except Exception:
            return Service.objects.none()


# --- BOOKING VIEW WITH DOUBLE REQUEST PREVENTION ---
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
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
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
            service = Service.objects.get(pk=service_id)
            if not service.availability: 
                raise serializers.ValidationError("This service is currently unavailable.")
            
            # --- STRICT DUPLICATE CHECK ---
            recent_duplicate = Booking.objects.filter(
                residentid=resident,
                serviceid=service,
                status='Pending',
                createdat__gte=timezone.now() - datetime.timedelta(minutes=1)
            ).exists()
            if recent_duplicate:
                raise serializers.ValidationError("Duplicate request detected. Please wait a moment.")
            # ------------------------------

            booking_instance = serializer.save(residentid=resident, providerid=service.providerid, communityid=community, status="Pending", price=service.price, paymentstatus="Pending", bookingdate=timezone.now().date())
            Payment.objects.create(bookingid=booking_instance, amount=service.price, method=payment_method, status="Pending")
        except Resident.DoesNotExist:
            raise serializers.ValidationError("User is not a resident.")
        except Service.DoesNotExist:
            raise serializers.ValidationError("Service not found.")

class BookingDetailView(generics.DestroyAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        try:
            booking = self.get_object()
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            
            if booking.residentid != resident:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            today = timezone.now().date()
            if booking.servicedate < today:
                return Response({"error": "Cannot cancel past bookings."}, status=status.HTTP_400_BAD_REQUEST)

            if booking.status == 'Accepted':
                service = booking.serviceid
                if service.availability is not None:
                    try:
                        current_val = int(service.availability)
                        service.availability = current_val + 1
                        service.save()
                    except ValueError:
                        pass

            return super().delete(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ==========================================
#  AUTHORITY & SHARED VIEWS (UPDATED FOR FILTERING)
# ==========================================

class AuthorityDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Get Community context
            user_email = UserEmail.objects.get(email=request.user.email)
            authority = Authority.objects.get(userid=user_email.userid)
            
            # Identify Community either from AuthorityCommunity or User Profile
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid

            if not target_community:
                return Response({"total_issues": 0, "resolved_issues": 0, "pending_issues": 0, "satisfaction_rate": 0})

            # 2. Filter Stats by Community
            total_issues = Issuereport.objects.filter(communityid=target_community).count()
            
            resolved_issues = Issuereport.objects.filter(
                communityid=target_community,
                status='Resolved'
            ).count()
            
            pending_issues = Issuereport.objects.filter(communityid=target_community).exclude(
                status='Resolved'
            ).count()

            # Avg rating of bookings in THIS community
            avg_rating = Review.objects.filter(
                bookingid__communityid=target_community
            ).aggregate(Avg('rating'))['rating__avg'] or 0
            
            satisfaction_rate = round((avg_rating / 5) * 100, 1)

            return Response({
                "total_issues": total_issues,
                "resolved_issues": resolved_issues,
                "pending_issues": pending_issues,
                "satisfaction_rate": satisfaction_rate
            })

        except Exception:
             return Response({"total_issues": 0, "resolved_issues": 0, "pending_issues": 0, "satisfaction_rate": 0})


class AuthorityIssueListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthorityIssueSerializer

    def get_queryset(self):
        try:
            # 1. Identify the logged-in user
            user_email = UserEmail.objects.get(email=self.request.user.email)
            
            # 2. Get the Authority profile
            authority = Authority.objects.get(userid=user_email.userid)
            
            # 3. Find the specific Community ID for this Authority
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            # Fallback: Check the User table directly
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid
            
            # 4. Filter the Issues by that Community ID
            if target_community:
                return Issuereport.objects.filter(
                    communityid=target_community
                ).annotate(
                    vote_count=Count('issuevote')
                ).order_by('-createdat')
            
            return Issuereport.objects.none()

        except (UserEmail.DoesNotExist, Authority.DoesNotExist):
            return Issuereport.objects.none()


class AuthorityIssueDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            issue = Issuereport.objects.get(pk=pk)
            data = request.data

            if 'status' in data:
                issue.status = data['status']
                if data['status'] == 'Resolved':
                    issue.resolvedat = timezone.now()
                issue.save()

            if 'assignedTo' in data:
                dept_name = data['assignedTo']
                if dept_name:
                    auth_user = Authority.objects.filter(
                        departmentname__icontains=dept_name
                    ).first()
                    if auth_user:
                        Issueassignment.objects.update_or_create(
                            issueid=issue,
                            defaults={
                                'authorityid': auth_user,
                                'assigneddate': timezone.now(),
                                'status': 'Assigned'
                            }
                        )

            serializer = AuthorityIssueSerializer(issue)
            return Response(serializer.data)

        except Issuereport.DoesNotExist:
            return Response(
                {"error": "Issue not found"},
                status=404
            )


class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Identify User and Community
            user_email = UserEmail.objects.get(email=request.user.email)
            authority = Authority.objects.get(userid=user_email.userid)
            
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid

            # If no community found, return empty stats
            if not target_community:
                 return Response({
                    "totalReports": 0,
                    "avgResolutionTime": "0h 0m",
                    "satisfactionScore": 0,
                    "categoryStats": [],
                    "topAreas": []
                })

            # 2. Filter Total Reports
            total = Issuereport.objects.filter(communityid=target_community).count()

            # 3. Filter Resolved Issues for Time Calculation
            resolved_issues = Issuereport.objects.filter(
                communityid=target_community,
                status='Resolved',
                resolvedat__isnull=False
            )

            total_seconds = 0
            count = 0
            for i in resolved_issues:
                if i.createdat and i.resolvedat:
                    diff = i.resolvedat - i.createdat
                    total_seconds += diff.total_seconds()
                    count += 1

            avg_time_str = "0h 0m"
            if count > 0:
                avg_seconds = total_seconds / count
                hours = int(avg_seconds // 3600)
                avg_time_str = f"{hours} hrs"

            # 4. Filter Reviews (Review -> Booking -> Community)
            avg_score = Review.objects.filter(
                bookingid__communityid=target_community
            ).aggregate(Avg('rating'))['rating__avg'] or 0

            # 5. Filter Categories
            cat_stats = Issuereport.objects.filter(
                communityid=target_community
            ).values('type').annotate(
                count=Count('issueid')
            ).order_by('-count')
            formatted_cats = [
                {'name': c['type'] or 'Uncategorized', 'count': c['count']}
                for c in cat_stats
            ]

            # 6. Filter Top Areas
            area_stats = Issuereport.objects.filter(
                communityid=target_community
            ).values('mapaddress').annotate(
                count=Count('issueid')
            ).order_by('-count')[:5]
            formatted_areas = [
                {'name': a['mapaddress'] or 'Unknown', 'count': a['count']}
                for a in area_stats
            ]

            return Response({
                "totalReports": total,
                "avgResolutionTime": avg_time_str,
                "satisfactionScore": round(avg_score, 1),
                "categoryStats": formatted_cats,
                "topAreas": formatted_areas
            })
            
        except Exception as e:
            # Just in case of error, return empty/safe data
            return Response({
                "totalReports": 0,
                "avgResolutionTime": "0h 0m",
                "satisfactionScore": 0,
                "categoryStats": [],
                "topAreas": []
            })


class AuthoritySOSView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Identify User and Authority
            user_email = UserEmail.objects.get(email=request.user.email)
            authority = Authority.objects.get(userid=user_email.userid)
            
            # 2. Find Community ID
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid

            # 3. Filter Emergency Reports
            if target_community:
                sos_list = Emergencyreport.objects.filter(
                    communityid=target_community
                ).order_by('-timestamp')
                
                serializer = AuthoritySOSSerializer(sos_list, many=True)
                return Response(serializer.data)
            
            return Response([])

        except (UserEmail.DoesNotExist, Authority.DoesNotExist):
            return Response([])

# --- AuthoritySOSDetailView handles PATCH (status) and POST (dispatch) ---
class AuthoritySOSDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            sos = Emergencyreport.objects.get(pk=pk)
            sos.status = request.data.get('status', sos.status)
            sos.save()
            return Response({'status': 'success'})
        except Emergencyreport.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def post(self, request, pk):
        """
        Handles Dispatch Logic.
        1. Identifies the Service Type (Police, Fire, Ambulance).
        2. Finds Authorities in the same Community with matching Department names.
        3. Sends a notification specifically to them.
        """
        service_type = request.data.get('service', '').upper() # e.g., 'FIRE DEPT', 'AMBULANCE'
        
        try:
            sos = Emergencyreport.objects.get(pk=pk)
            community = sos.communityid
            
            # Map Service Type to Department Keywords
            dept_keyword = ""
            if "FIRE" in service_type:
                dept_keyword = "Fire"
            elif "AMBULANCE" in service_type or "MEDICAL" in service_type:
                dept_keyword = "Medical" # or Health
            elif "POLICE" in service_type:
                dept_keyword = "Police" # or Security
            
            # Find relevant Authorities in this community
            if dept_keyword:
                target_authorities = Authority.objects.filter(
                    userid__communityid=community,
                    departmentname__icontains=dept_keyword
                )
                
                # Create Notifications
                notifs = []
                for auth in target_authorities:
                    notifs.append(Notification(
                        userid=auth.userid,
                        communityid=community,
                        message=f"DISPATCH ALERT: You have been assigned to an SOS at {sos.location}.",
                        type="sos",
                        link="/authority/emergency"
                    ))
                
                if notifs:
                    Notification.objects.bulk_create(notifs)
                    print(f"--- DEBUG: Notified {len(notifs)} authorities in {dept_keyword} department ---")

            return Response({'message': f'{service_type} Units Dispatched Successfully'})
            
        except Emergencyreport.DoesNotExist:
            return Response({'error': 'SOS Report not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class VotingResultsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthorityIssueSerializer

    def get_queryset(self):
        try:
            # 1. Identify User and Community
            user_email = UserEmail.objects.get(email=self.request.user.email)
            authority = Authority.objects.get(userid=user_email.userid)
            
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid

            # 2. Filter Issues by Community + Count Votes
            if target_community:
                return Issuereport.objects.filter(
                    communityid=target_community
                ).annotate(
                    upvotes=Count('issuevote', filter=Q(issuevote__votetype='up')),
                    downvotes=Count('issuevote', filter=Q(issuevote__votetype='down'))
                ).order_by('-upvotes')

            return Issuereport.objects.none()

        except Exception:
            return Issuereport.objects.none()


class AuthorityEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Identify Community
            user_email = UserEmail.objects.get(email=request.user.email)
            authority = Authority.objects.get(userid=user_email.userid)
            
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid
            
            # 2. Filter Events by Community
            if target_community:
                events = Event.objects.filter(
                    communityid=target_community,
                    status='Published'
                ).order_by('-date')
                serializer = AuthorityEventSerializer(events, many=True)
                return Response(serializer.data)
                
            return Response([])

        except Exception:
             return Response([])

    def post(self, request):
        data = request.data
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            # Use the robust community lookup here too if you want, 
            # but usually the user's direct communityid is fine for creation.
            community = user_email.userid.communityid
            if not community:
                community = Community.objects.first()

            Event.objects.create(
                postedbyid=user_email.userid,
                communityid=community,
                title=data.get('title'),
                description=data.get('description'),
                date=data.get('date'),
                time=data.get('time'),
                location=data.get('location'),
                category=data.get('category'),
                status='Published'
            )
            return Response({'message': 'Event Created'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class AuthorityEventRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Identify Community
            user_email = UserEmail.objects.get(email=request.user.email)
            authority = Authority.objects.get(userid=user_email.userid)
            
            auth_comm = Authoritycommunity.objects.filter(authorityid=authority).first()
            target_community = None
            if auth_comm:
                target_community = auth_comm.communityid
            elif user_email.userid.communityid:
                target_community = user_email.userid.communityid

            # 2. Filter Pending Requests by Community
            if target_community:
                requests = Event.objects.filter(
                    communityid=target_community,
                    status='Pending'
                ).order_by('-date')
                serializer = AuthorityEventSerializer(requests, many=True)
                return Response(serializer.data)

            return Response([])

        except Exception:
             return Response([])


class AuthorityEventActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        action = request.data.get('action')  # 'approve' or 'reject'
        try:
            event = Event.objects.get(pk=pk)
            if action == 'approve':
                event.status = 'Published'
                event.save()
            elif action == 'reject':
                event.status = 'Rejected'
                event.save()
            return Response({'status': 'success'})
        except Event.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, pk):
        try:
            Event.objects.get(pk=pk).delete()
            return Response({'status': 'deleted'})
        except:
            return Response({'error': 'Not found'}, status=404)


class DepartmentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        departments = Authority.objects.values_list(
            'departmentname',
            flat=True
        ).distinct()
        valid_departments = [dept for dept in departments if dept]
        return Response(valid_departments)


class CommunityIssueListView(generics.ListAPIView):
    serializer_class = CommunityIssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            user_email = UserEmail.objects.get(email=self.request.user.email)
            app_user = user_email.userid
            community = app_user.communityid

            if community:
                return Issuereport.objects.filter(
                    communityid=community
                ).order_by('-createdat')

            return Issuereport.objects.none()
        except Exception:
            return Issuereport.objects.none()


class IssueVoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)

            issue_id = request.data.get('issueid')
            vote_type = request.data.get('type')  # 'up' or 'down'
            issue = Issuereport.objects.get(pk=issue_id)

            existing_vote = Issuevote.objects.filter(
                issueid=issue,
                residentid=resident
            ).first()

            if existing_vote:
                if existing_vote.votetype == vote_type:
                    # same vote again: remove
                    existing_vote.delete()
                    return Response({'status': 'removed'})
                else:
                    existing_vote.votetype = vote_type
                    existing_vote.save()
                    return Response({
                        'status': 'updated',
                        'type': vote_type
                    })
            else:
                Issuevote.objects.create(
                    issueid=issue,
                    residentid=resident,
                    votetype=vote_type
                )
                return Response({
                    'status': 'created',
                    'type': vote_type
                })

        except Issuereport.DoesNotExist:
            return Response({'error': 'Issue not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class NotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            notifs = Notification.objects.filter(
                userid=user_email.userid
            ).order_by('-createdat')
            unread_count = notifs.filter(isread=False).count()

            serializer = NotificationSerializer(
                notifs[:10],
                many=True
            )
            return Response({
                'unread_count': unread_count,
                'notifications': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    def post(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            Notification.objects.filter(
                userid=user_email.userid,
                isread=False
            ).update(isread=True)
            return Response({
                'message': 'Notifications marked as read',
                'unread_count': 0
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class EventRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EventRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user_email = UserEmail.objects.get(email=request.user.email)
                app_user = user_email.userid
                community = app_user.communityid

                if not community:
                    return Response(
                        {
                            "error": "You must be assigned to a community to request events."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                serializer.save(
                    postedbyid=app_user,
                    communityid=community,
                    status='Pending'
                )
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
#  SERVICE PROVIDER VIEWS
# ==========================================

def get_provider_safely(request_user):
    """
    Safely retrieves the ServiceProvider based on your specific DB Schema:
    UserEmail -> User -> ServiceProvider
    """
    email_str = str(request_user)
    if hasattr(request_user, 'email'):
        email_str = request_user.email
    
    # 1. Find User via UserEmail table
    try:
        email_record = UserEmail.objects.get(email=email_str)
        user_instance = email_record.userid
    except (UserEmail.DoesNotExist, AttributeError):
        return None

    # 2. Get ServiceProvider profile
    try:
        return Serviceprovider.objects.get(userid=user_instance)
    except Serviceprovider.DoesNotExist:
        return None

class ProviderDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Profile not found'}, status=404)

        bookings = Booking.objects.filter(providerid=provider)
        total_bookings = bookings.count()
        completed_bookings = bookings.filter(status__iexact='Completed').count()
        earnings = sum(b.price for b in bookings.filter(status__iexact='Completed') if b.price)
        
        # Calculate Rating dynamically
        avg_rating = Review.objects.filter(providerid=provider).aggregate(Avg('rating'))['rating__avg'] or 0
        
        recent_bookings = ProviderBookingSerializer(bookings.order_by('-bookingdate')[:5], many=True).data

        return Response({
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'earnings': earnings,
            'rating': round(avg_rating, 1),
            'recent_bookings': recent_bookings
        })

class ProviderServiceManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        services = Service.objects.filter(providerid=provider)
        serializer = ProviderServiceSerializer(services, many=True)
        return Response(serializer.data)

    def post(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        # FIX: Fetch the Community ID from the User's profile
        user_community = provider.userid.communityid
        
        if not user_community:
             return Response({'error': 'Your profile is not linked to a Community. Please update your profile settings first.'}, status=400)

        serializer = ProviderServiceSerializer(data=request.data)
        if serializer.is_valid():
            # FIX: Save with BOTH providerid AND communityid
            serializer.save(providerid=provider, communityid=user_community) 
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderServiceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        """ Update an existing service """
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        try:
            service = Service.objects.get(serviceid=pk, providerid=provider)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)

        # FIX: Add partial=True to allow updating just price/slots without crashing on missing fields
        serializer = ProviderServiceSerializer(service, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        # This prints the REAL error to your terminal so we know exactly what's wrong if it fails again
        print("Update Validation Errors:", serializer.errors) 
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        """ Delete a service """
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        try:
            service = Service.objects.get(serviceid=pk, providerid=provider)
            service.delete()
            return Response({'message': 'Service deleted successfully'}, status=204)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found or access denied'}, status=404)

class ProviderBookingManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        bookings = Booking.objects.filter(providerid=provider).order_by('-bookingdate')
        serializer = ProviderBookingSerializer(bookings, many=True)
        return Response(serializer.data)

class ProviderBookingStatusUpdateView(generics.UpdateAPIView):
    serializer_class = ProviderBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # CRITICAL FIX: request.user is an email string, NOT a User object.
        # We must resolve Email -> User object via UserEmail table as per your database truths.
        email_str = self.request.user
        
        try:
            # 1. Find the UserEmail entry matching the logged-in email
            user_email_obj = UserEmail.objects.get(email=email_str)
            # 2. Extract the actual User object (userid is the ForeignKey)
            user_obj = user_email_obj.userid
        except UserEmail.DoesNotExist:
            # If email doesn't exist in UserEmail, return empty
            return Booking.objects.none()

        # 3. Use the resolved User object to filter bookings
        # Booking -> providerid (ServiceProvider) -> userid (User)
        return Booking.objects.filter(providerid__userid=user_obj)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 1. Update Booking Status if present
        if 'status' in request.data:
            instance.status = request.data['status']
            
        # 2. Update Payment Status if present (Explicitly handling 'paymentstatus')
        if 'paymentstatus' in request.data:
            instance.paymentstatus = request.data['paymentstatus']
            
        instance.save()
        
        # Return updated data
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class ProviderProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # REQUIRED for File Uploads

    def get(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)
        serializer = ProviderProfileSerializer(provider)
        return Response(serializer.data)

    def put(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        user = provider.userid # Get the linked User instance

        # 1. Update User Table Fields
        user.firstname = request.data.get('first_name', user.firstname)
        user.lastname = request.data.get('last_name', user.lastname)
        user.gender = request.data.get('gender', user.gender)
        
        dob = request.data.get('date_of_birth')
        if dob and dob != 'null': user.date_of_birth = dob

        # Update Community ID
        comm_id = request.data.get('community_id')
        if comm_id:
            try:
                user.communityid = Community.objects.get(communityid=comm_id)
            except Community.DoesNotExist:
                pass # Ignore invalid community IDs
        
        user.save()

        # 2. Update Phone Number Table
        phone = request.data.get('phone_number')
        if phone:
            UserPhonenumber.objects.update_or_create(userid=user, defaults={'phonenumber': phone})

        # 3. Update ServiceProvider Table Fields
        provider.subrole = request.data.get('subrole', provider.subrole)
        provider.service_area = request.data.get('service_area', provider.service_area)
        provider.workinghours = request.data.get('workinghours', provider.workinghours)
        provider.availability_status = request.data.get('availability_status', provider.availability_status)

        # 4. Handle File Upload
        if 'certificationfile' in request.FILES:
            provider.certificationfile = request.FILES['certificationfile']

        provider.save()
        
        return Response(ProviderProfileSerializer(provider).data)

class ProviderReviewsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_provider_safely(request.user)
        if not provider:
            return Response({'error': 'Provider not found'}, status=404)

        # Get reviews for this provider, newest first
        reviews = Review.objects.filter(providerid=provider).order_by('-createdat')
        serializer = ProviderReviewSerializer(reviews, many=True)
        return Response(serializer.data)

# ==========================================
#  BKASH PAYMENT CONFIGURATION & VIEWS
# ==========================================

# --- BKASH CONFIGURATION ---
BKASH_BASE_URL = "https://checkout.sandbox.bka.sh/v1.2.0-beta/checkout"
BKASH_USERNAME = "YOUR_SANDBOX_USERNAME"
BKASH_PASSWORD = "YOUR_SANDBOX_PASSWORD"
BKASH_APP_KEY = "YOUR_SANDBOX_APP_KEY"
BKASH_APP_SECRET = "YOUR_SANDBOX_APP_SECRET"


def get_bkash_token():
    url = f"{BKASH_BASE_URL}/token/grant"
    headers = {
        "username": BKASH_USERNAME,
        "password": BKASH_PASSWORD,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    body = {
        "app_key": BKASH_APP_KEY,
        "app_secret": BKASH_APP_SECRET
    }
    try:
        response = requests.post(url, json=body, headers=headers)
        if response.status_code == 200:
            return response.json().get('id_token')
    except Exception as e:
        print("Token Error:", e)
    return None


class BkashInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        try:
            booking = Booking.objects.get(bookingid=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=400)

        token = get_bkash_token()
        if not token:
            return Response({'error': 'bKash Auth Failed'}, status=500)

        create_url = f"{BKASH_BASE_URL}/payment/create"
        headers = {
            "Authorization": token,
            "X-APP-Key": BKASH_APP_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        invoice_no = f"INV-{booking_id}-{uuid.uuid4().hex[:6].upper()}"
        payload = {
            "mode": "0011",
            "payerReference": "01700000000",
            "callbackURL": (
                "http://127.0.0.1:8000/api/payment/bkash/callback/"
            ),
            "amount": str(booking.price),
            "currency": "BDT",
            "intent": "sale",
            "merchantInvoiceNumber": invoice_no
        }

        response = requests.post(create_url, json=payload, headers=headers)
        data = response.json()

        if response.status_code == 200 and 'bkashURL' in data:
            return Response({'payment_url': data['bkashURL']})
        else:
            return Response(
                {'error': data.get('statusMessage', 'Failed')},
                status=400
            )


class BkashCallbackView(APIView):
    def get(self, request):
        payment_id = request.GET.get('paymentID')
        status_msg = request.GET.get('status')  # 'success', 'cancel', etc.

        if status_msg != 'success':
            return redirect(
                'http://localhost:5173/book-service?payment=failed'
            )

        token = get_bkash_token()
        if not token:
            return redirect(
                'http://localhost:5173/book-service?payment=error'
            )

        execute_url = f"{BKASH_BASE_URL}/payment/execute/{payment_id}"
        headers = {
            "Authorization": token,
            "X-APP-Key": BKASH_APP_KEY,
            "Accept": "application/json"
        }
        response = requests.post(execute_url, headers=headers)
        data = response.json()

        if (
            data.get("statusCode") == "0000"
            and data.get("transactionStatus") == "Completed"
        ):
            merchant_inv = data.get('merchantInvoiceNumber')
            try:
                booking_id = merchant_inv.split('-')[1]
                booking = Booking.objects.get(bookingid=booking_id)
                booking.status = 'Confirmed'
                booking.paymentstatus = 'Paid'
                booking.save()

                Payment.objects.create(
                    bookingid=booking,
                    amount=booking.price,
                    method='Bkash',
                    transactionid=data.get('trxID'),
                    status='Completed'
                )
                return redirect(
                    'http://localhost:5173/book-service?payment=success'
                )
            except Exception as e:
                print("DB Error:", e)
                return redirect(
                    'http://localhost:5173/book-service?payment=error'
                )
        else:
            print("Execution Failed:", data)
            return redirect(
                'http://localhost:5173/book-service?payment=failed'
            )


class BkashQueryPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('paymentID')

        token = get_bkash_token()
        query_url = f"{BKASH_BASE_URL}/payment/query/{payment_id}"
        headers = {
            "Authorization": token,
            "X-APP-Key": BKASH_APP_KEY,
            "Accept": "application/json"
        }
        response = requests.get(query_url, headers=headers)
        return Response(response.json())
    

class AuthorityProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_authority(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            return Authority.objects.get(userid=user_email.userid)
        except (UserEmail.DoesNotExist, Authority.DoesNotExist):
            return None

    def get(self, request):
        authority = self.get_authority(request)
        if not authority:
            return Response({"error": "Authority profile not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AuthorityProfileSerializer(authority)
        return Response(serializer.data)

    def put(self, request):
        authority = self.get_authority(request)
        if not authority:
            return Response({"error": "Authority profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AuthorityProfileSerializer(authority, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)