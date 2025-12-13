import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f0fdfa', '#e0f7f4']}
      locations={[0, 0.6, 1]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
        <View className="mb-12 items-center">
          <Image
            source={require('../../assets/icon.png')}
            className="w-24 h-24 mb-4"
            resizeMode="contain"
          />
          <Text className="text-4xl font-bold text-gray-900 text-center">
            DayGo
          </Text>
          <Text className="text-lg text-gray-500 text-center mt-2">
            Track your habits, achieve your goals
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View className="mt-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-xl mt-6 ${
              isLoading ? 'bg-brand-teal/70' : 'bg-brand-teal'
            }`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-brand-teal font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
