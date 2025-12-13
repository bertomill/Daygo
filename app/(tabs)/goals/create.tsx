import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCreateGoal } from '../../../src/hooks/useGoals';
import { useHabitsWithLogs } from '../../../src/hooks/useHabits';
import { IconPicker } from '../../../src/components/IconPicker';

export default function CreateGoalScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [metricName, setMetricName] = useState('');
  const [metricTarget, setMetricTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const createGoal = useCreateGoal();
  const { data: habits } = useHabitsWithLogs();

  const toggleHabit = (habitId: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habitId)
        ? prev.filter((id) => id !== habitId)
        : [...prev, habitId],
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (!metricName.trim()) {
      Alert.alert('Error', 'Please enter a metric name (e.g., "books read")');
      return;
    }
    if (!metricTarget || isNaN(parseFloat(metricTarget))) {
      Alert.alert('Error', 'Please enter a valid target number');
      return;
    }

    try {
      await createGoal.mutateAsync({
        goal: {
          title: title.trim(),
          description: description.trim() || undefined,
          icon: icon || undefined,
          metric_name: metricName.trim(),
          metric_target: parseFloat(metricTarget),
          deadline: deadline || undefined,
        },
        habitIds: selectedHabits,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-3">
          {/* Title */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Goal Title *
            </Text>
            <TextInput
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
              placeholder="e.g., Read 12 books this year"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description & Icon Row */}
          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Description
              </Text>
              <TextInput
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
                placeholder="Why is this important?"
                value={description}
                onChangeText={setDescription}
              />
            </View>
            <View className="w-24">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Icon
              </Text>
              <IconPicker selectedIcon={icon} onSelectIcon={setIcon} compact />
            </View>
          </View>

          {/* Metric */}
          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Metric *
              </Text>
              <TextInput
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
                placeholder="e.g., books"
                value={metricName}
                onChangeText={setMetricName}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Target *
              </Text>
              <TextInput
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
                placeholder="e.g., 12"
                value={metricTarget}
                onChangeText={setMetricTarget}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Deadline */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Deadline <Text className="text-gray-400">(YYYY-MM-DD)</Text>
            </Text>
            <TextInput
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
              placeholder="e.g., 2025-12-31"
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>

          {/* Link Habits */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Link Habits
            </Text>

            {habits && habits.length > 0 ? (
              <View className="bg-white rounded-xl border border-gray-200">
                {habits.map((habit, index) => (
                  <TouchableOpacity
                    key={habit.id}
                    className={`flex-row items-center justify-between px-4 py-2.5 ${
                      index < habits.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onPress={() => toggleHabit(habit.id)}
                  >
                    <Text className="text-gray-800">{habit.name}</Text>
                    <Switch
                      value={selectedHabits.includes(habit.id)}
                      onValueChange={() => toggleHabit(habit.id)}
                      trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                      thumbColor={
                        selectedHabits.includes(habit.id) ? '#2563eb' : '#f4f4f5'
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-gray-100 rounded-xl p-3">
                <Text className="text-gray-500 text-center text-sm">
                  No habits yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Create Button */}
      <View className="px-4 pb-2 pt-3 bg-gray-50 border-t border-gray-200">
        <TouchableOpacity
          className={`w-full py-3.5 rounded-xl ${
            createGoal.isPending ? 'bg-primary-400' : 'bg-primary-600'
          }`}
          onPress={handleCreate}
          disabled={createGoal.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createGoal.isPending ? 'Creating...' : 'Create Goal'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
