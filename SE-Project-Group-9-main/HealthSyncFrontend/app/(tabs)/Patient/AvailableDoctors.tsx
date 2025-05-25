import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {useNavigation, useRoute,} from "@react-navigation/native";
import { RootStackParamList, Doctor } from "../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AvailableDoctors">;

const DEPARTMENTS = [
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Pediatrics",
  "Neurology",
] as const;

export default function AvailableDoctors() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const userId = (route.params as { userId?: string })?.userId ?? "";
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://se-project-group-9.onrender.com/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .catch((err) => console.error("docs fetch", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter((d) => {
    const name = `${d.first_name} ${d.last_name}`.toLowerCase();
    const matchName = name.includes(search.toLowerCase());
    const matchDept = dept ? d.specialization === dept : true;
    return matchName && matchDept;
  });

  const openBooking = (doctor: Doctor) =>
    navigation.navigate("BookingScreen", { doctor, userId });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Find a Doctor</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput
          placeholder="Search for doctor"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView>
        <Text style={styles.sectionTitle}>Departments</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deptRow}
        >
          {DEPARTMENTS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.deptPill,
                dept === d && { backgroundColor: "#4CAF50" },
              ]}
              onPress={() => setDept((prev) => (prev === d ? null : d))}
            >
              <Text
                style={[
                  styles.deptText,
                  dept === d && { color: "#fff", fontWeight: "700" },
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Doctors</Text>
        {filtered.length === 0 ? (
          <Text style={styles.noDoc}>No doctors found</Text>
        ) : (
          filtered.map((doc) => (
            <TouchableOpacity
              key={doc.doctor_id}
              style={styles.card}
              onPress={() => openBooking(doc)}
            >
              {doc.picture ? (
                <Image source={{ uri: doc.picture }} style={styles.avatar} />
              ) : (
                <Ionicons
                  name="person-circle"
                  size={60}
                  color="#ccc"
                  style={{ marginRight: 12 }}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>
                  Dr.&nbsp;{doc.first_name} {doc.last_name}
                </Text>
                <Text style={styles.special}>{doc.specialization}</Text>
                <View style={styles.hospitalTag}>
                  <Text style={styles.hospitalText}>{doc.hospital_name}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 90,
    marginBottom: 20,
  },
  screenTitle: { fontSize: 27, fontWeight: "600", color: "#4CAF50" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  deptRow: { 
    paddingVertical: 4, 
    paddingRight: 6,
    marginBottom: 15,
  },
  deptPill: {
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  deptText: { color: "#333", fontSize: 14 },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    padding: 12,
    marginBottom: 12,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  docName: { fontSize: 16, fontWeight: "bold" },
  special: { fontSize: 14, color: "gray" },
  hospitalTag: {
    alignSelf: "flex-start",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  hospitalText: { color: "#fff", fontSize: 12 },
  noDoc: { textAlign: "center", marginVertical: 20 },
});
