import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mantra } from '../types/database';

interface MantraCardProps {
  mantra: Mantra;
  onPress: () => void;
}

export function MantraCard({ mantra, onPress }: MantraCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-gradient-to-r bg-purple-50 rounded-xl p-4 mb-3 border border-purple-100"
    >
      <View className="flex-row items-start">
        <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
          <Ionicons name="sparkles" size={16} color="#9333ea" />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-purple-600 font-medium mb-1">MANTRA</Text>
          <Text className="text-base text-gray-800 italic">"{mantra.text}"</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
