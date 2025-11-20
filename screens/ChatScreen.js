import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { parseReminderWithGemini } from '../lib/gemini';
import { saveReminder } from '../utils/storage';
import { scheduleLocalNotification, requestNotificationPermission } from '../utils/notification';
import MessageBubble from '../components/MessageBubble';
import VoiceInput from '../components/VoiceInput'; // 1. Import VoiceInput.

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'System initialized. Ready for input.\n\nExamples:\n> "Remind me to check servers at 0900"\n> "Meeting with dev team Friday 2pm"',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const addMessage = (text, isUser = false, reminder = null, error = null) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      reminder,
      error,
    };
    setMessages((prev) => [...prev, newMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    Keyboard.dismiss();
    addMessage(userText, true);
    setLoading(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parsed = await parseReminderWithGemini(userText, timezone);

      if (!parsed.success) {
        addMessage(
          `Command not recognized. ${parsed.error || 'Please refine syntax.'}`,
          false,
          null,
          parsed.error
        );
        setLoading(false);
        return;
      }

      const reminder = await saveReminder(parsed);

      try {
        const notificationId = await scheduleLocalNotification({
          title: reminder.title,
          body: reminder.notes || 'Reminder',
          isoDate: reminder.datetime_iso,
          data: { reminderId: reminder.localId },
        });

        reminder.notificationId = notificationId;
        addMessage(`Task scheduled: "${reminder.title}"`, false, reminder);
      } catch (notifError) {
        console.error('Notification error:', notifError);
        addMessage(
          `Save successful. Notification scheduling failed: ${notifError.message}`,
          false,
          reminder,
          notifError.message
        );
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage(`System Error: ${error.message}`, false, null, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderPress = (reminder) => {
    Alert.alert(
      'DATA_VIEW',
      `ID: ${reminder.title}\nTIME: ${new Date(reminder.datetime_iso).toLocaleString()}`,
      [{ text: 'ACKNOWLEDGE' }]
    );
  };

  // 2. Add handleVoiceResults function.
  const handleVoiceResults = (text) => {
    setInput(text);
    // Optional: Auto-send if desired, but letting user review is safer
    // handleSend();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#050B14', '#0A1120']}
        style={StyleSheet.absoluteFill}
      />

      {/* Simulated Grid Background */}
      <View style={styles.gridContainer} pointerEvents="none">
        <View style={styles.gridLineVertical} />
        <View style={[styles.gridLineVertical, { left: '33%' }]} />
        <View style={[styles.gridLineVertical, { left: '66%' }]} />
        <View style={[styles.gridLineVertical, { right: 0 }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isUser={item.isUser}
                onReminderPress={handleReminderPress}
              />
            )}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>{'>'}</Text>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Enter command..."
                placeholderTextColor="#475569"
                multiline
                maxLength={500}
                editable={!loading}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              {/* 3. Add VoiceInput to the input area. */}
              <VoiceInput
                onSpeechResults={handleVoiceResults}
                isProcessing={loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#00F0FF" size="small" />
              ) : (
                <Text style={[styles.sendButtonText, !input.trim() && styles.sendButtonTextDisabled]}>
                  EXE
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B14',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    opacity: 0.1,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#00F0FF',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    padding: 20,
    paddingBottom: 20,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(5, 11, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    borderColor: '#334155',
    backgroundColor: 'transparent',
  },
  sendButtonText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sendButtonTextDisabled: {
    color: '#475569',
  },
});
