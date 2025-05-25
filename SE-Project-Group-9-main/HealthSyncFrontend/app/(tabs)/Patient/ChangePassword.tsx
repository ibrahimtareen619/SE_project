import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, RouteProp, useRoute } from "@react-navigation/native";
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
  "PatientChangePassword"
>;
type Rt = RouteProp<RootStackParamList, "PatientChangePassword">;

export default function PatientChangePassword() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const userId = params.userId;

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

  const pwStrong = (pw: string) =>
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  const handleSave = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      Alert.alert("All fields are required");
      return;
    }
    if (newPw === oldPw) {
      Alert.alert("New password cannot be the same as current password");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("New passwords do not match");
      return;
    }
    if (!pwStrong(newPw)) {
      Alert.alert(
        "Password must be at least 8 characters and include an uppercase letter, a number and a special character"
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
      const back = await fetch(
        `https://se-project-group-9.onrender.com/api/authentication/${userId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPw }),
        }
      );
      if (!back.ok) {
        const txt = await back.text();
        throw new Error(txt || "Backend update failed");
      }
      Alert.alert("Success", "Password changed successfully");
      navigation.goBack();
    } catch (e: any) {
      const code = e.code || "";
      const msg =
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        /wrong-password/i.test(e.message)
          ? "Current password is incorrect"
          : code === "auth/weak-password"
          ? "New password is too weak"
          : e.message || "Could not change password";
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
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={28} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={s.title}>Change Password</Text>
        </View>

        <View style={{ padding: 24 }}>
          <Text style={s.label}>Current Password</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
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

          <Text style={s.label}>New Password</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
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

          <Text style={s.label}>Confirm New Password</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              secureTextEntry={!showConfirm}
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <TouchableOpacity onPress={() => setShowConfirm((p) => !p)}>
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.btnTxt}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
