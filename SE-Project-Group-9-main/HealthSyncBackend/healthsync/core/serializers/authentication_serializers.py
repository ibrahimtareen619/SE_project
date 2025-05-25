from rest_framework import serializers
from core.models import Authentication

class AuthenticationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Authentication
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True}
        }