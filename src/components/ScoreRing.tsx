import { View, Text } from 'react-native';

interface ScoreRingProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export function ScoreRing({ score, size = 'medium' }: ScoreRingProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const textClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  };

  const getColor = (score: number) => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    if (score >= 40) return 'border-orange-500';
    return 'border-red-500';
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <View
      className={`${sizeClasses[size]} rounded-full border-4 ${getColor(score)} items-center justify-center bg-white`}
    >
      <Text className={`${textClasses[size]} font-bold ${getTextColor(score)}`}>
        {Math.round(score)}
      </Text>
    </View>
  );
}
