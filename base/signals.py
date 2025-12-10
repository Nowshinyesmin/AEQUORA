import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import (
    User, Community, Resident, Serviceprovider, Authority,
    Notification, Issuereport, Booking, Event, 
    Issuevote, Eventparticipation, Emergencyreport
)

AuthUser = get_user_model()
logger = logging.getLogger(__name__)

# --- Helper: Get Authorities of a Community ---
def get_community_authorities(community_id):
    if not community_id:
        return []
    return User.objects.filter(role='Authority', communityid=community_id)

# ==============================================================================
#  1. USER CREATION (Unchanged)
# ==============================================================================
@receiver(post_save, sender=AuthUser)
def create_user_profile_and_custom_user(sender, instance, created, **kwargs):
    if created:
        try:
            if hasattr(instance, 'profile_data'):
                profile_data = instance.profile_data
                role = profile_data.get('role')
                community_id = profile_data.get('community_id')

                custom_user = User.objects.create(
                    auth_user=instance, 
                    communityid_id=community_id if community_id else None,
                    firstname=profile_data.get('firstname'),
                    lastname=profile_data.get('lastname'),
                    role=role,
                )
                
                if role == 'Resident':
                    Resident.objects.create(userid=custom_user)
                elif role == 'ServiceProvider':
                    Serviceprovider.objects.create(userid=custom_user)
                elif role == 'Authority':
                    Authority.objects.create(userid=custom_user)
        except Exception as e:
            print(f"--- DEBUG ERROR in User Creation: {str(e)} ---")

# ==============================================================================
#  2. BOOKING AVAILABILITY LOGIC (Unchanged)
# ==============================================================================
@receiver(pre_save, sender=Booking)
def handle_booking_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_booking = Booking.objects.get(pk=instance.pk)
            if old_booking.status == 'Pending' and instance.status == 'Accepted':
                service = instance.serviceid
                if service.availability and int(service.availability) > 0:
                    service.availability = int(service.availability) - 1
                    service.save()
        except Booking.DoesNotExist:
            pass

# ==============================================================================
#  3. NOTIFICATIONS (CORRECTED LINKS & FILTERING)
# ==============================================================================

# --- A. ISSUES ---
@receiver(post_save, sender=Issuereport)
def notify_new_issue(sender, instance, created, **kwargs):
    if created:
        # 1. Notify Resident (Link -> /report-issue)
        Notification.objects.create(
            userid=instance.residentid.userid, 
            communityid=instance.communityid,
            message=f"Success: Your issue report '{instance.title}' has been submitted.",
            type='issue',
            link='/report-issue'
        )

        # 2. Notify Authorities (Link -> /authority/manage-issues)
        authorities = get_community_authorities(instance.communityid)
        auth_notifs = []
        for auth_user in authorities:
            auth_notifs.append(Notification(
                userid=auth_user,
                communityid=instance.communityid,
                message=f"New Issue: '{instance.title}' reported in {instance.mapaddress or 'your area'}.",
                type='issue',
                link='/authority/manage-issues' 
            ))
        if auth_notifs:
            Notification.objects.bulk_create(auth_notifs)

@receiver(post_save, sender=Issuereport)
def notify_issue_resolved(sender, instance, created, **kwargs):
    if not created and instance.status == 'Resolved':
        # Notify Resident
        Notification.objects.create(
            userid=instance.residentid.userid, 
            communityid=instance.communityid,
            message=f"Good news! Your issue '{instance.title}' has been resolved.",
            type='issue',
            link='/report-issue'
        )

# --- B. EVENTS ---
@receiver(post_save, sender=Event)
def notify_event_changes(sender, instance, created, **kwargs):
    # 1. New Event Request (Notify Authorities ONLY)
    if created and instance.status == 'Pending':
        authorities = get_community_authorities(instance.communityid)
        auth_notifs = []
        for auth_user in authorities:
            auth_notifs.append(Notification(
                userid=auth_user,
                communityid=instance.communityid,
                message=f"Event Request: Resident requested '{instance.title}'. Please review.",
                type='event',
                link='/authority/events' 
            ))
        if auth_notifs:
            Notification.objects.bulk_create(auth_notifs)

    # 2. Event Published (Notify Everyone appropriately)
    if not created and instance.status == 'Published':
        
        # A. Notify the Creator (Check if Creator is Authority or Resident)
        creator_link = '/events' # Default Resident link
        if instance.postedbyid.role == 'Authority':
            creator_link = '/authority/events'
            
        Notification.objects.create(
            userid=instance.postedbyid,
            communityid=instance.communityid,
            message=f"Your event '{instance.title}' has been approved and published.",
            type='event',
            link=creator_link 
        )
        
        # B. Notify Community (Residents AND Authorities)
        all_community_users = User.objects.filter(communityid=instance.communityid)
        
        broadcast_notifs = []
        for user in all_community_users:
            if user != instance.postedbyid:
                target_link = '/events'
                if user.role == 'Authority':
                    target_link = '/authority/events' 
                elif user.role == 'ServiceProvider':
                    target_link = '/serviceprovider/dashboard'

                broadcast_notifs.append(Notification(
                    userid=user,
                    communityid=instance.communityid,
                    message=f"New Event: '{instance.title}' is happening on {instance.date}!",
                    type='event',
                    link=target_link 
                ))
        
        if broadcast_notifs:
            Notification.objects.bulk_create(broadcast_notifs)


# --- C. EMERGENCY SOS (FIXED SECTION) ---
@receiver(post_save, sender=Emergencyreport)
def notify_sos_sent(sender, instance, created, **kwargs):
    if created:
        # 1. Notify Resident
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.communityid,
            message="SOS ALERT SENT! Authorities have been notified.",
            type='sos',
            link='/sos' # Resident Link
        )

        # 2. Notify Authorities
        authorities = get_community_authorities(instance.communityid)
        auth_notifs = []
        for auth_user in authorities:
            auth_notifs.append(Notification(
                userid=auth_user,
                communityid=instance.communityid,
                message=f"URGENT SOS: {instance.emergencytype} reported at {instance.location}.",
                type='sos',
                link='/authority/emergency' # Authority Link
            ))
        if auth_notifs:
            Notification.objects.bulk_create(auth_notifs)

# --- NEW: NOTIFY RESIDENT ON RESOLUTION ---
@receiver(post_save, sender=Emergencyreport)
def notify_sos_resolved(sender, instance, created, **kwargs):
    # This logic was missing in your original code
    if not created and instance.status == 'Resolved':
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.communityid,
            message=f"Good news! Your Emergency SOS at {instance.location} has been marked as RESOLVED by authorities.",
            type='sos',
            link='/sos' # Resident Link
        )


# --- D. PROFILE UPDATE ---
@receiver(post_save, sender=User)
def notify_profile_update(sender, instance, created, **kwargs):
    if not created:
        role_link = '/profile' 
        if instance.role == 'Authority':
            role_link = '/authority/profile'
        elif instance.role == 'ServiceProvider':
            role_link = '/serviceprovider/profile'
        
        Notification.objects.create(
            userid=instance,
            communityid=instance.communityid,
            message="Security Alert: Your profile information was updated.",
            type='profile',
            link=role_link 
        )

# --- E. BOOKING ---
@receiver(post_save, sender=Booking)
def notify_booking_updates(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.communityid,
            message=f"Booking Sent: Request for '{instance.serviceid.servicename}' submitted.",
            type='booking',
            link='/book-service'
        )
    elif instance.status in ['Accepted', 'Rejected', 'Completed']:
        msg = f"Your booking for '{instance.serviceid.servicename}' is now {instance.status}."
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.communityid,
            message=msg,
            type='booking',
            link='/book-service'
        )

# --- F. VOTING & PARTICIPATION ---
@receiver(post_save, sender=Issuevote)
def notify_vote_cast(sender, instance, created, **kwargs):
    if created:
        vote_action = "upvoted" if instance.votetype == 'up' else "downvoted"
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.residentid.userid.communityid,
            message=f"You {vote_action} the issue: '{instance.issueid.title}'.",
            type='vote',
            link='/community-voting'
        )

@receiver(post_save, sender=Eventparticipation)
def notify_event_join(sender, instance, created, **kwargs):
    if instance.interesttype == 'Going':
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.residentid.userid.communityid,
            message=f"You are going to event: '{instance.eventid.title}'",
            type='event',
            link='/events'
        )