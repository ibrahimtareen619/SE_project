import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "./App"; 
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Splash'>>(); 
  const route = useRoute<RouteProp<RootStackParamList, 'Splash'>>(); 
  const role = route.params?.role || "patient"; 

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={require("./logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>HealthSync</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() =>
            navigation.navigate(role === "doctor" ? "DoctorSignUpStep1" : "SignupStep1")
          }
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() =>
            navigation.navigate(role === "doctor" ? "DoctorLogin" : "Login")
          }
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  headerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 200,
  },
  logo: {
    width: 230,
    height: 230,
    marginBottom: 1,
    resizeMode: "contain",
  },
  title: {
    fontSize: 30,
    color: "#4CAF50",
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  signUpButton: {
    backgroundColor: "#4CAF50",
    width: "90%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#fff",
    width: "90%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 60,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  loginButtonText: {
    color: "purple",
    fontSize: 16,
    fontWeight: "600",
  },
});
