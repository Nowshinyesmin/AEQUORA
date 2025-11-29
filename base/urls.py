from django.urls import path
from .views import RegisterView, CustomLoginView

urlpatterns = [
    # Custom Registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # Custom Login (Replaces Djoser for now)
    path('login/', CustomLoginView.as_view(), name='custom_login'),
]