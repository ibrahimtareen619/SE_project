from django.urls import path
from .views.doctor_views import DoctorView, DoctorDetailView, DoctorSummaryDetailView
from .views.patient_views import PatientView, PatientDetailView
from .views.timeslot_views import TimeSlotView, TimeSlotDetailView
from .views.booking_views import BookingView, BookingDetailView
from .views.authentication_views import (
    AuthenticationView,
    AuthenticationDetailView,
    AuthenticationByEmailView,
    AuthenticationLoginView,
)
from . import views

urlpatterns = [
    path('doctors/', DoctorView.as_view(), name='doctor-list'),
    path('doctors/<str:doctor_id>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('doctors/<str:doctor_id>/summary/', DoctorSummaryDetailView.as_view(), name='doctor-summary'),

    path('patients/', PatientView.as_view()),
    path('patients/<str:patient_id>/', PatientDetailView.as_view()),

    path('timeslots/', TimeSlotView.as_view()),                   
    path('timeslots/<str:timeslot_id>/', TimeSlotDetailView.as_view()),

    path('bookings/', BookingView.as_view()),
    path('bookings/<str:booking_id>/', BookingDetailView.as_view()),

    path('authentication/', AuthenticationView.as_view()),
    path('authentication/email/<str:email>/', AuthenticationByEmailView.as_view(), name='auth-by-email'),
    path("authentication/login/", AuthenticationLoginView.as_view(), name="auth-login"),
    path('authentication/<str:user_id>/', AuthenticationDetailView.as_view()),
]

