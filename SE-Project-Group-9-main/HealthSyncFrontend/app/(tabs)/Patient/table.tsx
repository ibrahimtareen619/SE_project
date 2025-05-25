import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Card, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Booking = {
  booking_id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  appointment_status: 'confirmed' | 'cancelled' | 'completed';
};

type Doctor = {
  doctor_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
};

type AppointmentDetail = {
  date: string;
  doctor: string;
  time: string;
  booking_id: string;
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PatientTable'
>;

const prettyTime = (dateStr: string, timeOrIso: string) => {
  const iso = timeOrIso.includes("T") ? timeOrIso : `${dateStr}T${timeOrIso}`;
  try {
    return new Date(iso).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid time";
  }
};

export default function PatientTable() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const userId = (route.params as { userId: string }).userId;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] =
    useState<AppointmentDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [bookingRes, doctorRes] = await Promise.all([
          fetch(
            `https://se-project-group-9.onrender.com/api/bookings?patient_id=${userId}`
          ),
          fetch('https://se-project-group-9.onrender.com/api/doctors'),
        ]);

        const bookingData: Booking[] = await bookingRes.json();
        const doctorData: Doctor[] = await doctorRes.json();
        const active = bookingData.filter(
          (b) => b.appointment_status !== 'cancelled'
        );

        const doctorMap = doctorData.reduce(
          (acc: Record<string, Doctor>, d) => {
            acc[d.doctor_id] = d;
            return acc;
          },
          {}
        );

        setBookings(active);
        setDoctors(doctorMap);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const appointmentMap = useMemo(() => {
    return bookings.reduce((acc: Record<string, AppointmentDetail>, b) => {
      const doc = doctors[b.doctor_id];
      acc[b.date] = {
        date: b.date,
        doctor: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Unknown Doctor',
        time: `${prettyTime(b.date, b.start_time)} – ${prettyTime(b.date, b.end_time)}`,
        booking_id: b.booking_id,
      };
      return acc;
    }, {});
  }, [bookings, doctors]);

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    Object.keys(appointmentMap).forEach((d) => {
      marked[d] = { marked: true, dotColor: '#4CAF50' };
    });

    if (selectedDate && appointmentMap[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#4CAF50',
      };
    }
    return marked;
  }, [appointmentMap, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setAppointmentDetails(appointmentMap[day.dateString] || null);
    setModalVisible(true);
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await fetch(
        `https://se-project-group-9.onrender.com/api/bookings/${bookingId}/`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_status: 'cancelled' }),
        }
      );
      setBookings((prev) => prev.filter((b) => b.booking_id !== bookingId));
      setModalVisible(false);
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Your Appointments</Text>
        <Ionicons name="chevron-back" size={28} color="transparent" />
      </View>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#4CAF50',
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
        }}
      />

      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={26} color="#000" />
          </TouchableOpacity>

          <Card style={styles.modalCard}>
            {appointmentDetails ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.modalDate}>
                  {new Date(appointmentDetails.date).toDateString()}
                </Text>
                <Text style={styles.modalDoctor}>{appointmentDetails.doctor}</Text>
                <Text style={styles.modalTime}>{appointmentDetails.time}</Text>
                <Button
                  mode="contained"
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(appointmentDetails.booking_id)}
                >
                  Cancel Appointment
                </Button>
              </View>
            ) : (
              <View style={styles.noApptContainer}>
                <Text style={styles.noAppt}>No appointments for this day</Text>
              </View>
            )}
          </Card>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AvailableDoctors', { userId })}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 90,
    marginBottom: 50,
  },
  headerText: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: width * 0.85,
    padding: 24,
    paddingTop: 36,
    borderRadius: 16,
    backgroundColor: '#fff',
    minHeight: 200,
  },
  modalClose: {
    position: 'absolute',
    top: '40%',
    right: '10%',
    zIndex: 10,
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalDate: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: 8,
  },
  modalDoctor: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalTime: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
  },
  cancelBtn: {
    backgroundColor: '#ff4444',
    width: '100%',
  },
  noAppt: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  noApptContainer: {
    justifyContent: 'center',
    top: 75,
    alignItems: 'center',
    paddingVertical: 20,
  },  
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
