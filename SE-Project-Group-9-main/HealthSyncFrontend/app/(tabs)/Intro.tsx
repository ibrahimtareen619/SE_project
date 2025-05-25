import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./App"; 

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, "IntroScreen">;

export default function IntroScreen() {
  const navigation = useNavigation<IntroScreenNavigationProp>(); 
  const navigateToRoleSelection = (role: string) => {
    if (role === "patient") {
      navigation.navigate("Splash", { role: "patient" });
    } else if (role === "doctor") {
      navigation.navigate("Splash", { role: "doctor" });
    }
  };

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
        <Text style={styles.rolePrompt}>Who are you?</Text>

        <TouchableOpacity
          style={styles.patientButton}
          onPress={() => navigateToRoleSelection("patient")}
        >
          <Text style={styles.patientButtonText}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doctorButton}
          onPress={() => navigateToRoleSelection("doctor")}
        >
          <Text style={styles.doctorButtonText}>Doctor</Text>
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
  rolePrompt: {
    fontSize: 20,
    color: "#333",
    marginBottom: 20,
    fontWeight: 'bold'
  },
  patientButton: {
    backgroundColor: "#4CAF50",
    width: "90%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  patientButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  doctorButton: {
    backgroundColor: "#4CAF50",
    width: "90%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 60,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  doctorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
