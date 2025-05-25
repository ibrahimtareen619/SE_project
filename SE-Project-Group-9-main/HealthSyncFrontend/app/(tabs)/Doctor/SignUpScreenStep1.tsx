import React, { useState, useMemo } from "react";
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
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Picker } from "@react-native-picker/picker";

type DoctorSignUpStep1ScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  "DoctorSignUpStep1"
>;

export default function DoctorSignUpScreenStep1() {
  const navigation = useNavigation<DoctorSignUpStep1ScreenProp>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [gender, setGender] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [cnic, setCnic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    dobMonth: "",
    dobYear: "",
    dobDay: "",
    gender: "",
    mobileNumber: "",
    cnic: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const months = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const genderOptions = [
    { label: "Select Gender...", value: "" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yr = [];
    for (let i = currentYear; i >= 1900; i--) {
      yr.push({ label: i.toString(), value: i.toString() });
    }
    return [{ label: "Select Year...", value: "" }, ...yr];
  }, [currentYear]);

  const days = useMemo(() => {
    if (!dobMonth || !dobYear) return [{ label: "Select Day...", value: "" }];
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const dayArray = [];
    for (let i = 1; i <= lastDay; i++) {
      dayArray.push({ label: i.toString(), value: i.toString() });
    }
    return [{ label: "Select Day...", value: "" }, ...dayArray];
  }, [dobMonth, dobYear]);

  const validateName = (name: string, field: string) => {
    const t = name.trim();
    if (!t) return `* ${field} is a required field.`;
    if (t.length < 2) return `* ${field} must be at least 2 characters.`;
    if (t.length > 50) return `* ${field} cannot exceed 50 characters.`;
    const regex = /^[A-Za-z]+(?:[-'][A-Za-z]+)*(?:\s[A-Za-z]+(?:[-'][A-Za-z]+)*)?$/;
    if (!regex.test(t))
      return `* ${field} must contain only letters, optional hyphen/apostrophe, and at most one space.`;
    return "";
  };

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const validateFields = () => {
    let valid = true;
    const newErrors: typeof errors = {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      dobMonth: dobMonth ? "" : "* Month is a required field.",
      dobYear: dobYear ? "" : "* Year is a required field.",
      dobDay: dobDay ? "" : "* Day is a required field.",
      gender: gender ? "" : "* Gender is a required field.",
      mobileNumber:
        mobileNumber.trim()
          ? /^03\d{9}$/.test(mobileNumber)
            ? ""
            : "* Mobile number must start with 03 and be 11 digits."
          : "* Mobile number is a required field.",
      cnic: (() => {
        const pc = cnic.replace(/-/g, "");
        if (!pc) return "* CNIC is a required field.";
        if (pc.length !== 13) return "* CNIC must be exactly 13 digits.";
        if (pc[0] === "0") return "* CNIC should not start with a zero.";
        return "";
      })(),
      email: (() => {
        const e = email.trim();
        if (!e) return "* Email is a required field.";
        if (e.includes(" ")) return "* Email should not contain spaces.";
        if (e.startsWith(".") || e.endsWith(".")) return "* Email cannot start or end with a dot.";
        if (e.includes("..")) return "* Email should not contain consecutive dots.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "* Enter a valid email.";
        return "";
      })(),
      password:
        password.length >= 8
          ? /^(?=.*[A-Z])(?=.*\d)/.test(password)
            ? ""
            : "* Password must have one uppercase and one digit."
          : "* Password is a required field and must be at least 8 characters.",
      confirmPassword:
        confirmPassword
          ? password === confirmPassword
            ? ""
            : "* Passwords do not match."
          : "* Confirm password is required.",
    };

    const dobValid =
      !newErrors.dobMonth &&
      !newErrors.dobYear &&
      !newErrors.dobDay &&
      (() => {
        const sel = new Date(
          parseInt(dobYear),
          parseInt(dobMonth) - 1,
          parseInt(dobDay)
        );
        const today = new Date();
        sel.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return sel <= today;
      })();

    if (!dobValid && !newErrors.dobMonth && !newErrors.dobYear && !newErrors.dobDay) {
      newErrors.dobDay = "* Date of Birth cannot be in the future.";
    }

    Object.values(newErrors).forEach((e) => e && (valid = false));
    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (!validateFields()) return;
    navigation.navigate("DoctorSignUpStep2", {
      firstName,
      lastName,
      dob: { month: dobMonth, day: dobDay, year: dobYear },
      gender,
      mobileNumber,
      cnic,
      email,
      password,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Doctor Account</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>First Name</Text>
            <View style={[styles.inputWrapper, errors.firstName && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#666"
              />
            </View>
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            <Text style={styles.label}>Last Name</Text>
            <View style={[styles.inputWrapper, errors.lastName && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor="#666"
              />
            </View>
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.dobRow}>

              <View style={[styles.pickerWrapper, errors.dobMonth && styles.inputWrapperError]}>
                <Picker
                  selectedValue={dobMonth}
                  onValueChange={(v) => { setDobMonth(v); setDobDay(""); }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Month..." value="" />
                  {months.map((m) => (
                    <Picker.Item key={m.value} label={m.label} value={m.value} />
                  ))}
                </Picker>
              </View>

              <View style={[styles.pickerWrapper, errors.dobYear && styles.inputWrapperError]}>
                <Picker
                  selectedValue={dobYear}
                  onValueChange={(v) => { setDobYear(v); setDobDay(""); }}
                  style={styles.picker}
                >
                  {years.map((y) => (
                    <Picker.Item key={y.value} label={y.label} value={y.value} />
                  ))}
                </Picker>
              </View>
              {/* Day */}
              <View style={[styles.pickerWrapper, errors.dobDay && styles.inputWrapperError]}>
                <Picker
                  selectedValue={dobDay}
                  onValueChange={setDobDay}
                  style={styles.picker}
                  enabled={!!dobMonth && !!dobYear}
                >
                  {days.map((d) => (
                    <Picker.Item key={d.value} label={d.label} value={d.value} />
                  ))}
                </Picker>
              </View>
            </View>
            {errors.dobMonth && <Text style={styles.errorText}>{errors.dobMonth}</Text>}
            {errors.dobYear  && <Text style={styles.errorText}>{errors.dobYear}</Text>}
            {errors.dobDay   && <Text style={styles.errorText}>{errors.dobDay}</Text>}

            <Text style={styles.label}>Gender</Text>
            <View style={[styles.pickerWrapper, errors.gender && styles.inputWrapperError, { marginBottom: 15 }]}>
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                style={styles.picker}
              >
                {genderOptions.map((g) => (
                  <Picker.Item key={g.value} label={g.label} value={g.value} />
                ))}
              </Picker>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputWrapper, errors.mobileNumber && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={(t) => setMobileNumber(t.replace(/\D/g, ""))}
                placeholder="Enter 11-digit mobile number"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>
            {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}

            <Text style={styles.label}>CNIC</Text>
            <View style={[styles.inputWrapper, errors.cnic && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                value={cnic}
                onChangeText={(t) => setCnic(formatCnic(t))}
                placeholder="Enter 13-digit CNIC"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={15}
              />
            </View>
            {errors.cnic && <Text style={styles.errorText}>{errors.cnic}</Text>}

            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>• Your password should be at least 8 characters and should contain atleast one uppercase letter, one number and one non-alphanumeric character</Text>

            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#666"
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color="#666" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity style={styles.signUpButton} onPress={handleNext}>
              <Text style={styles.signUpButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flexContainer: { flex: 1 },
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
  },
  
  inputWrapperError: {
    backgroundColor: "#FFEBEB",
    borderColor: "#FF0000",
    borderWidth: 1,
  },
  input: { fontSize: 16, color: "#000", paddingVertical: 10, width: "100%" },
  pickerWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    flex: 1,
    paddingHorizontal: 5,
    justifyContent: "center",
  },
  picker: { height: 53, color: "#000", width: "100%" },
  dobRow: { flexDirection: "column", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  errorText: { color: "#FF0000", fontSize: 14, marginBottom: 8 },
  hintText: { fontSize: 12, color: "#000", marginBottom: 4 },
  eyeButton: { padding: 8 },
  signUpButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    marginHorizontal: 80,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  signUpButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
