import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Route = RouteProp<RootStackParamList, "MedicalHistory">;
type Nav   = NativeStackNavigationProp<RootStackParamList, "MedicalHistory">;

export default function MedicalHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { userId } = useRoute<Route>().params;

  const [loading, setLoading]         = useState(true);
  const [gender, setGender]           = useState("");
  const [bloodType, setBloodType]     = useState("");
  const [historyText, setHistoryText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://se-project-group-9.onrender.com/api/patients/${userId}/`
        );
        if (!res.ok) throw new Error("Failed to load patient");
        const p = await res.json();

        setGender(p.gender || "");
        setBloodType(p.blood_type || "");
        setHistoryText(p.medical_history || "");
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load your medical history.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const save = async () => {
    setLoading(true);
    try {
      const payload = {
        blood_type:      bloodType.trim(),
        medical_history: historyText.trim(),
      };
      const res = await fetch(
        `https://se-project-group-9.onrender.com/api/patients/${userId}/`,
        {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Save failed");
      }
      Alert.alert("Saved", "Your information has been updated.");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Could not save your data.");
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>Medical History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.readField}>
          <Text style={styles.readText}>{gender || "—"}</Text>
        </View>

        <Text style={styles.label}>Blood Type</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. O+"
          value={bloodType}
          onChangeText={setBloodType}
        />

        <Text style={[styles.label, { marginTop: 20 }]}>What do you want the doctor to know about you?</Text>
        <Text style={styles.hint}>(e.g. Weight, Height, Allergies, Illnesses…)</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Enter details here…"
          value={historyText}
          onChangeText={setHistoryText}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveTxt}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingTop:     50,
    paddingHorizontal: 16,
    paddingBottom:  12,
    backgroundColor:   "#fff",
    borderBottomWidth: 1,
    borderColor:       "#eee",
  },
  backArrow: { fontSize: 35, color: "#4CAF50", fontWeight: "bold" },
  title:     { flex: 1, textAlign: "center", fontSize: 27, fontWeight: "600", color: "#4CAF50" },

  container:    { padding: 16 },
  label:        { fontSize: 16, fontWeight: "500", color: "#333", marginBottom: 6 },
  hint:         { fontSize: 14, color: "#666", marginBottom: 12 },

  readField:    {
    backgroundColor: "#FAFAFA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius:    10,
    marginBottom:    20,
  },
  readText:     { fontSize: 16, color: "#444" },

  input:        {
    height:          48,
    borderWidth:     1,
    borderColor:     "#ccc",
    borderRadius:    10,
    paddingHorizontal: 16,
    marginBottom:    20,
    backgroundColor: "#F0FFF0",
  },
  textArea:     {
    minHeight:       220,
    borderWidth:     1,
    borderColor:     "#ccc",
    borderRadius:    10,
    padding:         16,
    textAlignVertical: "top",
    backgroundColor: "#F0FFF0",
    marginBottom:    30,
  },

  saveBtn:      {
    backgroundColor:  "#4CAF50",
    paddingVertical:  14,
    borderRadius:     25,
    alignItems:       "center",
    marginHorizontal: 16,
    marginBottom:     20,
  },
  saveTxt:      { color: "#fff", fontSize: 16, fontWeight: "600" },

  center:       { flex: 1, justifyContent: "center", alignItems: "center" },
});
