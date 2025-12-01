# AEQUORA/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- THE FIX ---
    # We add 'api/' here so it matches the frontend's request
    path('api/', include('base.urls')), 
]

# Allow viewing uploaded images during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)