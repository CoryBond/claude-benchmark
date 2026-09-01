import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { Message, Role } from '../types';

interface Props {
  message: Message;
  onChangeContent: (id: string, content: string) => void;
  onChangeRole: (id: string, role: Role) => void;
  onDelete: (id: string) => void;
}

export default function MessageRow({
  message,
  onChangeContent,
  onChangeRole,
  onDelete,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.roleToggle}>
          <Pressable
            onPress={() => onChangeRole(message.id, 'user')}
            style={[
              styles.roleButton,
              message.role === 'user' && styles.roleButtonActiveUser,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                message.role === 'user' && styles.roleTextActive,
              ]}
            >
              User
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onChangeRole(message.id, 'assistant')}
            style={[
              styles.roleButton,
              message.role === 'assistant' && styles.roleButtonActiveAssistant,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                message.role === 'assistant' && styles.roleTextActive,
              ]}
            >
              Claude
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={() => onDelete(message.id)} hitSlop={10}>
          <Text style={styles.deleteText}>Remove</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        multiline
        value={message.content}
        onChangeText={(text) => onChangeContent(message.id, text)}
        placeholder={message.role === 'user' ? 'User message…' : 'Assistant message…'}
        placeholderTextColor="#9a9488"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e0d8',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0ede6',
    borderRadius: 8,
    padding: 2,
  },
  roleButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  roleButtonActiveUser: {
    backgroundColor: '#3b3b3b',
  },
  roleButtonActiveAssistant: {
    backgroundColor: '#c15f3c',
  },
  roleText: {
    fontSize: 13,
    color: '#6b665c',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#ffffff',
  },
  deleteText: {
    color: '#a33d2e',
    fontSize: 13,
  },
  input: {
    minHeight: 56,
    fontSize: 15,
    color: '#2b2b2b',
    textAlignVertical: 'top',
    padding: 0,
  },
});
