import { View, Text, DimensionValue } from 'react-native';

interface DataPoint {
  date: string;
  score: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  height?: number;
}

export function SimpleLineChart({ data, height = 200 }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height }}>
        <Text className="text-gray-400">No data available</Text>
      </View>
    );
  }

  const maxScore = 100;
  const gridLines = [100, 75, 50, 25];

  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-amber-400';
    if (score >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <View className="w-full" style={{ height }}>
      {/* Chart area with grid */}
      <View className="flex-1 relative">
        {/* Grid lines */}
        {gridLines.map((value) => (
          <View
            key={value}
            className="absolute left-0 right-0 flex-row items-center"
            style={{ bottom: `${value}%` }}
          >
            <Text className="text-[10px] text-gray-300 w-6 text-right mr-2">
              {value}
            </Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>
        ))}

        {/* Bars */}
        <View className="flex-1 flex-row items-end pl-8 pr-2">
          {data.map((point, index) => {
            const barHeight = Math.max((point.score / maxScore) * 100, 3);

            return (
              <View
                key={index}
                className="flex-1 items-center justify-end mx-1"
              >
                <View
                  className={`w-full rounded-lg ${getColor(point.score)} shadow-sm`}
                  style={{
                    height: `${barHeight}%` as DimensionValue,
                    minHeight: 6,
                    maxWidth: 40,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View className="flex-row mt-3 pl-8 pr-2">
        {data.map((point, index) => {
          const date = new Date(point.date + 'T00:00:00');
          const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <View
              key={index}
              className="flex-1 items-center mx-1"
            >
              <Text className="text-xs font-medium text-gray-600">{dayLabel}</Text>
              <Text className="text-[10px] text-gray-400">{dayNum}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
