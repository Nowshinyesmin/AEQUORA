from django.urls import path
from .views import RegisterView, CustomLoginView

urlpatterns = [
    # Custom Registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # Custom Login (Replaces Djoser for now)
    path('login/', CustomLoginView.as_view(), name='custom_login'),

    # --- ADD THESE LINES BELOW ---
    # This enables the /users/me/ endpoint and token endpoints
    #path('auth/', include('djoser.urls')),
    #path('auth/', include('djoser.urls.authtoken')),
]