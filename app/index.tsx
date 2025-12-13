import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { session } = useAuthStore();

  if (session) {
    return <Redirect href="/(tabs)/today" />;
  }

  return <Redirect href="/(auth)/login" />;
}
