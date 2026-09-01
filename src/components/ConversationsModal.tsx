import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Conversation } from '../types';
import { loadConversations, deleteConversation } from '../storage';

interface ConversationsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (conversation: Conversation) => void;
}

export default function ConversationsModal({
  visible,
  onClose,
  onSelect,
}: ConversationsModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConversationsList();
    }
  }, [visible]);

  async function loadConversationsList() {
    setLoading(true);
    try {
      const data = await loadConversations();
      // Sort by most recently updated
      setConversations(data.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Delete Conversation?', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(id);
            setConversations((prev) => prev.filter((c) => c.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete conversation');
          }
        },
      },
    ]);
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Conversations</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No saved conversations yet</Text>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {conversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                style={styles.conversationItem}
                onPress={() => {
                  onSelect(conversation);
                  onClose();
                }}
              >
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationName}>{conversation.name}</Text>
                  <Text style={styles.conversationMeta}>
                    {conversation.model} · {conversation.messages.length} messages ·{' '}
                    {formatDate(conversation.updatedAt)}
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(conversation.id, conversation.name)}
                  hitSlop={8}
                >
                  <Text style={styles.deleteButtonText}>🗑</Text>
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf5f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ddd5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9a9488',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8ddd5',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  conversationMeta: {
    fontSize: 12,
    color: '#9a9488',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
});
