import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../App";

const { width } = Dimensions.get("window");

type Appointment = {
  booking_id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  appointment_status: string;
  doctor_name?: string; 
};

const HomeScreen = () => {
  const route = useRoute();
  const userId = (route.params as { userId: string })?.userId;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientName, setPatientName] = useState("");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [gender, setGender] = useState<string>("");
  const [bloodType, setBloodType] = useState<string>("");
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isFocused) return;
      try {
        const response = await fetch(
          `https://se-project-group-9.onrender.com/api/bookings?patient_id=${userId}`
        );
        if (!response.ok) throw new Error('Failed to fetch appointments');
        let data: Appointment[] = await response.json();
        data = data.filter(a => a.appointment_status === "confirmed"); 
        const updatedData = await Promise.all(
          data.map(async (appointment) => {
            try {
              const doctorRes = await fetch(
                `https://se-project-group-9.onrender.com/api/doctors/${appointment.doctor_id}`
              );
              if (!doctorRes.ok) throw new Error('Failed to fetch doctor');
              const doctorData = await doctorRes.json();
              return { ...appointment, doctor_name: `Dr. ${doctorData.first_name} ${doctorData.last_name} `};
            } catch (error) {
              console.error("Error fetching doctor name:", error);
              return { ...appointment, doctor_name: "Unknown Doctor" };
            }
          })
        );
        const now = new Date();
      const upcoming = updatedData.filter(a => {
        let end: Date;
        if (a.end_time.includes("T")) {
          end = new Date(a.end_time);
        } else {
          end = new Date(`${a.date}T${a.end_time}`);
        }
        return end > now;
      });
      upcoming.sort((a, b) => {
        const parse = (appt: typeof a) => {
          if (appt.start_time.includes("T")) {
            return new Date(appt.start_time);
          }
          return new Date(`${appt.date}T${appt.start_time}`);
        };
        return parse(a).getTime() - parse(b).getTime();
      });
      setAppointments(upcoming);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };
    fetchAppointments();
  }, [userId, isFocused]);

  useEffect(() => {
    const fetchPatientName = async () => {
      if (!userId) return;
      try {
        const response = await fetch(
          `https://se-project-group-9.onrender.com/api/patients/${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch patient");
        const data = await response.json();
        setPatientName(`${data.first_name}`);
        setGender(data.gender);
        setBloodType(data.blood_type ?? "");
      } catch (error) {
        console.error("Error fetching patient:", error);
        setPatientName("");
      }
    };
    fetchPatientName();
  }, [userId]);

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const date = new Date(item.date);
    const prettyTime = (dateStr: string, timeOrIso: string) => {
      const iso = timeOrIso.includes("T")           
        ? timeOrIso                                  
        : `${dateStr}T${timeOrIso}`;                  
    
      return new Date(iso).toLocaleString(
        "en-US",                                      
        { hour: "numeric", minute: "2-digit", hour12: true }
      );                                              
    };
    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.doctor}>{item.doctor_name || "Unknown Doctor"}</Text>
          <Text style={styles.time}>
            {prettyTime(item.date, item.start_time)} – {prettyTime(item.date, item.end_time)}
          </Text>
          <Text style={styles.hospital}>Status: {item.appointment_status}</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.date}>{date.getDate()}</Text>
          <Text style={styles.monthYear}>
            {date.toLocaleString('default', { month: 'short' }).toUpperCase()} {date.getFullYear()}
          </Text>
        </View>
      </View>
    );
  };

  const renderNoAppointments = () => (
    <View style={styles.card}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#777" }}>
          No Appointments Yet
        </Text>
        <Text style={{ fontSize: 14, marginTop: 5, color: "#aaa" }}>
          Book your first appointment!
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("PatientSettings", { userId })}>
          <Ionicons name="person-circle" size={50} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ChatHome", { userId, patientName })}>
          <MaterialIcons name="chat-bubble-outline" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Hello, {patientName || ""}</Text>

      <View style={styles.bodyContent}>
        <View style={{ position: "relative" }}>
          <FlatList
            data={appointments.length > 0 ? appointments : [{} as Appointment]}
            horizontal
            renderItem={appointments.length > 0 ? renderAppointment : renderNoAppointments}
            keyExtractor={(item, index) =>
              appointments.length > 0 ? item.booking_id : index.toString()
            }
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 20, paddingLeft: 4 }}
          />
          <View style={styles.upcomingLabel}>
            <Text style={styles.upcomingText}>Upcoming{"\n"}Appointments</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.largeBox} onPress={() => navigation.navigate("PatientTable", { userId })}>
            <Image
              source={require("./assets/appt.png")}
              style={styles.boxImage}
              resizeMode="contain"
            />
            <Text style={styles.boxText}>Appointments</Text>
          </TouchableOpacity>

          <View>
            <TouchableOpacity style={styles.smallBox1} onPress={() => navigation.navigate("MedicalHistory", {
              userId: userId
            })}>
              <Image
                source={require("./assets/hist.png")}
                style={styles.boxImage}
                resizeMode="contain"
              />
              <Text style={styles.boxText}>Medical History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smallBox2} onPress={() => navigation.navigate("AvailableDoctors", { userId })}>
              <Image
                source={require("./assets/doc.png")}
                style={styles.boxImage}
                resizeMode="contain"
              />
              <Text style={styles.boxText}>See Doctors</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 45,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
  },
  bodyContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 25,
    width: width * 0.87,
    height: 160,
    marginVertical: 20,
    marginRight: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 8,
  },
  doctor: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  time: {
    fontWeight: "500",
    fontSize: 14,
  },
  hospital: {
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 13,
  },
  dateBox: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: "auto",
  },
  date: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  monthYear: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  upcomingLabel: {
    position: "absolute",
    right: 0,
    bottom: -30,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 18,
    zIndex: 1,
  },
  upcomingText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 40,
  },
  largeBox: {
    backgroundColor: "#C7E9C0",
    width: width * 0.56,
    height: 310,
    borderRadius: 12,
    justifyContent: "flex-end",
    padding: 15,
    overflow: "hidden",
  },
  smallBox1: {
    backgroundColor: "#75DB7A",
    height: 150,
    width: width * 0.33,
    borderRadius: 12,
    justifyContent: "flex-end",
    padding: 15,
    marginBottom: 10,
    overflow: "hidden",
  },
  smallBox2: {
    backgroundColor: "#A1D998",
    height: 150,
    width: width * 0.33,
    borderRadius: 12,
    justifyContent: "flex-end",
    padding: 15,
    overflow: "hidden",
  },
  boxImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
    borderRadius: 12,
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  boxText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});