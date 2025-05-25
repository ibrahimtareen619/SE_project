from bson import ObjectId
from djongo import models
from django.core.validators import RegexValidator

cnic_validator = RegexValidator(
    regex=r'^\d{13}$',
    message='CNIC must be exactly 13 digits (numbers only).'
)

class Patient(models.Model):
    _id = models.ObjectIdField(default = ObjectId, primary_key = True)
    patient_id = models.CharField(max_length = 50, unique = True)
    first_name = models.CharField(max_length = 100)
    last_name = models.CharField(max_length = 100)
    gender = models.CharField(max_length = 10, choices = [('Male', 'Male'), ('Female', 'Female'),])
    date_of_birth = models.DateField()
    age = models.IntegerField()
    cnic = models.CharField(max_length = 13, unique = True, validators = [cnic_validator])
    address = models.TextField(null = True)
    blood_type = models.CharField(max_length = 3, blank = True, null = True)
    emergency_contact = models.CharField(max_length = 20)
    medical_history = models.TextField(default = "", blank = True)

    def __str__(self):
        return (f"{self.first_name} {self.last_name}")

class Hospital(models.Model):
    _id = models.ObjectIdField(default = ObjectId, primary_key = True)
    hospital_id = models.CharField(max_length = 50, unique = True)
    name = models.CharField(max_length = 255)
    address = models.TextField()
    phone_number = models.CharField(max_length = 20)
    email = models.EmailField()
    type = models.CharField(max_length = 10, choices = [('clinic', 'Clinic'), ('hospital', 'Hospital')])
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    doctor_ids = models.JSONField(default = list)

    @property
    def doctors(self):
        """Get related doctors using stored IDs"""
        return (Doctor.objects.filter(_id__in = [ObjectId(did) for did in self.doctor_ids]))

    def __str__(self):
        return (self.name)

class Doctor(models.Model):
    _id = models.ObjectIdField(default = ObjectId, primary_key = True)
    doctor_id = models.CharField(max_length = 50, unique = True)
    first_name = models.CharField(max_length = 100)
    last_name = models.CharField(max_length = 100)
    gender = models.CharField(max_length = 10, choices = [('Male', 'Male'), ('Female', 'Female')])
    date_of_birth = models.DateField()
    age = models.IntegerField()
    cnic = models.CharField(max_length = 13, unique = True, validators = [cnic_validator])
    picture = models.URLField(null = True, blank = True)
    education = models.JSONField()
    specialization = models.CharField(max_length = 100)
    hospital_name = models.CharField(max_length = 100, null = True)

    def __str__(self):
        return (f"Dr. {self.first_name} {self.last_name}")

class TimeSlot(models.Model):
    _id = models.ObjectIdField(default=ObjectId, primary_key=True)
    timeslot_id = models.CharField(max_length=50, unique=True)
    doctor_id = models.CharField(max_length=50)
    start_time = models.TimeField(null=True)
    end_time = models.TimeField(null=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    availability_status = models.CharField(max_length = 20, choices = [('available', 'Available'), ('unavailable', 'Unavailable')], default = 'available')
    
    def __str__(self):
        return (f"{self.doctor} - {self.start_time} to {self.end_time}")

class Booking(models.Model):
    _id = models.ObjectIdField(default=ObjectId, primary_key=True)
    booking_id = models.CharField(max_length=50, unique=True)
    patient_id = models.CharField(max_length=50)
    doctor_id = models.CharField(max_length=50)
    timeslot_id = models.CharField(max_length=50)
    date = models.DateField(null=True)
    start_time = models.CharField(max_length=50)
    end_time = models.CharField(max_length=50)
    appointment_status = models.CharField(max_length = 20, choices = [('confirmed', 'confirmed'), ('cancelled', 'cancelled'), ('completed', 'completed')])

    def __str__(self):
        return (f"Booking {self.booking_id} - {self.appointment_status}")

class Authentication(models.Model):
    _id = models.ObjectIdField(default = ObjectId, primary_key = True)
    user_id = models.CharField(max_length = 50)
    user_type = models.CharField(max_length = 20, choices = [('doctor', 'doctor'), ('patient', 'patient')], default = 'patient')
    phone_number = models.CharField(max_length = 20)
    email = models.EmailField()
    password = models.CharField(max_length = 255)

    def __str__(self):
        return (self.email)