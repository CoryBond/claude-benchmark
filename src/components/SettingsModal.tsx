import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Props {
  visible: boolean;
  initialKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
}

export default function SettingsModal({ visible, initialKey, onClose, onSave }: Props) {
  const [key, setKey] = useState(initialKey);

  // Keep the field in sync if the stored key changes while the modal is closed.
  useEffect(() => {
    if (visible) {
      setKey(initialKey);
    }
  }, [visible, initialKey]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Anthropic API key</Text>
          <Text style={styles.subtitle}>
            Stored only on this device, encrypted via Android Keystore / iOS Keychain. Create a
            key at platform.claude.com.
          </Text>
          <TextInput
            style={styles.input}
            value={key}
            onChangeText={setKey}
            placeholder="sk-ant-api03-…"
            placeholderTextColor="#9a9488"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                onSave(key.trim());
                onClose();
              }}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#faf8f4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2b2b2b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b665c',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dedad0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    color: '#2b2b2b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#6b665c',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#c15f3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
