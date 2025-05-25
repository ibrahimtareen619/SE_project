import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Route = RouteProp<RootStackParamList, "PatientRecord">;
type Nav   = NativeStackNavigationProp<RootStackParamList, "PatientRecord">;

export default function PatientRecordScreen() {
  const navigation = useNavigation<Nav>();
  const { patientId } = useRoute<Route>().params;

  const [loading, setLoading]         = useState(true);
  const [gender, setGender]           = useState("");
  const [bloodType, setBloodType]     = useState("");
  const [historyText, setHistoryText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://se-project-group-9.onrender.com/api/patients/${patientId}/`
        );
        if (!res.ok) throw new Error("Failed to load patient record");
        const p = await res.json();

        setGender(p.gender || "");
        setBloodType(p.blood_type || "");
        setHistoryText(p.medical_history || "");
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load patient record.");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Patient Record</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.readField}>
          <Text style={styles.readText}>{gender || "—"}</Text>
        </View>

        <Text style={styles.label}>Blood Type</Text>
        <View style={styles.readField}>
          <Text style={styles.readText}>{bloodType || "—"}</Text>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>
          Medical History
        </Text>
        <Text style={styles.hint}>
          (e.g. Weight, Height, Allergies, Illnesses…)
        </Text>
        <View style={styles.textArea}>
          <Text style={styles.readText}>{historyText || "—"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection:      "row",
    alignItems:         "center",
    paddingTop:         50,
    paddingHorizontal:  16,
    paddingBottom:      12,
    backgroundColor:    "#fff",
    borderBottomWidth:  1,
    borderColor:        "#eee",
  },
  backArrow: { fontSize: 35, color: "#4CAF50", fontWeight: "bold" },
  title:     {
    flex:          1,
    textAlign:     "center",
    fontSize:      27,
    fontWeight:    "600",
    color:         "#4CAF50",
  },

  container: { padding: 16 },
  label:     { fontSize: 16, fontWeight: "500", color: "#333", marginBottom: 6 },
  hint:      { fontSize: 14, color: "#666", marginBottom: 12 },

  readField: {
    backgroundColor:  "#F0FFF0",
    paddingVertical:  12,
    paddingHorizontal:16,
    borderRadius:     10,
    marginBottom:     20,
  },
  readText:  { fontSize: 16, color: "#444" },

  textArea:  {
    backgroundColor:   "#F0FFF0",
    padding:           16,
    borderRadius:      10,
    minHeight:         220,
    marginBottom:      30,
  },

  center:   { flex:1, justifyContent:"center", alignItems:"center" },
});
