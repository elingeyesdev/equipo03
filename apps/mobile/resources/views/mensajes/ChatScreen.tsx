import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { messagesApi, DirectMessage } from '../../../app/Providers/messages/messages.api';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { useSocket } from '../../../app/Providers/notifications/SocketContext';

type RouteParams = {
  Chat: { conversationId: number; otherUserName: string };
};

// hiddenLocally: flag de cliente que oculta el mensaje sin hacer re-fetch
type LocalMessage = DirectMessage & { hiddenLocally?: boolean };

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

// ── Burbuja de mensaje ────────────────────────────────────────────────────────

type BubbleProps = {
  msg:         LocalMessage;
  isMine:      boolean;
  onLongPress: () => void;
};

const MessageBubble = ({ msg, isMine, onLongPress }: BubbleProps) => {
  const isDeleted = !!msg.isDeletedForAll;
  const isRead    = !!msg.readAt;

  return (
    <TouchableOpacity
      style={[s.bubbleRow, isMine ? s.rowMine : s.rowOther]}
      onLongPress={onLongPress}
      delayLongPress={200}
      activeOpacity={0.85}
    >
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
        <Text style={[
          isMine ? s.bubbleTextMine : s.bubbleTextOther,
          isDeleted && s.bubbleTextDeleted,
        ]}>
          {msg.content}
        </Text>

        {/* Meta: hora + checks */}
        <View style={s.bubbleMeta}>
          <Text style={s.bubbleTime}>{fmtTime(msg.createdAt)}</Text>
          {isMine && !isDeleted && (
            <MaterialCommunityIcons
              name={isRead ? 'check-all' : 'check'}
              size={13}
              color={isRead ? '#34B7F1' : 'rgba(255,255,255,0.5)'}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Pantalla principal ────────────────────────────────────────────────────────

export const ChatScreen = () => {
  const route      = useRoute<RouteProp<RouteParams, 'Chat'>>();
  const navigation = useNavigation();
  const { conversationId, otherUserName } = route.params;

  const { user }    = useAuth();
  const myId        = Number((user as any)?.userId ?? 0);
  const { socket }  = useSocket();
  const queryClient = useQueryClient();

  const [messages,       setMessages]       = useState<LocalMessage[]>([]);
  const [inputText,      setInputText]      = useState('');
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSending,      setIsSending]      = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [selectedMsg,    setSelectedMsg]    = useState<LocalMessage | null>(null);
  const listRef = useRef<FlatList<LocalMessage>>(null);

  // ── Cargar historial ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const safeId = Number(conversationId);
      const data   = await messagesApi.getHistory(safeId);
      setMessages([...data].reverse() as LocalMessage[]);
      void messagesApi.markAsRead(safeId);
    } catch {
      // Error silencioso — no bloquea UI
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  // ── WebSocket: mensajes nuevos + eliminaciones en tiempo real ───────────────
  useEffect(() => {
    if (!socket) return;
    const safeConvId = Number(conversationId);

    const onChatMessage = (payload: any) => {
      if (Number(payload?.conversationId) !== safeConvId) return;
      setMessages((prev) => {
        const incomingId = payload?.messageId ?? payload?.id;
        if (prev.some((m) => m.id === incomingId)) return prev;
        const incoming: LocalMessage = {
          id:             incomingId,
          conversationId: safeConvId,
          senderId:       Number(payload.senderId),
          content:        payload.content ?? '',
          readAt:         null,
          createdAt:      payload.createdAt ?? new Date().toISOString(),
        };
        return [incoming, ...prev];
      });
      if (Number(payload?.senderId) !== myId) {
        void messagesApi.markAsRead(safeConvId).catch(() => {});
      }
    };

    const onMessageDeleted = (updated: any) => {
      const targetId = updated?.id ?? updated?.messageId;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== targetId) return m;
          return {
            ...m,
            isDeletedForAll:    updated.isDeletedForAll    ?? m.isDeletedForAll,
            deletedForSender:   updated.deletedForSender   ?? m.deletedForSender,
            deletedForReceiver: updated.deletedForReceiver ?? m.deletedForReceiver,
            content: updated.isDeletedForAll ? 'Mensaje eliminado' : (updated.content ?? m.content),
          };
        }),
      );
    };

    const onMessagesRead = (data: any) => {
      if (Number(data?.conversationId) !== safeConvId) return;
      // Mutar readAt de todos mis mensajes no leídos → checks pasan a azul sin re-fetch
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === myId && !m.readAt
            ? { ...m, readAt: new Date().toISOString() }
            : m,
        ),
      );
    };

    socket.on('chat_message',    onChatMessage);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('messages_read',   onMessagesRead);
    return () => {
      socket.off('chat_message',    onChatMessage);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('messages_read',   onMessagesRead);
    };
  }, [socket, conversationId, myId]);

  // ── Enviar mensaje ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

    const safeId = Number(conversationId);
    if (isNaN(safeId) || safeId <= 0) {
      Alert.alert('Error', 'ID de conversación inválido.');
      return;
    }

    const optimistic: LocalMessage = {
      id: Date.now(), conversationId: safeId, senderId: myId,
      content, readAt: null, createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [optimistic, ...prev]);
    setInputText('');
    setIsSending(true);

    try {
      const saved = await messagesApi.sendMessage(safeId, content);
      setMessages((prev) => {
        const replaced = prev.map((m) => (m.id === optimistic.id ? { ...saved } as LocalMessage : m));
        const seen = new Set<number>();
        return replaced.filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
      });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(content);
      const raw = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
      Alert.alert('Fallo en el servidor', typeof raw === 'string' ? raw : JSON.stringify(raw));
    } finally {
      setIsSending(false);
    }
  };

  // ── Eliminar conversación completa ──────────────────────────────────────────
  const handleDeleteChat = () => {
    setShowHeaderMenu(false);
    Alert.alert(
      'Eliminar Chat',
      '¿Eliminar el chat para ambos usuarios? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await messagesApi.deleteConversation(Number(conversationId));
              queryClient.invalidateQueries({ queryKey: ['inbox'] });
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el chat.');
            }
          },
        },
      ],
    );
  };

  // ── Vaciar chat localmente (soft-delete masivo) ─────────────────────────────
  const handleClearChat = () => {
    setShowHeaderMenu(false);
    Alert.alert(
      'Vaciar Chat',
      'Se ocultarán todos los mensajes actuales solo para ti. El otro usuario no se verá afectado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar', style: 'destructive',
          onPress: async () => {
            try {
              await messagesApi.clearConversation(Number(conversationId));
              setMessages([]);
              queryClient.invalidateQueries({ queryKey: ['inbox'] });
            } catch {
              Alert.alert('Error', 'No se pudo vaciar el chat.');
            }
          },
        },
      ],
    );
  };

  // ── Eliminar mensaje individual ─────────────────────────────────────────────
  const handleDeleteMessage = async (type: 'FOR_ME' | 'FOR_ALL') => {
    const target = selectedMsg;
    setSelectedMsg(null);
    if (!target) return;

    try {
      await messagesApi.deleteMessage(target.id, type);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== target.id) return m;
          if (type === 'FOR_ALL') return { ...m, isDeletedForAll: true, content: 'Mensaje eliminado' };
          return { ...m, hiddenLocally: true };
        }),
      );
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el mensaje.');
    }
  };

  // ── Compartir contenido del mensaje (equivalente a copiar) ──────────────────
  const handleShare = async () => {
    const content = selectedMsg?.content ?? '';
    setSelectedMsg(null);
    if (!content || content === 'Mensaje eliminado') return;
    try {
      await Share.share({ message: content });
    } catch {
      // Share cancelado por el usuario
    }
  };

  // ── Lista filtrada — excluye mensajes ocultos para el usuario actual ─────────
  const visibleMessages = useMemo(
    () =>
      messages.filter((m) => {
        if (m.hiddenLocally) return false;
        if (m.isDeletedForAll) return true; // visible como "Mensaje eliminado"
        if (m.senderId === myId) return !m.deletedForSender;
        return !m.deletedForReceiver;
      }),
    [messages, myId],
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={s.avatar}>
          <MaterialCommunityIcons name="account-circle-outline" size={34} color="#f05b22" />
        </View>
        <Text style={s.headerName} numberOfLines={1}>{otherUserName}</Text>
        <TouchableOpacity
          onPress={() => setShowHeaderMenu(true)}
          style={s.kebabBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* ── Cuerpo ────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#f05b22" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={visibleMessages}
            keyExtractor={(item) => item.id.toString()}
            inverted
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <MessageBubble
                msg={item}
                isMine={item.senderId === myId}
                onLongPress={() => setSelectedMsg(item)}
              />
            )}
          />
        )}

        {/* ── Compositor ── */}
        <View style={s.composer}>
          <TextInput
            style={s.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#555"
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!inputText.trim() || isSending) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.75}
          >
            {isSending
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="send" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Modal: menú de cabecera (kebab) ───────────────────────────────── */}
      <Modal visible={showHeaderMenu} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowHeaderMenu(false)}>
          <View style={s.overlayFull}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={s.headerDropdown}
            >
              <TouchableOpacity style={s.dropdownItem} onPress={handleClearChat}>
                <MaterialCommunityIcons name="delete-empty-outline" size={18} color="#E5E7EB" />
                <Text style={s.dropdownText}>Vaciar chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.dropdownItem, s.dropdownBorder]} onPress={handleDeleteChat}>
                <MaterialCommunityIcons name="delete-sweep-outline" size={18} color="#EF4444" />
                <Text style={s.dropdownTextDanger}>Eliminar chat</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Modal: menú contextual de mensaje (long-press) ────────────────── */}
      <Modal visible={!!selectedMsg} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedMsg(null)}>
          <View style={s.overlayCenter}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={s.contextMenu}>

              {/* Copiar — oculto si el mensaje fue eliminado para todos */}
              {!selectedMsg?.isDeletedForAll && (
                <TouchableOpacity style={s.ctxItem} onPress={handleShare}>
                  <MaterialCommunityIcons name="content-copy" size={18} color="#E5E7EB" />
                  <Text style={s.ctxText}>Copiar</Text>
                </TouchableOpacity>
              )}

              {/* Eliminar para mí */}
              <TouchableOpacity
                style={[s.ctxItem, !selectedMsg?.isDeletedForAll && s.ctxBorder]}
                onPress={() => handleDeleteMessage('FOR_ME')}
              >
                <MaterialCommunityIcons name="eye-off-outline" size={18} color="#E5E7EB" />
                <Text style={s.ctxText}>Eliminar para mí</Text>
              </TouchableOpacity>

              {/* Eliminar para todos — solo visible si soy el emisor y no está ya eliminado */}
              {selectedMsg?.senderId === myId && !selectedMsg?.isDeletedForAll && (
                <TouchableOpacity
                  style={[s.ctxItem, s.ctxBorder, s.ctxItemDanger]}
                  onPress={() => handleDeleteMessage('FOR_ALL')}
                >
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                  <Text style={s.ctxTextDanger}>Eliminar para todos</Text>
                </TouchableOpacity>
              )}

            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  flex:      { flex: 1 },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1C1C1E', gap: 10 },
  backBtn:    { padding: 4 },
  kebabBtn:   { padding: 6 },
  avatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  headerName: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },

  // Lista
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },

  // Burbujas
  bubbleRow:  { marginVertical: 3 },
  rowMine:    { alignItems: 'flex-end' },
  rowOther:   { alignItems: 'flex-start' },
  bubble:     { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 6 },
  bubbleMine:         { backgroundColor: '#f05b22', borderBottomRightRadius: 4 },
  bubbleOther:        { backgroundColor: '#1C1C1E', borderBottomLeftRadius: 4 },
  bubbleTextMine:     { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTextOther:    { color: '#E5E7EB', fontSize: 14, lineHeight: 20 },
  bubbleTextDeleted:  { fontStyle: 'italic', opacity: 0.55 },
  bubbleMeta:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 },
  bubbleTime:         { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  // Compositor
  composer:        { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#1C1C1E', gap: 10 },
  input:           { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: '#1C1C1E', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 },
  sendBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f05b22', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#3A3A3C' },

  // Overlays
  overlayFull:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  // Dropdown del header (top-right absoluto)
  headerDropdown: { position: 'absolute', top: 58, right: 8, backgroundColor: '#1C1C1E', borderRadius: 10, minWidth: 170, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2A2D', elevation: 8 },
  dropdownItem:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 16 },
  dropdownBorder:     { borderTopWidth: 1, borderTopColor: '#2A2A2D' },
  dropdownText:       { color: '#E5E7EB', fontSize: 14 },
  dropdownTextDanger: { color: '#EF4444', fontSize: 14 },

  // Menú contextual de mensaje
  contextMenu:   { backgroundColor: '#1C1C1E', borderRadius: 14, minWidth: 230, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2A2D', elevation: 10 },
  ctxItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 18 },
  ctxBorder:     { borderTopWidth: 1, borderTopColor: '#2A2A2D' },
  ctxItemDanger: {},
  ctxText:       { color: '#E5E7EB', fontSize: 14 },
  ctxTextDanger: { color: '#EF4444', fontSize: 14 },
});
