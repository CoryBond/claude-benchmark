import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Message, Role, Conversation } from './src/types';
import { runMessages, ApiError } from './src/api';
import { loadApiKey, saveApiKey, saveConversation } from './src/storage';
import MessageRow from './src/components/MessageRow';
import SettingsModal from './src/components/SettingsModal';
import SaveConversationModal from './src/components/SaveConversationModal';
import ConversationsModal from './src/components/ConversationsModal';

const MODEL_OPTIONS = [
  'claude-sonnet-5',
  'claude-opus-4-8',
  'claude-haiku-4-5-20251001',
  'claude-fable-5',
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [system, setSystem] = useState('');
  const [model, setModel] = useState(MODEL_OPTIONS[0]);
  const [maxTokens, setMaxTokens] = useState('1024');
  const [temperature, setTemperature] = useState('1');

  const [messages, setMessages] = useState<Message[]>([
    { id: makeId(), role: 'user', content: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(
    null
  );
  const [saveConversationVisible, setSaveConversationVisible] = useState(false);
  const [loadConversationsVisible, setLoadConversationsVisible] = useState(false);

  useEffect(() => {
    loadApiKey().then(setApiKey);
  }, []);

  const hasKey = apiKey.trim().length > 0;

  function updateContent(id: string, content: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
  }

  function updateRole(id: string, role: Role) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function removeMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function addMessage() {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      const nextRole: Role = !last || last.role === 'assistant' ? 'user' : 'assistant';
      return [...prev, { id: makeId(), role: nextRole, content: '' }];
    });
  }

  const canRun = useMemo(
    () => hasKey && messages.some((m) => m.content.trim().length > 0) && !loading,
    [hasKey, messages, loading]
  );

  async function handleRun() {
    if (!hasKey) {
      setSettingsVisible(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await runMessages({
        apiKey,
        model: model.trim(),
        system,
        messages,
        maxTokens: parseInt(maxTokens, 10) || 1024,
        temperature: temperature.trim() === '' ? NaN : parseFloat(temperature),
      });
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', content: result.text },
      ]);
      setUsage(result.usage);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey(key: string) {
    setApiKey(key);
    await saveApiKey(key);
  }

  async function handleSaveConversation(name: string) {
    try {
      const conversation: Conversation = {
        id: makeId(),
        name,
        system,
        model,
        maxTokens,
        temperature,
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveConversation(conversation);
      setSaveConversationVisible(false);
      setError(`Saved as "${name}"`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError('Failed to save conversation');
    }
  }

  function handleLoadConversation(conversation: Conversation) {
    setSystem(conversation.system);
    setModel(conversation.model);
    setMaxTokens(conversation.maxTokens);
    setTemperature(conversation.temperature);
    setMessages(conversation.messages);
    setError(`Loaded "${conversation.name}"`);
    setTimeout(() => setError(null), 3000);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Claude Bench</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={() => setLoadConversationsVisible(true)} hitSlop={10}>
                <Text style={styles.headerAction}>📂</Text>
              </Pressable>
              <Pressable onPress={() => setSettingsVisible(true)} hitSlop={10}>
                <Text style={styles.headerAction}>{hasKey ? 'Key set ⚙︎' : 'Add key ⚙︎'}</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionLabel}>MODEL</Text>
            <View style={styles.chipRow}>
              {MODEL_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setModel(option)}
                  style={[styles.chip, model === option && styles.chipActive]}
                >
                  <Text style={[styles.chipText, model === option && styles.chipTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.modelInput}
              value={model}
              onChangeText={setModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="model string"
              placeholderTextColor="#9a9488"
            />

            <View style={styles.paramRow}>
              <View style={styles.paramField}>
                <Text style={styles.sectionLabel}>MAX TOKENS</Text>
                <TextInput
                  style={styles.paramInput}
                  value={maxTokens}
                  onChangeText={setMaxTokens}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.paramField}>
                <Text style={styles.sectionLabel}>TEMPERATURE</Text>
                <TextInput
                  style={styles.paramInput}
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>SYSTEM PROMPT</Text>
            <TextInput
              style={styles.systemInput}
              value={system}
              onChangeText={setSystem}
              multiline
              placeholder="Optional system prompt…"
              placeholderTextColor="#9a9488"
            />

            <Text style={styles.sectionLabel}>MESSAGES</Text>
            {messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                onChangeContent={updateContent}
                onChangeRole={updateRole}
                onDelete={removeMessage}
              />
            ))}

            <Pressable style={styles.addButton} onPress={addMessage}>
              <Text style={styles.addButtonText}>+ Add message</Text>
            </Pressable>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {usage && (
              <Text style={styles.usageText}>
                {usage.input_tokens} input tokens · {usage.output_tokens} output tokens
              </Text>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <Pressable
                style={[styles.saveButton]}
                onPress={() => setSaveConversationVisible(true)}
              >
                <Text style={styles.saveButtonText}>💾 Save</Text>
              </Pressable>
              <Pressable
                style={[styles.runButton, !canRun && styles.runButtonDisabled]}
                onPress={handleRun}
                disabled={!canRun}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.runButtonText}>Run</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

        <SettingsModal
          visible={settingsVisible}
          initialKey={apiKey}
          onClose={() => setSettingsVisible(false)}
          onSave={handleSaveKey}
        />

        <SaveConversationModal
          visible={saveConversationVisible}
          onClose={() => setSaveConversationVisible(false)}
          onSave={handleSaveConversation}
        />

        <ConversationsModal
          visible={loadConversationsVisible}
          onClose={() => setLoadConversationsVisible(false)}
          onSelect={handleLoadConversation}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f2ec',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e0d8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2b2b2b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAction: {
    fontSize: 13,
    color: '#c15f3c',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a8578',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e0d8',
  },
  chipActive: {
    backgroundColor: '#2b2b2b',
    borderColor: '#2b2b2b',
  },
  chipText: {
    fontSize: 12,
    color: '#6b665c',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  modelInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e0d8',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#2b2b2b',
  },
  paramRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paramField: {
    flex: 1,
  },
  paramInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e0d8',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#2b2b2b',
  },
  systemInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e0d8',
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    fontSize: 14,
    color: '#2b2b2b',
    textAlignVertical: 'top',
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addButtonText: {
    color: '#c15f3c',
    fontWeight: '600',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#fbeae6',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#a33d2e',
    fontSize: 13,
  },
  usageText: {
    fontSize: 12,
    color: '#8a8578',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e0d8',
    backgroundColor: '#f5f2ec',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4b9bbf',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  runButton: {
    flex: 1,
    backgroundColor: '#c15f3c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#d9b9ab',
  },
  runButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
