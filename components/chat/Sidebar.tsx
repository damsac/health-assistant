import { useEffect, useRef } from 'react';
import { Animated, FlatList, Pressable, RefreshControl } from 'react-native';
import { Spinner, Text, XStack, YStack } from '@/components/ui';
import {
  useConversations,
  useDeleteConversation,
} from '@/lib/hooks/use-conversations';
import { ConversationItem } from './ConversationItem';

const SIDEBAR_WIDTH = 280;

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string | undefined;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  insets: { top: number; bottom: number };
};

export function Sidebar({
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

  // Animate sidebar open/close
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
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: overlayAnim,
          zIndex: 10,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          backgroundColor: '#ffffff',
          borderRightWidth: 1,
          borderRightColor: '#e5e5e5',
          transform: [{ translateX: slideAnim }],
          zIndex: 20,
          paddingTop: insets.top,
        }}
      >
        <YStack flex={1}>
          {/* Header */}
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

          {/* Content */}
          <SidebarContent
            conversations={conversations}
            isLoading={isLoading}
            isRefetching={isRefetching}
            currentConversationId={currentConversationId}
            deletingId={
              deleteConversation.isPending
                ? deleteConversation.variables
                : undefined
            }
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            onRefresh={refetch}
            bottomInset={insets.bottom}
          />
        </YStack>
      </Animated.View>
    </>
  );
}

// ============================================================================
// Sidebar Content
// ============================================================================

type Conversation = {
  id: string;
  title: string | null;
  updatedAt: Date;
};

type SidebarContentProps = {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  currentConversationId: string | undefined;
  deletingId: string | undefined;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  bottomInset: number;
};

function SidebarContent({
  conversations,
  isLoading,
  isRefetching,
  currentConversationId,
  deletingId,
  onSelect,
  onDelete,
  onRefresh,
  bottomInset,
}: SidebarContentProps) {
  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="small" color="$color10" />
      </YStack>
    );
  }

  if (!conversations?.length) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$color10" fontSize="$3" textAlign="center">
          No conversations yet
        </Text>
      </YStack>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ConversationItem
          id={item.id}
          title={item.title}
          updatedAt={item.updatedAt}
          isActive={item.id === currentConversationId}
          onPress={() => onSelect(item.id)}
          onDelete={() => onDelete(item.id)}
          isDeleting={deletingId === item.id}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: bottomInset }}
    />
  );
}
