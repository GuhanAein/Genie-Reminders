import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { saveGeminiKey, getGeminiKey, hasGeminiKey } from '../lib/secureKey';
import { testGeminiKey } from '../lib/gemini';
import { clearAllLocalReminders, syncLocalToSupabase } from '../utils/storage';
import { getAllScheduledNotifications, cancelAllNotifications } from '../utils/notification';

export default function SettingsScreen() {
  const [geminiKey, setGeminiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadSettings();
    loadNotificationCount();
  }, []);

  const loadSettings = async () => {
    const keyExists = await hasGeminiKey();
    setHasKey(keyExists);
    
    if (keyExists) {
      const key = await getGeminiKey();
      setGeminiKey(key ? `${key.substring(0, 10)}...` : '');
    }
  };

  const loadNotificationCount = async () => {
    const notifications = await getAllScheduledNotifications();
    setNotificationCount(notifications.length);
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      Alert.alert('Missing Key', 'Please enter your Gemini API key');
      return;
    }

    setLoading(true);
    try {
      const isValid = await testGeminiKey(geminiKey);
      
      if (!isValid) {
        Alert.alert('Invalid Key', 'This API key doesn\'t work. Please check and try again.');
        setLoading(false);
        return;
      }

      await saveGeminiKey(geminiKey);
      setHasKey(true);
      Alert.alert('✓ Success', 'Your Gemini API key has been saved!');
    } catch (error) {
      Alert.alert('Error', `Failed to save key: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKey = () => {
    setHasKey(false);
    setGeminiKey('');
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const count = await syncLocalToSupabase();
      Alert.alert('✓ Synced', `${count} reminder${count !== 1 ? 's' : ''} synced to cloud`);
    } catch (error) {
      Alert.alert('Sync Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data?',
      'This will delete all local reminders. Cloud data will remain untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllLocalReminders();
            Alert.alert('✓ Cleared', 'Local data has been cleared');
          },
        },
      ]
    );
  };

  const handleClearNotifications = () => {
    Alert.alert(
      'Cancel All Notifications?',
      `This will cancel ${notificationCount} scheduled notification${notificationCount !== 1 ? 's' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            await loadNotificationCount();
            Alert.alert('✓ Cleared', 'All notifications have been cancelled');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8EFFF', '#F8F9FF', '#F2F2F7']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>⚙️</Text>
          </View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your preferences</Text>
        </View>

        {/* API Key Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔑</Text>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Gemini API Key</Text>
              <Text style={styles.sectionDescription}>
                Securely stored on your device
              </Text>
            </View>
          </View>

          {!hasKey ? (
            <View style={styles.sectionContent}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={geminiKey}
                  onChangeText={setGeminiKey}
                  placeholder="Enter your API key"
                  placeholderTextColor="#A0A0A5"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <TouchableOpacity
                onPress={handleSaveGeminiKey}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#C7C7CC', '#C7C7CC'] : ['#667EEA', '#764BA2']}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Validating...' : 'Save API Key'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.keyStatusContainer}>
              <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                style={styles.keyStatus}
              >
                <View style={styles.keyStatusLeft}>
                  <Text style={styles.keyStatusIcon}>✓</Text>
                  <Text style={styles.keyStatusText}>API Key Configured</Text>
                </View>
                <TouchableOpacity 
                  onPress={handleUpdateKey}
                  style={styles.changeButton}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <Text style={styles.sectionDescription}>
                {notificationCount} scheduled notification{notificationCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.sectionContent}>
            <View style={styles.statBox}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.statBoxGradient}
              >
                <Text style={styles.statBoxNumber}>{notificationCount}</Text>
                <Text style={styles.statBoxLabel}>Active Reminders</Text>
              </LinearGradient>
            </View>

            <TouchableOpacity
              onPress={handleClearNotifications}
              disabled={notificationCount === 0}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryButton, notificationCount === 0 && styles.buttonDisabled]}>
                <Text style={[styles.secondaryButtonText, notificationCount === 0 && styles.buttonDisabledText]}>
                  Cancel All Notifications
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cloud Sync Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>☁️</Text>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Cloud Sync</Text>
              <Text style={styles.sectionDescription}>
                Sync with Supabase
              </Text>
            </View>
          </View>

          <View style={styles.sectionContent}>
            <TouchableOpacity
              onPress={handleSync}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  {loading ? 'Syncing...' : 'Sync Now'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Danger Zone</Text>
              <Text style={styles.sectionDescription}>
                Irreversible actions
              </Text>
            </View>
          </View>

          <View style={styles.sectionContent}>
            <TouchableOpacity
              onPress={handleClearData}
              activeOpacity={0.8}
            >
              <View style={styles.dangerButton}>
                <Text style={styles.dangerButtonText}>Clear Local Data</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>🧞 Genie Reminders</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
          <Text style={styles.footerPowered}>Powered by Gemini AI & Supabase</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  headerIcon: {
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  sectionContent: {
    gap: 12,
  },
  inputWrapper: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  keyStatusContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  keyStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  keyStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  keyStatusIcon: {
    fontSize: 24,
    color: '#2E7D32',
  },
  keyStatusText: {
    fontSize: 17,
    color: '#2E7D32',
    fontWeight: '700',
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
  },
  statBox: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statBoxGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statBoxNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  statBoxLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  secondaryButtonText: {
    color: '#667EEA',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonDisabledText: {
    color: '#8E8E93',
  },
  dangerButton: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '600',
  },
  footerPowered: {
    fontSize: 13,
    color: '#C7C7CC',
  },
});
