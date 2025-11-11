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
import { parseReminderWithGemini } from '../lib/gemini';
import { saveReminder } from '../utils/storage';
import { scheduleLocalNotification, requestNotificationPermission } from '../utils/notification';
import MessageBubble from '../components/MessageBubble';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: '👋 Hi! I\'m Genie, your smart reminder assistant.\n\nJust tell me what to remember in plain English!\n\n💡 Try:\n• "Remind me to buy milk tomorrow at 10 AM"\n• "Meeting with John on Friday at 3 PM"\n• "Call mom tonight at 8"',
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
          `I couldn't quite understand that. ${parsed.error || 'Try: "Remind me tomorrow at 9 AM to check email"'}`,
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
        addMessage(`✅ Perfect! I'll remind you about "${reminder.title}"`, false, reminder);
      } catch (notifError) {
        console.error('Notification error:', notifError);
        addMessage(
          `Reminder saved, but notification scheduling failed: ${notifError.message}`,
          false,
          reminder,
          notifError.message
        );
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage(`Something went wrong: ${error.message}`, false, null, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderPress = (reminder) => {
    Alert.alert(
      '📅 ' + reminder.title,
      `⏰ ${new Date(reminder.datetime_iso).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}\n\n${reminder.notes ? '📝 ' + reminder.notes : 'No additional notes'}`,
      [{ text: 'Got it!' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
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

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="What should I remind you?"
              placeholderTextColor="#A0A0A0"
              multiline
              maxLength={500}
              editable={!loading}
              returnKeyType="send"
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#111827',
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
