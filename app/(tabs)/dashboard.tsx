import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleLineChart } from '../../src/components/charts/SimpleLineChart';
import { ScoreRing } from '../../src/components/ScoreRing';
import { useScoreHistory } from '../../src/hooks/useHabits';

export default function DashboardScreen() {
  const { data: scoreHistory, isLoading, refetch, isRefetching } = useScoreHistory(7);

  // Calculate stats
  const averageScore =
    scoreHistory && scoreHistory.length > 0
      ? scoreHistory.reduce((sum, d) => sum + d.score, 0) / scoreHistory.length
      : 0;

  // Calculate streak (consecutive days with score >= 80)
  const calculateStreak = () => {
    if (!scoreHistory || scoreHistory.length === 0) return 0;

    let streak = 0;
    // Start from most recent
    const sorted = [...scoreHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    for (const day of sorted) {
      if (day.score >= 80) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  const bestDay =
    scoreHistory && scoreHistory.length > 0
      ? Math.max(...scoreHistory.map((d) => d.score))
      : 0;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Average Score */}
        <View className="items-center py-6">
          <Text className="text-gray-500 text-lg mb-4">7-Day Average</Text>
          <ScoreRing score={averageScore} size="large" />
        </View>

        {/* Stats Row */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-white rounded-xl p-4 mr-2 items-center shadow-sm border border-gray-100">
            <Text className="text-3xl font-bold text-orange-500">{streak}</Text>
            <Text className="text-gray-500 text-sm mt-1">Day Streak</Text>
            <Text className="text-gray-400 text-xs">(80+ score)</Text>
          </View>

          <View className="flex-1 bg-white rounded-xl p-4 ml-2 items-center shadow-sm border border-gray-100">
            <Text className="text-3xl font-bold text-green-500">
              {Math.round(bestDay)}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Best Day</Text>
            <Text className="text-gray-400 text-xs">(this week)</Text>
          </View>
        </View>

        {/* Chart */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Last 7 Days
          </Text>

          {scoreHistory && scoreHistory.length > 0 ? (
            <SimpleLineChart data={scoreHistory} height={200} />
          ) : (
            <View className="h-44 items-center justify-center">
              <Text className="text-gray-400 text-center">
                Complete some habits to see your progress chart!
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
