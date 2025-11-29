import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import User, Community, Resident, Serviceprovider, Authority

# Django's built-in User model provided by Djoser/Django Auth
AuthUser = get_user_model()
logger = logging.getLogger(__name__)

# NOTE: This signal relies on CustomUserCreateSerializer passing data via 'profile_data'

@receiver(post_save, sender=AuthUser)
def create_user_profile_and_custom_user(sender, instance, created, **kwargs):
    if created:
        try:
            # The custom Djoser serializer stores profile data here temporarily
            if hasattr(instance, 'profile_data'):
                profile_data = instance.profile_data
                
                # Retrieve custom fields
                role = profile_data.get('role')
                community_id = profile_data.get('community_id')

                # Find the corresponding custom User object (1:1 with AuthUser)
                # Note: In your model setup, 'User' is your custom model linked to AuthUser via keys or logic.
                # If your architecture uses a separate custom User table that mirrors AuthUser, create it here.
                
                custom_user = User.objects.create(
                    auth_user=instance,  # Link to the Djoser-managed AuthUser if your model supports it
                    communityid_id=community_id if community_id else None,
                    firstname=profile_data.get('firstname'),
                    lastname=profile_data.get('lastname'),
                    role=role,
                    # Password hash is managed by AuthUser, so we might not set it here or copy it if needed
                )
                
                # CRITICAL: Create the specific role profile based on the 'role' field
                if role == 'Resident':
                    # Create Resident profile, linking to the newly created custom User instance
                    Resident.objects.create(userid=custom_user)
                    logger.info(f"Resident profile created for user {instance.username}")
                    
                elif role == 'ServiceProvider':
                    # Create ServiceProvider profile
                    Serviceprovider.objects.create(userid=custom_user)
                    logger.info(f"Service Provider profile created for user {instance.username}")
                    
                elif role == 'Authority':
                    # Create Authority profile
                    Authority.objects.create(userid=custom_user)
                    logger.info(f"Authority profile created for user {instance.username}")
                
                else:
                    logger.warning(f"User {instance.username} created with unknown role: {role}")

        except Exception as e:
            logger.error(f"Error creating user profile for {instance.username}: {e}")
            # Optional: Delete the AuthUser instance if profile creation fails to maintain data integrity
            # instance.delete()