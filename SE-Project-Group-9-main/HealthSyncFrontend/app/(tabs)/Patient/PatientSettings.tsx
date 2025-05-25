import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation , useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

const { width } = Dimensions.get("window");
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PatientSettings">;

export default function PatientSettingsScreen(): JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<{
    fullName: string;
    phone: string;
    email: string;
  }>({ fullName: "", phone: "", email: "" });

  useEffect(() => {
    if (!userId) return;

    const patientReq = fetch(
      `https://se-project-group-9.onrender.com/api/patients/${userId}`
    ).then(r => r.json());

    const authReq = fetch(
      `https://se-project-group-9.onrender.com/api/authentication/${userId}`
    ).then(r => r.json());

    Promise.all([patientReq, authReq])
      .then(([patient, auth]) => {
        setProfile({
          fullName: `${patient.first_name} ${patient.last_name}`,
          phone: auth.phone_number ?? "—",
          email: auth.email ?? "—",
        });
      })
      .catch(err => console.error("Settings fetch error:", err));
  }, [userId]);
  

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={120} color="#ccc" />
          </View>
          <Ionicons
            name="camera-outline"
            size={22}
            color="#fff"
            style={styles.cameraIcon}
          />
        </TouchableOpacity>

          <Text style={styles.name}>{profile.fullName}</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Contact Details</Text>
          <View style={styles.item}>
            <Ionicons
              name="mail-outline"
              size={26}
              color="#4CAF50"
              style={styles.itemIcon}
            />
            <Text style={styles.itemLabel}>Email</Text>
            <Text style={styles.itemValue}>{profile.email}</Text>
          </View>
          <View style={styles.item}>
            <Ionicons
              name="call-outline"
              size={26}
              color="#4CAF50"
              style={styles.itemIcon}
            />
            <Text style={styles.itemLabel}>Phone</Text>
            <Text style={styles.itemValue}>{profile.phone}</Text>
          </View>
        </View>

        <View style={styles.group}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("PatientChangePassword", { userId })}
          >
            <Ionicons
              name="key-outline"
              size={26}
              color="#4CAF50"
              style={styles.itemIcon}
            />
            <Text style={styles.itemLabel}>Change Password</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={22}
              color="#ccc"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "IntroScreen" }],
              })
            }
          >
            <Ionicons
              name="log-out-outline"
              size={26}
              color="#4CAF50"
              style={styles.itemIcon}
            />
            <Text style={styles.itemLabel}>Logout</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={22}
              color="#ccc"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2"},

  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 10,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  

  profileSection: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#fff",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: { position: "relative" },
  avatar: { width: 120, height: 120, borderRadius: 45 },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    borderRadius: 14,
    padding: 3,
  },
  name: { marginTop: 14, fontSize: 20, fontWeight: "600" },

  group: {
    marginVertical: 8,
    marginHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 16,
    marginVertical: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  itemIcon: { marginRight: 16 },
  itemLabel: { flex: 1, fontSize: 18, color: "#000" },
  itemValue: { fontSize: 17, color: "#555", marginRight: 10 },
});
