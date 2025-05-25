import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "DocChatHome">;

const DoctorChatHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Route>();

  const doctorId = route.params?.useId ?? "";
  const doctorName = route.params?.doctorName ?? "";

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientsForAppointments = async () => {
      try {
        const bookingsRes = await fetch(
          `https://se-project-group-9.onrender.com/api/bookings?doctor_id=${doctorId}`
        );

        if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");

        const bookings = await bookingsRes.json();
        const confirmed = bookings.filter((b: any) => b.appointment_status === "confirmed");
        const patientIdsSet = new Set(confirmed.map((b: any) => b.patient_id));
        const patientIds = Array.from(patientIdsSet);

        if (patientIds.length === 0) {
          setPatients([]);
          return;
        }

        const patientsRes = await fetch("https://se-project-group-9.onrender.com/api/patients/");
        if (!patientsRes.ok) throw new Error("Failed to fetch patients");

        const allPatients = await patientsRes.json();
        const matchedPatients = allPatients
          .filter((p: any) => patientIds.includes(p.patient_id))
          .map((p: any) => ({
            id: p.patient_id,
            name: `${p.first_name} ${p.last_name}`,
            avatar: p.picture ? { uri: p.picture } : null,
            unread: 0,
          }));

        setPatients(matchedPatients);
      } catch (error) {
        console.error("Error fetching doctor patients:", error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsForAppointments();
  }, [doctorId]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.chatItem, item.pinned && styles.pinnedChat]}
      onPress={() =>
        navigation.navigate("Message", {
          currentUser: {
            id: doctorId,
            name: doctorName,
          },
          selectedDoctor: {
            id: item.id,
            name: item.name,
            specialty: "Patient",
          },
        })
      }
    >
      {item.avatar ? (
        <Image source={item.avatar} style={styles.avatar} />
      ) : (
        <View style={styles.aiCircle}>
          <Text style={styles.aiText}>P</Text>
        </View>
      )}
      <Text style={styles.chatName}>{item.name}</Text>
      {item.unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.unread > 3 ? "3+" : item.unread}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chats</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
      ) : patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active patient in the booking to talk</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

export default DoctorChatHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    marginTop: 60,
  },
  headerText: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    backgroundColor: "#fff",
  },
  pinnedChat: {
    backgroundColor: "#C8FAD3",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  aiCircle: {
    backgroundColor: "#333",
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  aiText: {
    color: "#fff",
    fontWeight: "bold",
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 18,
    flex: 1,
  },
  badge: {
    backgroundColor: "#b71c1c",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
