import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRoute, useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth } from "../../../firebase";
import { RootStackParamList } from "../App";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Feather from "react-native-vector-icons/Feather";

import { StreamChat } from "stream-chat";


type SignupStep2RouteProp = {
  key: string;
  name: "SignupStep2";
  params: {
    firstName: string;
    lastName: string;
    dob: { month: string; day: string; year: string };
    gender: string;
    address: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SignupStep2">;

export default function SignupScreenStep2() {
  const route = useRoute<SignupStep2RouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const [signupEmail, setSignupEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [errors, setErrors] = useState({
    cnic: "",
    signupEmail: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    bloodType: "",
    emergencyContact: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length <= 5) {
      formatted = digits;
    } else if (digits.length <= 12) {
      formatted = digits.slice(0, 5) + "-" + digits.slice(5);
    } else {
      formatted =
        digits.slice(0, 5) +
        "-" +
        digits.slice(5, 12) +
        "-" +
        digits.slice(12, 13);
    }
    return formatted;
  };

  const validateFields = () => {
    let valid = true;
    let newErrors = {
      cnic: "",
      signupEmail: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      bloodType: "",
      emergencyContact: "",
    };

    const plainCnic = cnic.replace(/-/g, "");
    if (!plainCnic.trim()) {
      newErrors.cnic = "* CNIC is a required field.";
      valid = false;
    } else if (plainCnic.length !== 13) {
      newErrors.cnic = "* CNIC must be exactly 13 digits.";
      valid = false;
    } else if (plainCnic[0] === "0") {
      newErrors.cnic = "* CNIC should not start with zero.";
      valid = false;
    }

    if (!signupEmail.trim()) {
      newErrors.signupEmail = "* Email is a required field.";
      valid = false;
    } else if (signupEmail.indexOf(" ") !== -1) {
      newErrors.signupEmail = "* Email should not contain spaces.";
      valid = false;
    } else if (signupEmail.startsWith(".") || signupEmail.endsWith(".")) {
      newErrors.signupEmail = "* Email cannot start or end with a dot.";
      valid = false;
    } else if (signupEmail.includes("..")) {
      newErrors.signupEmail = "* Email should not contain consecutive dots.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      newErrors.signupEmail = "* Please enter a valid email address.";
      valid = false;
    }

    const mobileRegex = /^03\d{9}$/;
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = "* Mobile number is a required field.";
      valid = false;
    } else if (!mobileRegex.test(mobileNumber)) {
      newErrors.mobileNumber =
        "* Mobile number must start with 03 and be exactly 11 digits.";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "* Password is a required field.";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "* Password must be at least 8 characters.";
      valid = false;
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(password)) {
      newErrors.password =
        "* Password must contain at least one uppercase letter, one number, and one special character.";
      valid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "* Confirm Password is required.";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "* Passwords do not match.";
      valid = false;
    }

    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (bloodType.trim() && !validBloodGroups.includes(bloodType.toUpperCase())) {
      newErrors.bloodType = "* Please enter a valid blood group (e.g., A+, O-).";
      valid = false;
    }

    if (!emergencyContact.trim()) {
      newErrors.emergencyContact = "* Emergency contact is a required field.";
      valid = false;
    } else if (!mobileRegex.test(emergencyContact)) {
      newErrors.emergencyContact =
        "* Emergency contact must start with 03 and be exactly 11 digits.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignUp = async () => {
    if (!validateFields()) return;
  
    let patientId: string | null = null; 
  
    try {
      const dobFormatted = `${route.params.dob.year}-${route.params.dob.month.padStart(2, "0")}-${route.params.dob.day.padStart(2, "0")}`;      
      const patientData = {
        first_name: route.params.firstName,
        last_name: route.params.lastName,
        gender: route.params.gender,
        date_of_birth: dobFormatted,
        cnic: cnic.replace(/-/g, ""),
        address: route.params.address,
        blood_type: bloodType,
        emergency_contact: emergencyContact,
      };
  
      const patientResponse = await fetch("https://se-project-group-9.onrender.com/api/patients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });
  
      const patientResponseText = await patientResponse.text();
      
      if (!patientResponse.ok) {
        console.error("Patient creation failed:", patientResponseText);
        throw new Error("Failed to create patient record");
      }
  
      const patientDataResponse = JSON.parse(patientResponseText);
      patientId = patientDataResponse.patient_id; 
  
      console.log("Creating Firebase account...");
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, password);
      
      const authData = {
        user_id: patientId,  
        user_type: "patient",
        phone_number: mobileNumber,
        email: signupEmail,
        password: password, 
      };
  
      const authResponse = await fetch("https://se-project-group-9.onrender.com/api/authentication/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData),
      });
  
      const authResponseText = await authResponse.text();
      
      if (!authResponse.ok) {
        console.error("Authentication record creation failed:", authResponseText);
        throw new Error("Failed to create authentication record");
      }
      if (!patientId) {
        throw new Error("Patient ID is missing. Cannot create Stream user.");
      }
      try {
        const streamClient = StreamChat.getInstance("j4w7tbr2wcqm");
        console.log("Connecting to Stream Chat...");
        console.log("Patient ID:", patientId);
        await streamClient.connectUser(
          {
            id: patientId,
            name: `${route.params.firstName} ${route.params.lastName}`,
          },
          streamClient.devToken(patientId)
        );
  
        console.log("Stream Chat user created successfully!");
      } catch (streamError) {
        console.error("Failed to create Stream user", streamError);
        throw new Error("Failed to create Stream user");
      }
  
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: "Home",
            params: {
              userId: patientId,
            }
          }],
        })
      );
  
    } catch (error) {
      console.error("Signup error:", error);
      
      try {
        // 1) Remove Firebase user
        if (auth.currentUser) {
          await auth.currentUser.delete();
          console.log("Rolled back Firebase account");
        }
  
        if (patientId) {
          // 2) Delete backend auth record (if it got created)
          await fetch(
            `https://se-project-group-9.onrender.com/api/authentication/${patientId}/`,
            { method: "DELETE" }
          );
          console.log("Rolled back authentication record");
  
          // 3) Delete backend patient record
          await fetch(
            `https://se-project-group-9.onrender.com/api/patients/${patientId}/`,
            { method: "DELETE" }
          );
          console.log("Rolled back patient record");
        }
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create a New Account</Text>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.label}>CNIC</Text>
            <View style={[styles.inputWrapper, errors.cnic && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter 13-digit CNIC"
                placeholderTextColor="#666"
                value={cnic}
                onChangeText={(text) => setCnic(formatCnic(text))}
                keyboardType="number-pad"
                maxLength={15}
              />
            </View>
            {errors.cnic ? <Text style={styles.errorText}>{errors.cnic}</Text> : null}

            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputWrapper, errors.mobileNumber && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter 11-digit mobile number"
                placeholderTextColor="#666"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>
            {errors.mobileNumber ? <Text style={styles.errorText}>{errors.mobileNumber}</Text> : null}

            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, errors.signupEmail && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#666"
                value={signupEmail}
                onChangeText={setSignupEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.signupEmail ? <Text style={styles.errorText}>{errors.signupEmail}</Text> : null}

            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>• Your password should be at least 8 characters and should contain atleast one uppercase letter, one number and one non-alphanumeric character</Text>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Re-enter Password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

            <Text style={styles.label}>Blood Type (Optional)</Text>
            <View style={[styles.inputWrapper, errors.bloodType && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter Blood Type (e.g., O+, A-)"
                placeholderTextColor="#666"
                value={bloodType}
                onChangeText={setBloodType}
              />
            </View>
            {errors.bloodType ? <Text style={styles.errorText}>{errors.bloodType}</Text> : null}

            <Text style={styles.label}>Emergency Contact</Text>
            <View style={[styles.inputWrapper, errors.emergencyContact && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter 11-digit emergency contact"
                placeholderTextColor="#666"
                value={emergencyContact}
                onChangeText={(text) => setEmergencyContact(text.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>
            {errors.emergencyContact ? <Text style={styles.errorText}>{errors.emergencyContact}</Text> : null}
          </View>
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 40,
    position: "relative",
  },
  backButton: { position: "absolute", left: 20 },
  backArrow: { color: "#4CAF50", fontSize: 40, fontWeight: "bold" },
  headerTitle: { fontSize: 27, color: "#4CAF50", fontWeight: "bold" },
  formContainer: { paddingHorizontal: 20 },
  label: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 8 },
  inputWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapperError: {
    backgroundColor: "#FFEBEB",
    borderColor: "#FF0000",
    borderWidth: 1,
  },
  input: { fontSize: 16, color: "#000", paddingVertical: 12, flex: 1 },
  errorText: { color: "#FF0000", fontSize: 14, marginBottom: 10 },
  hintText: { fontSize: 12, color: "#000", marginBottom: 6 },
  eyeButton: { padding: 8 },
  signUpButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    marginHorizontal: 80,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  signUpButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
