import React, { useEffect, useMemo, useState } from "react";
import { Platform, StatusBar } from "react-native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList, Doctor } from "../App";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BookingScreen">;
type Route = RouteProp<RootStackParamList, "BookingScreen">;

type TimeSlot = {
  timeslot_id: string;
  doctor_id: string;
  start_time: string; 
  end_time: string;  
  availability_status: "available" | "unavailable";
};

const monthMap = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC"
] as const;

const pad = (n: number) => n.toString().padStart(2, "0");

const to24h = (time: string) => {
  const [hms, ampm] = time.split(" ");
  let [h, m] = hms.split(":").map(Number);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${pad(h)}:${pad(m)}`;
};

const to12h = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
};

const intervalsFromSlot = (slot: TimeSlot) => {
  const out: { label: string; value: string; slotId: string }[] = [];
  let [h, m] = slot.start_time.split(":").map(Number);
  const [eh, em] = slot.end_time.split(":").map(Number);

  while (h < eh || (h === eh && m < em)) {
    const label = to12h(`${pad(h)}:${pad(m)}`);
    out.push({ label, value: `${pad(h)}:${pad(m)}`, slotId: slot.timeslot_id });
    m += 30;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
};


export default function BookingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<Route>();
  const { doctor, userId } = params;          
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<{
    label: string;    
    value: string;
    slotId: string;
  } | null>(null);

  const [isConfirmModal, setConfirmModal] = useState(false);
  const [dateType, setDateType] =
    useState<"day" | "month" | "year" | null>(null);

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(pad(today.getDate()));
  const [selectedMonth, setSelectedMonth] = useState(
    monthMap[today.getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState(
    today.getFullYear().toString()
  );
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const timeOptions = useMemo(() => {
    const all = slots.flatMap(intervalsFromSlot);
    return all.filter(opt => !bookedTimes.has(opt.value));
  }, [slots, bookedTimes]);
  const isoDate = useMemo(() => {
    const monthIndex = monthMap.indexOf(selectedMonth as any);
    return `${selectedYear}-${pad(monthIndex + 1)}-${selectedDay}`; 
  }, [selectedDay, selectedMonth, selectedYear]);
  const isFocused = useIsFocused(); 
  
  useEffect(() => {
    let cancelled = false;         
    const fetchSlots = async () => {
      try {
        const res = await fetch(
          `https://se-project-group-9.onrender.com/api/timeslots?doctor_id=${doctor.doctor_id}`
        );
        const data: TimeSlot[] = await res.json();
        const available = data.filter(ts => ts.availability_status === 'available');
        const sanitized = available.map(ts => ({
          ...ts,
          start_time: ts.start_time.slice(0, 5),   
          end_time:   ts.end_time.slice(0, 5),    
        }));

        if (!cancelled) setSlots(sanitized);
      } catch (err) {
        console.error('Timeslot fetch error:', err);
      }
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, [doctor.doctor_id]);

  useEffect(() => {
    if (!isFocused || slots.length === 0) return;   

    const fetchBooked = async () => {
      try {
        const res = await fetch(
          `https://se-project-group-9.onrender.com/api/bookings?doctor_id=${doctor.doctor_id}&date=${isoDate}`
        );
        const confirmed: any[] = await res.json();
        const taken = confirmed
          .filter(b => b.appointment_status === 'confirmed')   
          .map(b => b.start_time.split('T')[1].slice(0, 5));

        setBookedTimes(new Set(taken));
      } catch (err) {
        console.error('Booking fetch error:', err);
      }
    };

    fetchBooked();
  }, [isFocused, isoDate, doctor.doctor_id, slots.length]);

  const isDateInPast = () => {
    const chosen = new Date(isoDate);
    chosen.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return chosen < now;
  };

  const handleBook = async () => {
    if (!selectedTime) return;
    if (isDateInPast()) {
      Alert.alert("Invalid Date", "Please pick a future date.");
      return;
    }

    try {
      const payload = {
        patient_id: userId,
        doctor_id: doctor.doctor_id,
        timeslot_id: selectedTime.slotId,
        date: isoDate,                        
        start_time: `${isoDate}T${selectedTime.value}:00`, 
      };

      const res = await fetch(
        "https://se-project-group-9.onrender.com/api/bookings/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Booking failed");
      }
      setConfirmModal(false);
      Alert.alert("Success", "Your appointment has been booked!");
      setBookedTimes(prev => new Set(prev).add(selectedTime!.value));
      navigation.goBack();          
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const buildPickerData = () => {
    if (dateType === "day") {
      return Array.from({ length: 31 }, (_, i) => pad(i + 1));
    }
    if (dateType === "month") return [...monthMap];
    if (dateType === "year") {
      const thisYear = today.getFullYear();
      return Array.from({ length: 5 }, (_, i) => (thisYear + i).toString());
    }
    return [];
  };

  const renderDateModal = () => (
    <Modal visible={!!dateType} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.dateModal}>
          <Text style={styles.modalTitle}>Select {dateType}</Text>
          <FlatList
            data={buildPickerData()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  if (dateType === "day") setSelectedDay(item);
                  if (dateType === "month") setSelectedMonth(item as any);
                  if (dateType === "year") setSelectedYear(item);
                  setDateType(null);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            onPress={() => setDateType(null)}
            style={styles.modalCancel}
          >
            <Text style={styles.modalCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  return (
    <View style={styles.container}>
      {renderDateModal()}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.imageContainer}>
        {doctor.picture ? (
          <Image source={{ uri: doctor.picture }} style={styles.doctorImage} />
        ) : (
          <View style={[styles.doctorImage, { backgroundColor: "#eee" }]} />
        )}
        <View style={styles.infoBubble}>
          <Text style={styles.doctorName}>
            Dr.&nbsp;{doctor.first_name} {doctor.last_name}
          </Text>
          <Text style={styles.specialty}>{doctor.specialization}</Text>
          {doctor.hospital_name ? (
            <Text style={styles.hospital}>{doctor.hospital_name}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateItem}
          onPress={() => setDateType("day")}
        >
          <Ionicons name="chevron-down" size={18} color="#4CAF50" />
          <Text style={styles.dateText}>{selectedDay}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateItem}
          onPress={() => setDateType("month")}
        >
          <Ionicons name="chevron-down" size={18} color="#4CAF50" />
          <Text style={styles.dateText}>{selectedMonth}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateItem}
          onPress={() => setDateType("year")}
        >
          <Ionicons name="chevron-down" size={18} color="#4CAF50" />
          <Text style={styles.dateText}>{selectedYear}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Available Time</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeScrollContainer}
      >
        {timeOptions.length === 0 ? (
          <Text>No available slots</Text>
        ) : (
          timeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.timeSlot,
                selectedTime?.value === opt.value && styles.selectedTime,
              ]}
              onPress={() => setSelectedTime(opt)}
            >
              <Text
                style={[
                  styles.timeText,
                  selectedTime?.value === opt.value && styles.selectedTimeText,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedTime || isDateInPast()) && styles.disabledButton,
        ]}
        disabled={!selectedTime || isDateInPast()}
        onPress={() => setConfirmModal(true)}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>

      <Modal visible={isConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalDate}>
              {new Date(isoDate).toDateString()}
            </Text>
            <Text style={styles.modalText}>Appointment With</Text>
            <Text style={styles.modalDoctor}>
              Dr.&nbsp;{doctor.first_name} {doctor.last_name}
            </Text>
            <Text style={styles.modalTime}>
              Time:&nbsp;{selectedTime?.label}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleBook}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 60, 
  },
  headerTitle: { fontSize: 27, fontWeight: "bold", color: "#4CAF50" },

  imageContainer: { alignItems: "center", marginBottom: 20 },
  doctorImage: { width: "100%", height: 300, borderRadius: 12 },
  infoBubble: {
    position: "absolute",
    bottom: -20,
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 20,
    width: "90%",
    alignItems: "center",
    elevation: 10,
  },
  doctorName: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  specialty: { fontSize: 16, color: "#fff" },
  hospital: { fontSize: 14, color: "#fff" },

  dateRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginVertical: 30,
  },
  dateItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 20, fontWeight: "bold", color: "#4CAF50" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#222",
  },
  timeScrollContainer: {
    paddingVertical: 10,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#4CAF50",
    backgroundColor: "#fff",
    marginHorizontal: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  selectedTime: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  timeText: { fontWeight: "bold", fontSize: 15, color: "#4CAF50" },
  selectedTimeText: { color: "#fff" },

  bookButton: {
    backgroundColor: "#A4E88B",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#ccc" },
  bookButtonText: { color: "#000", fontSize: 18, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalDate: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  modalText: { fontSize: 16, marginBottom: 5 },
  modalDoctor: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  modalTime: { fontSize: 16, fontWeight: "600", marginBottom: 20 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  cancelButtonText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  dateModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxHeight: "60%",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 18,
    textAlign: "center",
    color: "#4CAF50",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  modalCancel: { marginTop: 15, alignItems: "center" },
  modalCancelText: { color: "#999", fontSize: 16 },
});
