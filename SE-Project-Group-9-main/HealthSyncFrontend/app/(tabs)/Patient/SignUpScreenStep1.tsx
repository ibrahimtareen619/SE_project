import React, { useState, useMemo, useRef } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Picker } from "@react-native-picker/picker";


type SignupStep1ScreenProp = NativeStackNavigationProp<RootStackParamList, "SignupStep1">;

export default function SignupScreenStep1() {
  const navigation = useNavigation<SignupStep1ScreenProp>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    gender: "",
    address: "",
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
    let dayArray: { label: string; value: string }[] = [];
    for (let i = 1; i <= lastDay; i++) {
      dayArray.push({ label: i.toString(), value: i.toString() });
    }
    return [{ label: "Select Day...", value: "" }, ...dayArray];
  }, [dobMonth, dobYear]);

  const validateName = (name: string, field: string) => {
    const trimmed = name.trim();
    if (!trimmed) return `* ${field} is a required field.`;
    if (trimmed.length < 2) return `* ${field} must be at least 2 characters.`;
    if (trimmed.length > 50) return `* ${field} cannot exceed 50 characters.`;
    const regex = /^[A-Za-z]+(?:[-'][A-Za-z]+)*(?:\s[A-Za-z]+(?:[-'][A-Za-z]+)*)?$/;
    if (!regex.test(trimmed))
      return `* ${field} must contain only letters, optional hyphens/apostrophes, and at most one space.`;
    return "";
  };

  const handleNext = () => {
    let valid = true;
    const newErrors = {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      dobMonth: "",
      dobDay: "",
      dobYear: "",
      gender: gender ? "" : "* Gender is a required field.",
      address: address.trim() ? "" : "* Address is a required field.",
    };

    if (!dobMonth) {
      newErrors.dobMonth = "* Month is a required field.";
      valid = false;
    }
    if (!dobYear) {
      newErrors.dobYear = "* Year is a required field.";
      valid = false;
    }
    if (!dobDay) {
      newErrors.dobDay = "* Day is a required field.";
      valid = false;
    }
    if (dobMonth && dobDay && dobYear) {
      const sel = new Date(
        parseInt(dobYear, 10),
        parseInt(dobMonth, 10) - 1,
        parseInt(dobDay, 10)
      );
      const today = new Date();
      sel.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (sel > today) {
        newErrors.dobDay = "* Date of birth cannot be in the future.";
        valid = false;
      }
    }

    setErrors(newErrors);

    if (valid) {
      navigation.navigate("SignupStep2", {
        firstName,
        lastName,
        dob: { month: dobMonth, day: dobDay, year: dobYear },
        gender,
        address,
      });
    }
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
            <Text style={styles.headerTitle}>Create Patient Account</Text>
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
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

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
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.dobContainer}>
              <View style={[styles.pickerWrapper, errors.dobMonth && styles.inputWrapperError]}>
                <Picker
                  selectedValue={dobMonth}
                  onValueChange={(v) => {
                    setDobMonth(v);
                    setDobDay("");
                  }}
                  style={styles.picker}
                  mode="dropdown"
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
                  onValueChange={(v) => {
                    setDobYear(v);
                    setDobDay("");
                  }}
                  style={styles.picker}
                  mode="dropdown"
                >
                  {years.map((y) => (
                    <Picker.Item key={y.value} label={y.label} value={y.value} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.pickerWrapper, errors.dobDay && styles.inputWrapperError]}>
                <Picker
                  selectedValue={dobDay}
                  onValueChange={setDobDay}
                  style={styles.picker}
                  mode="dropdown"
                  enabled={!!dobMonth && !!dobYear}
                >
                  {days.map((d) => (
                    <Picker.Item key={d.value} label={d.label} value={d.value} />
                  ))}
                </Picker>
              </View>
            </View>
            {errors.dobMonth ? <Text style={styles.errorText}>{errors.dobMonth}</Text> : null}
            {errors.dobYear ? <Text style={styles.errorText}>{errors.dobYear}</Text> : null}
            {errors.dobDay ? <Text style={styles.errorText}>{errors.dobDay}</Text> : null}

            <Text style={styles.label}>Gender</Text>
            <View style={[styles.pickerWrapper, { marginBottom: 15 }, errors.gender && styles.inputWrapperError]}>
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                style={styles.picker}
                mode="dropdown"
              >
                {genderOptions.map((g) => (
                  <Picker.Item key={g.value} label={g.label} value={g.value} />
                ))}
              </Picker>
            </View>
            {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

            <Text style={styles.label}>Address</Text>
            <View style={[styles.addressWrapper, errors.address && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                placeholderTextColor="#666"
                multiline
              />
            </View>
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <View style={styles.nextButtonContent}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flexContainer: { flex: 1 },
  scrollContainer: { paddingBottom: 80 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 40,
    position: "relative",
  },
  backButton: { position: "absolute", left: 20 },
  backArrow: { color: "#4CAF50", fontSize: 35, fontWeight: "bold" },
  headerTitle: { fontSize: 27, color: "#4CAF50", fontWeight: "bold" },
  formContainer: { paddingHorizontal: 20 },
  label: { fontSize: 20, fontWeight: "bold", color: "#000", marginBottom: 10 },
  inputWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginRight: 5,
    paddingHorizontal: 5,
    justifyContent: "center",
    flex: 1,
  },
  dobContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  addressWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: { fontSize: 16, color: "#000" },
  addressInput: { height: 80, textAlignVertical: "top" },
  picker: { height: 53, color: "#000", width: "100%" },
  errorText: { color: "red", fontSize: 14, marginBottom: 10 },
  inputWrapperError: {
    backgroundColor: "#FFEBEB",
    borderColor: "#FF0000",
    borderWidth: 1,
  },
  nextButton: {
    marginTop: 50,
    alignSelf: "flex-end",
    marginRight: 20,
  },
  nextButtonContent: { flexDirection: "row", alignItems: "center" },
  nextButtonText: { color: "#4CAF50", fontSize: 18, fontWeight: "bold" },
  arrow: { color: "#4CAF50", fontSize: 20, fontWeight: "bold", marginLeft: 5 },
});