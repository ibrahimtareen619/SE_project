from django.contrib import admin
from django import forms
import json
from bson import ObjectId
from .models import *

def create_json_form(model_class, json_fields):
    class Meta:
        model = model_class
        fields = '__all__'
    attrs = {'Meta': Meta}

    for field in json_fields:
        attrs[field] = forms.CharField(
            widget = forms.Textarea(attrs = {'rows': 4}),
            required = False
        )
        
        def make_clean_method(field_name):
            def clean_method(self):
                data = self.cleaned_data.get(field_name, '[]')
                try:
                    parsed = json.loads(data)
                except json.JSONDecodeError:
                    raise forms.ValidationError(f"Invalid JSON format for {field_name}")
                
                if (field_name in 'doctor_ids'):
                    for item in parsed:
                        try:
                            ObjectId(str(item))
                        except:
                            raise forms.ValidationError(f"Invalid ObjectId format in {field_name}: {item}")
                return (parsed)
            return (clean_method)
        attrs[f'clean_{field}'] = make_clean_method(field)
    return (type(f'{model_class.__name__}Form', (forms.ModelForm,), attrs))

DoctorForm = create_json_form(Doctor, ['hospital_name', 'education', 'specialization'])
@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    form = DoctorForm
    list_display = ('first_name', 'last_name', 'cnic')

PatientForm = create_json_form(Patient, ['emergency_contacts', 'medical_history'])
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    form = PatientForm
    list_display = ('first_name', 'last_name', 'cnic')

admin.site.register(TimeSlot)
admin.site.register(Booking)
admin.site.register(Authentication)