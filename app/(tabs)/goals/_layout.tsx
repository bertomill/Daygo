import { Stack } from 'expo-router';

export default function GoalsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Goal Details',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'New Goal',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
