from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Patient, Authentication
from core.serializers.patient_serializers import PatientSerializer
from datetime import date
from core.utils import send_custom_email

class PatientView(APIView):
    def get(self, request):
        patients = Patient.objects.all()
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data.copy()
            required_fields = ['first_name', 'last_name', 'gender', 'date_of_birth', 'cnic', 'address']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return Response({'error': f'Missing fields: {", ".join(missing_fields)}'}, status=status.HTTP_400_BAD_REQUEST)
            if len(data['cnic']) != 13 or not data['cnic'].isdigit():
                return Response({'error': 'CNIC must be exactly 13 digits.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                dob = date.fromisoformat(data['date_of_birth'])
                today = date.today()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                data['age'] = age
            except Exception:
                return Response({'error': 'Invalid date_of_birth format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
            existing_ids = set(Patient.objects.values_list('patient_id', flat=True))
            new_id = 0
            while f"P{str(new_id)}" in existing_ids:
                new_id += 1
            patient_id = f"P{new_id}"
            data['patient_id'] = patient_id
            if 'emergency_contact' in data and data['emergency_contact'] in [None, '', 'null']:
                data['emergency_contact'] = None
            if 'medical_history' in data and data['medical_history'] in [None, '', 'null']:
                data['medical_history'] = {}
            serializer = PatientSerializer(data=data)
            if serializer.is_valid():
                patient = serializer.save()
                return Response({
                    'patient_id':    patient.patient_id,
                    'first_name':    patient.first_name,
                    'last_name':     patient.last_name,
                    'gender':        patient.gender,
                    'date_of_birth': patient.date_of_birth,
                    'cnic':          patient.cnic,
                    'message':       'Patient created successfully'
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientDetailView(APIView):
    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, patient_id=patient_id)
        serializer = PatientSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, patient_id):
        patient = get_object_or_404(Patient, patient_id=patient_id)
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # grab their email from the Authentication record
            try:
                auth_rec = Authentication.objects.get(user_id=patient.patient_id)
                send_custom_email(
                    subject="Your Profile Has Been Updated",
                    message=f"Hi {patient.first_name},\n\nYour profile has been successfully updated.",
                    recipient_list=[auth_rec.email],
                )
            except Authentication.DoesNotExist:
                pass
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, patient_id):
        patient = get_object_or_404(Patient, patient_id=patient_id)
        patient.delete()
        try:
            auth_rec = Authentication.objects.get(user_id=patient.patient_id)
            send_custom_email(
                subject="Your Profile Has Been Deleted",
                message=f"Hi {patient.first_name},\n\nYour profile has been successfully deleted.",
                recipient_list=[auth_rec.email],
            )
        except Authentication.DoesNotExist:
            pass
        return Response({"message": "Patient deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
