import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    alert('Notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Notification permission denied');
    return false;
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Schedule a local notification
 * @param {Object} params
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {string} params.isoDate - ISO date string for trigger time
 * @param {Object} params.data - Additional data to pass
 */
export async function scheduleLocalNotification({ title, body, isoDate, data = {} }) {
  try {
    let triggerDate = new Date(isoDate);
    const now = new Date();
    
    // If date is in the past, try to fix it by adding a day
    if (triggerDate <= now) {
      console.warn('Date in past, attempting to add 24 hours:', isoDate);
      triggerDate = new Date(triggerDate.getTime() + (24 * 60 * 60 * 1000));
      
      // If still in past, throw error
      if (triggerDate <= now) {
        throw new Error(`Cannot schedule notification in the past. Requested: ${isoDate}, Current: ${now.toISOString()}`);
      }
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Reminder',
        body: body || '',
        data: { ...data, reminderTime: isoDate },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: triggerDate,
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

