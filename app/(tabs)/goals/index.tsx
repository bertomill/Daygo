import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoalCard } from '../../../src/components/GoalCard';
import { useGoals } from '../../../src/hooks/useGoals';

export default function GoalsScreen() {
  const { data: goals, isLoading, refetch, isRefetching } = useGoals();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-800">Your Goals</Text>
          <Text className="text-gray-500 mt-1">
            Track your long-term objectives
          </Text>
        </View>

        {/* Goals List */}
        {goals && goals.length > 0 ? (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GoalCard
                goal={item}
                onPress={() => router.push(`/(tabs)/goals/${item.id}`)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="flag-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-gray-400 text-lg text-center">
              No goals yet.{'\n'}Set your first goal to get started!
            </Text>
          </View>
        )}

        {/* Add Goal Button */}
        <TouchableOpacity
          className="absolute bottom-6 right-4 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
          onPress={() => router.push('/(tabs)/goals/create')}
        >
          <Text className="text-white text-3xl">+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
