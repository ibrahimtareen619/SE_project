from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
import traceback
import logging
from core.models import Authentication, Patient, Doctor
from core.serializers.authentication_serializers import AuthenticationSerializer
from core.utils import send_custom_email

logger = logging.getLogger(__name__)

class AuthenticationView(APIView):
    def get(self, request):
        auth_records = Authentication.objects.all()
        serializer = AuthenticationSerializer(auth_records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        required = ['user_id', 'user_type', 'phone_number', 'email', 'password']
        if any(field not in request.data for field in required):
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if request.data['user_type'] == "patient":
            try:
                Patient.objects.get(patient_id=request.data['user_id'])
            except Patient.DoesNotExist:
                return Response(
                    {"error": "Invalid user_id - patient not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif request.data['user_type'] == "doctor":
            try:
                Doctor.objects.get(doctor_id=request.data['user_id'])
            except Doctor.DoesNotExist:
                return Response(
                    {"error": "Invalid user_id - doctor not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        if Authentication.objects.filter(email=request.data['email']).exists():
            return Response(
                {"error": "Email already registered"},
                status=status.HTTP_409_CONFLICT
            )
        if Authentication.objects.filter(phone_number=request.data['phone_number']).exists():
            return Response(
                {"error": "Phone number already registered"},
                status=status.HTTP_409_CONFLICT
            )
        data = request.data.copy()
        data['password'] = make_password(data['password'])
        serializer = AuthenticationSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            auth_rec = serializer.save()
            if auth_rec.user_type == "patient":
                try:
                    patient = Patient.objects.get(patient_id=auth_rec.user_id)
                    send_custom_email(
                        subject="Welcome to the Hospital System",
                        message=(
                            f"Hi {patient.first_name},\n\n"
                            "Your patient profile has been successfully created!"
                        ),
                        recipient_list=[auth_rec.email],
                    )
                except Patient.DoesNotExist:
                    logger.warning(f"Patient {auth_rec.user_id} not found for welcome email")
            elif auth_rec.user_type == "doctor":
                try:
                    doctor = Doctor.objects.get(doctor_id=auth_rec.user_id)
                    send_custom_email(
                        subject="Welcome to HealthSync, Dr. " + doctor.last_name,
                        message=(
                            f"Hello Dr. {doctor.first_name} {doctor.last_name},\n\n"
                            "Your doctor account has been set up successfully!"
                        ),
                        recipient_list=[auth_rec.email],
                    )
                except Doctor.DoesNotExist:
                    logger.warning(f"Doctor {auth_rec.user_id} not found for welcome email")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError:
            raise
        except Exception:
            logger.error("Unexpected error creating authentication:\n" + traceback.format_exc())
            return Response({"error": "Server error"}, status=500)

class AuthenticationDetailView(APIView):
    def get(self, request, user_id):
        auth_record = get_object_or_404(Authentication, user_id=user_id)
        serializer = AuthenticationSerializer(auth_record)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, user_id):
        auth_record = get_object_or_404(Authentication, user_id=user_id)
        data = request.data.copy()
        if 'password' in data:
            data['password'] = make_password(data['password'])
        serializer = AuthenticationSerializer(auth_record, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        auth_record = get_object_or_404(Authentication, user_id=user_id)
        auth_record.delete()
        return Response({"message": "Authentication record deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class AuthenticationByEmailView(APIView):
    def get(self, request, email):
        try:
            auth_record = Authentication.objects.get(email=email)
            return Response({
                'user_id':   auth_record.user_id,
                'user_type': auth_record.user_type,
            }, status=status.HTTP_200_OK)
        except Authentication.DoesNotExist:
            return Response(
                {'error': 'Authentication record not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class AuthenticationLoginView(APIView):
    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        raw_pw = request.data.get("password", "")
        if not email or not raw_pw:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            auth_rec = Authentication.objects.get(email__iexact=email)
        except Authentication.DoesNotExist:
            return Response({"error": "No account for that email"}, status=status.HTTP_404_NOT_FOUND)
        if not check_password(raw_pw, auth_rec.password):
            return Response({"error": "Password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "user_id":   auth_rec.user_id,
            "user_type": auth_rec.user_type,
        }, status=status.HTTP_200_OK)