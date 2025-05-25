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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { RootStackParamList } from "../App";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    auth: "",
  });

  const handleLogin = async () => {
    setErrors({ email: "", password: "", auth: "" });
  
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
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
  
      if (json.user_type !== "patient") {
        throw new Error("This account is not registered as a patient.");
      }
  
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "Home",
              params: { userId: json.user_id },
            },
          ],
        })
      );
    } catch (err: any) {
      const m = (err.message || "").toLowerCase();
      if (m.includes("not found") || m.includes("no account")) {
        setErrors((e) => ({ ...e, auth: "* Email is incorrect or user does not exist" }));
      } else if (m.includes("password")) {
        setErrors((e) => ({ ...e, auth: `* ${err.message}` }));
      } else {
        setErrors((e) => ({ ...e, auth: "* Login failed. Please check your credentials." }));
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
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Patient Log In</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.email ? { backgroundColor: "#FFEBEB", borderWidth: 1, borderColor: "#FF0000" } : {},
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrors((e) => ({ ...e, email: "", auth: "" }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>
            {errors.email ? (
              <Text style={{ color: "#FF0000", marginBottom: 8 }}>{errors.email}</Text>
            ) : null}

            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password ? { backgroundColor: "#FFEBEB", borderWidth: 1, borderColor: "#FF0000" } : {},
                { flexDirection: "row", alignItems: "center" }      
              ]}
            >
              <TextInput
                style={[styles.input, { flex: 1 }]}                 
                placeholder="Enter your password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrors((e) => ({ ...e, password: "", auth: "" }));
                }}
                secureTextEntry={!showPassword}                     
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeButton}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={{ color: "#FF0000", marginBottom: 8 }}>{errors.password}</Text>
            ) : null}

            {errors.auth ? (
              <Text style={{ color: "#FF0000", marginBottom: 8 }}>{errors.auth}</Text>
            ) : null}

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword1")}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupLinkContainer}
              onPress={() => navigation.navigate("SignupStep1")}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 120,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
  backArrow: {
    color: "#4CAF50",
    fontSize: 35,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 30,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  formContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: "#F0FFF0",
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 100,
    marginBottom: 15,
    marginHorizontal: 60,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#4CAF50",
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
  },
  signupLinkContainer: {
    marginTop: 3,
    alignItems: "center",
  },
  linkHighlight: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  forgotPassword: {
    color: "#4CAF50",
  },
  eyeButton: {
    marginLeft: 8,
  },
});
