import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Curated list of icons suitable for goals
const GOAL_ICONS = [
  'flag',
  'trophy',
  'star',
  'rocket',
  'fitness',
  'barbell',
  'bicycle',
  'walk',
  'heart',
  'book',
  'school',
  'laptop',
  'code-slash',
  'cash',
  'wallet',
  'trending-up',
  'analytics',
  'briefcase',
  'business',
  'calendar',
  'time',
  'alarm',
  'musical-notes',
  'brush',
  'camera',
  'globe',
  'airplane',
  'car',
  'home',
  'people',
  'person',
  'happy',
  'medkit',
  'nutrition',
  'leaf',
  'water',
  'sunny',
  'moon',
  'bed',
  'cafe',
  'restaurant',
  'pizza',
  'wine',
  'beer',
  'game-controller',
  'headset',
  'tv',
  'film',
  'mic',
  'language',
  'document-text',
  'pencil',
  'construct',
  'hammer',
  'flask',
  'bulb',
  'checkmark-circle',
  'ribbon',
  'medal',
] as const;

type GoalIconName = typeof GOAL_ICONS[number];

interface IconPickerProps {
  selectedIcon: string | null;
  onSelectIcon: (icon: string | null) => void;
  compact?: boolean;
}

export function IconPicker({ selectedIcon, onSelectIcon, compact }: IconPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (icon: string | null) => {
    onSelectIcon(icon);
    setModalVisible(false);
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          className="w-full h-[42px] border border-gray-300 rounded-xl bg-white items-center justify-center"
          onPress={() => setModalVisible(true)}
        >
          {selectedIcon ? (
            <Ionicons name={selectedIcon as any} size={22} color="#2563eb" />
          ) : (
            <Ionicons name="add" size={22} color="#9ca3af" />
          )}
        </TouchableOpacity>
        <IconPickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          selectedIcon={selectedIcon}
          onSelect={handleSelect}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white flex-row items-center justify-between"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row items-center">
          {selectedIcon ? (
            <>
              <View className="w-10 h-10 bg-primary-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name={selectedIcon as any} size={24} color="#2563eb" />
              </View>
              <Text className="text-gray-800">{selectedIcon}</Text>
            </>
          ) : (
            <Text className="text-gray-400">Select an icon (optional)</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
      <IconPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedIcon={selectedIcon}
        onSelect={handleSelect}
      />
    </>
  );
}

interface IconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedIcon: string | null;
  onSelect: (icon: string | null) => void;
}

function IconPickerModal({ visible, onClose, selectedIcon, onSelect }: IconPickerModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-t-3xl max-h-[70%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-gray-800">
                Choose an Icon
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="p-4">
            {/* No icon option */}
            <TouchableOpacity
              className={`mb-4 px-4 py-3 rounded-xl border ${
                selectedIcon === null
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200'
              }`}
              onPress={() => onSelect(null)}
            >
              <Text
                className={`text-center ${
                  selectedIcon === null ? 'text-primary-700' : 'text-gray-600'
                }`}
              >
                No icon
              </Text>
            </TouchableOpacity>

            {/* Icon grid */}
            <View className="flex-row flex-wrap justify-between">
              {GOAL_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  className={`w-[18%] aspect-square items-center justify-center rounded-xl mb-3 ${
                    selectedIcon === icon
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => onSelect(icon)}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={selectedIcon === icon ? '#2563eb' : '#4b5563'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom padding for safe area */}
            <View className="h-8" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
