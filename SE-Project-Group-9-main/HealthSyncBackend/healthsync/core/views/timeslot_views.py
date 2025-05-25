from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import TimeSlot
from core.serializers.timeslot_serializers import TimeSlotSerializer

class TimeSlotView(APIView):
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if doctor_id:
            timeslots = TimeSlot.objects.filter(doctor_id=doctor_id)
        else:
            timeslots = TimeSlot.objects.all()
        serializer = TimeSlotSerializer(timeslots, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        required_fields = ['doctor_id', 'hospital_id', 'start_time', 'end_time', 'fee']
        missing = [f for f in required_fields if f not in data or not data[f]]
        if missing:
            return Response({'error': f'Missing fields: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)
        existing_ids = set(TimeSlot.objects.values_list('timeslot_id', flat=True))
        new_id = 0
        while f"T{new_id}" in existing_ids:
            new_id += 1
        timeslot_id = f"T{new_id}"
        availability_status = data.get('availability_status', 'available')
        timeslot_data = {
            'timeslot_id': timeslot_id,
            'doctor_id': data['doctor_id'],
            'hospital_id': data['hospital_id'],
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'fee': data['fee'],
            'availability_status': data.get('availability_status', 'available')
        }
        try:
            serializer = TimeSlotSerializer(data=timeslot_data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class TimeSlotDetailView(APIView):
    def get(self, request, timeslot_id):
        timeslot = get_object_or_404(TimeSlot, timeslot_id=timeslot_id)
        serializer = TimeSlotSerializer(timeslot)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, timeslot_id):
        timeslot = get_object_or_404(TimeSlot, timeslot_id=timeslot_id)
        serializer = TimeSlotSerializer(timeslot, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, timeslot_id):
        timeslot = get_object_or_404(TimeSlot, timeslot_id=timeslot_id)
        timeslot.delete()
        return Response({"message": "Timeslot deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
