import React, { useState } from "react";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native'; 
import { RootStackParamList } from "../App"; 
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth } from "../../../firebase";
import { confirmPasswordReset } from "firebase/auth"; 


type ForgotPasswordScreen2NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword2'>;
type ForgotPasswordScreen2RouteProp = RouteProp<RootStackParamList, 'ForgotPassword2'>;

export default function ForgotPasswordScreen2() {
  const navigation = useNavigation<ForgotPasswordScreen2NavigationProp>();
  const route = useRoute<ForgotPasswordScreen2RouteProp>();
  const { email } = route.params; 

  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      await confirmPasswordReset(auth, verificationCode, newPassword);
      alert("Password successfully reset!");
      navigation.navigate("Login");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reset Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Verification Code"
        onChangeText={setVerificationCode}
        value={verificationCode}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter New Password"
        secureTextEntry
        onChangeText={setNewPassword}
        value={newPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        onChangeText={setConfirmPassword}
        value={confirmPassword}
      />

      <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: "#4CAF50", 
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
