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
)
from .serializers import RegisterSerializer


class CustomLoginView(APIView):
    """
    Login using email + password.

    - Finds the Django auth user either by username (we store it as email)
      or by the email field.
    - Uses Django's authenticate() so it behaves like the admin login.
    - Returns an auth token plus some basic user info.
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
                logintime=timezone.now(),
                # ipAddress / deviceInfo can be added later
            )

        # 7) Response
        return Response(
            {
                "auth_token": token.key,
                "username": user.username,
                "email": user.email,
                "app_user_id": getattr(app_user, "userID", None),
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
    - If role == 'Resident', also creates a Resident row.
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
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

        # 2) Create Django auth user (create_user hashes password)
        auth_user = DjangoAuthUser.objects.create_user(
            username=email,
            email=email,
            password=data["password"],
        )

        # 3) Create AppUser profile
        app_user = AppUser.objects.create(
            firstname=data["first_name"],
            lastname=data["last_name"],
            role=data["role"],
            status="Active",
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
        )

        # 4) Store email
        UserEmail.objects.create(userid=app_user, email=email)

        # 5) Store phone number (FIELD NAME FIXED HERE)
        phone_number = data.get("phone_number")
        if phone_number:
            UserPhonenumber.objects.create(
                userid=app_user,
                phonenumber=phone_number,  # <-- use the actual field name
            )

        # 6) If role is Resident, create Resident entry
        if data["role"] == "Resident":
            Resident.objects.create(
                userid=app_user,
                house_no=data.get("house_no", ""),
                street=data.get("street", ""),
                thana=data.get("thana", ""),
                district=data.get("district", ""),
                emergency_contact=data.get("phone_number", ""),
            )

        return Response(
            {"message": "Account created successfully!"},
            status=status.HTTP_201_CREATED,
        )
