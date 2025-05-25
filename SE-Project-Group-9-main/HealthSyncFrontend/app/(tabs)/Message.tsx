import React, { useEffect, useState, useRef } from 'react';
import {View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import { StreamChat } from 'stream-chat';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';


const API_KEY = 'j4w7tbr2wcqm';
const chatClient = StreamChat.getInstance(API_KEY);

type RootStackParamList = {
  Message: { 
    currentUser: { id: string; name: string };
    selectedDoctor: { id: string; name: string; specialty: string };
  };
};

interface HealthChatAppProps {
  route: RouteProp<RootStackParamList, 'Message'>;
  navigation: StackNavigationProp<RootStackParamList, 'Message'>;
}

const HealthChatApp: React.FC<HealthChatAppProps> = ({ route }) => {
  const { currentUser, selectedDoctor } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionReady, setConnectionReady] = useState(false);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser || !selectedDoctor) return;

      let channelListener: any;
      setLoading(true);
      setConnectionReady(false);

      try {
        if (chatClient.userID) await chatClient.disconnectUser();
        
        await chatClient.connectUser(
          {
            id: currentUser.id,
            name: currentUser.name,
            role: 'patient', 
          },
          chatClient.devToken(currentUser.id)
        );

        const members = [currentUser.id, selectedDoctor.id].sort();
        const channelId = `health_chat_${members.join('_')}`;

        const channel = chatClient.channel('messaging', channelId, {
          members,
          created_by_id: currentUser.id,
        });

        await channel.watch();
        channelRef.current = channel;

        setMessages([...channel.state.messages].reverse());
        setConnectionReady(true);

        channelListener = (event: any) => {
          setMessages(prev => [event.message, ...prev]);
        };

        channel.on('message.new', channelListener);
      } catch (err) {
        Alert.alert('Error', 'Unable to setup chat connection');
      } finally {
        setLoading(false);
      }

      return () => {
        if (channelRef.current && channelListener) {
          channelRef.current.off('message.new', channelListener);
        }
      };
    };

    initializeChat();
  }, [currentUser?.id, selectedDoctor?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !connectionReady || !channelRef.current) return;

    try {
      await channelRef.current.sendMessage({ text: newMessage });
      setNewMessage('');
    } catch (err) {
      Alert.alert('Send Failed', 'Could not send message');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Connecting to chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {selectedDoctor.name}
        </Text>
        <Text style={styles.userInfo}>
          You are chatting with {selectedDoctor.name}
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.user.id === currentUser.id ? styles.myMessage : styles.theirMessage
            ]}
          >
            <Text style={styles.messageSender}>
              {item.user.id === currentUser.id ? 'You' : item.user.name}
            </Text>
            <Text style={[styles.messageText, item.user.id === currentUser.id && styles.myMessageText]}>
              {item.text}
            </Text>
            <Text style={styles.messageTime}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          editable={connectionReady}
          multiline
        />
        <Button title="Send" onPress={sendMessage} disabled={!newMessage.trim() || !connectionReady} />
      </View>

      {!connectionReady && (
        <View style={styles.reconnectContainer}>
          <Text style={styles.connectionWarning}>Not connected</Text>
          <Button title="Reconnect" onPress={() => setConnectionReady(false)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20, textAlign: 'center'},
  doctorButton: { padding: 15, margin: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  doctorName: { fontSize: 18, fontWeight: 'bold' },
  doctorSpecialty: { fontSize: 14, color: '#666' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' , marginTop: 50},
  headerText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  userInfo: { fontSize: 14, textAlign: 'center', marginVertical: 8, color: '#666' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  messagesContainer: { padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e5ea' },
  messageSender: { fontWeight: 'bold', marginBottom: 4, fontSize: 12 },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#ffffff' },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: 'right', color: '#666' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 8,
    borderTopWidth: 1, borderTopColor: '#e0e0e0'
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    minHeight: 40, maxHeight: 100
  },
  reconnectContainer: { padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  connectionWarning: { color: 'red', marginBottom: 8 },
});

export default HealthChatApp;
