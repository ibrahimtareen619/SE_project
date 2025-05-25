const API_BASE_URL = 'https://se-project-group-9.onrender.com';

interface PatientData {
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  cnic: string;
  address: string;
  email: string;
  phone_number: string;
  blood_type?: string;
  emergency_contact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export const registerPatient = async (patientData: PatientData, firebaseUID: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patientData,
          firebase_uid: firebaseUID
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Registration failed');
      }
  
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };