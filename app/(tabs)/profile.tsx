import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { clearAllGuestData } from '../../src/services/localStorage';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount, isGuest, exitGuestMode } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await deleteAccount();
            setIsDeleting(false);
            if (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/register');
  };

  const handleExitGuestMode = () => {
    Alert.alert(
      'Exit Guest Mode',
      'Your local data will remain on this device. You can sign in or create an account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await exitGuestMode();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleClearGuestData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your local data including habits, goals, and journal entries. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearAllGuestData();
            await exitGuestMode();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@daygo.live');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.daygo.live/privacy');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="items-center py-8">
          <View className={`w-24 h-24 ${isGuest ? 'bg-gray-200' : 'bg-blue-100'} rounded-full items-center justify-center mb-4`}>
            <Ionicons name="person" size={48} color={isGuest ? '#6b7280' : '#3b82f6'} />
          </View>
          <Text className="text-xl font-semibold text-gray-800">
            {isGuest ? 'Guest User' : user?.email}
          </Text>
          <Text className="text-gray-500 mt-1">
            {isGuest ? 'Data stored locally on this device' : 'DayGo Member'}
          </Text>
        </View>

        {/* Guest Mode Banner */}
        {isGuest && (
          <View className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#d97706" />
              <View className="ml-2 flex-1">
                <Text className="text-amber-800 font-medium">Guest Mode</Text>
                <Text className="text-amber-700 text-sm mt-1">
                  Your data is stored only on this device. Create an account to sync across devices and keep your data safe.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Info - Only show for logged in users */}
        {!isGuest && (
          <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-500 rounded-lg items-center justify-center mr-3">
                  <Ionicons name="mail" size={18} color="#ffffff" />
                </View>
                <Text className="text-gray-800">Email</Text>
              </View>
              <Text className="text-gray-500 text-sm">{user?.email}</Text>
            </View>
          </View>
        )}

        {/* App Info */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-500 rounded-lg items-center justify-center mr-3">
                <Ionicons name="phone-portrait" size={18} color="#ffffff" />
              </View>
              <Text className="text-gray-800">Version</Text>
            </View>
            <Text className="text-gray-500">1.0.0 (10)</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
            onPress={handleContactSupport}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-green-500 rounded-lg items-center justify-center mr-3">
                <Ionicons name="help-circle" size={18} color="#ffffff" />
              </View>
              <Text className="text-gray-800">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4"
            onPress={handlePrivacyPolicy}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-500 rounded-lg items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
              </View>
              <Text className="text-gray-800">Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {isGuest ? (
          <>
            {/* Create Account Button for Guests */}
            <TouchableOpacity
              className="bg-brand-teal rounded-xl py-4 mb-3"
              onPress={handleCreateAccount}
            >
              <Text className="text-white text-center font-semibold">
                Create Account
              </Text>
            </TouchableOpacity>

            {/* Sign In Button for Guests */}
            <TouchableOpacity
              className="bg-white rounded-xl py-4 border border-gray-200 mb-3"
              onPress={handleExitGuestMode}
            >
              <Text className="text-gray-700 text-center font-semibold">
                Sign In to Existing Account
              </Text>
            </TouchableOpacity>

            {/* Clear Data Button for Guests */}
            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-4 border border-gray-200"
              onPress={handleClearGuestData}
            >
              <Text className="text-red-500 text-center font-medium">
                Clear All Local Data
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Sign Out */}
            <TouchableOpacity
              className="bg-red-50 rounded-xl py-4 border border-red-100 mb-3"
              onPress={handleSignOut}
            >
              <Text className="text-red-600 text-center font-semibold">
                Sign Out
              </Text>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-4 border border-gray-200"
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Text className="text-red-500 text-center font-medium">
                {isDeleting ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Footer */}
        <View className="items-center mt-auto pb-8">
          <Text className="text-gray-400 text-sm">
            Made with care for your daily habits
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
