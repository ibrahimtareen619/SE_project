import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { auth } from "../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { StreamChat } from "stream-chat";

type DoctorStep3RouteProp = {
  key: string;
  name: "DoctorSignUpStep3";
  params: RootStackParamList["DoctorSignUpStep3"];
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "DoctorSignUpStep3"
>;

export default function DoctorSignUpScreenStep3() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DoctorStep3RouteProp>();

  const [images, setImages] = useState<{
    degree: string | null;
    pmcCertificate: string | null;
    cnicFront: string | null;
    cnicBack: string | null;
    doctorPicture: string | null;
  }>({
    degree: null,
    pmcCertificate: null,
    cnicFront: null,
    cnicBack: null,
    doctorPicture: null,
  });

  const [errors, setErrors] = useState<{
    degree: string;
    pmcCertificate: string;
    cnicFront: string;
    cnicBack: string;
    doctorPicture: string;
  }>({
    degree: "",
    pmcCertificate: "",
    cnicFront: "",
    cnicBack: "",
    doctorPicture: "",
  });

  const uploadImage = async (uri: string): Promise<string> => {
    return "https://example.com/doctor-picture.jpg"; 
  };

  const handleImagePick = async (type: keyof typeof images) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted" || cameraStatus.status !== "granted") {
      Alert.alert("Permission required", "Camera and gallery access are needed.");
      return;
    }
    Alert.alert(
      "Select Image",
      "Choose source",
      [
        {
          text: "Camera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
            if (!result.canceled) {
              setImages(prev => ({ ...prev, [type]: result.assets[0].uri }));
              setErrors(prev => ({ ...prev, [type]: "" }));
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
            if (!result.canceled) {
              setImages(prev => ({ ...prev, [type]: result.assets[0].uri }));
              setErrors(prev => ({ ...prev, [type]: "" }));
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = async () => {
    const newErrors = { /* existing validation */ };
    if (Object.values(newErrors).some(msg => msg)) return;
  
    let doctorId: string | null = null;
  
    try {
      const pictureUrl = images.doctorPicture ? await uploadImage(images.doctorPicture) : null;
  
      const dobFormatted = `${route.params.dob.year}-${route.params.dob.month.padStart(2, '0')}-${route.params.dob.day.padStart(2, '0')}`;
      const doctorData = {
        first_name: route.params.firstName,
        last_name: route.params.lastName,
        gender: route.params.gender,
        date_of_birth: dobFormatted,
        cnic: route.params.cnic.replace(/-/g, ''),
        picture: pictureUrl,
        education: {
          degree: route.params.education.degreeName,
          school: route.params.education.institution,
          year: route.params.education.graduationYear
        },
        specialization: route.params.specialization,
        hospital_name: route.params.hospitalName,
      };
  
      const doctorResponse = await fetch('https://se-project-group-9.onrender.com/api/doctors/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
  
      if (!doctorResponse.ok) {
        const errorText = await doctorResponse.text();
        throw new Error(`Doctor creation failed: ${errorText}`);
      }
  
      const doctorResult = await doctorResponse.json();
      doctorId = doctorResult.doctor_id;
  
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        route.params.email,
        route.params.password
      );
  
      const authData = {
        user_id: doctorId,
        user_type: "doctor",
        phone_number: route.params.mobileNumber,
        email: route.params.email,
        password: route.params.password
      };
      
  
      const authResponse = await fetch('https://se-project-group-9.onrender.com/api/authentication/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
  
      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Authentication creation failed: ${errorText}`);
      }

      if (!doctorId) {
        throw new Error("Patient ID is missing. Cannot create Stream user.");
      }
      try {
        const streamClient = StreamChat.getInstance("j4w7tbr2wcqm");
        await streamClient.disconnect();
        await streamClient.connectUser(
          {
            id: doctorId!,
            name: `${route.params.firstName} ${route.params.lastName}`,
          },
          streamClient.devToken(doctorId) 
        );

        console.log("Stream Chat doctor user connected successfully!");
      } catch (streamError) {
        console.error("Failed to create Stream user", streamError);
        throw new Error("Failed to create Stream user");
      }

  
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: "DocHomeScreen",
            params: { userId: doctorId } 
          }],
        })
      );
  
    } catch (error) {
      console.error("Signup error:", error);
      
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
          console.log("Rolled back Firebase user");
        }

        if (doctorId) {
          await fetch(
            `https://se-project-group-9.onrender.com/api/authentication/${doctorId}/`,
            { method: "DELETE" }
          );
          console.log("Rolled back authentication record");

          await fetch(
            `https://se-project-group-9.onrender.com/api/doctors/${doctorId}/`,
            { method: "DELETE" }
          );
          console.log("Rolled back doctor record");
        }
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
  
      let errorMessage = "Signup failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes("cnic")) {
        errorMessage = "This CNIC is already registered";
      } else if (errorMessage.includes("email")) {
        errorMessage = "This email is already in use";
      }

      Alert.alert("Signup Failed", errorMessage);
    }
  };

  const renderUploader = (
    label: string,
    type: keyof typeof images
  ) => (
    <View style={styles.uploaderContainer} key={type}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.uploadBox, errors[type] && styles.uploadBoxError]}
        onPress={() => handleImagePick(type)}
      >
        {images[type] ? (
          <Image source={{ uri: images[type]! }} style={styles.preview} />
        ) : (
          <Text style={styles.uploadText}>Tap to upload</Text>
        )}
      </TouchableOpacity>
      {errors[type] ? (
        <Text style={styles.errorText}>{errors[type]}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Documents</Text>
        </View>

        {renderUploader("Degree Certificate", "degree")}
        {renderUploader("PMC Certificate", "pmcCertificate")}
        {renderUploader("CNIC (Front)", "cnicFront")}
        {renderUploader("CNIC (Back)", "cnicBack")}
        {renderUploader("Profile Picture", "doctorPicture")}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Create Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  backButton: { padding: 8 },
  backArrow: { fontSize: 32, color: "#4CAF50" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 40,
  },
  uploaderContainer: { marginBottom: 20 },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  uploadBox: {
    backgroundColor: "#F0FFF0",
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  uploadBoxError: {
    backgroundColor: "#FFEBEB",
    borderColor: "#FF0000",
  },
  uploadText: {
    color: "#4CAF50",
    fontSize: 16,
  },
  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 30,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
