import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Vision } from '../types/database';

interface VisionCardProps {
  vision: Vision;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VisionCard({ vision, onPress }: VisionCardProps) {
  const glowIntensity = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowIntensity.value,
    shadowRadius: 20 * glowIntensity.value,
    // Web-specific box-shadow for glow effect
    boxShadow: `0 0 ${30 * glowIntensity.value}px ${10 * glowIntensity.value}px rgba(59, 130, 246, ${glowIntensity.value * 0.6})`,
  }));

  const handlePressIn = () => {
    glowIntensity.value = withSpring(1, { damping: 15, stiffness: 150 });
    scale.value = withSpring(1.02, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    glowIntensity.value = withTiming(0, { duration: 300 });
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-100"
    >
      <View className="flex-row items-start">
        <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
          <Ionicons name="eye-outline" size={16} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-blue-600 font-medium mb-1">VISION</Text>
          <Text className="text-base text-gray-800 leading-relaxed">{vision.text}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}
