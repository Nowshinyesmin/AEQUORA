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

# ==============================================================================
#  1. USER CREATION
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
                
                print(f"--- DEBUG: Created Profile for {role} ---")
        except Exception as e:
            print(f"--- DEBUG ERROR in User Creation: {str(e)} ---")

# ==============================================================================
#  2. BOOKING AVAILABILITY LOGIC
# ==============================================================================
@receiver(pre_save, sender=Booking)
def handle_booking_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_booking = Booking.objects.get(pk=instance.pk)
            # Decrease availability ONLY when status changes to Accepted
            if old_booking.status == 'Pending' and instance.status == 'Accepted':
                service = instance.serviceid
                if service.availability:
                    current_val = int(service.availability)
                    if current_val > 0:
                        service.availability = current_val - 1
                        service.save()
                        print(f"--- DEBUG: Service '{service.servicename}' Accepted. Availability reduced. ---")

        except Booking.DoesNotExist:
            pass

# ==============================================================================
#  3. NOTIFICATIONS (LINKS CORRECTED)
# ==============================================================================

# --- A. ISSUES ---
@receiver(post_save, sender=Issuereport)
def notify_new_issue(sender, instance, created, **kwargs):
    if created:
        print(f"--- DEBUG: New Issue '{instance.title}' Created ---")
        Notification.objects.create(
            userid=instance.residentid.userid, 
            communityid=instance.communityid,
            message=f"Success: Your issue report '{instance.title}' has been submitted.",
            type='issue',
            link='/report-issue' # <--- FIXED
        )

@receiver(post_save, sender=Issuereport)
def notify_issue_resolved(sender, instance, created, **kwargs):
    if not created and instance.status == 'Resolved':
        print(f"--- DEBUG: Issue '{instance.title}' Resolved ---")
        Notification.objects.create(
            userid=instance.residentid.userid, 
            communityid=instance.communityid,
            message=f"Good news! Your issue '{instance.title}' has been resolved.",
            type='issue',
            link='/report-issue' # <--- FIXED
        )

# --- B. EVENTS ---
@receiver(post_save, sender=Event)
def notify_event_changes(sender, instance, created, **kwargs):
    if not created and instance.status == 'Published':
        print(f"--- DEBUG: Event '{instance.title}' Approved ---")
        # Notify Creator
        Notification.objects.create(
            userid=instance.postedbyid,
            communityid=instance.communityid,
            message=f"Congratulations! Your event '{instance.title}' has been approved and published.",
            type='event',
            link='/events' # <--- FIXED
        )
        # Notify Community
        community_users = User.objects.filter(communityid=instance.communityid)
        notifs = []
        for user in community_users:
            if user != instance.postedbyid: 
                notifs.append(Notification(
                    userid=user,
                    communityid=instance.communityid,
                    message=f"New Event: '{instance.title}' is happening on {instance.date}!",
                    type='event',
                    link='/events' # <--- FIXED
                ))
        if notifs:
            Notification.objects.bulk_create(notifs)

# --- C. BOOKINGS (THIS IS THE FIX YOU ASKED FOR) ---
@receiver(post_save, sender=Booking)
def notify_new_booking(sender, instance, created, **kwargs):
    if created:
        print(f"--- DEBUG: New Booking for '{instance.serviceid.servicename}' ---")
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.communityid,
            message=f"Booking Sent: Request for '{instance.serviceid.servicename}' submitted successfully.",
            type='booking',
            link='/book-service' # <--- FIXED (Was /resident/bookings)
        )

@receiver(post_save, sender=Booking)
def notify_booking_update(sender, instance, created, **kwargs):
    if not created:
        if instance.status in ['Accepted', 'Rejected', 'Completed']:
            print(f"--- DEBUG: Booking Status Changed to {instance.status} ---")
            
            msg = ""
            if instance.status == 'Accepted':
                msg = f"Good news! Your booking for '{instance.serviceid.servicename}' has been ACCEPTED."
            elif instance.status == 'Rejected':
                msg = f"Update: Your booking for '{instance.serviceid.servicename}' was declined."
            elif instance.status == 'Completed':
                msg = f"Service '{instance.serviceid.servicename}' is marked as COMPLETED."

            if msg:
                Notification.objects.create(
                    userid=instance.residentid.userid,
                    communityid=instance.communityid,
                    message=msg,
                    type='booking',
                    link='/book-service' # <--- FIXED (Was /resident/bookings)
                )

# --- D. EMERGENCY SOS ---
@receiver(post_save, sender=Emergencyreport)
def notify_sos_sent(sender, instance, created, **kwargs):
    if created:
        print(f"--- DEBUG: SOS Sent ---")
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.communityid,
            message="SOS ALERT SENT! Authorities have been notified of your location.",
            type='sos',
            link='/sos' # <--- FIXED
        )

# --- E. PROFILE UPDATE ---
@receiver(post_save, sender=User)
def notify_profile_update(sender, instance, created, **kwargs):
    if not created:
        print(f"--- DEBUG: User Profile Updated for {instance.firstname} ---")
        Notification.objects.create(
            userid=instance,
            communityid=instance.communityid,
            message="Security Alert: Your profile information was updated.",
            type='profile',
            link='/profile' # <--- FIXED
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
            link='/community-voting' # <--- FIXED
        )

@receiver(post_save, sender=Eventparticipation)
def notify_event_join(sender, instance, created, **kwargs):
    if instance.interesttype == 'Going':
        Notification.objects.create(
            userid=instance.residentid.userid,
            communityid=instance.residentid.userid.communityid,
            message=f"You are going to event: '{instance.eventid.title}'",
            type='event',
            link='/events' # <--- FIXED
        )