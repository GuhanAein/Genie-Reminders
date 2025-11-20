import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'REMINDERS';

/**
 * Save a reminder locally and sync to Supabase
 */
export async function saveReminder(reminder) {
  try {
    // Add local ID and timestamp
    const reminderWithMeta = {
      ...reminder,
      localId: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    // Save locally first
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(reminderWithMeta);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

    // Try to sync to Supabase
    try {
      const { data, error } = await supabase.from('reminders').insert([{
        title: reminderWithMeta.title,
        notes: reminderWithMeta.notes || '',
        trigger_at: reminderWithMeta.datetime_iso,
        timezone: reminderWithMeta.timezone || 'UTC',
        meta: reminderWithMeta,
      }]).select();

      if (error) throw error;

      // Update local storage with Supabase ID
      if (data && data[0]) {
        reminderWithMeta.supabaseId = data[0].id;
        const updated = arr.map(r =>
          r.localId === reminderWithMeta.localId ? reminderWithMeta : r
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (syncError) {
      console.warn('Failed to sync to Supabase:', syncError);
      // Continue anyway - reminder is saved locally
    }

    return reminderWithMeta;
  } catch (error) {
    console.error('Error saving reminder:', error);
    throw error;
  }
}

/**
 * Get all reminders (tries Supabase first, falls back to local)
 */
export async function getReminders() {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('trigger_at', { ascending: true });

    if (!error && data) {
      // Cache to local storage
      const formattedData = data.map(item => ({
        ...item.meta,
        supabaseId: item.id,
        title: item.title,
        notes: item.notes,
        datetime_iso: item.trigger_at,
        timezone: item.timezone,
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formattedData));
      return formattedData;
    }
  } catch (err) {
    console.warn('Supabase fetch failed, using local cache:', err);
  }

  // Fall back to local storage
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Delete a reminder
 */
export async function deleteReminder(reminderId, isSupabaseId = false) {
  try {
    // Delete from local storage
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter(r =>
      isSupabaseId ? r.supabaseId !== reminderId : r.localId !== reminderId
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Try to delete from Supabase
    if (isSupabaseId) {
      await supabase.from('reminders').delete().eq('id', reminderId);
    }

    return true;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
}

/**
 * Clear all local reminders (for debugging)
 */
export async function clearAllLocalReminders() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Sync local reminders to Supabase
 */
export async function syncLocalToSupabase() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const localReminders = raw ? JSON.parse(raw) : [];

    const unsynced = localReminders.filter(r => !r.supabaseId);

    for (const reminder of unsynced) {
      try {
        const { data, error } = await supabase.from('reminders').insert([{
          title: reminder.title,
          notes: reminder.notes || '',
          trigger_at: reminder.datetime_iso,
          timezone: reminder.timezone || 'UTC',
          meta: reminder,
        }]).select();

        if (!error && data && data[0]) {
          reminder.supabaseId = data[0].id;
        }
      } catch (err) {
        console.warn('Failed to sync reminder:', err);
      }
    }

    // Update local storage with synced IDs
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localReminders));

    return unsynced.length;
  } catch (error) {
    console.error('Sync error:', error);
    return 0;
  }
}

/**
 * Update a reminder
 */
export async function updateReminder(reminder) {
  try {
    // Update local storage
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    const updatedArr = arr.map(r => {
      const isMatch = reminder.supabaseId
        ? r.supabaseId === reminder.supabaseId
        : r.localId === reminder.localId;

      return isMatch ? { ...r, ...reminder } : r;
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArr));

    // Try to update Supabase
    if (reminder.supabaseId) {
      await supabase
        .from('reminders')
        .update({
          title: reminder.title,
          notes: reminder.notes || '',
          trigger_at: reminder.datetime_iso,
          meta: reminder,
        })
        .eq('id', reminder.supabaseId);
    }

    return true;
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
}
