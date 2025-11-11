import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MessageBubble({ message, isUser, onReminderPress }) {
  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.botContainer}>
      <View style={styles.botBubble}>
        <Text style={styles.botText}>{message.text}</Text>
        
        {message.reminder && (
          <TouchableOpacity 
            style={styles.reminderCard}
            onPress={() => onReminderPress && onReminderPress(message.reminder)}
            activeOpacity={0.8}
          >
            <View style={styles.reminderHeader}>
              <View style={styles.iconBadge}>
                <Text style={styles.reminderIcon}>📅</Text>
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{message.reminder.title}</Text>
                {message.reminder.notes && (
                  <Text style={styles.reminderNotes} numberOfLines={2}>
                    {message.reminder.notes}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.reminderFooter}>
              <View style={styles.timeChip}>
                <Text style={styles.timeText}>
                  📅 {new Date(message.reminder.datetime_iso).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={styles.timeChip}>
                <Text style={styles.timeText}>
                  ⏰ {new Date(message.reminder.datetime_iso).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
            
            <Text style={styles.tapHint}>Tap to view details</Text>
          </TouchableOpacity>
        )}
        
        {message.error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {message.error}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  botContainer: {
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  botText: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 24,
  },
  reminderCard: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
  },
  reminderHeader: {
    flexDirection: 'row',
    padding: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderIcon: {
    fontSize: 24,
  },
  reminderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reminderNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  reminderFooter: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  timeChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingBottom: 10,
    fontStyle: 'italic',
  },
  errorCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
});
