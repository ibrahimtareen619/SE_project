import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const OPEN_ROUTER_API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = {
  role: "system" as const,
  content:
    "You are Medi AI, an empathetic medical assistant.  \
Respond in plain English only—no LaTeX, no math markup.  \
If the user asks for a formula, describe it in words."
};

interface Message {
  id: number;
  sender: "user" | "doctor";
  content: string;
}

export default function MessageScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const userMsg: Message = {
      id: messages.length + 1,
      sender: "user",
      content: newMessage,
    };
    const convo = [...messages, userMsg];
    setMessages(convo);
    setNewMessage("");
    setIsLoading(true);

    try {
      const reply = await fetchAIReply(convo);
      setMessages((m) => [
        ...m,
        { id: m.length + 1, sender: "doctor", content: reply },
      ]);
    } catch (e) {
      console.error("AI error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchAIReply(chatHistory: Message[]): Promise<string> {
    const payloadMsgs = [
      SYSTEM_PROMPT,
      ...chatHistory.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    const payload = {
      model: "deepseek/deepseek-r1:free",
      messages: payloadMsgs,
    };

    console.log("→ sending:", payload);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPEN_ROUTER_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("← status:", res.status);
    const data = await res.json();
    console.log("← raw:", data);
    return data.choices?.[0]?.message?.content ?? "";
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.userName}>Medi AI</Text>
      </View>

      <ScrollView contentContainerStyle={styles.messageArea}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.sender === "user" ? styles.userBubble : styles.doctorBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.bubble, styles.doctorBubble]}>
            <Text style={styles.bubbleText}>Medi AI is typing…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity onPress={handleSend} disabled={isLoading}>
          <Ionicons name="send" size={24} color={isLoading ? "#999" : "#388E3C"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 80,
    backgroundColor: "#333",
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 15,
  },
  userName: { color: "#fff", fontSize: 18, marginLeft: 10 },
  messageArea: { padding: 20 },
  bubble: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  userBubble: { backgroundColor: "#388E3C", alignSelf: "flex-end" },
  doctorBubble: { backgroundColor: "#a6c09a", alignSelf: "flex-start" },
  bubbleText: { color: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
  },
});


