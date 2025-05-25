import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../../firebase";
import { RootStackParamList } from "../App";

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "DoctorChangePassword"
>;
type Rt = RouteProp<RootStackParamList, "DoctorChangePassword">;

export default function DoctorChangePassword() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const doctorId = params.userId;

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const isStrong = (pw: string) =>
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  const onSave = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      Alert.alert("All fields are required");
      return;
    }
    if (newPw === oldPw) {
      Alert.alert("New password cannot be the same as current");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("Passwords do not match");
      return;
    }
    if (!isStrong(newPw)) {
      Alert.alert(
        "Password must be ≥8 chars, include uppercase, number & special char"
      );
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("Not logged in");
      const cred = EmailAuthProvider.credential(user.email, oldPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      const res = await fetch(
        `https://se-project-group-9.onrender.com/api/authentication/${doctorId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPw }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      Alert.alert("Success", "Password changed");
      navigation.goBack();
    } catch (e: any) {
      const msg =
        e.code === "auth/wrong-password"
          ? "Current password incorrect"
          : e.code === "auth/weak-password"
          ? "New password is too weak"
          : e.message;
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons
              name="arrow-back-ios"
              size={28}
              color="#4CAF50"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
        </View>
        <View style={{ padding: 24 }}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showOld}
              value={oldPw}
              onChangeText={setOldPw}
            />
            <TouchableOpacity onPress={() => setShowOld((p) => !p)}>
              <Ionicons
                name={showOld ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showNew}
              value={newPw}
              onChangeText={setNewPw}
            />
            <TouchableOpacity onPress={() => setShowNew((p) => !p)}>
              <Ionicons
                name={showNew ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showConfirm}
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((p) => !p)}
            >
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.btn, saving && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.btnTxt}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginLeft: 8,
  },
  label: { fontSize: 16, marginTop: 22, marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 16 },
  btn: {
    marginTop: 40,
    backgroundColor: "#4CAF50",
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 12,
  },
  btnTxt: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
