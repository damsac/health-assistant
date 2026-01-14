import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageContent, type MessagePart, Sidebar } from '@/components/chat';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useChat } from '@/lib/hooks/use-chat';

// Enable layout animation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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

  const {
    messages,
    sendMessage,
    status,
    error,
    isLoadingConversation,
    conversationTitle,
    getMessageText,
    setMessages,
    addToolApprovalResponse,
  } = useChat({
    existingConversationId: activeConversationId,
    onConversationCreated: (newId) => {
      setActiveConversationId(newId);
      router.setParams({ conversationId: newId });
    },
  });

  // Handlers for tool approval flow
  const handleApprove = (approvalId: string) => {
    addToolApprovalResponse({ id: approvalId, approved: true });
  };

  const handleReject = (approvalId: string) => {
    addToolApprovalResponse({ id: approvalId, approved: false });
  };

  // Sync with URL params
  useEffect(() => {
    if (params.conversationId !== activeConversationId) {
      setActiveConversationId(params.conversationId);
    }
  }, [params.conversationId, activeConversationId]);

  const title = conversationTitle || 'New Chat';
  const isLoading = status === 'submitted' || status === 'streaming';

  // Log errors to console for debugging.
  // TODO: remove this and add better error handling.
  useEffect(() => {
    if (error) {
      console.error('[Chat Error]', error);
    }
  }, [error]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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
            messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isAssistantStreaming =
                isLastMessage && isLoading && message.role === 'assistant';

              return (
                <MessageContent
                  key={message.id}
                  role={message.role as 'user' | 'assistant' | 'system'}
                  parts={(message.parts ?? []) as MessagePart[]}
                  getMessageText={getMessageText}
                  isStreaming={isAssistantStreaming}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              );
            })
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
