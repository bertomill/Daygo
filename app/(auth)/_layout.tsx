import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuthStore();

  if (session) {
    return <Redirect href="/(tabs)/today" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
