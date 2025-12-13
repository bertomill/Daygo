import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuthStore();
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

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@daygo.live');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.daygo.live/privacy');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="flex-1 px-4">
        {/* Profile Header */}
        <View className="items-center py-8">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="person" size={48} color="#3b82f6" />
          </View>
          <Text className="text-xl font-semibold text-gray-800">
            {user?.email}
          </Text>
          <Text className="text-gray-500 mt-1">DayGo Member</Text>
        </View>

        {/* Account */}
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

        {/* App Info */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-500 rounded-lg items-center justify-center mr-3">
                <Ionicons name="phone-portrait" size={18} color="#ffffff" />
              </View>
              <Text className="text-gray-800">Version</Text>
            </View>
            <Text className="text-gray-500">1.0.0</Text>
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
          className="py-4"
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Text className="text-gray-400 text-center text-sm">
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center mt-auto pb-8">
          <Text className="text-gray-400 text-sm">
            Made with care for your daily habits
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
