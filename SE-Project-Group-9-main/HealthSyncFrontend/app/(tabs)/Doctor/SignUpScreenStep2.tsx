import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Picker } from "@react-native-picker/picker";

type DoctorStep2RouteProp = {
  key: string;
  name: "DoctorSignUpStep2";
  params: RootStackParamList["DoctorSignUpStep2"];
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "DoctorSignUpStep2">;

export default function DoctorSignUpScreenStep2() {
  const route = useRoute<DoctorStep2RouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const [degreeName, setDegreeName] = useState("");
  const [institution, setInstitution] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [errors, setErrors] = useState({
    degreeName: "",
    institution: "",
    graduationYear: "",
    specialization: "",
    hospitalName: "",
  });

  const currentYear = new Date().getFullYear();
  const gradYears = useMemo(() => {
    const yrs: { label: string; value: string }[] = [];
    for (let y = currentYear; y >= 1950; y--) {
      yrs.push({ label: y.toString(), value: y.toString() });
    }
    return [{ label: "Select Year...", value: "" }, ...yrs];
  }, [currentYear]);

  const validateFields = () => {
    let valid = true;
    const newErrors = {
      degreeName: "",
      institution: "",
      graduationYear: "",
      specialization: "",
      hospitalName: "",
    };

    if (!degreeName.trim()) {
      newErrors.degreeName = "* Degree name is a required field.";
      valid = false;
    }
    if (!institution.trim()) {
      newErrors.institution = "* Institution is a required field.";
      valid = false;
    }
    if (!graduationYear) {
      newErrors.graduationYear = "* Graduation year is a required field.";
      valid = false;
    }
    if (!specialization.trim()) {
      newErrors.specialization = "* Specialization is a required field.";
      valid = false;
    }
    if (!hospitalName.trim()) {
      newErrors.hospitalName = "* Hospital name is a required field";
      valid = false;
    } else if (hospitalName.trim().length < 2) {
      newErrors.hospitalName = "* Hospital name must be at least 2 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleDoctorSignUp = () => {
    if (!validateFields()) return;
    navigation.navigate("DoctorSignUpStep3", {
      ...route.params,
      education: { degreeName, institution, graduationYear },
      specialization,
      hospitalName,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Education & Specialization</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Education</Text>

            <Text style={styles.subLabel}>Degree Name</Text>
            <View style={[styles.inputWrapper, errors.degreeName && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="e.g., MBBS"
                placeholderTextColor="#666"
                value={degreeName}
                onChangeText={setDegreeName}
              />
            </View>
            {errors.degreeName && <Text style={styles.errorText}>{errors.degreeName}</Text>}

            <Text style={styles.subLabel}>Institution</Text>
            <View style={[styles.inputWrapper, errors.institution && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="e.g., King Edward Medical University"
                placeholderTextColor="#666"
                value={institution}
                onChangeText={setInstitution}
              />
            </View>
            {errors.institution && <Text style={styles.errorText}>{errors.institution}</Text>}

            <Text style={styles.subLabel}>Graduation Year</Text>
            <View style={[styles.inputWrapper, errors.graduationYear && styles.inputWrapperError]}>
              <Picker
                selectedValue={graduationYear}
                onValueChange={setGraduationYear}
                style={styles.picker}
                mode="dropdown"
              >
                {gradYears.map((y) => (
                  <Picker.Item key={y.value} label={y.label} value={y.value} />
                ))}
              </Picker>
            </View>
            {errors.graduationYear && <Text style={styles.errorText}>{errors.graduationYear}</Text>}

            <Text style={styles.subLabel}>Specialization</Text>
            <View style={[styles.inputWrapper, errors.specialization && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Cardiology, Oncology"
                placeholderTextColor="#666"
                value={specialization}
                onChangeText={setSpecialization}
              />
            </View>
            {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}

            <Text style={styles.subLabel}>Hospital/Clinic Name</Text>
            <View style={[styles.inputWrapper, errors.hospitalName && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="e.g., General Hospital"
                placeholderTextColor="#666"
                value={hospitalName}
                onChangeText={setHospitalName}
              />
            </View>
            {errors.hospitalName && <Text style={styles.errorText}>{errors.hospitalName}</Text>}
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={handleDoctorSignUp}>
            <Text style={styles.signUpButtonText}>Next</Text>
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
  headerTitle: { fontSize: 26, color: "#4CAF50", fontWeight: "bold", textAlign: "center" },
  formContainer: { paddingHorizontal: 20 },
  label: { fontSize: 20, fontWeight: "bold", color: "#000", marginTop: 20, marginBottom: 8 },
  subLabel: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 6 },
  inputWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    height: 60,
  },
  inputWrapperError: {
    backgroundColor: "#FFEBEB",
    borderColor: "#FF0000",
    borderWidth: 1,
  },
  input: { fontSize: 16, color: "#000", flex: 1, paddingVertical: 10 },
  picker: { height: 50, width: "100%" },
  errorText: { color: "#FF0000", fontSize: 14, marginBottom: 10, marginTop: 1 },
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