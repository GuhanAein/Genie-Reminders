import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { getReminders, deleteReminder, updateReminder } from '../utils/storage';
import { cancelNotification, scheduleLocalNotification } from '../utils/notification';
import { useFocusEffect } from '@react-navigation/native';

export default function CalendarScreen() {
  const [reminders, setReminders] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const loadReminders = async () => {
    try {
      const data = await getReminders();
      setReminders(data);

      const marks = {};
      data.forEach((reminder) => {
        if (reminder.datetime_iso) {
          const date = reminder.datetime_iso.split('T')[0];

          if (!marks[date]) {
            marks[date] = {
              marked: true,
              dotColor: '#00F0FF'
            };
          }
        }
      });

      setMarkedDates(marks);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
  };

  const getRemindersForDate = () => {
    if (!selectedDate) return [];
    const filtered = reminders.filter((r) => {
      if (!r.datetime_iso) return false;
      const reminderDate = r.datetime_iso.split('T')[0];
      return reminderDate === selectedDate;
    });
    return filtered.sort((a, b) => new Date(a.datetime_iso) - new Date(b.datetime_iso));
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setEditTitle(reminder.title);
    setEditNotes(reminder.notes || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReminder || !editTitle.trim()) return;

    try {
      const updatedReminder = {
        ...editingReminder,
        title: editTitle.trim(),
        notes: editNotes.trim(),
      };

      await updateReminder(updatedReminder);

      // Update notification if it exists
      if (updatedReminder.notificationId) {
        await cancelNotification(updatedReminder.notificationId);
        const newNotifId = await scheduleLocalNotification({
          title: updatedReminder.title,
          body: updatedReminder.notes || 'Reminder',
          isoDate: updatedReminder.datetime_iso,
          data: { reminderId: updatedReminder.localId },
        });
        // Update with new notification ID
        updatedReminder.notificationId = newNotifId;
        await updateReminder(updatedReminder);
      }

      setEditModalVisible(false);
      await loadReminders();
      Alert.alert('SYSTEM', 'RECORD_UPDATED');
    } catch (error) {
      Alert.alert('ERROR', 'UPDATE_FAILED');
      console.error(error);
    }
  };

  const handleDeleteReminder = (reminder, onSuccess) => {
    Alert.alert(
      'CONFIRM_DELETION',
      `Purge record "${reminder.title}"?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'PURGE',
          style: 'destructive',
          onPress: async () => {
            try {
              if (reminder.notificationId) {
                await cancelNotification(reminder.notificationId);
              }

              const id = reminder.supabaseId || reminder.localId;
              await deleteReminder(id, !!reminder.supabaseId);

              await loadReminders();
              if (onSuccess) onSuccess();
            } catch (error) {
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  };

  const renderReminderItem = ({ item }) => {
    const dateObj = new Date(item.datetime_iso);
    const time = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <Text style={styles.timelineTime}>{time}</Text>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
        </View>

        <TouchableOpacity
          style={styles.reminderCard}
          onPress={() => handleEditReminder(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <TouchableOpacity onPress={() => handleDeleteReminder(item)}>
              <Text style={styles.deleteIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {item.notes && (
            <Text style={styles.cardNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.cardStatus}>STATUS: PENDING</Text>
            <Text style={styles.editHint}>[EDIT]</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const todayReminders = getRemindersForDate();
  const upcomingCount = reminders.filter(r => {
    if (!r.datetime_iso) return false;
    return new Date(r.datetime_iso) > new Date();
  }).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050B14', '#0A1120']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL_TASKS</Text>
          <Text style={styles.statValue}>{reminders.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PENDING</Text>
          <Text style={[styles.statValue, { color: '#00F0FF' }]}>{upcomingCount}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SELECTED</Text>
          <Text style={[styles.statValue, { color: '#BD00FF' }]}>{todayReminders.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00F0FF" />
        }
      >
        <View style={styles.calendarWrapper}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: '#00F0FF',
                selectedTextColor: '#000000',
              },
            }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#64748B',
              selectedDayBackgroundColor: '#00F0FF',
              selectedDayTextColor: '#000000',
              todayTextColor: '#00F0FF',
              dayTextColor: '#E2E8F0',
              textDisabledColor: '#334155',
              dotColor: '#00F0FF',
              selectedDotColor: '#000000',
              arrowColor: '#00F0FF',
              monthTextColor: '#F8FAFC',
              textDayFontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              textMonthFontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              textDayHeaderFontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {selectedDate ? `LOG: ${selectedDate}` : 'SELECT_DATE_FOR_LOGS'}
            </Text>
          </View>

          {selectedDate && todayReminders.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>[NO_DATA_FOUND]</Text>
            </View>
          )}

          {todayReminders.length > 0 && (
            <FlatList
              data={todayReminders}
              keyExtractor={(item) => item.localId || item.supabaseId}
              renderItem={renderReminderItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT_RECORD</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>[CANCEL]</Text>
              </TouchableOpacity>
            </View>

            {editingReminder && (
              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>TITLE_DATA</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="ENTER_TITLE"
                    placeholderTextColor="#475569"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOTES_DATA</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textArea]}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="ENTER_NOTES"
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>TIMESTAMP_LOCKED:</Text>
                  <Text style={styles.dataValue}>
                    {new Date(editingReminder.datetime_iso).toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonText}>SAVE_CHANGES</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReminder(editingReminder, () => setEditModalVisible(false))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteButtonText}>DELETE_RECORD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B14',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
    height: '100%',
  },
  calendarWrapper: {
    margin: 16,
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  listContainer: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#00F0FF',
    paddingBottom: 8,
  },
  listTitle: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyText: {
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineTime: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F0FF',
    marginBottom: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#334155',
  },
  reminderCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deleteIcon: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardNotes: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatus: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  editHint: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 4,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalClose: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
    color: '#F8FAFC',
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dataRow: {
    marginBottom: 24,
  },
  dataLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  dataValue: {
    color: '#475569',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  saveButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    padding: 16,
    alignItems: 'center',
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#00F0FF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 16,
    alignItems: 'center',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
