from django.db import models
from django.conf import settings  # <--- Added this import

# --- Core Application Models ---

# 1. Community
class Community(models.Model):
    communityid = models.AutoField(db_column='communityID', primary_key=True)
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    thana = models.CharField(max_length=50)
    postalcode = models.CharField(db_column='postalCode', max_length=20)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)

    class Meta:
        db_table = 'Community'

# 2. User (UPDATED)
class User(models.Model):
    userid = models.AutoField(db_column='userID', primary_key=True)
    # --- ADDED THIS FIELD FOR SIGNALS.PY ---
   
    # ---------------------------------------
    communityid = models.ForeignKey(Community, models.SET_NULL, db_column='communityID', blank=True, null=True)
    firstname = models.CharField(db_column='firstName', max_length=50)
    lastname = models.CharField(db_column='lastName', max_length=50)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=15)
    date_of_birth = models.DateField(db_column='date_Of_birth', blank=True, null=True)
    gender = models.CharField(max_length=6, blank=True, null=True)
    twofactorcode = models.CharField(db_column='twoFactorCode', max_length=10, blank=True, null=True)
    status = models.CharField(max_length=9, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)
    updatedat = models.DateTimeField(db_column='updatedAt', auto_now=True)

    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.userid})"

    class Meta:
        db_table = 'User'

# 3. Resident
class Resident(models.Model):
    residentid = models.AutoField(db_column='residentID', primary_key=True)
    userid = models.OneToOneField(User, models.CASCADE, db_column='userID')
    house_no = models.CharField(max_length=20, blank=True, null=True)
    street = models.CharField(max_length=50, blank=True, null=True)
    thana = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    verification_status = models.CharField(max_length=8, blank=True, null=True)
    registered_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Resident'

# 4. ServiceProvider
class Serviceprovider(models.Model):
    providerid = models.AutoField(db_column='providerID', primary_key=True)
    userid = models.OneToOneField(User, models.CASCADE, db_column='userID')
    service_area = models.CharField(max_length=100, blank=True, null=True)
    workinghours = models.CharField(db_column='workingHours', max_length=50, blank=True, null=True)
    certificationfile = models.CharField(db_column='certificationFile', max_length=255, blank=True, null=True)
    availability_status = models.CharField(max_length=9, blank=True, null=True)
    subrole = models.CharField(db_column='subRole', max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'ServiceProvider'

# 5. Authority
class Authority(models.Model):
    authorityid = models.AutoField(db_column='authorityID', primary_key=True)
    userid = models.OneToOneField(User, models.CASCADE, db_column='userID')
    departmentname = models.CharField(db_column='departmentName', max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=50, blank=True, null=True)
    houseno = models.CharField(db_column='houseNo', max_length=20, blank=True, null=True)
    street = models.CharField(max_length=50, blank=True, null=True)
    thana = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=50, blank=True, null=True)
    assignedarea = models.CharField(db_column='assignedArea', max_length=100, blank=True, null=True)
    profilecertificate = models.CharField(db_column='profileCertificate', max_length=255, blank=True, null=True)
    datejoined = models.DateField(db_column='dateJoined', blank=True, null=True)

    class Meta:
        db_table = 'Authority'

# 6. User_Email
class UserEmail(models.Model):
    emailid = models.AutoField(db_column='emailID', primary_key=True)
    userid = models.ForeignKey(User, models.CASCADE, db_column='userID')
    email = models.CharField(max_length=100)

    class Meta:
        db_table = 'User_Email'
        unique_together = (('userid', 'email'),)

# 7. User_PhoneNumber
class UserPhonenumber(models.Model):
    phoneid = models.AutoField(db_column='phoneID', primary_key=True)
    userid = models.ForeignKey(User, models.CASCADE, db_column='userID')
    phonenumber = models.CharField(db_column='phoneNumber', max_length=20)

    class Meta:
        db_table = 'User_PhoneNumber'
        unique_together = (('userid', 'phonenumber'),)

# 8. Service
class Service(models.Model):
    serviceid = models.AutoField(db_column='serviceID', primary_key=True)
    providerid = models.ForeignKey(Serviceprovider, models.CASCADE, db_column='providerID')
    communityid = models.ForeignKey(Community, models.CASCADE, db_column='communityID')
    servicename = models.CharField(db_column='serviceName', max_length=100)
    category = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)

    class Meta:
        db_table = 'Service'

# 9. IssueReport
class Issuereport(models.Model):
    issueid = models.AutoField(db_column='issueID', primary_key=True)
    residentid = models.ForeignKey(Resident, models.CASCADE, db_column='residentID')
    communityid = models.ForeignKey(Community, models.CASCADE, db_column='communityID')
    title = models.CharField(max_length=150)
    type = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    mapaddress = models.CharField(db_column='mapAddress', max_length=255, blank=True, null=True)
    status = models.CharField(max_length=11, blank=True, null=True)
    prioritylevel = models.CharField(db_column='priorityLevel', max_length=6, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)
    resolvedat = models.DateTimeField(db_column='resolvedAt', blank=True, null=True)

    class Meta:
        db_table = 'IssueReport'

# 10. IssueVote
class Issuevote(models.Model):
    voteid = models.AutoField(db_column='voteID', primary_key=True)
    issueid = models.ForeignKey(Issuereport, models.CASCADE, db_column='issueID')
    residentid = models.ForeignKey(Resident, models.CASCADE, db_column='residentID')
    votetype = models.CharField(db_column='voteType', max_length=8)
    votedat = models.DateTimeField(db_column='votedAt', auto_now_add=True)

    class Meta:
        db_table = 'IssueVote'
        unique_together = (('issueid', 'residentid'),)

# 11. AuthorityCommunity
class Authoritycommunity(models.Model):
    mapid = models.AutoField(db_column='mapID', primary_key=True)
    authorityid = models.ForeignKey(Authority, models.CASCADE, db_column='authorityID')
    communityid = models.ForeignKey(Community, models.CASCADE, db_column='communityID')

    class Meta:
        db_table = 'AuthorityCommunity'
        unique_together = (('authorityid', 'communityid'),)

# 12. Event
class Event(models.Model):
    eventid = models.AutoField(db_column='eventID', primary_key=True)
    postedbyid = models.ForeignKey(User, models.CASCADE, db_column='postedByID')
    communityid = models.ForeignKey(Community, models.CASCADE, db_column='communityID')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=9, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)

    class Meta:
        db_table = 'Event'

# 13. EventParticipation
class Eventparticipation(models.Model):
    participationid = models.AutoField(db_column='participationID', primary_key=True)
    eventid = models.ForeignKey(Event, models.CASCADE, db_column='eventID')
    residentid = models.ForeignKey(Resident, models.CASCADE, db_column='residentID')
    interesttype = models.CharField(db_column='interestType', max_length=10)

    class Meta:
        db_table = 'EventParticipation'
        unique_together = (('eventid', 'residentid'),)

# 14. IssueAssignment
class Issueassignment(models.Model):
    assignmentid = models.AutoField(db_column='assignmentID', primary_key=True)
    issueid = models.ForeignKey(Issuereport, models.CASCADE, db_column='issueID')
    authorityid = models.ForeignKey(Authority, models.CASCADE, db_column='authorityID')
    providerid = models.ForeignKey(Serviceprovider, models.SET_NULL, db_column='providerID', blank=True, null=True)
    assigneddate = models.DateTimeField(db_column='assignedDate', auto_now_add=True)
    remarks = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = 'IssueAssignment'

# 15. EmergencyReport
class Emergencyreport(models.Model):
    sosid = models.AutoField(db_column='sosID', primary_key=True)
    residentid = models.ForeignKey(Resident, models.CASCADE, db_column='residentID')
    communityid = models.ForeignKey(Community, models.CASCADE, db_column='communityID')
    emergencytype = models.CharField(db_column='emergencyType', max_length=8)
    photo = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=9, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'EmergencyReport'

# 16. Notification
class Notification(models.Model):
    notificationid = models.AutoField(db_column='notificationID', primary_key=True)
    userid = models.ForeignKey(User, models.CASCADE, db_column='userID')
    communityid = models.ForeignKey(Community, models.SET_NULL, db_column='communityID', blank=True, null=True)
    message = models.TextField()
    type = models.CharField(max_length=7)
    link = models.CharField(max_length=255, blank=True, null=True)
    isread = models.BooleanField(db_column='isRead', default=False)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)

    class Meta:
        db_table = 'Notification'

# 17. Booking
class Booking(models.Model):
    bookingid = models.AutoField(db_column='bookingID', primary_key=True)
    serviceid = models.ForeignKey(Service, models.CASCADE, db_column='serviceID')
    residentid = models.ForeignKey(Resident, models.CASCADE, db_column='residentID')
    providerid = models.ForeignKey(Serviceprovider, models.CASCADE, db_column='providerID')
    communityid = models.ForeignKey(Community, models.CASCADE, db_column='communityID')
    bookingdate = models.DateField(db_column='bookingDate')
    servicedate = models.DateField(db_column='serviceDate')
    status = models.CharField(max_length=9, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    paymentstatus = models.CharField(db_column='paymentStatus', max_length=8, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)

    class Meta:
        db_table = 'Booking'

# 18. Payment
class Payment(models.Model):
    paymentid = models.AutoField(db_column='paymentID', primary_key=True)
    bookingid = models.OneToOneField(Booking, models.CASCADE, db_column='bookingID')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=5)
    transactionid = models.CharField(db_column='transactionID', max_length=100, blank=True, null=True)
    paymentdate = models.DateTimeField(db_column='paymentDate', auto_now_add=True)
    status = models.CharField(max_length=8, blank=True, null=True)

    class Meta:
        db_table = 'Payment'

# 19. Review
class Review(models.Model):
    reviewid = models.AutoField(db_column='reviewID', primary_key=True)
    bookingid = models.OneToOneField(Booking, models.CASCADE, db_column='bookingID')
    residentid = models.ForeignKey(Resident, models.CASCADE, db_column='residentID')
    providerid = models.ForeignKey(Serviceprovider, models.CASCADE, db_column='providerID')
    rating = models.IntegerField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', auto_now_add=True)

    class Meta:
        db_table = 'Review'

# 20. LoginLog
class Loginlog(models.Model):
    logid = models.AutoField(db_column='logID', primary_key=True)
    userid = models.ForeignKey(User, models.CASCADE, db_column='userID')
    user_role = models.CharField(max_length=15, blank=True, null=True)
    logintime = models.DateTimeField(db_column='loginTime', auto_now_add=True)
    logouttime = models.DateTimeField(db_column='logoutTime', blank=True, null=True)
    ipaddress = models.CharField(db_column='ipAddress', max_length=45, blank=True, null=True)
    deviceinfo = models.CharField(db_column='deviceInfo', max_length=255, blank=True, null=True)
    twofactorstatus = models.CharField(db_column='twoFactorStatus', max_length=7, blank=True, null=True)

    class Meta:
        db_table = 'LoginLog'

# 21. ActivityLog
class Activitylog(models.Model):
    logid = models.AutoField(db_column='logID', primary_key=True)
    userid = models.ForeignKey(User, models.CASCADE, db_column='userID')
    actiontype = models.CharField(db_column='actionType', max_length=50)
    description = models.TextField(blank=True, null=True)
    entityaffected = models.CharField(db_column='entityAffected', max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ActivityLog'

# --- Corrected Example Model (Was ApiExample) ---
# Renamed to Example so views.py and serializers.py imports work.
class Example(models.Model):
    id = models.BigAutoField(primary_key=True)
    message = models.CharField(max_length=255)

    class Meta:
        # If this table exists in DB as 'api_example', keep this. 
        # Otherwise, remove managed=False if you want Django to create it.
        managed = False
        db_table = 'api_example'