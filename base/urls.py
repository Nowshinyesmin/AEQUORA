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
    ResidentDashboardView,

    DepartmentListView,


    ## NEW IMPORTS BY SAYEDA NUSRAT FOR AUTHORITY'S BACKEND

    AuthorityDashboardStatsView,
    AuthorityIssueListView,
    AuthorityIssueDetailView,
    AnalyticsSummaryView,
    AuthoritySOSView,
    AuthoritySOSDetailView,
    VotingResultsView,
    AuthorityEventView,
    AuthorityEventRequestsView,
    AuthorityEventActionView
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

    path('authority/departments/', DepartmentListView.as_view(), name='auth_dept_list'),

    # ==========================
    # NEW AUTHORITY ROUTES BY SAYEDA NUSRAT
    # ==========================

    # 1. Authority Dashboard
    path('authority/dashboard-stats/', AuthorityDashboardStatsView.as_view(), name='auth_dashboard'),

    # 2. Manage Issues (Frontend calls 'issues/')
    path('issues/', AuthorityIssueListView.as_view(), name='auth_issue_list'),
    path('issues/<int:pk>/', AuthorityIssueDetailView.as_view(), name='auth_issue_detail'),

    # 3. Analytics
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics_summary'),

    # 4. Emergency Management
    path('authority/sos/', AuthoritySOSView.as_view(), name='auth_sos_list'),
    path('authority/sos/<int:pk>/', AuthoritySOSDetailView.as_view(), name='auth_sos_update'),
    path('authority/sos/<int:pk>/dispatch/', AuthoritySOSDetailView.as_view(), name='auth_sos_dispatch'),

    # 5. Events & Requests
    path('authority/events/', AuthorityEventView.as_view(), name='auth_events'),
    path('authority/events/requests/', AuthorityEventRequestsView.as_view(), name='auth_event_requests'),
    path('authority/events/<int:pk>/action/', AuthorityEventActionView.as_view(), name='auth_event_action'),
    path('authority/events/<int:pk>/', AuthorityEventActionView.as_view(), name='auth_event_delete'),

    # 6. Voting Results
    path('authority/voting-results/', VotingResultsView.as_view(), name='voting_results'),
]


