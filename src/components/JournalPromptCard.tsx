import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JournalPromptWithEntry } from '../types/database';

interface JournalPromptCardProps {
  prompt: JournalPromptWithEntry;
  onPress: () => void;
}

export function JournalPromptCard({ prompt, onPress }: JournalPromptCardProps) {
  const hasEntry = !!prompt.todayEntry;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-xl p-4 mb-3 border ${
        hasEntry
          ? 'bg-teal-50 border-teal-100'
          : 'bg-orange-50 border-orange-100'
      }`}
    >
      <View className="flex-row items-start">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
            hasEntry ? 'bg-teal-100' : 'bg-orange-100'
          }`}
        >
          <Ionicons
            name={hasEntry ? 'checkmark-circle' : 'create-outline'}
            size={16}
            color={hasEntry ? '#14b8a6' : '#f97316'}
          />
        </View>
        <View className="flex-1">
          <Text
            className={`text-xs font-medium mb-1 ${
              hasEntry ? 'text-teal-600' : 'text-orange-600'
            }`}
          >
            JOURNAL PROMPT
          </Text>
          <Text className="text-base text-gray-800">{prompt.prompt}</Text>
          {hasEntry ? (
            <Text className="text-sm text-gray-500 mt-2" numberOfLines={2}>
              {prompt.todayEntry}
            </Text>
          ) : (
            <Text className="text-sm text-orange-500 mt-2">
              Tap to write your response...
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
