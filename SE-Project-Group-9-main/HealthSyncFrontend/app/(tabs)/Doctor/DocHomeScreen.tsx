import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import moment from "moment";
import {useNavigation, useRoute, useIsFocused, RouteProp,} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "DocHomeScreen">;

type Appointment = {
  id: string;
  name: string;
  time: string;
  hospital: string;
  startTime: string;
};

type Booking = {
  booking_id: string;
  patient_id: string;
  date: string;
  start_time: string;
  end_time: string;
  appointment_status: "confirmed" | "cancelled" | "completed";
};

const to12 = (iso: string) => {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDatePretty = (d: string) =>
  moment(d).format("D MMMM YYYY").toUpperCase();

const DetailModal = ({
  visible,
  onClose,
  appt,
}: {
  visible: boolean;
  onClose: () => void;
  appt: Appointment | null;
}) => {
  if (!appt) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={mStyles.backdrop}>
        <View style={mStyles.card}>
          <TouchableOpacity style={mStyles.close} onPress={onClose}>
            <Ionicons name="close" size={24} />
          </TouchableOpacity>
          <Text style={mStyles.date}>{formatDatePretty(new Date().toISOString())}</Text>
          <Text style={mStyles.name}>{appt.name}</Text>
          <Text style={mStyles.time}>Time&nbsp;{appt.time}</Text>
          <Text style={mStyles.hosp}>{appt.hospital}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default function DocHomeScreen() {
  const nav = useNavigation<NavigationProp>();
  const route = useRoute<Route>();
  const isFocused = useIsFocused();

  type DocHomeParams = { userId: string };
  const { userId: doctorId } =
    (route.params as unknown as DocHomeParams) ?? { userId: "" };
  const [doctorName, setDoctorName] = useState("Dr. ");
  const [hospitalName, setHospitalName] = useState("");
  const [byDate, setByDate] = useState<Record<string, Appointment[]>>({});
  const todayISO = moment().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!isFocused) return;

    const load = async () => {
      try {
        const docRes = await fetch(
          `https://se-project-group-9.onrender.com/api/doctors/${doctorId}`
        );
        const doc = await docRes.json();
        setDoctorName(`Dr. ${doc.first_name} ${doc.last_name}`);
        const hosp = doc.hospital_name ?? "";
        setHospitalName(hosp);

        const bookRes = await fetch(
          `https://se-project-group-9.onrender.com/api/bookings?doctor_id=${doctorId}`
        );
        const bookings: Booking[] = (await bookRes.json()).filter(
          (b: Booking) => b.appointment_status === "confirmed"
        );

        const nameCache: Record<string, string> = {};
        const makeAppt = async (b: Booking): Promise<Appointment> => {
          if (!nameCache[b.patient_id]) {
            try {
              const pRes = await fetch(
                `https://se-project-group-9.onrender.com/api/patients/${b.patient_id}`
              );
              const p = await pRes.json();
              nameCache[b.patient_id] = `${p.first_name} ${p.last_name}`;
            } catch {
              nameCache[b.patient_id] = "Unknown Patient";
            }
          }
          return {
            id: b.booking_id,
            name: nameCache[b.patient_id],
            time: `${to12(b.start_time)} – ${to12(b.end_time)}`,
            hospital: hosp,
            startTime: b.start_time,
          };
        };

        const apptPromises = bookings.map((b) => makeAppt(b));
        const appts = await Promise.all(apptPromises);
        const grouped: Record<string, Appointment[]> = {};
        bookings.forEach((b, i) => {
          if (!grouped[b.date]) grouped[b.date] = [];
          grouped[b.date].push(appts[i]);
        });
        Object.keys(grouped).forEach(day => {
            grouped[day].sort((a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
          });
          setByDate(grouped);
      } catch {
        Alert.alert("Error", "Unable to load dashboard data. Please try again.");
      }
    };

    load();
  }, [doctorId, isFocused, hospitalName]);

  const todayAppointments = byDate[selectedDate] ?? [];
  const markedDates = useMemo(() => {
    const m: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string; dotColor?: string }> = {};
    Object.keys(byDate).forEach((d) => {
      m[d] = { marked: true, dotColor: "#4CAF50" };
    });
    if (selectedDate) {
      m[selectedDate] = { ...(m[selectedDate] || {}), selected: true, selectedColor: "#4CAF50" };
    }
    return m;
  }, [byDate, selectedDate]);

  const openDetail = (appt: Appointment) => {
    setSelectedAppt(appt);
    setDetailVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => nav.navigate("DocSettings", { userId: doctorId })}>
          <Ionicons name="person-circle" size={50} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate("DocChatHome",{useId :doctorId,doctorName: doctorName})}>
          <MaterialIcons name="chat-bubble-outline" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      <Text style={styles.greeting}>Hello, {doctorName}</Text>

      <View style={styles.fixedAppointmentContainer}>
        {todayAppointments.length > 0 ? (
          <FlatList
            data={todayAppointments}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openDetail(item)}>
                <View style={styles.appointmentCard}>
                  <View>
                    <Text style={styles.patient}>{item.name}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                    <Text style={styles.hospital}>{item.hospital}</Text>
                  </View>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateText}>
                      {moment(selectedDate).format("DD")}
                    </Text>
                    <Text style={styles.monthYearText}>
                      {moment(selectedDate).format("MMM YYYY").toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[styles.appointmentCard, styles.noAppointmentCard]}>
            <Text style={styles.noAppointmentText}>
              No appointments {selectedDate === todayISO ? "today" : "for this date"}
            </Text>
          </View>
        )}
        <View style={styles.upcomingLabel}>
          <Text style={styles.upcomingText}>Today's{"\n"}Appointments</Text>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
          hideExtraDays
          hideArrows
          theme={{
            todayTextColor: "#4CAF50",
            selectedDayBackgroundColor: "#4CAF50",
            selectedDayTextColor: "#fff",
            textDayFontSize: 16,
          }}
          renderHeader={() => null}
          dayComponent={({ date }: { date: DateData }) => {
            const dateStr = date.dateString;
            const count = byDate[dateStr]?.length ?? 0;
            const isSel = dateStr === selectedDate;

            const capsule = (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: "#4CAF50",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#4CAF50",
                    marginBottom: count > 0 ? 4 : 0,
                  }}
                >
                  {date.day}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      backgroundColor: "#4CAF50",
                      borderRadius: 20,
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            );

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedDate(dateStr)}
              >
                {isSel ? (
                  capsule
                ) : (
                  <View style={{ alignItems: "center", width: 48, height: 64 }}>
                    <Text style={{ fontSize: 16 }}>{date.day}</Text>
                    {count > 0 && (
                      <View
                        style={{
                          marginTop: 4,
                          backgroundColor: "#4CAF50",
                          borderRadius: 20,
                          width: 24,
                          height: 24,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <TouchableOpacity
        style={styles.allAppointmentsButton}
        onPress={() => nav.navigate("DoctorTable", { userId: doctorId })}
      >
        <Text style={styles.allAppointmentsText}>All{"\n"}Appointments</Text>
      </TouchableOpacity>

      <DetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        appt={selectedAppt}
      />
    </View>
  );
}



const styles = StyleSheet.create({
container: { flex: 1, padding: 20, paddingBottom: 100, backgroundColor: "#fff" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
  },
  greeting: { fontSize: 22, fontWeight: "bold", marginTop: 10 },

  fixedAppointmentContainer: {
    position: "relative",
    height: 200, 
    justifyContent: "center",
  },

  appointmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 25,
    width: 340,
    height: 160,
    marginVertical: 10,
    marginRight: 20,
    marginLeft: 5,
    borderRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    justifyContent: "space-between",
    marginTop: 0.1
  },
  patient: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  time: { fontSize: 14, fontWeight: "500" },
  hospital: { fontWeight: "bold", marginTop: 4, fontSize: 13 },
  dateBox: { alignItems: "flex-end", justifyContent: "center" },
  dateText: { fontSize: 34, fontWeight: "bold", color: "#4CAF50" },
  monthYearText: { fontSize: 14, color: "#4CAF50", fontWeight: "600" },

  upcomingLabel: {
    position: "absolute",
    right: 0,
    bottom: -30,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 18,
  },
  upcomingText: { color: "#fff", fontWeight: "bold", fontSize: 20, textAlign: "center", lineHeight: 22 },

  noAppointmentCard: { alignItems: "center", justifyContent: "center" },
  noAppointmentText: { fontSize: 16, fontWeight: "500", color: "#777" },

  calendarContainer: { marginTop: 30 },

  allAppointmentsButton: {
    position: "absolute",
    bottom: 15,
    right: 20,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 18,
  },
  allAppointmentsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 22,
  },
});

const mStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  close: { alignSelf: "flex-end" },
  date: { color: "#4CAF50", fontWeight: "bold", fontSize: 15 },
  name: { fontSize: 22, fontWeight: "bold", marginVertical: 10 },
  time: { fontSize: 16, marginBottom: 6 },
  hosp: { fontSize: 14, color: "gray" },
});