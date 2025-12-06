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
    ChangePasswordSerializer
)

# ... [Authentication Views: CustomLoginView, RegisterView, ChangePasswordView remain same] ...
class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        raw_email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        if not raw_email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=raw_email, password=password)
        if user is None:
            auth_user = DjangoAuthUser.objects.filter(email__iexact=raw_email).first()
            if auth_user:
                user = authenticate(request, username=auth_user.username, password=password)
        if user is None:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        app_user = None
        user_email = UserEmail.objects.select_related("userid").filter(email__iexact=raw_email).first()
        if user_email:
            app_user = user_email.userid
        if app_user:
            Loginlog.objects.create(userid=app_user, user_role=app_user.role)
        return Response({
            "auth_token": token.key,
            "username": user.username,
            "email": user.email,
            "app_user_id": getattr(app_user, "userid", None),
            "role": getattr(app_user, "role", None),
        }, status=status.HTTP_200_OK)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        raw = request.data
        email = data["email"]
        existing_auth = (DjangoAuthUser.objects.filter(username__iexact=email).exists() or DjangoAuthUser.objects.filter(email__iexact=email).exists())
        if existing_auth:
            return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        auth_user = DjangoAuthUser.objects.create_user(username=email, email=email, password=data["password"])
        app_user = AppUser.objects.create(
            firstname=data["first_name"], lastname=data["last_name"], password=auth_user.password,
            role=data["role"], status="Active", date_of_birth=data.get("date_of_birth"), gender=data.get("gender")
        )
        UserEmail.objects.create(userid=app_user, email=email)
        phone_number = data.get("phone_number") or raw.get("phone_number")
        if phone_number:
            UserPhonenumber.objects.create(userid=app_user, phonenumber=phone_number)
        role = data["role"]
        if role == "Resident":
            Resident.objects.create(
                userid=app_user, house_no=data.get("house_no") or raw.get("house_no", ""),
                street=data.get("street") or raw.get("street", ""), thana=data.get("thana") or raw.get("thana", ""),
                district=data.get("district") or raw.get("district", ""),
                emergency_contact=(data.get("emergency_contact") or raw.get("emergency_contact") or phone_number or "")
            )
        elif role == "Authority":
            Authority.objects.create(userid=app_user, departmentname=raw.get("department_name", ""), designation=raw.get("designation", ""), houseno=raw.get("office_house_no", ""), street=raw.get("office_street", ""), thana=raw.get("office_thana", ""), district=raw.get("office_district", ""))
        elif role == "ServiceProvider":
            service_area = (raw.get("service_area") or raw.get("serviceArea") or "")
            working_hours = (raw.get("working_hours") or raw.get("workingHours") or "")
            service_type = (raw.get("service_type") or raw.get("serviceType") or "")
            sp = Serviceprovider.objects.create(userid=app_user, service_area=service_area, workinghours=working_hours, subrole=service_type, availability_status="Available")
            if service_type:
                community = app_user.communityid
                if not community:
                    community = Community.objects.first()
                if not community:
                    community = Community.objects.create(name="Default Community", city="", district="", thana="", postalcode="0000")
                Service.objects.create(providerid=sp, communityid=community, servicename=service_type, category="General", price=0, availability=True, description="")
        return Response({"message": "Account created successfully!"}, status=status.HTTP_201_CREATED)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_pass = serializer.data.get("old_password")
            new_pass = serializer.data.get("new_password")
            if not user.check_password(old_pass):
                return Response({"error": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_pass)
            user.save()
            try:
                user_email = UserEmail.objects.get(email=user.email)
                app_user = user_email.userid
                app_user.password = user.password 
                app_user.save()
            except Exception as e:
                print("Error syncing password:", e)
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ... [Resident Feature Views: Dashboard, Profile, SOS, Issue, Event, Service] ...
class ResidentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            resident = Resident.objects.get(userid=user_email.userid)
            total_issues = Issuereport.objects.filter(residentid=resident).count()
            total_bookings = Booking.objects.filter(residentid=resident, status__in=['Accepted', 'Completed']).count()
            total_events = Eventparticipation.objects.filter(residentid=resident, interesttype='Going').count()
            activities = []
            issues = Issuereport.objects.filter(residentid=resident).order_by('-createdat')[:5]
            for i in issues:
                activities.append({'id': f"issue_{i.issueid}", 'type': 'Issue', 'title': i.title, 'status': i.status, 'date': i.createdat, 'description': f"Reported: {i.type}"})
            bookings = Booking.objects.filter(residentid=resident).order_by('-createdat')[:5]
            for b in bookings:
                activities.append({'id': f"booking_{b.bookingid}", 'type': 'Booking', 'title': b.serviceid.servicename, 'status': b.status, 'date': b.createdat, 'description': f"Service Date: {b.servicedate}"})
            events = Eventparticipation.objects.filter(residentid=resident, interesttype='Going').select_related('eventid')[:5]
            for e in events:
                activities.append({'id': f"event_{e.participationid}", 'type': 'Event', 'title': e.eventid.title, 'status': 'Going', 'date': str(e.eventid.date), 'description': f"Event on {e.eventid.date}"})
            activities.sort(key=lambda x: str(x['date']), reverse=True)
            return Response({"stats": {"issues": total_issues, "bookings": total_bookings, "events": total_events}, "activities": activities[:10]})
        except Resident.DoesNotExist:
            return Response({"error": "Resident not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

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
        app_user = self.get_app_user(request)
        if not app_user:
            return Response({"error": "User profile not found"}, status=404)
        data = request.data.copy()
        if 'communityid' in data and data['communityid'] == "": del data['communityid']
        if 'date_of_birth' in data and data['date_of_birth'] == "": del data['date_of_birth']
        serializer = UserProfileSerializer(app_user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            photo_path = None
            if 'photo' in self.request.FILES:
                image = self.request.FILES['photo']
                file_name = default_storage.save(f"sos_evidence/{image.name}", image)
                photo_path = default_storage.url(file_name)
            serializer.save(residentid=resident, communityid=community, photo=photo_path, status="Pending")
        except Resident.DoesNotExist:
            raise serializers.ValidationError("User is not a registered resident.")
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
            return Issuereport.objects.filter(residentid=resident).order_by('-createdat')
        except Resident.DoesNotExist:
            return Issuereport.objects.none()
    def perform_create(self, serializer):
        app_user = self.get_app_user()
        try:
            resident = Resident.objects.get(userid=app_user)
            community = app_user.communityid
            serializer.save(residentid=resident, communityid=community, status="Pending")
        except Resident.DoesNotExist:
            raise serializers.ValidationError("User is not a resident.")

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

# ... [Authority Views, NotificationView, etc. remain unchanged] ...
class AuthorityDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        total_issues = Issuereport.objects.count()
        resolved_issues = Issuereport.objects.filter(status='Resolved').count()
        pending_issues = Issuereport.objects.exclude(status='Resolved').count()
        avg_rating = Review.objects.aggregate(Avg('rating'))['rating__avg'] or 0
        satisfaction_rate = round((avg_rating / 5) * 100, 1)
        return Response({"total_issues": total_issues, "resolved_issues": resolved_issues, "pending_issues": pending_issues, "satisfaction_rate": satisfaction_rate})

class AuthorityIssueListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthorityIssueSerializer
    def get_queryset(self):
        return Issuereport.objects.annotate(vote_count=Count('issuevote')).order_by('-createdat')

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
                    auth_user = Authority.objects.filter(departmentname__icontains=dept_name).first()
                    if auth_user:
                        Issueassignment.objects.update_or_create(issueid=issue, defaults={'authorityid': auth_user, 'assigneddate': timezone.now(), 'status': 'Assigned'})
            serializer = AuthorityIssueSerializer(issue)
            return Response(serializer.data)
        except Issuereport.DoesNotExist:
            return Response({"error": "Issue not found"}, status=404)

class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        total = Issuereport.objects.count()
        resolved_issues = Issuereport.objects.filter(status='Resolved', resolvedat__isnull=False)
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
        avg_score = Review.objects.aggregate(Avg('rating'))['rating__avg'] or 0
        cat_stats = Issuereport.objects.values('type').annotate(count=Count('issueid')).order_by('-count')
        formatted_cats = [{'name': c['type'] or 'Uncategorized', 'count': c['count']} for c in cat_stats]
        area_stats = Issuereport.objects.values('mapaddress').annotate(count=Count('issueid')).order_by('-count')[:5]
        formatted_areas = [{'name': a['mapaddress'] or 'Unknown', 'count': a['count']} for a in area_stats]
        return Response({"totalReports": total, "avgResolutionTime": avg_time_str, "satisfactionScore": round(avg_score, 1), "categoryStats": formatted_cats, "topAreas": formatted_areas})

class AuthoritySOSView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        sos_list = Emergencyreport.objects.all().order_by('-timestamp')
        serializer = AuthoritySOSSerializer(sos_list, many=True)
        return Response(serializer.data)

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
        return Response({'message': 'Units Dispatched Successfully'})

class VotingResultsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthorityIssueSerializer
    def get_queryset(self):
        return Issuereport.objects.annotate(upvotes=Count('issuevote', filter=Q(issuevote__votetype='up')), downvotes=Count('issuevote', filter=Q(issuevote__votetype='down'))).order_by('-upvotes')

class AuthorityEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        events = Event.objects.filter(status='Published').order_by('-date')
        serializer = AuthorityEventSerializer(events, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data
        user_email = UserEmail.objects.get(email=request.user.email)
        community = user_email.userid.communityid 
        if not community:
            community = Community.objects.first()
        Event.objects.create(postedbyid=user_email.userid, communityid=community, title=data.get('title'), description=data.get('description'), date=data.get('date'), time=data.get('time'), location=data.get('location'), category=data.get('category'), status='Published')
        return Response({'message': 'Event Created'}, status=201)

class AuthorityEventRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        requests = Event.objects.filter(status='Pending').order_by('-date')
        serializer = AuthorityEventSerializer(requests, many=True)
        return Response(serializer.data)

class AuthorityEventActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        action = request.data.get('action') 
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
        departments = Authority.objects.values_list('departmentname', flat=True).distinct()
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
                return Issuereport.objects.filter(communityid=community).order_by('-createdat')
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
            vote_type = request.data.get('type') 
            issue = Issuereport.objects.get(pk=issue_id)
            existing_vote = Issuevote.objects.filter(issueid=issue, residentid=resident).first()
            if existing_vote:
                if existing_vote.votetype == vote_type:
                    existing_vote.delete()
                    return Response({'status': 'removed'})
                else:
                    existing_vote.votetype = vote_type
                    existing_vote.save()
                    return Response({'status': 'updated', 'type': vote_type})
            else:
                Issuevote.objects.create(issueid=issue, residentid=resident, votetype=vote_type)
                return Response({'status': 'created', 'type': vote_type})
        except Issuereport.DoesNotExist:
            return Response({'error': 'Issue not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class NotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            notifs = Notification.objects.filter(userid=user_email.userid).order_by('-createdat')
            unread_count = notifs.filter(isread=False).count()
            serializer = NotificationSerializer(notifs[:10], many=True)
            return Response({'unread_count': unread_count, 'notifications': serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    def post(self, request):
        try:
            user_email = UserEmail.objects.get(email=request.user.email)
            Notification.objects.filter(userid=user_email.userid, isread=False).update(isread=True)
            return Response({'message': 'Notifications marked as read', 'unread_count': 0})
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
                    return Response({"error": "You must be assigned to a community to request events."}, status=status.HTTP_400_BAD_REQUEST)
                serializer.save(postedbyid=app_user, communityid=community, status='Pending')
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- BKASH CONFIGURATION ---
BKASH_BASE_URL = "https://checkout.sandbox.bka.sh/v1.2.0-beta/checkout"
BKASH_USERNAME = "YOUR_SANDBOX_USERNAME"      
BKASH_PASSWORD = "YOUR_SANDBOX_PASSWORD"      
BKASH_APP_KEY = "YOUR_SANDBOX_APP_KEY"        
BKASH_APP_SECRET = "YOUR_SANDBOX_APP_SECRET"  

def get_bkash_token():
    url = f"{BKASH_BASE_URL}/token/grant"
    headers = {"username": BKASH_USERNAME, "password": BKASH_PASSWORD, "Content-Type": "application/json", "Accept": "application/json"}
    body = {"app_key": BKASH_APP_KEY, "app_secret": BKASH_APP_SECRET}
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
        headers = {"Authorization": token, "X-APP-Key": BKASH_APP_KEY, "Content-Type": "application/json", "Accept": "application/json"}
        invoice_no = f"INV-{booking_id}-{uuid.uuid4().hex[:6].upper()}"
        payload = {"mode": "0011", "payerReference": "01700000000", "callbackURL": f"http://127.0.0.1:8000/api/payment/bkash/callback/", "amount": str(booking.price), "currency": "BDT", "intent": "sale", "merchantInvoiceNumber": invoice_no}
        response = requests.post(create_url, json=payload, headers=headers)
        data = response.json()
        if response.status_code == 200 and 'bkashURL' in data:
            return Response({'payment_url': data['bkashURL']})
        else:
            return Response({'error': data.get('statusMessage', 'Failed')}, status=400)

class BkashCallbackView(APIView):
    def get(self, request):
        payment_id = request.GET.get('paymentID')
        status_msg = request.GET.get('status') 
        if status_msg != 'success':
             return redirect('http://localhost:5173/book-service?payment=failed')
        token = get_bkash_token()
        if not token:
            return redirect('http://localhost:5173/book-service?payment=error')
        execute_url = f"{BKASH_BASE_URL}/payment/execute/{payment_id}"
        headers = {"Authorization": token, "X-APP-Key": BKASH_APP_KEY, "Accept": "application/json"}
        response = requests.post(execute_url, headers=headers)
        data = response.json()
        if data.get("statusCode") == "0000" and data.get("transactionStatus") == "Completed":
             merchant_inv = data.get('merchantInvoiceNumber')
             try:
                 booking_id = merchant_inv.split('-')[1] 
                 booking = Booking.objects.get(bookingid=booking_id)
                 booking.status = 'Confirmed'
                 booking.paymentstatus = 'Paid'
                 booking.save()
                 Payment.objects.create(bookingid=booking, amount=booking.price, method='Bkash', transactionid=data.get('trxID'), status='Completed')
                 return redirect('http://localhost:5173/book-service?payment=success')
             except Exception as e:
                 print("DB Error:", e)
                 return redirect('http://localhost:5173/book-service?payment=error')
        else:
             print("Execution Failed:", data)
             return redirect('http://localhost:5173/book-service?payment=failed')

class BkashQueryPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        payment_id = request.data.get('paymentID')
        token = get_bkash_token()
        query_url = f"{BKASH_BASE_URL}/payment/query/{payment_id}"
        headers = {"Authorization": token, "X-APP-Key": BKASH_APP_KEY, "Accept": "application/json"}
        response = requests.get(query_url, headers=headers)
        return Response(response.json())