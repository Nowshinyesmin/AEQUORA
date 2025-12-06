# base/urls.py
from django.urls import path
import base.signals
from .views import (
    RegisterView, 
    CustomLoginView,
    UserMeView,
    EmergencySOSView,
    IssueReportView,
    EventListView,
    ResidentPendingEventsView,
    EventParticipationView,
    ServiceListView,
    BookingView,
    BookingDetailView,
    CommunityListView,
    ResidentDashboardView,
    EventRequestView,
    DepartmentListView,

    # Bkash Payment Integration
    BkashInitiateView,
    BkashCallbackView,
    BkashQueryPaymentView,

    # Authority's Backend
    AuthorityDashboardStatsView,
    AuthorityIssueListView,
    AuthorityIssueDetailView,
    AnalyticsSummaryView,
    AuthoritySOSView,
    AuthoritySOSDetailView,
    VotingResultsView,
    AuthorityEventView,
    AuthorityEventRequestsView,
    AuthorityEventActionView,

    # Community & Notification
    CommunityIssueListView,
    IssueVoteView,
    NotificationView,

    # --- NEW IMPORT ---
    ChangePasswordView
)

urlpatterns = [
    # --- Authentication ---
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    
    # --- NEW: Password Change ---
    path('auth/users/set_password/', ChangePasswordView.as_view(), name='change_password'),

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
    path('resident/events/request/', EventRequestView.as_view(), name='event_request'),
    path('resident/events/pending/', ResidentPendingEventsView.as_view(), name='resident_pending_events'),

    # --- Services & Bookings ---
    path('resident/services/', ServiceListView.as_view(), name='service_list'),
    path('resident/bookings/', BookingView.as_view(), name='booking_list'),
    path('resident/bookings/<int:pk>/', BookingDetailView.as_view(), name='booking_detail'),

    path('resident/dashboard-stats/', ResidentDashboardView.as_view(), name='dashboard_stats'),

    path('authority/departments/', DepartmentListView.as_view(), name='auth_dept_list'),

    # -------------------------Bkash Payment Integration -------------------------
    path('payment/bkash/initiate/', BkashInitiateView.as_view(), name='bkash_init'),
    path('payment/bkash/callback/', BkashCallbackView.as_view(), name='bkash_callback'),
    path('payment/bkash/query/', BkashQueryPaymentView.as_view(), name='bkash_query'),

    # Community Voting
    path('resident/community-issues/', CommunityIssueListView.as_view(), name='community_issues'),
    path('resident/vote/', IssueVoteView.as_view(), name='cast_vote'),
    
    # Notifications
    path('resident/notifications/', NotificationView.as_view(), name='notifications'),

    # ==========================
    # AUTHORITY ROUTES
    # ==========================
    path('authority/dashboard-stats/', AuthorityDashboardStatsView.as_view(), name='auth_dashboard'),
    path('issues/', AuthorityIssueListView.as_view(), name='auth_issue_list'),
    path('issues/<int:pk>/', AuthorityIssueDetailView.as_view(), name='auth_issue_detail'),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics_summary'),
    path('authority/sos/', AuthoritySOSView.as_view(), name='auth_sos_list'),
    path('authority/sos/<int:pk>/', AuthoritySOSDetailView.as_view(), name='auth_sos_update'),
    path('authority/sos/<int:pk>/dispatch/', AuthoritySOSDetailView.as_view(), name='auth_sos_dispatch'),
    path('authority/events/', AuthorityEventView.as_view(), name='auth_events'),
    path('authority/events/requests/', AuthorityEventRequestsView.as_view(), name='auth_event_requests'),
    path('authority/events/<int:pk>/action/', AuthorityEventActionView.as_view(), name='auth_event_action'),
    path('authority/events/<int:pk>/', AuthorityEventActionView.as_view(), name='auth_event_delete'),
    path('authority/voting-results/', VotingResultsView.as_view(), name='voting_results'),
]