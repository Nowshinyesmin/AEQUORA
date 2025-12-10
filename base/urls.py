from django.urls import path
import base.signals

# ADDED BY SAYEDA NUSRAT FOR THE EVIDENCE PHOTO 

from django.conf import settings
from django.conf.urls.static import static
from .views import (
    # --- Admin (hard-coded admin panel) ---
    AdminProfileView,
    AdminPasswordChangeView,
    AdminCreateCommunityView,
    AdminCommunityListView,
    AdminCommunityDetailView,
    AdminUserListView,
    AdminUserStatusToggleView,
    AdminDashboardStatsView,

    # --- Authentication & Core ---
    RegisterView,
    CustomLoginView,
    ChangePasswordView,
    UserMeView,
    CommunityListView,
    DepartmentListView,

    # --- Resident Views ---
    ResidentDashboardView,
    EmergencySOSView,
    IssueReportView,
    EventListView,
    ResidentPendingEventsView,
    EventParticipationView,
    EventRequestView,
    ServiceListView,
    BookingView,
    BookingDetailView,
    CommunityIssueListView,
    IssueVoteView,
    NotificationView,

    # --- bKash Payment Integration ---
    BkashInitiateView,
    BkashCallbackView,
    BkashQueryPaymentView,

    # --- Authority Views ---
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
    AuthorityProfileView,
   
    # --- Service Provider Views ---
    ProviderDashboardStatsView,
    ProviderServiceManageView,
    ProviderServiceDetailView,
    ProviderBookingManageView,
    ProviderBookingStatusUpdateView,
    ProviderProfileView,
    ProviderReviewsListView,
)

urlpatterns = [
    # ==========================
    # AUTHENTICATION
    # ==========================
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('auth/users/set_password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/users/me/', UserMeView.as_view(), name='user_profile'),
    path('communities/', CommunityListView.as_view(), name='community_list'),

    # ==========================
    # RESIDENT ROUTES
    # ==========================
    # Dashboard
    path('resident/dashboard-stats/', ResidentDashboardView.as_view(), name='dashboard_stats'),

    # Emergency SOS
    path('resident/sos/', EmergencySOSView.as_view(), name='emergency_sos'),

    # Issue Reports
    path('resident/issues/', IssueReportView.as_view(), name='issue_reports'),

    # Events
    path('resident/events/', EventListView.as_view(), name='event_list'),
    path('resident/events/participate/', EventParticipationView.as_view(), name='event_participate'),
    path('resident/events/request/', EventRequestView.as_view(), name='event_request'),
    path('resident/events/pending/', ResidentPendingEventsView.as_view(), name='resident_pending_events'),

    # Services & Bookings
    path('resident/services/', ServiceListView.as_view(), name='service_list'),
    path('resident/bookings/', BookingView.as_view(), name='booking_list'),
    path('resident/bookings/<int:pk>/', BookingDetailView.as_view(), name='booking_detail'),

    # Community Voting
    path('resident/community-issues/', CommunityIssueListView.as_view(), name='community_issues'),
    path('resident/vote/', IssueVoteView.as_view(), name='cast_vote'),

    # Notifications (Resident)
    path('resident/notifications/', NotificationView.as_view(), name='notifications'),
   
    # ==========================
    # BKASH PAYMENT INTEGRATION
    # ==========================
    path('payment/bkash/initiate/', BkashInitiateView.as_view(), name='bkash_init'),
    path('payment/bkash/callback/', BkashCallbackView.as_view(), name='bkash_callback'),
    path('payment/bkash/query/', BkashQueryPaymentView.as_view(), name='bkash_query'),

    # ==========================
    # AUTHORITY ROUTES
    # ==========================
    path('authority/dashboard-stats/', AuthorityDashboardStatsView.as_view(), name='auth_dashboard'),
    path('authority/departments/', DepartmentListView.as_view(), name='auth_dept_list'),

    # Issues & Analytics
    path('issues/', AuthorityIssueListView.as_view(), name='auth_issue_list'),
    path('issues/<int:pk>/', AuthorityIssueDetailView.as_view(), name='auth_issue_detail'),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics_summary'),
    path('authority/voting-results/', VotingResultsView.as_view(), name='voting_results'),

    # SOS Management
    path('authority/sos/', AuthoritySOSView.as_view(), name='auth_sos_list'),
    path('authority/sos/<int:pk>/', AuthoritySOSDetailView.as_view(), name='auth_sos_update'),
    path('authority/sos/<int:pk>/dispatch/', AuthoritySOSDetailView.as_view(), name='auth_sos_dispatch'),

    # Event Management
    path('authority/events/', AuthorityEventView.as_view(), name='auth_events'),
    path('authority/events/requests/', AuthorityEventRequestsView.as_view(), name='auth_event_requests'),
    path('authority/events/<int:pk>/action/', AuthorityEventActionView.as_view(), name='auth_event_action'),
    path('authority/events/<int:pk>/', AuthorityEventActionView.as_view(), name='auth_event_delete'),
    
    # Authority Profile
    path('authority/profile/', AuthorityProfileView.as_view(), name='authority_profile'),

    # --- AUTHORITY NOTIFICATIONS (New Endpoint) ---
    # We reuse NotificationView because the logic (fetch by request.user) is the same
    path('authority/notifications/', NotificationView.as_view(), name='auth_notifications'),


    # ==========================
    # SERVICE PROVIDER ROUTES
    # ==========================
    path('provider/dashboard/', ProviderDashboardStatsView.as_view(), name='provider_dashboard'),
    path('provider/services/', ProviderServiceManageView.as_view(), name='provider_services'),
    path('provider/services/<int:pk>/', ProviderServiceDetailView.as_view(), name='provider_service_detail'),
    path('provider/bookings/', ProviderBookingManageView.as_view(), name='provider_bookings'),
    path('provider/bookings/<int:pk>/update/', ProviderBookingStatusUpdateView.as_view(), name='provider_booking_update'),
    path('provider/profile/', ProviderProfileView.as_view(), name='provider_profile'),
    path('provider/reviews/', ProviderReviewsListView.as_view(), name='provider_reviews'),

    # ==========================
    # HARD-CODED ADMIN PANEL
    # ==========================
    path('admin/profile/', AdminProfileView.as_view(), name='admin_profile'),
    path('admin/change-password/', AdminPasswordChangeView.as_view(), name='admin_change_password'),
    path("admin/create-community/", AdminCreateCommunityView.as_view(), name="admin-create-community"),
    path("admin/communities/", AdminCommunityListView.as_view(), name="admin-community-list"),
    path("admin/communities/<int:pk>/", AdminCommunityDetailView.as_view(), name="admin-community-detail"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path(
        "admin/users/<int:pk>/toggle-status/",
        AdminUserStatusToggleView.as_view(),
        name="admin-user-toggle-status",
    ),
    path("admin/dashboard-stats/", AdminDashboardStatsView.as_view(), name="admin-dashboard-stats"),

]
# ... existing urlpatterns list ...

# ADD THIS BLOCK AT THE END
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)