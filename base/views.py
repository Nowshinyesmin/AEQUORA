from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User as DjangoAuthUser
from django.utils import timezone
from django.contrib.auth import authenticate

from .models import (
    User as AppUser,
    Resident,
    UserEmail,
    UserPhonenumber,
    Loginlog,
    Authority,
    Serviceprovider,
    Service,
    Community,
)
from .serializers import RegisterSerializer



class CustomLoginView(APIView):
    """
    Login using email + password.

    - Finds the Django auth user either by username (we store it as email)
      or by the email field.
    - Uses Django's authenticate() so it behaves like the admin login.
    - Returns an auth token plus some basic user info, including role.
    """

    def post(self, request):
        # Get data from request
        raw_email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not raw_email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1) Try authenticate assuming username == email
        user = authenticate(request, username=raw_email, password=password)

        # 2) If that fails, try to find by email column then authenticate with username
        if user is None:
            auth_user = DjangoAuthUser.objects.filter(
                email__iexact=raw_email
            ).first()
            if auth_user:
                user = authenticate(
                    request,
                    username=auth_user.username,
                    password=password,
                )

        # 3) Still no user -> invalid credentials
        if user is None:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4) Get or create auth token
        token, _ = Token.objects.get_or_create(user=user)

        # 5) Try to map to our AppUser via UserEmail
        app_user = None
        user_email = (
            UserEmail.objects.select_related("userid")
            .filter(email__iexact=raw_email)
            .first()
        )
        if user_email:
            app_user = user_email.userid

        # 6) Log login if we have an AppUser
        if app_user:
            Loginlog.objects.create(
                userid=app_user,
                user_role=app_user.role,
                # logintime auto-added by model
            )

        # 7) Response
        return Response(
            {
                "auth_token": token.key,
                "username": user.username,
                "email": user.email,
                "app_user_id": getattr(app_user, "userid", None),
                "role": getattr(app_user, "role", None),
            },
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """
    Register a new user.

    - Validates input with RegisterSerializer.
    - Creates Django auth user (username = email).
    - Creates AppUser, UserEmail, UserPhonenumber.
    - If role == 'Resident'       -> creates Resident row.
    - If role == 'Authority'      -> creates Authority row.
    - If role == 'ServiceProvider'-> creates Serviceprovider row
      and a Service row with servicename = service_type.
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # validated core fields
        data = serializer.validated_data
        # raw payload (includes fields not defined in serializer)
        raw = request.data

        email = data["email"]

        # 1) Check for duplicate auth user
        existing_auth = (
            DjangoAuthUser.objects.filter(username__iexact=email).exists()
            or DjangoAuthUser.objects.filter(email__iexact=email).exists()
        )
        if existing_auth:
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) Create Django auth user (this hashes password)
        auth_user = DjangoAuthUser.objects.create_user(
            username=email,
            email=email,
            password=data["password"],
        )

        # 3) Create AppUser profile (domain user)
        app_user = AppUser.objects.create(
            firstname=data["first_name"],
            lastname=data["last_name"],
            password=data["password"],  # your custom table copy
            role=data["role"],
            status="Active",
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
        )

        # 4) Store email
        UserEmail.objects.create(userid=app_user, email=email)

        # 5) Store phone number
        phone_number = data.get("phone_number") or raw.get("phone_number")
        if phone_number:
            UserPhonenumber.objects.create(
                userid=app_user,
                phonenumber=phone_number,
            )

        # 6) Role–specific rows
        role = data["role"]

        # --------- RESIDENT ---------
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
                ),
            )

        # --------- AUTHORITY ---------
        elif role == "Authority":
            Authority.objects.create(
                userid=app_user,
                departmentname=raw.get("department_name", ""),
                designation=raw.get("designation", ""),
                houseno=raw.get("office_house_no", ""),
                street=raw.get("office_street", ""),
                thana=raw.get("office_thana", ""),
                district=raw.get("office_district", ""),
            )

        # --------- SERVICE PROVIDER ---------
        elif role == "ServiceProvider":
            # Read directly from request.data to avoid serializer dropping fields
            service_area = (
                raw.get("service_area")
                or raw.get("serviceArea")
                or ""
            )
            working_hours = (
                raw.get("working_hours")
                or raw.get("workingHours")
                or ""
            )
            service_type = (
                raw.get("service_type")
                or raw.get("serviceType")
                or ""
            )

            # 1) Serviceprovider profile
            sp = Serviceprovider.objects.create(
                userid=app_user,
                service_area=service_area,
                workinghours=working_hours,
                subrole=service_type,
                availability_status="Available",
            )

            # 2) Create (or get) a Community so Service entry never fails
            if service_type:
                community = app_user.communityid

                if not community:
                    community = Community.objects.first()
                if not community:
                    # create a simple default community if DB is empty
                    community = Community.objects.create(
                        name="Default Community",
                        city="",
                        district="",
                        thana="",
                        postalcode="0000",
                    )

                Service.objects.create(
                    providerid=sp,
                    communityid=community,
                    servicename=service_type,  # <-- serviceName column
                    category="General",
                    price=0,
                    availability=True,
                    description="",
                )

        return Response(
            {"message": "Account created successfully!"},
            status=status.HTTP_201_CREATED,
        )

