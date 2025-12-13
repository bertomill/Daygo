import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoalWithHabits } from '../types/database';

interface GoalCardProps {
  goal: GoalWithHabits;
  onPress: () => void;
}

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const daysRemaining = goal.deadline
    ? Math.ceil(
        (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center flex-1">
          {goal.icon && (
            <View className="w-8 h-8 bg-primary-100 rounded-lg items-center justify-center mr-2">
              <Ionicons name={goal.icon as any} size={18} color="#2563eb" />
            </View>
          )}
          <Text className="text-lg font-semibold text-gray-800 flex-1">
            {goal.title}
          </Text>
        </View>
        {daysRemaining !== null && (
          <View
            className={`px-2 py-1 rounded-lg ${
              daysRemaining < 7 ? 'bg-red-100' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                daysRemaining < 7 ? 'text-red-700' : 'text-gray-600'
              }`}
            >
              {daysRemaining > 0 ? `${daysRemaining}d left` : 'Due!'}
            </Text>
          </View>
        )}
      </View>

      {goal.description && (
        <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>
          {goal.description}
        </Text>
      )}

      {/* Progress Bar */}
      <View className="mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-600 text-sm">
            {goal.metric_current} / {goal.metric_target} {goal.metric_name}
          </Text>
          <Text className="text-gray-600 text-sm font-medium">
            {goal.progress}%
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className={`h-full ${getProgressColor(goal.progress)} rounded-full`}
            style={{ width: `${goal.progress}%` }}
          />
        </View>
      </View>

      {/* Linked Habits */}
      {goal.habits.length > 0 && (
        <View className="flex-row flex-wrap mt-2">
          {goal.habits.slice(0, 3).map((habit) => (
            <View
              key={habit.id}
              className="bg-primary-50 px-2 py-1 rounded-lg mr-2 mb-1"
            >
              <Text className="text-primary-700 text-xs">{habit.name}</Text>
            </View>
          ))}
          {goal.habits.length > 3 && (
            <View className="bg-gray-100 px-2 py-1 rounded-lg">
              <Text className="text-gray-600 text-xs">
                +{goal.habits.length - 3} more
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
