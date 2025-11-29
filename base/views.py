from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User as DjangoAuthUser

from .models import User as AppUser, Resident


class CustomLoginView(APIView):
    def post(self, request):
        # Get credentials from frontend
        email = request.data.get("username")
        password = request.data.get("password")

        # Authenticate against Django auth_user
        user = authenticate(username=email, password=password)

        if user:
            # Get or create token
            token, created = Token.objects.get_or_create(user=user)
            return Response({"auth_token": token.key}, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Invalid Credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RegisterView(APIView):
    def post(self, request):
        from .serializers import RegisterSerializer

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            data = serializer.validated_data

            # 1) Check if Django auth user already exists
            if DjangoAuthUser.objects.filter(username=data["email"]).exists():
                return Response(
                    {"error": "User with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 2) Create Django auth user (for login)
            auth_user = DjangoAuthUser.objects.create_user(
                username=data["email"],
                email=data["email"],
                password=data["password"],
            )

            # 3) Create App User profile (NO auth_user FK here)
            app_user = AppUser.objects.create(
                firstname=data["first_name"],
                lastname=data["last_name"],
                role=data["role"],
                status="Active",
            )

            # 4) If role is Resident, create Resident row
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

        # serializer not valid
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)