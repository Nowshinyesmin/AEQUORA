from rest_framework import serializers
from .models import Example

class ExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Example
        fields = ['id', 'message']

## Newly added for signup 
# --- Add this to serializers.py ---

class RegisterSerializer(serializers.Serializer):
    # User Login Fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    # Profile Fields
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    phone_number = serializers.CharField()
    
    # Address Fields (For Residents)
    house_no = serializers.CharField(required=False, allow_blank=True)
    street = serializers.CharField(required=False, allow_blank=True)
    thana = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)