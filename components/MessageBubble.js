import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function MessageBubble({ message, isUser, onReminderPress }) {
  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userContent}>
          <LinearGradient
            colors={['rgba(0, 240, 255, 0.1)', 'rgba(0, 240, 255, 0.05)']}
            style={styles.userMessageContainer}
          >
            <Text style={styles.userText}>{message.text}</Text>
          </LinearGradient>
          <View style={styles.userAccent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.botRow}>
      <View style={styles.botContent}>
        <View style={styles.botHeader}>
          <View style={styles.botIndicator} />
          <Text style={styles.botLabel}>GENIE_AI</Text>
        </View>

        <Text style={styles.botText}>{message.text}</Text>

        {message.reminder && (
          <TouchableOpacity
            style={styles.reminderWidget}
            onPress={() => onReminderPress && onReminderPress(message.reminder)}
            activeOpacity={0.8}
          >
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetLabel}>REMINDER_DATA</Text>
              <View style={styles.widgetStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.widgetBody}>
              <Text style={styles.reminderTitle}>{message.reminder.title}</Text>
              {message.reminder.notes && (
                <Text style={styles.reminderNotes}>{message.reminder.notes}</Text>
              )}

              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaValue}>
                    {new Date(message.reminder.datetime_iso).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>TIME</Text>
                  <Text style={styles.metaValue}>
                    {new Date(message.reminder.datetime_iso).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.widgetFooter}>
              <Text style={styles.tapHint}>[TAP TO MODIFY]</Text>
            </View>
          </TouchableOpacity>
        )}

        {message.error && (
          <View style={styles.errorWidget}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>SYSTEM_ALERT</Text>
            </View>
            <Text style={styles.errorText}>{message.error}</Text>
            <View style={styles.errorFooter}>
              <Text style={styles.errorCode}>ERR_CODE: 0x001</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    alignItems: 'flex-end',
    marginVertical: 12,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    maxWidth: '85%',
  },
  userMessageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  userText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  userAccent: {
    width: 4,
    backgroundColor: '#00F0FF',
    marginLeft: 4,
    borderRadius: 2,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  botRow: {
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  botContent: {
    maxWidth: '90%',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  botIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BD00FF',
    marginRight: 8,
    shadowColor: '#BD00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  botLabel: {
    color: '#BD00FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  botText: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: 14,
  },
  reminderWidget: {
    marginTop: 16,
    marginLeft: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  widgetLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  widgetStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  widgetBody: {
    padding: 16,
  },
  reminderTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  reminderNotes: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    padding: 8,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 1,
  },
  metaValue: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  widgetFooter: {
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 240, 255, 0.1)',
  },
  tapHint: {
    color: '#00F0FF',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    opacity: 0.7,
  },
  errorWidget: {
    marginTop: 12,
    marginLeft: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  errorIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  errorTitle: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorText: {
    color: '#FCD34D',
    fontSize: 13,
    padding: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorFooter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  errorCode: {
    color: '#78350F',
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.7,
  },
});
