# base/urls.py
from django.urls import path
from .views import (
    RegisterView, 
    CustomLoginView,
    UserMeView,
    EmergencySOSView,
    IssueReportView,
    EventListView,
    EventParticipationView,
    ServiceListView,
    BookingView,
    CommunityListView,
    ResidentDashboardView
)

urlpatterns = [
    # --- Authentication ---
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),

    # --- Resident Profile & Communities ---
    path('auth/users/me/', UserMeView.as_view(), name='user_profile'),
    path('communities/', CommunityListView.as_view(), name='community_list'),

    # --- Emergency SOS ---
    path('resident/sos/', EmergencySOSView.as_view(), name='emergency_sos'),

    # --- Issue Reports ---
    path('resident/issues/', IssueReportView.as_view(), name='issue_reports'),

    # --- Events ---
    path('resident/events/', EventListView.as_view(), name='event_list'),
    path('resident/events/participate/', EventParticipationView.as_view(), name='event_participate'),

    # --- Services & Bookings ---
    path('resident/services/', ServiceListView.as_view(), name='service_list'),
    path('resident/bookings/', BookingView.as_view(), name='booking_list'),

    path('resident/dashboard-stats/', ResidentDashboardView.as_view(), name='dashboard_stats'),
]