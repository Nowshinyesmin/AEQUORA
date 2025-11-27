# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Activitylog(models.Model):
    logid = models.AutoField(db_column='logID', primary_key=True)  # Field name made lowercase.
    userid = models.ForeignKey('User', models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    actiontype = models.CharField(db_column='actionType', max_length=50)  # Field name made lowercase.
    description = models.TextField(blank=True, null=True)
    entityaffected = models.CharField(db_column='entityAffected', max_length=100, blank=True, null=True)  # Field name made lowercase.
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'activitylog'


class ApiExample(models.Model):
    id = models.BigAutoField(primary_key=True)
    message = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'api_example'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Authority(models.Model):
    authorityid = models.AutoField(db_column='authorityID', primary_key=True)  # Field name made lowercase.
    userid = models.OneToOneField('User', models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    departmentname = models.CharField(db_column='departmentName', max_length=100, blank=True, null=True)  # Field name made lowercase.
    designation = models.CharField(max_length=50, blank=True, null=True)
    houseno = models.CharField(db_column='houseNo', max_length=20, blank=True, null=True)  # Field name made lowercase.
    street = models.CharField(max_length=50, blank=True, null=True)
    thana = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=50, blank=True, null=True)
    assignedarea = models.CharField(db_column='assignedArea', max_length=100, blank=True, null=True)  # Field name made lowercase.
    profilecertificate = models.CharField(db_column='profileCertificate', max_length=255, blank=True, null=True)  # Field name made lowercase.
    datejoined = models.DateField(db_column='dateJoined', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'authority'


class Authoritycommunity(models.Model):
    mapid = models.AutoField(db_column='mapID', primary_key=True)  # Field name made lowercase.
    authorityid = models.ForeignKey(Authority, models.DO_NOTHING, db_column='authorityID')  # Field name made lowercase.
    communityid = models.ForeignKey('Community', models.DO_NOTHING, db_column='communityID')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'authoritycommunity'
        unique_together = (('authorityid', 'communityid'),)


class Booking(models.Model):
    bookingid = models.AutoField(db_column='bookingID', primary_key=True)  # Field name made lowercase.
    serviceid = models.ForeignKey('Service', models.DO_NOTHING, db_column='serviceID')  # Field name made lowercase.
    residentid = models.ForeignKey('Resident', models.DO_NOTHING, db_column='residentID')  # Field name made lowercase.
    providerid = models.ForeignKey('Serviceprovider', models.DO_NOTHING, db_column='providerID')  # Field name made lowercase.
    communityid = models.ForeignKey('Community', models.DO_NOTHING, db_column='communityID')  # Field name made lowercase.
    bookingdate = models.DateField(db_column='bookingDate')  # Field name made lowercase.
    servicedate = models.DateField(db_column='serviceDate')  # Field name made lowercase.
    status = models.CharField(max_length=9, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    paymentstatus = models.CharField(db_column='paymentStatus', max_length=8, blank=True, null=True)  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'booking'


class Community(models.Model):
    communityid = models.AutoField(db_column='communityID', primary_key=True)  # Field name made lowercase.
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    thana = models.CharField(max_length=50)
    postalcode = models.CharField(db_column='postalCode', max_length=20)  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'community'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Emergencyreport(models.Model):
    sosid = models.AutoField(db_column='sosID', primary_key=True)  # Field name made lowercase.
    residentid = models.ForeignKey('Resident', models.DO_NOTHING, db_column='residentID')  # Field name made lowercase.
    communityid = models.ForeignKey(Community, models.DO_NOTHING, db_column='communityID')  # Field name made lowercase.
    emergencytype = models.CharField(db_column='emergencyType', max_length=8)  # Field name made lowercase.
    photo = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=9, blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'emergencyreport'


class Event(models.Model):
    eventid = models.AutoField(db_column='eventID', primary_key=True)  # Field name made lowercase.
    postedbyid = models.ForeignKey('User', models.DO_NOTHING, db_column='postedByID')  # Field name made lowercase.
    communityid = models.ForeignKey(Community, models.DO_NOTHING, db_column='communityID')  # Field name made lowercase.
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=8)
    status = models.CharField(max_length=9, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'event'


class Eventparticipation(models.Model):
    participationid = models.AutoField(db_column='participationID', primary_key=True)  # Field name made lowercase.
    eventid = models.ForeignKey(Event, models.DO_NOTHING, db_column='eventID')  # Field name made lowercase.
    residentid = models.ForeignKey('Resident', models.DO_NOTHING, db_column='residentID')  # Field name made lowercase.
    interesttype = models.CharField(db_column='interestType', max_length=10)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'eventparticipation'
        unique_together = (('eventid', 'residentid'),)


class Issueassignment(models.Model):
    assignmentid = models.AutoField(db_column='assignmentID', primary_key=True)  # Field name made lowercase.
    issueid = models.ForeignKey('Issuereport', models.DO_NOTHING, db_column='issueID')  # Field name made lowercase.
    authorityid = models.ForeignKey(Authority, models.DO_NOTHING, db_column='authorityID')  # Field name made lowercase.
    providerid = models.ForeignKey('Serviceprovider', models.DO_NOTHING, db_column='providerID', blank=True, null=True)  # Field name made lowercase.
    assigneddate = models.DateTimeField(db_column='assignedDate', blank=True, null=True)  # Field name made lowercase.
    remarks = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'issueassignment'


class Issuereport(models.Model):
    issueid = models.AutoField(db_column='issueID', primary_key=True)  # Field name made lowercase.
    residentid = models.ForeignKey('Resident', models.DO_NOTHING, db_column='residentID')  # Field name made lowercase.
    communityid = models.ForeignKey(Community, models.DO_NOTHING, db_column='communityID')  # Field name made lowercase.
    title = models.CharField(max_length=150)
    type = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    mapaddress = models.CharField(db_column='mapAddress', max_length=255, blank=True, null=True)  # Field name made lowercase.
    status = models.CharField(max_length=11, blank=True, null=True)
    prioritylevel = models.CharField(db_column='priorityLevel', max_length=6, blank=True, null=True)  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.
    resolvedat = models.DateTimeField(db_column='resolvedAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'issuereport'


class Issuevote(models.Model):
    voteid = models.AutoField(db_column='voteID', primary_key=True)  # Field name made lowercase.
    issueid = models.ForeignKey(Issuereport, models.DO_NOTHING, db_column='issueID')  # Field name made lowercase.
    residentid = models.ForeignKey('Resident', models.DO_NOTHING, db_column='residentID')  # Field name made lowercase.
    votetype = models.CharField(db_column='voteType', max_length=8)  # Field name made lowercase.
    votedat = models.DateTimeField(db_column='votedAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'issuevote'
        unique_together = (('issueid', 'residentid'),)


class Loginlog(models.Model):
    logid = models.AutoField(db_column='logID', primary_key=True)  # Field name made lowercase.
    userid = models.ForeignKey('User', models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    user_role = models.CharField(max_length=15, blank=True, null=True)
    logintime = models.DateTimeField(db_column='loginTime', blank=True, null=True)  # Field name made lowercase.
    logouttime = models.DateTimeField(db_column='logoutTime', blank=True, null=True)  # Field name made lowercase.
    ipaddress = models.CharField(db_column='ipAddress', max_length=45, blank=True, null=True)  # Field name made lowercase.
    deviceinfo = models.CharField(db_column='deviceInfo', max_length=255, blank=True, null=True)  # Field name made lowercase.
    twofactorstatus = models.CharField(db_column='twoFactorStatus', max_length=7, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'loginlog'


class Notification(models.Model):
    notificationid = models.AutoField(db_column='notificationID', primary_key=True)  # Field name made lowercase.
    userid = models.ForeignKey('User', models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    communityid = models.ForeignKey(Community, models.DO_NOTHING, db_column='communityID', blank=True, null=True)  # Field name made lowercase.
    message = models.TextField()
    type = models.CharField(max_length=7)
    link = models.CharField(max_length=255, blank=True, null=True)
    isread = models.IntegerField(db_column='isRead', blank=True, null=True)  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'notification'


class Payment(models.Model):
    paymentid = models.AutoField(db_column='paymentID', primary_key=True)  # Field name made lowercase.
    bookingid = models.OneToOneField(Booking, models.DO_NOTHING, db_column='bookingID')  # Field name made lowercase.
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=5)
    transactionid = models.CharField(db_column='transactionID', max_length=100, blank=True, null=True)  # Field name made lowercase.
    paymentdate = models.DateTimeField(db_column='paymentDate', blank=True, null=True)  # Field name made lowercase.
    status = models.CharField(max_length=8, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payment'


class Resident(models.Model):
    residentid = models.AutoField(db_column='residentID', primary_key=True)  # Field name made lowercase.
    userid = models.OneToOneField('User', models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    house_no = models.CharField(max_length=20, blank=True, null=True)
    street = models.CharField(max_length=50, blank=True, null=True)
    thana = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    verification_status = models.CharField(max_length=8, blank=True, null=True)
    registered_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resident'


class Review(models.Model):
    reviewid = models.AutoField(db_column='reviewID', primary_key=True)  # Field name made lowercase.
    bookingid = models.OneToOneField(Booking, models.DO_NOTHING, db_column='bookingID')  # Field name made lowercase.
    residentid = models.ForeignKey(Resident, models.DO_NOTHING, db_column='residentID')  # Field name made lowercase.
    providerid = models.ForeignKey('Serviceprovider', models.DO_NOTHING, db_column='providerID')  # Field name made lowercase.
    rating = models.JSONField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'review'


class Service(models.Model):
    serviceid = models.AutoField(db_column='serviceID', primary_key=True)  # Field name made lowercase.
    providerid = models.ForeignKey('Serviceprovider', models.DO_NOTHING, db_column='providerID')  # Field name made lowercase.
    communityid = models.ForeignKey(Community, models.DO_NOTHING, db_column='communityID')  # Field name made lowercase.
    servicename = models.CharField(db_column='serviceName', max_length=100)  # Field name made lowercase.
    category = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'service'


class Serviceprovider(models.Model):
    providerid = models.AutoField(db_column='providerID', primary_key=True)  # Field name made lowercase.
    userid = models.OneToOneField('User', models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    service_area = models.CharField(max_length=100, blank=True, null=True)
    workinghours = models.CharField(db_column='workingHours', max_length=50, blank=True, null=True)  # Field name made lowercase.
    certificationfile = models.CharField(db_column='certificationFile', max_length=255, blank=True, null=True)  # Field name made lowercase.
    availability_status = models.CharField(max_length=9, blank=True, null=True)
    subrole = models.CharField(db_column='subRole', max_length=50, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'serviceprovider'


class User(models.Model):
    userid = models.AutoField(db_column='userID', primary_key=True)  # Field name made lowercase.
    communityid = models.ForeignKey(Community, models.DO_NOTHING, db_column='communityID', blank=True, null=True)  # Field name made lowercase.
    firstname = models.CharField(db_column='firstName', max_length=50)  # Field name made lowercase.
    lastname = models.CharField(db_column='lastName', max_length=50)  # Field name made lowercase.
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=15)
    date_of_birth = models.DateField(db_column='date_Of_birth', blank=True, null=True)  # Field name made lowercase.
    gender = models.CharField(max_length=6, blank=True, null=True)
    twofactorcode = models.CharField(db_column='twoFactorCode', max_length=10, blank=True, null=True)  # Field name made lowercase.
    status = models.CharField(max_length=9, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt', blank=True, null=True)  # Field name made lowercase.
    updatedat = models.DateTimeField(db_column='updatedAt', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'user'


class UserEmail(models.Model):
    emailid = models.AutoField(db_column='emailID', primary_key=True)  # Field name made lowercase.
    userid = models.ForeignKey(User, models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    email = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'user_email'
        unique_together = (('userid', 'email'),)


class UserPhonenumber(models.Model):
    phoneid = models.AutoField(db_column='phoneID', primary_key=True)  # Field name made lowercase.
    userid = models.ForeignKey(User, models.DO_NOTHING, db_column='userID')  # Field name made lowercase.
    phonenumber = models.CharField(db_column='phoneNumber', max_length=20)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'user_phonenumber'
        unique_together = (('userid', 'phonenumber'),)
