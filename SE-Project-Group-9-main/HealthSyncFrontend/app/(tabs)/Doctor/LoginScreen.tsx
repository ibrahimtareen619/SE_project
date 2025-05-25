import React, { useState } from "react";
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
import { useNavigation, CommonActions } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { RootStackParamList } from "../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type DoctorLoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DoctorLogin">;

const DoctorLoginScreen = () => {
  const navigation = useNavigation<DoctorLoginScreenNavigationProp>();
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async () => {
    setEmailError(""); setPasswordError("");
  
    try {
      const { user } = await signInWithEmailAndPassword(auth, emailOrMobile, password);
      if (!user?.email) throw new Error("Authentication failed");
  
      const res = await fetch(
        "https://se-project-group-9.onrender.com/api/authentication/login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email.toLowerCase().trim(),
            password,    
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
  
      if (json.user_type !== "doctor") {
        throw new Error("This e-mail is not registered as a doctor account");
      }
  
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: "DocHomeScreen",
            params: { userId: json.user_id },
          }],
        })
      );
  
    } catch (err: any) {
      const m = (err.message || "").toLowerCase();
      if (m.includes("not found") || m.includes("no account")) {
        setEmailError("* Email is incorrect or user does not exist");
      } else if (m.includes("password")) {
        setPasswordError(`* ${err.message}`);
      } else {
        setEmailError("* Login failed. Please check your credentials.");
      }
    }
  };
  
  
  

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Doctor Log In</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                emailError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter Email"
                value={emailOrMobile}
                onChangeText={setEmailOrMobile}
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword1")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupLinkContainer}
              onPress={() => navigation.navigate("DoctorSignUpStep1")}
            >
              <Text style={styles.linkText}>
                Don't have an account?{" "}
                <Text style={styles.linkHighlight}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { paddingVertical: 90, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 120,
    position: "relative",
  },
  backButton: { position: "absolute", left: 0 },
  backArrow: { color: "#4CAF50", fontSize: 35, fontWeight: "bold" },
  headerTitle: { fontSize: 30, color: "#4CAF50", fontWeight: "bold" },

  formContainer: { marginTop: 10 },
  label: { fontSize: 18, color: "#000", fontWeight: "bold", marginBottom: 15 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  input: { fontSize: 16, color: "#000" },
  eyeButton: { marginLeft: 8 },

  inputErrorBorder: {
    borderWidth: 1,
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 5,
  },

  forgotText: {
    color: "#4CAF50",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },

  loginButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 60,
    marginBottom: 15,
    marginTop: 50,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  signupLinkContainer: { alignItems: "center", marginTop: 3 },
  linkText: { color: "#000", fontSize: 16 },
  linkHighlight: { fontWeight: "bold", color: "#4CAF50" },
});

export default DoctorLoginScreen;
