import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  FlatList,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, State, GestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { HabitWithLog, Mantra, JournalPromptWithEntry, TodayItem, Vision, Identity } from '../../src/types/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitCard } from '../../src/components/HabitCard';
import { MantraCard } from '../../src/components/MantraCard';
import { JournalPromptCard } from '../../src/components/JournalPromptCard';
import { VisionCard } from '../../src/components/VisionCard';
import { IdentityCard } from '../../src/components/IdentityCard';
import { ScoreRing } from '../../src/components/ScoreRing';
import {
  useHabitsWithLogs,
  useCreateHabit,
  useToggleHabit,
  useDeleteHabit,
  useUpdateHabit,
  useReorderHabits,
} from '../../src/hooks/useHabits';
import { useMantras, useCreateMantra, useDeleteMantra } from '../../src/hooks/useMantras';
import {
  useJournalPromptsWithEntries,
  useCreateJournalPrompt,
  useDeleteJournalPrompt,
  useSaveJournalEntry,
} from '../../src/hooks/useJournalPrompts';
import { useVisions, useCreateVision, useDeleteVision } from '../../src/hooks/useVisions';
import { useIdentities, useCreateIdentity, useDeleteIdentity } from '../../src/hooks/useIdentities';

const getToday = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

type AddType = 'habit' | 'mantra' | 'journal' | 'vision' | 'identity';

export default function TodayScreen() {
  const today = getToday();

  // Selected date for navigation
  const [selectedDate, setSelectedDate] = useState(today);

  const isToday = selectedDate === today;

  const goToPreviousDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(today);
  };

  // Swipe gesture handler for day navigation
  const onSwipeGesture = useCallback((event: GestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent as any;
      const SWIPE_THRESHOLD = 50;

      if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left -> next day
        goToNextDay();
      } else if (translationX > SWIPE_THRESHOLD) {
        // Swipe right -> previous day
        goToPreviousDay();
      }
    }
  }, [selectedDate]);

  // Modal states
  const [addTypeModalVisible, setAddTypeModalVisible] = useState(false);
  const [habitModalVisible, setHabitModalVisible] = useState(false);
  const [mantraModalVisible, setMantraModalVisible] = useState(false);
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [visionModalVisible, setVisionModalVisible] = useState(false);
  const [identityModalVisible, setIdentityModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [journalEntryModalVisible, setJournalEntryModalVisible] = useState(false);

  // Selected items
  const [selectedHabit, setSelectedHabit] = useState<HabitWithLog | null>(null);
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPromptWithEntry | null>(null);
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);

  // Form inputs
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newMantraText, setNewMantraText] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newVisionText, setNewVisionText] = useState('');
  const [newIdentityText, setNewIdentityText] = useState('');
  const [journalEntry, setJournalEntry] = useState('');

  // Edit habit state
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitDescription, setEditHabitDescription] = useState('');

  // Habits
  const { data: habits, isLoading: habitsLoading, refetch: refetchHabits, isRefetching: habitsRefetching } = useHabitsWithLogs(selectedDate);
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabit();
  const deleteHabit = useDeleteHabit();
  const updateHabit = useUpdateHabit();
  const reorderHabits = useReorderHabits();

  // Mantras
  const { data: mantras, isLoading: mantrasLoading, refetch: refetchMantras } = useMantras();
  const createMantra = useCreateMantra();
  const deleteMantra = useDeleteMantra();

  // Journal Prompts
  const { data: journalPrompts, isLoading: promptsLoading, refetch: refetchPrompts } = useJournalPromptsWithEntries(selectedDate);
  const createJournalPrompt = useCreateJournalPrompt();
  const deleteJournalPrompt = useDeleteJournalPrompt();
  const saveJournalEntry = useSaveJournalEntry();

  // Visions
  const { data: visions, isLoading: visionsLoading, refetch: refetchVisions } = useVisions();
  const createVision = useCreateVision();
  const deleteVision = useDeleteVision();

  // Identities
  const { data: identities, isLoading: identitiesLoading, refetch: refetchIdentities } = useIdentities();
  const createIdentity = useCreateIdentity();
  const deleteIdentity = useDeleteIdentity();

  const isLoading = habitsLoading || mantrasLoading || promptsLoading || visionsLoading || identitiesLoading;
  const isRefetching = habitsRefetching;

  const refetch = () => {
    refetchHabits();
    refetchMantras();
    refetchPrompts();
    refetchVisions();
    refetchIdentities();
  };

  // Combine all items into a single list
  const allItems: TodayItem[] = useMemo(() => {
    const items: TodayItem[] = [];

    if (identities) {
      identities.forEach((i) => items.push({ type: 'identity', data: i }));
    }
    if (visions) {
      visions.forEach((v) => items.push({ type: 'vision', data: v }));
    }
    if (mantras) {
      mantras.forEach((m) => items.push({ type: 'mantra', data: m }));
    }
    if (habits) {
      habits.forEach((h) => items.push({ type: 'habit', data: h }));
    }
    if (journalPrompts) {
      journalPrompts.forEach((j) => items.push({ type: 'journal', data: j }));
    }

    return items;
  }, [identities, visions, mantras, habits, journalPrompts]);

  // Get habit index for reordering
  const getHabitIndex = useCallback((habitId: string) => {
    return habits?.findIndex((h) => h.id === habitId) ?? -1;
  }, [habits]);

  // Move habit up
  const moveHabitUp = useCallback((habitId: string) => {
    if (!habits) return;
    const index = getHabitIndex(habitId);
    if (index <= 0) return;

    const newOrder = habits.map((h) => h.id);
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderHabits.mutate(newOrder);
  }, [habits, getHabitIndex, reorderHabits]);

  // Move habit down
  const moveHabitDown = useCallback((habitId: string) => {
    if (!habits) return;
    const index = getHabitIndex(habitId);
    if (index < 0 || index >= habits.length - 1) return;

    const newOrder = habits.map((h) => h.id);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderHabits.mutate(newOrder);
  }, [habits, getHabitIndex, reorderHabits]);

  // Render item for the list
  const renderItem = useCallback(({ item }: { item: TodayItem }) => {
    if (item.type === 'identity') {
      return (
        <IdentityCard
          identity={item.data}
          onPress={() => handleIdentityPress(item.data)}
        />
      );
    }
    if (item.type === 'vision') {
      return (
        <VisionCard
          vision={item.data}
          onPress={() => handleVisionPress(item.data)}
        />
      );
    }
    if (item.type === 'mantra') {
      return (
        <MantraCard
          mantra={item.data}
          onPress={() => handleMantraPress(item.data)}
        />
      );
    }
    if (item.type === 'habit') {
      const index = getHabitIndex(item.data.id);
      const isFirst = index === 0;
      const isLast = index === (habits?.length ?? 0) - 1;

      return (
        <HabitCard
          habit={item.data}
          onToggle={() => handleToggle(item.data.id, item.data.completed)}
          onDelete={() => handleDeleteHabit(item.data.id, item.data.name)}
          onPress={() => handleHabitPress(item.data)}
          onMoveUp={isFirst ? undefined : () => moveHabitUp(item.data.id)}
          onMoveDown={isLast ? undefined : () => moveHabitDown(item.data.id)}
        />
      );
    }
    if (item.type === 'journal') {
      return (
        <JournalPromptCard
          prompt={item.data}
          onPress={() => handleJournalPromptPress(item.data)}
        />
      );
    }
    return null;
  }, [habits, getHabitIndex, moveHabitUp, moveHabitDown]);

  const completedCount = habits?.filter((h) => h.completed).length ?? 0;
  const totalCount = habits?.length ?? 0;
  const score = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = (habitId: string, currentlyCompleted: boolean) => {
    toggleHabit.mutate({
      habitId,
      date: selectedDate,
      completed: !currentlyCompleted,
    });
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      await createHabit.mutateAsync({
        name: newHabitName.trim(),
        description: newHabitDescription.trim() || undefined,
      });
      setNewHabitName('');
      setNewHabitDescription('');
      setHabitModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create habit');
    }
  };

  const handleAddMantra = async () => {
    if (!newMantraText.trim()) {
      Alert.alert('Error', 'Please enter your mantra');
      return;
    }

    try {
      await createMantra.mutateAsync(newMantraText.trim());
      setNewMantraText('');
      setMantraModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create mantra');
    }
  };

  const handleAddJournalPrompt = async () => {
    if (!newPromptText.trim()) {
      Alert.alert('Error', 'Please enter a journal prompt');
      return;
    }

    try {
      await createJournalPrompt.mutateAsync(newPromptText.trim());
      setNewPromptText('');
      setJournalModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create journal prompt');
    }
  };

  const handleAddVision = async () => {
    if (!newVisionText.trim()) {
      Alert.alert('Error', 'Please enter your vision');
      return;
    }

    try {
      await createVision.mutateAsync(newVisionText.trim());
      setNewVisionText('');
      setVisionModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create vision');
    }
  };

  const handleAddIdentity = async () => {
    if (!newIdentityText.trim()) {
      Alert.alert('Error', 'Please enter your identity');
      return;
    }

    try {
      await createIdentity.mutateAsync(newIdentityText.trim());
      setNewIdentityText('');
      setIdentityModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create identity');
    }
  };

  const handleSaveJournalEntry = async () => {
    if (!selectedPrompt || !journalEntry.trim()) return;

    try {
      await saveJournalEntry.mutateAsync({
        promptId: selectedPrompt.id,
        entry: journalEntry.trim(),
        date: selectedDate,
      });
      setJournalEntry('');
      setJournalEntryModalVisible(false);
      setSelectedPrompt(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  const handleMantraPress = (mantra: Mantra) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Mantra',
          message: mantra.text,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Alert.alert('Delete Mantra', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMantra.mutate(mantra.id) },
            ]);
          }
        }
      );
    } else {
      Alert.alert('Mantra', mantra.text, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMantra.mutate(mantra.id) },
      ]);
    }
  };

  const handleVisionPress = (vision: Vision) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Vision',
          message: vision.text,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Alert.alert('Delete Vision', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteVision.mutate(vision.id) },
            ]);
          }
        }
      );
    } else {
      Alert.alert('Vision', vision.text, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteVision.mutate(vision.id) },
      ]);
    }
  };

  const handleIdentityPress = (identity: Identity) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Identity',
          message: identity.text,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Alert.alert('Delete Identity', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteIdentity.mutate(identity.id) },
            ]);
          }
        }
      );
    } else {
      Alert.alert('Identity', identity.text, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteIdentity.mutate(identity.id) },
      ]);
    }
  };

  const handleJournalPromptPress = (prompt: JournalPromptWithEntry) => {
    setSelectedPrompt(prompt);
    setJournalEntry('');
    setJournalEntryModalVisible(true);
  };

  const handleAddTypeSelect = (type: AddType) => {
    setAddTypeModalVisible(false);
    setTimeout(() => {
      if (type === 'habit') setHabitModalVisible(true);
      else if (type === 'mantra') setMantraModalVisible(true);
      else if (type === 'journal') setJournalModalVisible(true);
      else if (type === 'vision') setVisionModalVisible(true);
      else if (type === 'identity') setIdentityModalVisible(true);
    }, 300);
  };

  const handleDeleteHabit = (habitId: string, habitName: string) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habitName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteHabit.mutate(habitId),
      },
    ]);
  };

  const handleHabitPress = (habit: HabitWithLog) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View Details', 'Delete'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: habit.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setSelectedHabit(habit);
            setDetailModalVisible(true);
          } else if (buttonIndex === 2) {
            handleDeleteHabit(habit.id, habit.name);
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert(habit.name, 'Choose an action', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => {
            setSelectedHabit(habit);
            setDetailModalVisible(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteHabit(habit.id, habit.name),
        },
      ]);
    }
  };

  const handleStartEditHabit = () => {
    if (selectedHabit) {
      setEditHabitName(selectedHabit.name);
      setEditHabitDescription(selectedHabit.description || '');
      setIsEditingHabit(true);
    }
  };

  const handleSaveEditHabit = async () => {
    if (!selectedHabit || !editHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      await updateHabit.mutateAsync({
        id: selectedHabit.id,
        updates: {
          name: editHabitName.trim(),
          description: editHabitDescription.trim() || undefined,
        },
      });
      setIsEditingHabit(false);
      setDetailModalVisible(false);
      setSelectedHabit(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const handleCancelEditHabit = () => {
    setIsEditingHabit(false);
    setEditHabitName('');
    setEditHabitDescription('');
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <PanGestureHandler
      onHandlerStateChange={onSwipeGesture}
      activeOffsetX={[-20, 20]}
    >
      <View style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
          <View className="flex-1 px-4">
        {/* Header */}
        <View className="items-center py-6">
          <View className="flex-row items-center justify-center w-full">
            <TouchableOpacity
              onPress={goToPreviousDay}
              className="p-2"
            >
              <Ionicons name="chevron-back" size={24} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={isToday ? undefined : goToToday}
              disabled={isToday}
              className="mx-4"
            >
              <Text className={`text-lg ${isToday ? 'text-gray-500' : 'text-primary-600'}`}>
                {formatDate(selectedDate)}
              </Text>
              {!isToday && (
                <Text className="text-xs text-primary-500 text-center mt-1">
                  Tap to return to today
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNextDay}
              className="p-2"
            >
              <Ionicons name="chevron-forward" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            <ScoreRing score={score} size="large" />
          </View>

          <Text className="mt-3 text-gray-600">
            {completedCount} of {totalCount} habits completed
          </Text>
        </View>

        {/* Content List */}
        {allItems.length > 0 ? (
          <FlatList
            data={allItems}
            keyExtractor={(item) => `${item.type}-${item.data.id}`}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            onRefresh={refetch}
            refreshing={isRefetching}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-lg text-center">
              Start your day!{'\n'}Tap + to add habits, mantras, or prompts.
            </Text>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity
          className="absolute bottom-6 right-4 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
          onPress={() => setAddTypeModalVisible(true)}
        >
          <Text className="text-white text-3xl">+</Text>
        </TouchableOpacity>
      </View>
          </KeyboardAvoidingView>

      {/* Add Type Selection Modal */}
      <Modal
        visible={addTypeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddTypeModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-800">
                What would you like to add?
              </Text>
              <TouchableOpacity onPress={() => setAddTypeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-green-50 rounded-xl mb-3 border border-green-100"
              onPress={() => handleAddTypeSelect('habit')}
            >
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">Habit</Text>
                <Text className="text-gray-500">Daily task to track and complete</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-purple-50 rounded-xl mb-3 border border-purple-100"
              onPress={() => handleAddTypeSelect('mantra')}
            >
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="sparkles" size={24} color="#9333ea" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">Mantra</Text>
                <Text className="text-gray-500">Daily affirmation or reminder</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-orange-50 rounded-xl mb-3 border border-orange-100"
              onPress={() => handleAddTypeSelect('journal')}
            >
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="create-outline" size={24} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">Journal Prompt</Text>
                <Text className="text-gray-500">Question to reflect on daily</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-blue-50 rounded-xl mb-3 border border-blue-100"
              onPress={() => handleAddTypeSelect('vision')}
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="eye-outline" size={24} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">Vision</Text>
                <Text className="text-gray-500">Your vision for the future</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-pink-50 rounded-xl mb-3 border border-pink-100"
              onPress={() => handleAddTypeSelect('identity')}
            >
              <View className="w-12 h-12 bg-pink-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="person-outline" size={24} color="#ec4899" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">Identity</Text>
                <Text className="text-gray-500">Who you are becoming</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Habit Modal */}
      <Modal
        visible={habitModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHabitModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Add New Habit
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Name
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
              placeholder="e.g., Morning meditation"
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Details (optional)
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
              placeholder="e.g., 10 minutes of mindfulness"
              value={newHabitDescription}
              onChangeText={setNewHabitDescription}
              multiline
              numberOfLines={2}
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-200"
                onPress={() => {
                  setHabitModalVisible(false);
                  setNewHabitName('');
                  setNewHabitDescription('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-primary-600 ml-3"
                onPress={handleAddHabit}
                disabled={createHabit.isPending}
              >
                <Text className="text-white text-center font-semibold">
                  {createHabit.isPending ? 'Adding...' : 'Add Habit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Mantra Modal */}
      <Modal
        visible={mantraModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMantraModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Add Daily Mantra
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Your Mantra
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
              placeholder="e.g., I am capable of achieving my goals"
              value={newMantraText}
              onChangeText={setNewMantraText}
              multiline
              numberOfLines={3}
              autoFocus
              blurOnSubmit={true}
              returnKeyType="done"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-200"
                onPress={() => {
                  setMantraModalVisible(false);
                  setNewMantraText('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-purple-600 ml-3"
                onPress={handleAddMantra}
                disabled={createMantra.isPending}
              >
                <Text className="text-white text-center font-semibold">
                  {createMantra.isPending ? 'Adding...' : 'Add Mantra'}
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Journal Prompt Modal */}
      <Modal
        visible={journalModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJournalModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Add Journal Prompt
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Your Prompt
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
              placeholder="e.g., What am I grateful for today?"
              value={newPromptText}
              onChangeText={setNewPromptText}
              multiline
              numberOfLines={2}
              autoFocus
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-200"
                onPress={() => {
                  setJournalModalVisible(false);
                  setNewPromptText('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-orange-500 ml-3"
                onPress={handleAddJournalPrompt}
                disabled={createJournalPrompt.isPending}
              >
                <Text className="text-white text-center font-semibold">
                  {createJournalPrompt.isPending ? 'Adding...' : 'Add Prompt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Vision Modal */}
      <Modal
        visible={visionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Add Vision
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Your Vision
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
              placeholder="e.g., I see myself living a healthy, balanced life where I..."
              value={newVisionText}
              onChangeText={setNewVisionText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
              autoFocus
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-200"
                onPress={() => {
                  setVisionModalVisible(false);
                  setNewVisionText('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-blue-500 ml-3"
                onPress={handleAddVision}
                disabled={createVision.isPending}
              >
                <Text className="text-white text-center font-semibold">
                  {createVision.isPending ? 'Adding...' : 'Add Vision'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Identity Modal */}
      <Modal
        visible={identityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIdentityModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Add Identity
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              I am...
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
              placeholder="e.g., someone who prioritizes my health"
              value={newIdentityText}
              onChangeText={setNewIdentityText}
              multiline
              numberOfLines={3}
              autoFocus
              blurOnSubmit={true}
              returnKeyType="done"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-200"
                onPress={() => {
                  setIdentityModalVisible(false);
                  setNewIdentityText('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-pink-500 ml-3"
                onPress={handleAddIdentity}
                disabled={createIdentity.isPending}
              >
                <Text className="text-white text-center font-semibold">
                  {createIdentity.isPending ? 'Adding...' : 'Add Identity'}
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Journal Entry Modal */}
      <Modal
        visible={journalEntryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJournalEntryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Journal Entry
              </Text>
              <TouchableOpacity onPress={() => setJournalEntryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedPrompt && (
              <>
                <View className="bg-orange-50 p-3 rounded-xl mb-4 border border-orange-100">
                  <Text className="text-orange-800 font-medium">
                    {selectedPrompt.prompt}
                  </Text>
                </View>

                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
                  placeholder="Write your response..."
                  value={journalEntry}
                  onChangeText={setJournalEntry}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  style={{ minHeight: 150 }}
                  autoFocus
                />

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl bg-gray-200"
                    onPress={() => {
                      Alert.alert('Delete Prompt', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            deleteJournalPrompt.mutate(selectedPrompt.id);
                            setJournalEntryModalVisible(false);
                          },
                        },
                      ]);
                    }}
                  >
                    <Text className="text-red-500 text-center font-semibold">
                      Delete Prompt
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl bg-teal-500 ml-3"
                    onPress={handleSaveJournalEntry}
                    disabled={saveJournalEntry.isPending}
                  >
                    <Text className="text-white text-center font-semibold">
                      {saveJournalEntry.isPending ? 'Saving...' : 'Save Entry'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Habit Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setDetailModalVisible(false);
          setIsEditingHabit(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                {isEditingHabit ? 'Edit Habit' : 'Habit Details'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setDetailModalVisible(false);
                  setIsEditingHabit(false);
                }}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedHabit && (
              <View>
                {isEditingHabit ? (
                  <>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Name
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
                      placeholder="Habit name"
                      value={editHabitName}
                      onChangeText={setEditHabitName}
                      autoFocus
                    />

                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Details (optional)
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4"
                      placeholder="Add details"
                      value={editHabitDescription}
                      onChangeText={setEditHabitDescription}
                      multiline
                      numberOfLines={2}
                    />

                    <View className="flex-row space-x-3">
                      <TouchableOpacity
                        className="flex-1 py-3 rounded-xl bg-gray-200"
                        onPress={handleCancelEditHabit}
                      >
                        <Text className="text-gray-700 text-center font-semibold">
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 py-3 rounded-xl bg-primary-600 ml-3"
                        onPress={handleSaveEditHabit}
                        disabled={updateHabit.isPending}
                      >
                        <Text className="text-white text-center font-semibold">
                          {updateHabit.isPending ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-500 mb-1">
                        Name
                      </Text>
                      <Text className="text-lg text-gray-800">
                        {selectedHabit.name}
                      </Text>
                    </View>

                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-500 mb-1">
                        Details
                      </Text>
                      <Text className="text-base text-gray-600">
                        {selectedHabit.description || 'No details added'}
                      </Text>
                    </View>

                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-500 mb-1">
                        Status Today
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className={`w-3 h-3 rounded-full mr-2 ${
                            selectedHabit.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <Text className="text-base text-gray-600">
                          {selectedHabit.completed ? 'Completed' : 'Not completed'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row space-x-3 mt-4">
                      <TouchableOpacity
                        className="flex-1 py-3 rounded-xl bg-primary-600"
                        onPress={handleStartEditHabit}
                      >
                        <Text className="text-white text-center font-semibold">
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 py-3 rounded-xl bg-red-500 ml-3"
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleDeleteHabit(selectedHabit.id, selectedHabit.name);
                        }}
                      >
                        <Text className="text-white text-center font-semibold">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
        </SafeAreaView>
      </View>
    </PanGestureHandler>
  );
}
