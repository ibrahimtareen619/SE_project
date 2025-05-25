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
type Route = RouteProp<RootStackParamList, "ChatHome">;

const ChatHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Route>();

  const userId = route.params?.userId ?? "";
  const userName = route.params?.patientName ?? "";

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorsForAppointments = async () => {
      try {
        const bookingsResponse = await fetch(
          `https://se-project-group-9.onrender.com/api/bookings?patient_id=${userId}`
        );
        if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings ${userId}`);
        }

        const bookings = await bookingsResponse.json();

        const confirmedBookings = bookings.filter(
          (b: any) => b.appointment_status === "confirmed"
        );
        const doctorIdsSet = new Set(confirmedBookings.map((b: any) => b.doctor_id));
        const doctorIds = Array.from(doctorIdsSet);

        if (doctorIds.length === 0) {
          setDoctors([]);
          return;
        }

        const doctorsResponse = await fetch(
          `https://se-project-group-9.onrender.com/api/doctors/`
        );

        if (!doctorsResponse.ok) {
          throw new Error("Failed to fetch doctors list");
        }

        const allDoctors = await doctorsResponse.json();

        const matchedDoctors = allDoctors
          .filter((doc: any) => doctorIds.includes(doc.doctor_id))
          .map((doc: any) => ({
            id: doc.doctor_id,
            name: `Dr. ${doc.first_name} ${doc.last_name}`,
            specialty: doc.specialization,
            avatar: doc.picture ? { uri: doc.picture } : null,
            unread: 0,
          }));

        setDoctors(matchedDoctors);
      } catch (error) {
        console.error("Error fetching doctor chats:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorsForAppointments();
  }, [userId]);

  const chatData = [
    {
      id: "ai",
      name: "Chat With MedAI",
      avatar: null,
      pinned: true,
      unread: 0,
      isAI: true,
    },
    ...doctors,
  ];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.chatItem, item.pinned && styles.pinnedChat]}
      onPress={() => {
        if (item.isAI) {
          navigation.navigate("AIChatbot");
        } else {
          navigation.navigate("Message", {
            currentUser: { id: userId, name: userName },
            selectedDoctor: {
              id: item.id,
              name: item.name,
              specialty: item.specialty,
            },
          });
        }
      }}
    >
      {item.isAI ? (
        <View style={styles.aiCircle}>
          <Text style={styles.aiText}>AI</Text>
        </View>
      ) : item.avatar ? (
        <Image source={item.avatar} style={styles.avatar} />
      ) : (
        <View style={styles.aiCircle}>
          <Text style={styles.aiText}>D</Text>
        </View>
      )}
      <Text style={styles.chatName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home", { userId })}>
          <Ionicons name="chevron-back" size={24} color="green" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chats</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={chatData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

export default ChatHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    marginTop: 60,
  },
  headerText: { fontSize: 27, fontWeight: "bold", color: "green" },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  pinnedChat: { backgroundColor: "#a6c09a" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 16 },
  aiCircle: {
    backgroundColor: "#333",
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  aiText: { color: "#fff", fontWeight: "bold" },
  chatName: { fontWeight: "bold", fontSize: 18, flex: 1 },
});
