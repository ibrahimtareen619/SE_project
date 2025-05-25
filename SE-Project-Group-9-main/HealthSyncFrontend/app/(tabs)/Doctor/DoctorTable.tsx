import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import moment from "moment";

const { width, height } = Dimensions.get("window");

type Appointment = {
  id: string;
  name: string;
  time: string;
  startTime: string;
  endTime: string;
  patientId: string;  
};

const to12 = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  
  type Route = RouteProp<RootStackParamList, "DoctorTable">;

const formatDateFull = (dateString: string) => {
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseTimeRange = (timeRange: string) => {
  const [start, end] = timeRange.split(" - ");
  return `From ${start} To ${end}`;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AppointmentCalendarScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<Route>();
  const doctorId = params.userId;   
  const today = moment().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState<boolean>(false);

  const [byDate, setByDate] = useState<Record<string, Appointment[]>>({});
  useEffect(() => {
    setAppointments(byDate[selectedDate] || []);
  }, [byDate, selectedDate]);
  const isPastAppointment = useMemo(() => {
    if (!selectedAppointment) return true;
    const end = new Date(selectedAppointment.endTime);
    return end <= new Date();
  }, [selectedAppointment]);

  const cancelAppointment = async () => {
        if (!selectedAppointment) return;
        try {
          const res = await fetch(
            `https://se-project-group-9.onrender.com/api/bookings/${selectedAppointment.id}/`,
            { method: "DELETE" }
          );
          if (res.status === 204) {
            // remove it from our in-memory lists
            const updated = (byDate[selectedDate] || []).filter(a => a.id !== selectedAppointment.id);
            setByDate(d => ({ ...d, [selectedDate]: updated }));
            setAppointments(updated);
            setDetailModalVisible(false);
            Alert.alert("Cancelled", "Appointment has been cancelled.");
          } else {
            const text = await res.text();
            throw new Error(text || `Status ${res.status}`);
          }
        } catch (err: any) {
          console.error("Cancel error:", err);
          Alert.alert("Error", err.message || "Could not cancel appointment.");
        }
      };

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(
          `https://se-project-group-9.onrender.com/api/bookings?doctor_id=${doctorId}`
        );
        const raw: any[] = await r.json();
        const confirmed = raw.filter(
          (b) => b.appointment_status === "confirmed"
        );

        const nameCache: Record<string, string> = {};
        const makeAppt = async (b: any): Promise<Appointment> => {
          if (!nameCache[b.patient_id]) {
            try {
              const pr = await fetch(
                `https://se-project-group-9.onrender.com/api/patients/${b.patient_id}`
              );
              const p = await pr.json();
              nameCache[b.patient_id] = `${p.first_name} ${p.last_name}`;
            } catch {
              nameCache[b.patient_id] = "Unknown Patient";
            }
          }
          return {
            id: b.booking_id,
            name: nameCache[b.patient_id],
            time: `${to12(b.start_time)} - ${to12(b.end_time)}`,
            startTime: b.start_time,
            endTime: b.end_time,
            patientId: b.patient_id, 
          };
        };
        
        const appts = await Promise.all(confirmed.map(makeAppt));

        const grouped: Record<string, Appointment[]> = {};
        confirmed.forEach((b, i) => {
          if (!grouped[b.date]) grouped[b.date] = [];
          grouped[b.date].push(appts[i]);
        });
        Object.keys(grouped).forEach((d) => {
          grouped[d].sort(
            (a, b) =>
              new Date(a.startTime).getTime() -
              new Date(b.startTime).getTime()
          );
        });
        setByDate(grouped);
      } catch {
        Alert.alert("Error", "Failed to load appointments.");
      }
    };
    load();
  }, [doctorId]);

  const onDayPress = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    const list = (byDate[dateString] || []).slice();
    list.sort(
      (a, b) =>
        new Date(a.startTime).getTime() -
        new Date(b.startTime).getTime()
    );
    setAppointments(list);
  };

  const openDetailPopup = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalVisible(true);
  };

  const closeDetailPopup = () => {
    setDetailModalVisible(false);
  };

  const markedDates = useMemo(() => {
        const m: Record<string, any> = {};
        Object.keys(byDate).forEach((d) => {
          m[d] = { marked: true, dotColor: "#4CAF50" };
        });
        if (selectedDate) {
          m[selectedDate] = {
            ...(m[selectedDate] || {}),
            selected: true,
            selectedColor: "#4CAF50",
          };
        }
        return m;
      }, [byDate, selectedDate]);
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
          <MaterialIcons name="arrow-back-ios" size={26} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={onDayPress}
          style={styles.calendar}
          markedDates={markedDates}
          theme={{
            backgroundColor: "#FFF",
            calendarBackground: "#FFF",
            textSectionTitleColor: "#999",
            dayTextColor: "#000",
            todayTextColor: "#4CAF50",
            selectedDayBackgroundColor: "#4CAF50",
            selectedDayTextColor: "#FFF",
            arrowColor: "#4CAF50",
            monthTextColor: "#4CAF50",
            textDisabledColor: "#d9e1e8",
            textDayFontSize: 16,
            textMonthFontSize: 20,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      {selectedDate !== "" && (
        <View style={styles.appointmentsContainer}>
          <Text style={styles.selectedDateText}>{formatDateFull(selectedDate)}</Text>

          {appointments.length === 0 ? (
            <View style={styles.appointmentBubble}>
              <Text style={styles.noAppointmentText}>No appointment</Text>
            </View>
          ) : (
            <FlatList
              data={appointments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.appointmentBubble}
                  onPress={() => openDetailPopup(item)}
                >
                  <Text style={styles.appointmentText}>{item.name}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </TouchableOpacity>
              )}
              style={styles.appointmentsList}
            />
          )}
        </View>
      )}

      <Modal visible={isDetailModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <TouchableOpacity onPress={closeDetailPopup} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            {selectedDate !== "" && (
              <Text style={styles.detailDate}>{formatDateFull(selectedDate)}</Text>
            )}
            <Text style={styles.detailTitle}>{selectedAppointment?.name}</Text>
            {selectedAppointment?.time && (
              <Text style={styles.detailTime}>{parseTimeRange(selectedAppointment.time)}</Text>
            )}
            <Text style={styles.hospitalName}>JINNAH HOSPITAL</Text>
            <View style={styles.spacer} />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() =>
                  navigation.navigate("PatientRecord", {
                    patientId: selectedAppointment!.patientId
                  })
                }
              >
                <Text style={styles.historyText}>Check Medical History</Text>
              </TouchableOpacity>
              {!isPastAppointment && (
                <TouchableOpacity style={styles.cancelButton} onPress={cancelAppointment}>
                  <Text style={styles.cancelText}>Cancel Appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AppointmentCalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 20,
    marginTop: 40
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 55,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 50
  },
  calendar: {
    borderRadius: 10,
  },
  appointmentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  selectedDateText: {
    fontSize: 20,
    color: "#4CAF50",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  appointmentsList: {
    marginTop: 5,
  },
  appointmentBubble: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
  },
  noAppointmentText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "gray",
    textAlign: "center",
  },
  appointmentText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  timeText: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "85%",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderRadius: 15,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  detailDate: {
    fontSize: 18,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#000",
  },
  detailTime: {
    fontSize: 17,
    color: "gray",
    textAlign: "center",
    marginBottom: 5,
  },
  hospitalName: {
    fontSize: 15,
    color: "gray",
    textAlign: "center",
    marginBottom: 20,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: "100%",
  },
  historyButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  historyText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  cancelButton: {
    borderColor: "red",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "red",
    fontWeight: "bold",
  },
});
