import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitWithLog } from '../types/database';

interface HabitCardProps {
  habit: HabitWithLog;
  onToggle: () => void;
  onDelete: () => void;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function HabitCard({ habit, onToggle, onDelete, onPress, onMoveUp, onMoveDown }: HabitCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100">
        {/* Reorder Buttons */}
        <View className="mr-3 items-center justify-center">
          <TouchableOpacity
            onPress={onMoveUp}
            disabled={!onMoveUp}
            className="p-1"
          >
            <Ionicons
              name="chevron-up"
              size={18}
              color={onMoveUp ? '#6b7280' : '#e5e7eb'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveDown}
            disabled={!onMoveDown}
            className="p-1"
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={onMoveDown ? '#6b7280' : '#e5e7eb'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onToggle}
          className={`w-8 h-8 rounded-full border-2 items-center justify-center mr-4 ${
            habit.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 bg-white'
          }`}
        >
          {habit.completed && (
            <Ionicons name="checkmark" size={18} color="#ffffff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity className="flex-1" onPress={onPress} activeOpacity={0.7}>
          <Text
            className={`text-base font-medium ${
              habit.completed ? 'text-gray-400 line-through' : 'text-gray-800'
            }`}
          >
            {habit.name}
          </Text>
          {habit.description && (
            <Text
              className={`text-sm mt-0.5 ${
                habit.completed ? 'text-gray-300' : 'text-gray-500'
              }`}
              numberOfLines={1}
            >
              {habit.description}
            </Text>
          )}
        </TouchableOpacity>

        {habit.weight > 1 && (
          <View className="bg-primary-100 px-2 py-1 rounded-lg">
            <Text className="text-primary-700 text-xs font-medium">
              ×{habit.weight}
            </Text>
          </View>
        )}
    </View>
  );
}
