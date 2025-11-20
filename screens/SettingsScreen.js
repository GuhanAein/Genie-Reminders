import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
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
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    loadSettings();
    loadNotificationCount();
  }, []);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  const showStatus = (type, message) => {
    setStatusMsg({ type, message });
  };

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
      showStatus('error', 'INPUT_ERROR: KEY_MISSING');
      return;
    }

    setLoading(true);
    try {
      const isValid = await testGeminiKey(geminiKey);

      if (!isValid) {
        showStatus('error', 'AUTH_FAILED: INVALID_KEY');
        setLoading(false);
        return;
      }

      await saveGeminiKey(geminiKey);
      setHasKey(true);
      showStatus('success', 'KEY_SECURED');
    } catch (error) {
      showStatus('error', `SYS_ERR: ${error.message}`);
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
      showStatus('success', `SYNC_COMPLETE: ${count} RECORDS`);
    } catch (error) {
      showStatus('error', `SYNC_FAILED: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'CRITICAL_ACTION',
      'INITIATE_LOCAL_WIPE?',
      [
        { text: 'ABORT', style: 'cancel' },
        {
          text: 'CONFIRM_WIPE',
          style: 'destructive',
          onPress: async () => {
            await clearAllLocalReminders();
            showStatus('warning', 'LOCAL_DATA_PURGED');
          },
        },
      ]
    );
  };

  const handleClearNotifications = () => {
    Alert.alert(
      'CRITICAL_ACTION',
      `CANCEL ${notificationCount} SCHEDULED_TASKS?`,
      [
        { text: 'ABORT', style: 'cancel' },
        {
          text: 'CONFIRM',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            await loadNotificationCount();
            showStatus('warning', 'SCHEDULE_CLEARED');
          },
        },
      ]
    );
  };

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderIndicator} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050B14', '#0A1120']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SYSTEM_CONFIG</Text>
          <Text style={styles.headerSubtitle}>V1.0.0 // GENIE_CORE</Text>
        </View>

        {/* Status Bar */}
        {statusMsg && (
          <View style={[
            styles.statusBar,
            statusMsg.type === 'error' ? styles.statusError :
              statusMsg.type === 'warning' ? styles.statusWarning : styles.statusSuccess
          ]}>
            <Text style={styles.statusText}>{statusMsg.message}</Text>
          </View>
        )}

        {/* API Key Section */}
        <View style={styles.section}>
          {renderSectionHeader('API_CONFIGURATION')}

          {!hasKey ? (
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={geminiKey}
                onChangeText={setGeminiKey}
                placeholder="ENTER_API_KEY"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                onPress={handleSaveGeminiKey}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'VALIDATING...' : 'INITIALIZE_KEY'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>STATUS:</Text>
                <Text style={styles.statusValueActive}>CONNECTED</Text>
              </View>
              <TouchableOpacity
                onPress={handleUpdateKey}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>RECONFIGURE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          {renderSectionHeader('NOTIFICATION_MODULE')}

          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>ACTIVE_TASKS</Text>
              <Text style={styles.gridValue}>{notificationCount}</Text>
            </View>

            <TouchableOpacity
              onPress={handleClearNotifications}
              disabled={notificationCount === 0}
              activeOpacity={0.8}
              style={[styles.gridItem, styles.gridAction, notificationCount === 0 && styles.disabledAction]}
            >
              <Text style={[styles.gridActionText, notificationCount === 0 && styles.disabledActionText]}>
                PURGE_ALL
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cloud Sync Section */}
        <View style={styles.section}>
          {renderSectionHeader('CLOUD_UPLINK')}

          <View style={styles.card}>
            <TouchableOpacity
              onPress={handleSync}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>
                {loading ? 'TRANSMITTING...' : 'INITIATE_SYNC'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          {renderSectionHeader('DANGER_ZONE')}

          <View style={[styles.card, styles.dangerCard]}>
            <TouchableOpacity
              onPress={handleClearData}
              activeOpacity={0.8}
              style={styles.dangerButton}
            >
              <Text style={styles.dangerButtonText}>FACTORY_RESET_LOCAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B14',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderIndicator: {
    width: 4,
    height: 16,
    backgroundColor: '#00F0FF',
    marginRight: 8,
  },
  sectionHeaderText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
    marginLeft: 12,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
    padding: 16,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    padding: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    marginBottom: 16,
    borderRadius: 4,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    padding: 14,
    alignItems: 'center',
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#00F0FF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLabel: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusValueActive: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#64748B',
    padding: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  outlineButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  gridLabel: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gridValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gridAction: {
    justifyContent: 'center',
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  gridActionText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  disabledAction: {
    borderColor: '#334155',
    backgroundColor: 'transparent',
  },
  disabledActionText: {
    color: '#475569',
  },
  dangerCard: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  dangerButton: {
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBar: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  statusWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    textAlign: 'center',
    color: '#F8FAFC',
  },
});
