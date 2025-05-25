import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useIsFocused,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";


type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "DocSettings"
>;
type Route = RouteProp<RootStackParamList, "DocSettings">;

type TimeSlot = {
  timeslot_id: string;
  start_time: string;
  end_time: string;   
  fee: number;
};

type DoctorProfile = {
  first_name: string;
  last_name: string;
  education: { degree: string; school: string; year: string };
  hospital_name: string;
  email: string;
  phone_number: string;
};

const pad = (n: number | string) => n.toString().padStart(2, "0");
const hours = Array.from({ length: 12 }, (_, i) => pad(i + 1));
const minutes = ["00", "15", "30", "45"];
const periods: ("AM" | "PM")[] = ["AM", "PM"];

const to24 = (h: string, m: string, p: "AM" | "PM") => {
  let hr = Number(h);
  if (p === "PM" && hr < 12) hr += 12;
  if (p === "AM" && hr === 12) hr = 0;
  return `${pad(hr)}:${m}`;
};

const to12 = (t: string) => {
  const [hStr, mStr] = t.split(":");          
  let hr = Number(hStr);
  const p = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 === 0 ? 12 : hr % 12;
  return `${pad(hr)}:${pad(mStr)} ${p}`;     
};

export default function DocSettings() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<Route>();
  const doctorId = params.userId;              
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [formHospital, setFormHospital] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [selSlotId, setSelSlotId] = useState<string | null>(null);

  const [sHour, setSHour] = useState("09");
  const [sMin, setSMin] = useState("00");
  const [sPer, setSPer] = useState<"AM" | "PM">("AM");
  const [eHour, setEHour] = useState("12");
  const [eMin, setEMin] = useState("00");
  const [ePer, setEPer] = useState<"AM" | "PM">("PM");
  const [fee, setFee] = useState("0");
  const parseOrderedDict = (txt: string) => {
    const obj: Record<string, string> = {};
    const tupleRe = /\('([^']*)'\s*,\s*'([^']*)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = tupleRe.exec(txt)) !== null) {
      const [, k, v] = m;
      obj[k] = v;
    }
    return obj;
  };

  
  useEffect(() => {
    if (!isFocused) return;

    fetch(`https://se-project-group-9.onrender.com/api/doctors/${doctorId}`)
      .then((r) => r.json())
      .then((doc) => {
        let edu: any = doc.education;

        if (typeof edu === "string") {
          if (edu.trim().startsWith("OrderedDict")) {
            edu = parseOrderedDict(edu);
          } else if (edu.trim() === "-" || edu.trim() === "") {
            edu = { degree: "", school: "", year: "" };
          } else {
            try {
              edu = JSON.parse(edu);         
            } catch {
              const fixed = edu
                .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
                .replace(/'/g, '"');
              try {
                edu = JSON.parse(fixed);
              } catch {
                edu = { degree: "", school: edu, year: "" };
              }
            }
          }
        }

        setProfile({
          first_name: doc.first_name,
          last_name: doc.last_name,
          education: edu,         
          hospital_name: doc.hospital_name,
          email: doc.email ?? "—",
          phone_number: doc.phone_number ?? "—",
        });
      })
      .catch(() => Alert.alert("Error", "Failed to load doctor profile"));

    fetch(
      `https://se-project-group-9.onrender.com/api/timeslots?doctor_id=${doctorId}`
    )
      .then((r) => r.json())
      .then((data: TimeSlot[]) => setSlots(data))
      .catch(() => Alert.alert("Error", "Failed to load time slots"));
  }, [doctorId, isFocused]);

 
  const openAdd = () => {
    setSHour("09");
    setSMin("00");
    setSPer("AM");
    setEHour("12");
    setEMin("00");
    setEPer("PM");
    setFee("0");
    setAddModal(true);
  };

  const submitSlot = async () => {
    const start = to24(sHour, sMin, sPer);
    const end = to24(eHour, eMin, ePer);
    if (start >= end) {
      Alert.alert("End time must be after start time");
      return;
    }
    const payload = {
      doctor_id: doctorId,
      hospital_id: "NA", 
      start_time: `${start}:00`,
      end_time: `${end}:00`,
      fee: Number(fee) || 0,
      availability_status: "available",
    };
    try {
      const res = await fetch(
        "https://se-project-group-9.onrender.com/api/timeslots/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const newSlot: TimeSlot = await res.json();
      setSlots((prev) => [...prev, newSlot]);
      setAddModal(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const confirmDelete = (id: string) => {
    setSelSlotId(id);
    setDelModal(true);
  };
  const deleteSlot = async () => {
    if (!selSlotId) return;
    try {
      await fetch(
        `https://se-project-group-9.onrender.com/api/timeslots/${selSlotId}/`,
        { method: "DELETE" }
      );
      setSlots((prev) => prev.filter((s) => s.timeslot_id !== selSlotId));
    } catch (_) {
    } finally {
      setDelModal(false);
      setSelSlotId(null);
    }
  };

  
  const openHospitalEdit = () => {
    if (!profile) return;
    setFormHospital(profile.hospital_name);
    setEditModal(true);
  };

  const saveHospital = async () => {
    try {
      const res = await fetch(
        `https://se-project-group-9.onrender.com/api/doctors/${doctorId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hospital_name: formHospital }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, hospital_name: updated.hospital_name } : prev));
      setEditModal(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  
  const logout = () =>
    navigation.reset({ index: 0, routes: [{ name: "IntroScreen" }] });


  if (!profile) return null;
  const fullName = `Dr. ${profile.first_name} ${profile.last_name}`;

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <Ionicons name="person-circle" size={120} color="#ccc" />
          <Text style={styles.name}>{fullName}</Text>
        </View>

        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Education</Text>
          </View>
          <View style={styles.item}>
            <Ionicons name="school-outline" size={24} color="#4CAF50" />
            <Text style={styles.itemLabel}>{profile.education.school || "—"}</Text>
          </View>
        </View>

        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Workplace / Hospital</Text>
            <TouchableOpacity onPress={openHospitalEdit}>
              <Ionicons name="create-outline" size={22} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <View style={styles.item}>
            <Ionicons name="business-outline" size={24} color="#4CAF50" />
            <Text style={styles.itemLabel}>{profile.hospital_name}</Text>
          </View>
        </View>

        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Schedule (all days)</Text>
            <TouchableOpacity onPress={openAdd}>
              <Ionicons name="add-circle-outline" size={26} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          {slots.map((s) => (
            <TouchableOpacity
              key={s.timeslot_id}
              style={styles.item}
              onPress={() => confirmDelete(s.timeslot_id)}
            >
              <Ionicons name="time-outline" size={24} color="#4CAF50" />
              <Text style={styles.itemLabel}>
                {to12(s.start_time.slice(0, 5))} – {to12(s.end_time.slice(0, 5))}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("DoctorChangePassword", { userId: doctorId })}
          >
            <Ionicons name="key-outline" size={24} color="#4CAF50" />
            <Text style={styles.itemLabel}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#4CAF50" />
            <Text style={styles.itemLabel}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      
      <Modal visible={addModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Time Slot</Text>

            <Text style={styles.subLabel}>Start</Text>
            <View style={styles.row}>
              <Picker style={styles.picker} selectedValue={sHour} onValueChange={setSHour}>
                {hours.map((h) => (
                  <Picker.Item key={h} label={h} value={h} />
                ))}
              </Picker>
              <Picker style={styles.picker} selectedValue={sMin} onValueChange={setSMin}>
                {minutes.map((m) => (
                  <Picker.Item key={m} label={m} value={m} />
                ))}
              </Picker>
              <Picker style={styles.picker} selectedValue={sPer} onValueChange={(v) => setSPer(v)}>
                {periods.map((p) => (
                  <Picker.Item key={p} label={p} value={p} />
                ))}
              </Picker>
            </View>

            <Text style={styles.subLabel}>End</Text>
            <View style={styles.row}>
              <Picker style={styles.picker} selectedValue={eHour} onValueChange={setEHour}>
                {hours.map((h) => (
                  <Picker.Item key={h} label={h} value={h} />
                ))}
              </Picker>
              <Picker style={styles.picker} selectedValue={eMin} onValueChange={setEMin}>
                {minutes.map((m) => (
                  <Picker.Item key={m} label={m} value={m} />
                ))}
              </Picker>
              <Picker style={styles.picker} selectedValue={ePer} onValueChange={(v) => setEPer(v)}>
                {periods.map((p) => (
                  <Picker.Item key={p} label={p} value={p} />
                ))}
              </Picker>
            </View>

            <Text style={styles.subLabel}>Fee (optional)</Text>
            <TextInput
              placeholder="e.g. 2000"
              keyboardType="numeric"
              style={styles.input}
              value={fee}
              onChangeText={setFee}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Text style={[styles.btnText, { color: "red" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitSlot}>
                <Text style={[styles.btnText, { color: "#4CAF50" }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      
      <Modal visible={delModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Remove this slot?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setDelModal(false)}>
                <Text style={[styles.btnText, { color: "grey" }]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deleteSlot}>
                <Text style={[styles.btnText, { color: "red" }]}>Yes, remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Hospital / Workplace</Text>

            <Text style={styles.subLabel}>Hospital</Text>
            <TextInput
              style={styles.input}
              value={formHospital}
              onChangeText={setFormHospital}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Text style={[styles.btnText, { color: "grey" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveHospital}>
                <Text style={[styles.btnText, { color: "#4CAF50" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },

  header: {
    height: 86,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 10,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    elevation: 3,
  },

  profileSection: {
    alignItems: "center",
    paddingVertical: 2,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  name: { marginTop: 10, fontSize: 24, fontWeight: "600" },

  group: {
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupTitle: { fontSize: 16, fontWeight: "600", color: "#666" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  itemLabel: { marginLeft: 12, fontSize: 16, color: "#000" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  subLabel: { fontSize: 14, marginTop: 14, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  picker: { flex: 1 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  btnText: { fontSize: 16, fontWeight: "600" },
});
