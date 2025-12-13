import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGoal, useUpdateProgress, useDeleteGoal } from '../../../src/hooks/useGoals';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal, isLoading } = useGoal(id);
  const updateProgress = useUpdateProgress();
  const deleteGoal = useDeleteGoal();

  const [editingProgress, setEditingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState('');

  if (isLoading || !goal) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const handleUpdateProgress = async () => {
    const value = parseFloat(newProgress);
    if (isNaN(value) || value < 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      await updateProgress.mutateAsync({ id: goal.id, progress: value });
      setEditingProgress(false);
      setNewProgress('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoal.mutateAsync(goal.id);
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete goal');
          }
        },
      },
    ]);
  };

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="py-6">
          <View className="flex-row items-center">
            {goal.icon && (
              <View className="w-12 h-12 bg-primary-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name={goal.icon as any} size={28} color="#2563eb" />
              </View>
            )}
            <Text className="text-2xl font-bold text-gray-800 flex-1">{goal.title}</Text>
          </View>
          {goal.description && (
            <Text className="text-gray-500 mt-2">{goal.description}</Text>
          )}
        </View>

        {/* Progress Card */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Progress
          </Text>

          <View className="items-center mb-4">
            <Text className="text-5xl font-bold text-gray-800">
              {goal.progress}%
            </Text>
            <Text className="text-gray-500 mt-1">
              {goal.metric_current} / {goal.metric_target} {goal.metric_name}
            </Text>
          </View>

          <View className="h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
            <View
              className={`h-full ${getProgressColor(goal.progress)} rounded-full`}
              style={{ width: `${goal.progress}%` }}
            />
          </View>

          {editingProgress ? (
            <View className="flex-row">
              <TextInput
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 mr-2"
                placeholder={`Current ${goal.metric_name}`}
                value={newProgress}
                onChangeText={setNewProgress}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                className="px-4 py-2 bg-primary-600 rounded-lg"
                onPress={handleUpdateProgress}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="py-3 bg-primary-50 rounded-lg"
              onPress={() => {
                setNewProgress(goal.metric_current.toString());
                setEditingProgress(true);
              }}
            >
              <Text className="text-primary-700 text-center font-semibold">
                Update Progress
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Details Card */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Details
          </Text>

          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-500">Metric</Text>
            <Text className="text-gray-800 font-medium">{goal.metric_name}</Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-500">Target</Text>
            <Text className="text-gray-800 font-medium">{goal.metric_target}</Text>
          </View>

          {goal.deadline && (
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-500">Deadline</Text>
              <Text className="text-gray-800 font-medium">
                {new Date(goal.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}

          {daysRemaining !== null && (
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-500">Days Remaining</Text>
              <Text
                className={`font-medium ${
                  daysRemaining < 7 ? 'text-red-600' : 'text-gray-800'
                }`}
              >
                {daysRemaining > 0 ? daysRemaining : 'Overdue'}
              </Text>
            </View>
          )}
        </View>

        {/* Linked Habits */}
        {goal.habits.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Linked Habits
            </Text>
            {goal.habits.map((habit) => (
              <View
                key={habit.id}
                className="flex-row items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <View className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                <Text className="text-gray-800">{habit.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          className="py-3 mb-8"
          onPress={handleDelete}
        >
          <Text className="text-red-500 text-center font-semibold">
            Delete Goal
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
