from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Doctor
from core.serializers.doctor_serializers import DoctorSerializer, DoctorSummarySerializer
from datetime import date
from core.models import Doctor

allowed_specializations = [
    'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Neurology'
]
class DoctorView(APIView):
    def get(self, request):
        doctors = Doctor.objects.all()
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        required_fields = ['first_name', 'last_name', 'gender', 'date_of_birth', 'cnic', 'education', 'specialization', 'hospital_name']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({'error': f'Missing fields: {", ".join(missing_fields)}'}, status=status.HTTP_400_BAD_REQUEST)
        if request.data['specialization'] not in allowed_specializations:
            return Response({'error': 'Invalid specialization'}, status=400)
        if len(data['cnic']) != 13 or not data['cnic'].isdigit():
            return Response({'error': 'CNIC must be exactly 13 digits.'}, status=status.HTTP_400_BAD_REQUEST)
        if not data.get('hospital_name') or len(data['hospital_name'].strip()) < 2:
                return Response({'error': 'Valid hospital name required'}, status=400)
        try:
            dob = date.fromisoformat(data['date_of_birth'])
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            data['age'] = age
        except Exception:
            return Response({'error': 'Invalid date_of_birth format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        existing_ids = set(Doctor.objects.values_list('doctor_id', flat=True))
        new_id = 0
        while f"D{str(new_id)}" in existing_ids:
            new_id += 1
        doctor_id = f"D{new_id}"
        data['doctor_id'] = doctor_id
        edu = data.get('education')
        if not isinstance(edu, dict) or not all(key in edu for key in ['degree', 'school', 'year']):
            return Response({'error': 'Education must be a JSON object with degree, school, and year.'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(data.get('specialization'), str):
            return Response({'error': 'Specialization must be a string.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = DoctorSerializer(data=data)
        if serializer.is_valid():
            doctor = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorDetailView(APIView):
    def get(self, request, doctor_id):
        doctor = get_object_or_404(Doctor, doctor_id=doctor_id)
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, doctor_id):
        doctor = get_object_or_404(Doctor, doctor_id=doctor_id)
        serializer = DoctorSerializer(doctor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, doctor_id):
        doctor = get_object_or_404(Doctor, doctor_id=doctor_id)
        doctor.delete()
        return Response({"message": "Doctor deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    
class DoctorSummaryDetailView(APIView):
    def get(self, request, doctor_id):
        doctor = get_object_or_404(Doctor, doctor_id=doctor_id)
        serializer = DoctorSummarySerializer(doctor)
        return Response(serializer.data, status=status.HTTP_200_OK)
