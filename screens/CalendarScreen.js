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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { getReminders, deleteReminder } from '../utils/storage';
import { cancelNotification } from '../utils/notification';
import { useFocusEffect } from '@react-navigation/native';

export default function CalendarScreen() {
  const [reminders, setReminders] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const loadReminders = async () => {
    try {
      const data = await getReminders();
      console.log('Loaded reminders:', data);
      setReminders(data);
      
      // Mark dates with reminders
      const marks = {};
      data.forEach((reminder) => {
        if (reminder.datetime_iso) {
          // Extract date in YYYY-MM-DD format
          const date = reminder.datetime_iso.split('T')[0];
          const hour = new Date(reminder.datetime_iso).getHours();
          
          if (!marks[date]) {
            marks[date] = { 
              marked: true, 
              dots: [{ color: getColorByHour(hour) }]
            };
          } else {
            marks[date].dots.push({ color: getColorByHour(hour) });
          }
        }
      });
      
      console.log('Marked dates:', marks);
      setMarkedDates(marks);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    }
  };

  const getColorByHour = (hour) => {
    if (hour < 12) return '#FF9500';
    if (hour < 17) return '#007AFF';
    return '#5856D6';
  };

  const getCategoryColor = (datetime) => {
    const hour = new Date(datetime).getHours();
    if (hour < 12) return { 
      gradient: ['#FF9500', '#FF6B00'], 
      bg: '#FFF5E6', 
      text: '#CC7A00',
      emoji: '☀️'
    };
    if (hour < 17) return { 
      gradient: ['#007AFF', '#0051D5'], 
      bg: '#E8F4FF', 
      text: '#0051D5',
      emoji: '🌤️'
    };
    return { 
      gradient: ['#5856D6', '#4642A8'], 
      bg: '#F0EFFF', 
      text: '#4642A8',
      emoji: '🌙'
    };
  };

  const getCategoryLabel = (datetime) => {
    const hour = new Date(datetime).getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
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
    console.log('Selected date:', date.dateString);
    setSelectedDate(date.dateString);
  };

  const getRemindersForDate = () => {
    if (!selectedDate) return [];
    const filtered = reminders.filter((r) => {
      if (!r.datetime_iso) return false;
      const reminderDate = r.datetime_iso.split('T')[0];
      return reminderDate === selectedDate;
    });
    console.log('Reminders for', selectedDate, ':', filtered);
    return filtered.sort((a, b) => new Date(a.datetime_iso) - new Date(b.datetime_iso));
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setEditModalVisible(true);
  };

  const handleDeleteReminder = (reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (reminder.notificationId) {
                await cancelNotification(reminder.notificationId);
              }
              
              const id = reminder.supabaseId || reminder.localId;
              await deleteReminder(id, !!reminder.supabaseId);
              
              await loadReminders();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const renderReminderItem = ({ item }) => {
    const dateObj = new Date(item.datetime_iso);
    const time = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const fullDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    const colors = getCategoryColor(item.datetime_iso);

    return (
      <View style={styles.reminderCard}>
        <LinearGradient
          colors={['#FFFFFF', '#FAFBFF']}
          style={styles.reminderGradient}
        >
          <View style={[styles.categoryStrip, { backgroundColor: colors.gradient[0] }]} />
          
          <View style={styles.reminderMain}>
            <TouchableOpacity 
              style={styles.reminderLeft}
              onPress={() => handleEditReminder(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryBadge, { backgroundColor: colors.bg }]}>
                <Text style={styles.categoryEmoji}>{colors.emoji}</Text>
                <Text style={[styles.categoryText, { color: colors.text }]}>
                  {getCategoryLabel(item.datetime_iso)}
                </Text>
              </View>
              
              <Text style={styles.reminderTitle}>{item.title}</Text>
              
              {item.notes && (
                <Text style={styles.reminderNotes} numberOfLines={2}>
                  {item.notes}
                </Text>
              )}
              
              <View style={styles.timeContainer}>
                <LinearGradient
                  colors={colors.gradient}
                  style={styles.timeChip}
                >
                  <Text style={styles.timeText}>📅 {fullDate}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={colors.gradient}
                  style={[styles.timeChip, { marginLeft: 8 }]}
                >
                  <Text style={styles.timeText}>⏰ {time}</Text>
                </LinearGradient>
              </View>
              
              <Text style={styles.tapToEdit}>Tap to edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteReminder(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
        colors={['#F8F9FF', '#F2F2F7']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.statCard}>
          <Text style={styles.statNumber}>{reminders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </LinearGradient>
        
        <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </LinearGradient>
        
        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.statCard}>
          <Text style={styles.statNumber}>{todayReminders.length}</Text>
          <Text style={styles.statLabel}>Selected</Text>
        </LinearGradient>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: '#667EEA',
              },
            }}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#8E8E93',
              selectedDayBackgroundColor: '#667EEA',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#667EEA',
              dayTextColor: '#1C1C1E',
              textDisabledColor: '#C7C7CC',
              dotColor: '#667EEA',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#667EEA',
              monthTextColor: '#1C1C1E',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Reminders List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a date'}
            </Text>
            {selectedDate && (
              <Text style={styles.listSubtitle}>
                {todayReminders.length} reminder{todayReminders.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {selectedDate && todayReminders.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No reminders</Text>
              <Text style={styles.emptySubtext}>Go to Chat to create one!</Text>
            </View>
          )}

          {todayReminders.length > 0 && (
            <FlatList
              data={todayReminders}
              keyExtractor={(item) => item.localId || item.supabaseId}
              renderItem={renderReminderItem}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>View Reminder</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {editingReminder && (
              <View style={styles.modalBody}>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <Text style={styles.modalValue}>{editingReminder.title}</Text>
                </View>
                
                {editingReminder.notes && (
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Notes</Text>
                    <Text style={styles.modalValue}>{editingReminder.notes}</Text>
                  </View>
                )}
                
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Date & Time</Text>
                  <Text style={styles.modalValue}>
                    {new Date(editingReminder.datetime_iso).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Category</Text>
                  <View style={styles.modalCategory}>
                    <Text style={styles.categoryEmoji}>
                      {getCategoryColor(editingReminder.datetime_iso).emoji}
                    </Text>
                    <Text style={styles.modalValue}>
                      {getCategoryLabel(editingReminder.datetime_iso)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setEditModalVisible(false)}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.modalCloseGradient}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  calendar: {
    borderRadius: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  listContent: {
    gap: 14,
  },
  reminderCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  reminderGradient: {
    borderRadius: 20,
  },
  categoryStrip: {
    height: 4,
    width: '100%',
  },
  reminderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
  },
  reminderLeft: {
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  reminderNotes: {
    fontSize: 15,
    color: '#636366',
    marginBottom: 12,
    lineHeight: 22,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tapToEdit: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 26,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 18,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  modalClose: {
    fontSize: 28,
    color: '#8E8E93',
    fontWeight: '400',
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  modalField: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 18,
    color: '#1C1C1E',
    lineHeight: 26,
  },
  modalCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCloseButton: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  modalCloseGradient: {
    padding: 18,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
