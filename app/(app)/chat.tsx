import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useChat } from '@/lib/hooks/use-chat';
import {
  useConversations,
  useDeleteConversation,
} from '@/lib/hooks/use-conversations';
import { useProfile } from '@/lib/hooks/use-profile';

const SIDEBAR_WIDTH = 280;

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessageBubble({
  role,
  content,
}: {
  role: 'user' | 'assistant' | 'system';
  content: string;
}) {
  const isUser = role === 'user';

  return (
    <XStack
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      paddingHorizontal="$3"
      marginVertical="$1"
    >
      <YStack
        backgroundColor={isUser ? '$blue9' : '$color4'}
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$4"
        maxWidth="80%"
      >
        <Text color={isUser ? 'white' : '$color12'} fontSize="$3">
          {content}
        </Text>
      </YStack>
    </XStack>
  );
}

function ProfileCompletionPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <XStack
      justifyContent="flex-start"
      paddingHorizontal="$3"
      marginVertical="$1"
    >
      <YStack
        backgroundColor="$yellow2"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$4"
        maxWidth="80%"
        borderLeftWidth={3}
        borderLeftColor="$yellow9"
      >
        <XStack gap="$2" alignItems="flex-start">
          <Text fontSize="$3">💡</Text>
          <YStack flex={1} gap="$1">
            <Text color="$yellow12" fontSize="$3" fontWeight="500">
              Tip: Complete your profile
            </Text>
            <Text color="$yellow11" fontSize="$2">
              I can give you even better advice if you complete more of your
              profile. Want to add your sleep patterns, eating schedule, or
              other details? You can update these anytime from the home screen.
            </Text>
            <Pressable onPress={onDismiss} style={{ marginTop: 8 }}>
              <Text color="$yellow10" fontSize="$2" fontWeight="500">
                Dismiss
              </Text>
            </Pressable>
          </YStack>
        </XStack>
      </YStack>
    </XStack>
  );
}

type ConversationItemProps = {
  id: string;
  title: string | null;
  updatedAt: Date | string;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

function ConversationItem({
  title,
  updatedAt,
  isActive,
  onPress,
  onDelete,
  isDeleting,
}: ConversationItemProps) {
  return (
    <Pressable onPress={onPress} disabled={isDeleting}>
      {({ pressed }) => (
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$3"
          backgroundColor={
            isActive ? '$color4' : pressed ? '$color3' : 'transparent'
          }
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          gap="$2"
          opacity={isDeleting ? 0.5 : 1}
        >
          <YStack flex={1} gap="$1">
            <Text
              fontSize="$3"
              fontWeight={isActive ? '600' : '400'}
              numberOfLines={1}
            >
              {title || 'New conversation'}
            </Text>
            <Text fontSize="$1" color="$color10">
              {formatDate(updatedAt)}
            </Text>
          </YStack>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
            disabled={isDeleting}
          >
            <Text color="$red10" fontSize="$2">
              {isDeleting ? '...' : '×'}
            </Text>
          </Pressable>
        </XStack>
      )}
    </Pressable>
  );
}

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string | undefined;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  insets: { top: number; bottom: number };
};

function Sidebar({
  isOpen,
  onClose,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  insets,
}: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const {
    data: conversations,
    isLoading,
    refetch,
    isRefetching,
  } = useConversations();
  const deleteConversation = useDeleteConversation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, slideAnim, overlayAnim]);

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        // If we deleted the current conversation, start a new chat
        if (id === currentConversationId) {
          onNewChat();
        }
      },
    });
  };

  return (
    <>
      {/* Overlay */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          opacity: overlayAnim,
          zIndex: 10,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          backgroundColor: '#fff',
          borderRightWidth: 1,
          borderRightColor: '#e0e0e0',
          transform: [{ translateX: slideAnim }],
          zIndex: 20,
          paddingTop: insets.top,
        }}
      >
        <YStack flex={1}>
          {/* Sidebar Header */}
          <XStack
            paddingHorizontal="$3"
            paddingVertical="$3"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontSize="$4" fontWeight="600">
              History
            </Text>
            <Pressable onPress={handleNewChat} hitSlop={8}>
              <Text color="$blue10" fontSize="$3" fontWeight="500">
                + New
              </Text>
            </Pressable>
          </XStack>

          {/* Conversations List */}
          {isLoading ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="small" color="$color10" />
            </YStack>
          ) : conversations?.length === 0 ? (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              padding="$4"
            >
              <Text color="$color10" fontSize="$3" textAlign="center">
                No conversations yet
              </Text>
            </YStack>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ConversationItem
                  id={item.id}
                  title={item.title}
                  updatedAt={item.updatedAt}
                  isActive={item.id === currentConversationId}
                  onPress={() => handleSelectConversation(item.id)}
                  onDelete={() => handleDeleteConversation(item.id)}
                  isDeleting={
                    deleteConversation.isPending &&
                    deleteConversation.variables === item.id
                  }
                />
              )}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
              }
              contentContainerStyle={{ paddingBottom: insets.bottom }}
            />
          )}
        </YStack>
      </Animated.View>
    </>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >(params.conversationId);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [dismissedProfilePrompt, setDismissedProfilePrompt] = useState(false);

  // Get profile completion percentage
  const { data: profile } = useProfile();

  const {
    messages,
    sendMessage,
    status,
    error,
    isLoadingConversation,
    conversationTitle,
    getMessageText,
    setMessages,
  } = useChat({
    existingConversationId: activeConversationId,
    onConversationCreated: (newId) => {
      setActiveConversationId(newId);
      router.setParams({ conversationId: newId });
    },
  });

  // Sync with URL params
  useEffect(() => {
    if (params.conversationId !== activeConversationId) {
      setActiveConversationId(params.conversationId);
    }
  }, [params.conversationId, activeConversationId]);

  const title = conversationTitle || 'New Chat';
  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Check if we should show profile completion prompt
  useEffect(() => {
    // Count user messages
    const userMessageCount = messages.filter((m) => m.role === 'user').length;

    // Show prompt after 3rd user message if profile is incomplete and not dismissed
    if (
      userMessageCount === 3 &&
      profile?.profileCompletionPercentage !== undefined &&
      profile?.profileCompletionPercentage !== null &&
      profile.profileCompletionPercentage < 100 &&
      !dismissedProfilePrompt
    ) {
      setShowProfilePrompt(true);
    }
  }, [messages, profile?.profileCompletionPercentage, dismissedProfilePrompt]);

  const handleDismissProfilePrompt = () => {
    setShowProfilePrompt(false);
    setDismissedProfilePrompt(true);
  };

  const onSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage({ text: message });
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    router.setParams({ conversationId: id });
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    router.setParams({ conversationId: undefined });
    setMessages([]);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoadingConversation && activeConversationId) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <YStack flex={1} paddingTop={insets.top}>
        {/* Header */}
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          gap="$3"
        >
          <Pressable onPress={toggleSidebar} hitSlop={8}>
            <Text fontSize="$5">☰</Text>
          </Pressable>
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="500" numberOfLines={1}>
              {title}
            </Text>
          </YStack>
          <Pressable onPress={handleNewChat} hitSlop={8}>
            <Text color="$blue10" fontSize="$3">
              New
            </Text>
          </Pressable>
        </XStack>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingVertical: 16,
            flexGrow: 1,
          }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.length === 0 ? (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              gap="$2"
            >
              <Text color="$color10" fontSize="$4">
                Start a conversation
              </Text>
              <Text
                color="$color9"
                fontSize="$2"
                textAlign="center"
                paddingHorizontal="$6"
              >
                Ask me anything about health, nutrition, or wellness.
              </Text>
            </YStack>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role as 'user' | 'assistant' | 'system'}
                content={getMessageText(message.parts)}
              />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <XStack
              justifyContent="flex-start"
              paddingHorizontal="$3"
              marginVertical="$1"
            >
              <YStack
                backgroundColor="$color4"
                paddingHorizontal="$4"
                paddingVertical="$3"
                borderRadius="$4"
              >
                <Spinner size="small" color="$color10" />
              </YStack>
            </XStack>
          )}

          {showProfilePrompt && (
            <ProfileCompletionPrompt onDismiss={handleDismissProfilePrompt} />
          )}

          {error && (
            <XStack
              justifyContent="center"
              paddingHorizontal="$3"
              marginVertical="$2"
            >
              <Text color="$red10" fontSize="$2">
                Error: {error.message}
              </Text>
            </XStack>
          )}
        </ScrollView>

        {/* Input */}
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$2"
          paddingBottom={insets.bottom + 8}
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$2"
          alignItems="flex-end"
        >
          <Input
            flex={1}
            placeholder="Type a message..."
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={onSubmit}
            returnKeyType="send"
            editable={!isLoading}
            multiline
            maxLength={2000}
            paddingVertical="$2"
            borderRadius="$4"
            backgroundColor="$color2"
            borderWidth={1}
            borderColor="$borderColor"
          />
          <Button
            onPress={onSubmit}
            disabled={!inputValue.trim() || isLoading}
            backgroundColor={
              inputValue.trim() && !isLoading ? '$blue9' : '$color5'
            }
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$4"
          >
            <Text color="white" fontWeight="600">
              Send
            </Text>
          </Button>
        </XStack>
      </YStack>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        insets={insets}
      />
    </KeyboardAvoidingView>
  );
}
