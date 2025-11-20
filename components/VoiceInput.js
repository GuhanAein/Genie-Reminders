import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Voice from '@react-native-voice/voice';

export default function VoiceInput({ onSpeechResults, isProcessing }) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResultsHandler;

        return () => {
            try {
                Voice.destroy().then(Voice.removeAllListeners);
            } catch (e) {
                // Ignore cleanup errors if module is missing
            }
        };
    }, []);

    const onSpeechStart = () => {
        setIsListening(true);
        setError(null);
    };

    const onSpeechEnd = () => {
        setIsListening(false);
    };

    const onSpeechError = (e) => {
        setIsListening(false);
        setError(e.error);
        // Don't log error here to avoid RedBox for expected voice errors
    };

    const onSpeechResultsHandler = (e) => {
        if (e.value && e.value[0]) {
            onSpeechResults(e.value[0]);
        }
    };

    const startListening = async () => {
        try {
            await Voice.start('en-US');
        } catch (e) {
            // Check for common "missing module" errors in Expo Go
            if (e.message && (e.message.includes('null') || e.message.includes('startSpeech'))) {
                Alert.alert(
                    'FEATURE_UNAVAILABLE',
                    'Voice recognition requires a Development Build.\n\nIt cannot run in Expo Go because it needs native modules.\n\nPlease type your command instead.'
                );
            } else {
                console.warn('Voice Error:', e);
                setError(e.message);
            }
            setIsListening(false);
        }
    };

    const stopListening = async () => {
        try {
            await Voice.stop();
        } catch (e) {
            // Ignore stop errors
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.micButton,
                    isListening && styles.micButtonActive,
                    isProcessing && styles.micButtonProcessing,
                ]}
                onPress={isListening ? stopListening : startListening}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color="#00F0FF" size="small" />
                ) : (
                    <Text style={[styles.micIcon, isListening && styles.micIconActive]}>
                        {isListening ? '■' : '🎤'}
                    </Text>
                )}
            </TouchableOpacity>

            {isListening && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>LISTENING...</Text>
                    <View style={styles.waveform}>
                        <View style={[styles.bar, { height: 12 }]} />
                        <View style={[styles.bar, { height: 20 }]} />
                        <View style={[styles.bar, { height: 16 }]} />
                        <View style={[styles.bar, { height: 24 }]} />
                        <View style={[styles.bar, { height: 14 }]} />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    micButtonActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#EF4444',
    },
    micButtonProcessing: {
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderColor: '#00F0FF',
    },
    micIcon: {
        fontSize: 18,
        color: '#94A3B8',
    },
    micIconActive: {
        color: '#EF4444',
        fontSize: 14,
    },
    statusContainer: {
        position: 'absolute',
        bottom: 50,
        right: 0,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#EF4444',
        borderRadius: 4,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
        minWidth: 120,
        justifyContent: 'center',
    },
    statusText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: '700',
        marginRight: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 1,
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        gap: 2,
    },
    bar: {
        width: 2,
        backgroundColor: '#EF4444',
        borderRadius: 1,
    },
});
