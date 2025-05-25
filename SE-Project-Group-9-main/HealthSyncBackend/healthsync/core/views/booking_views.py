from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Patient, Doctor
from core.models import Booking, TimeSlot, Authentication
from core.serializers.booking_serializers import BookingSerializer
from datetime import datetime, timedelta, date as date_class
from core.utils import send_custom_email

class BookingView(APIView):
    def get(self, request):
        qs = Booking.objects.all()
        doctor_id  = request.query_params.get("doctor_id")
        patient_id = request.query_params.get("patient_id")
        date_str   = request.query_params.get("date")
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if date_str:
            try:
                qs = qs.filter(date=date_str)
            except ValueError:
                return Response(
                    {"error": "Invalid date format – use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = BookingSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        required = ['patient_id', 'doctor_id', 'timeslot_id', 'date', 'start_time']
        missing  = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {'error': f'Missing fields: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            ts = TimeSlot.objects.get(timeslot_id=data['timeslot_id'])
            if ts.availability_status != 'available':
                return Response({'error': 'Timeslot no longer available'}, status=400)
        except TimeSlot.DoesNotExist:
            return Response({'error': 'Invalid timeslot'}, status=400)
        try:
            book_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            start_time_obj = datetime.fromisoformat(data['start_time'])
            if book_date < date_class.today() or start_time_obj < datetime.now():
                return Response({'error': 'Booking must be in the future.'}, status=status.HTTP_400_BAD_REQUEST)
            end_time_obj = start_time_obj + timedelta(minutes=30)
            data['start_time'] = start_time_obj.isoformat()
            data['end_time']   = end_time_obj.isoformat()
        except Exception:
            return Response({'error': 'Invalid date/start_time'}, status=status.HTTP_400_BAD_REQUEST)
        overlap = Booking.objects.filter(
            doctor_id=data['doctor_id'],
            appointment_status='confirmed',
            date=book_date,
            start_time__lt=end_time_obj,
            end_time__gt=start_time_obj,
        )
        if overlap.exists():
            return Response({'error': 'Doctor already booked in that slot'}, status=status.HTTP_409_CONFLICT)
        new_id = Booking.objects.count()
        booking_id = f'B{new_id}'
        while Booking.objects.filter(booking_id=booking_id).exists():
            new_id += 1
            booking_id = f'B{new_id}'
        data['booking_id'] = booking_id
        data['appointment_status'] = 'confirmed'
        serializer = BookingSerializer(data=data)
        if serializer.is_valid():
            booking = serializer.save()
            patient = get_object_or_404(Patient, patient_id=booking.patient_id)
            doctor  = get_object_or_404(Doctor, doctor_id=booking.doctor_id)
            subject = "Your Appointment is Confirmed"
            message = f"""
                Dear {patient.first_name},

                Your appointment with Dr. {doctor.first_name} {doctor.last_name} has been successfully booked.
                Appointment Details:
                • Date: {booking.date}
                • Time: {booking.start_time}

                Please reach out if you have any questions.
                """
            auth_rec = Authentication.objects.get(user_id=booking.patient_id)
            send_custom_email(
                subject=subject,
                message=message,
                recipient_list=[auth_rec.email],
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class BookingDetailView(APIView):
    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, booking_id=booking_id)
        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, booking_id):
        booking = get_object_or_404(Booking, booking_id=booking_id)
        serializer = BookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, booking_id):
        booking = get_object_or_404(Booking, booking_id=booking_id)
        patient = get_object_or_404(Patient, patient_id=booking.patient_id)
        doctor = get_object_or_404(Doctor, doctor_id=booking.doctor_id)
        try:
            auth_rec = Authentication.objects.get(user_id=booking.patient_id)
            recipient = auth_rec.email
        except Authentication.DoesNotExist:
            recipient = None
        if recipient:
            email_subject = "Your Appointment has been Cancelled"
            email_message = f"""
                Dear {patient.first_name},

                We regret to inform you that your appointment with Dr. {doctor.first_name} {doctor.last_name} on {booking.date} at {booking.start_time} has been cancelled.

                We apologize for any inconvenience this may cause. Please reach out if you have any questions or need to reschedule.

                Best regards,
                HealthSync Team
                """
            send_custom_email(
                subject=email_subject,
                message=email_message,
                recipient_list=[recipient],
            )
        booking.delete()
        return Response({"message": "Booking deleted successfully, and cancellation email sent."}, status=status.HTTP_204_NO_CONTENT)
