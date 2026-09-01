import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation } from './types';

const API_KEY_STORAGE_KEY = 'anthropic_api_key';
const CONVERSATIONS_STORAGE_KEY = 'conversations';

export async function saveApiKey(key: string): Promise<void> {
  if (key.length === 0) {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
}

export async function loadApiKey(): Promise<string> {
  const value = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
  return value ?? '';
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  try {
    const conversations = await loadConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);
    
    if (index >= 0) {
      conversations[index] = {
        ...conversation,
        updatedAt: Date.now(),
      };
    } else {
      conversations.push({
        ...conversation,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation:', error);
    throw error;
  }
}

export async function loadConversations(): Promise<Conversation[]> {
  try {
    const data = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

export async function deleteConversation(id: string): Promise<void> {
  try {
    const conversations = await loadConversations();
    const filtered = conversations.filter((c) => c.id !== id);
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw error;
  }
}
