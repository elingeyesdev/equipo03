import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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

const MessageBubble = ({ msg, isMine }: { msg: DirectMessage; isMine: boolean }) => (
  <View style={[s.bubbleRow, isMine ? s.rowMine : s.rowOther]}>
    <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
      <Text style={isMine ? s.bubbleTextMine : s.bubbleTextOther}>{msg.content}</Text>
      <Text style={s.bubbleTime}>{fmtTime(msg.createdAt)}</Text>
    </View>
  </View>
);

// ── Pantalla principal ────────────────────────────────────────────────────────

export const ChatScreen = () => {
  const route      = useRoute<RouteProp<RouteParams, 'Chat'>>();
  const navigation = useNavigation();
  const { conversationId, otherUserName } = route.params;

  const { user } = useAuth();
  const myId       = Number((user as any)?.userId ?? 0);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [messages,   setMessages]   = useState<DirectMessage[]>([]);
  const [inputText,  setInputText]  = useState('');
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSending,  setIsSending]  = useState(false);
  const listRef = useRef<FlatList<DirectMessage>>(null);

  // ── Cargar historial ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const safeId = Number(conversationId);
      const data = await messagesApi.getHistory(safeId);
      // API devuelve oldest-first; invertir para que data[0] sea el más reciente
      // (FlatList inverted muestra data[0] en el fondo → mensaje más reciente abajo)
      setMessages([...data].reverse());
      void messagesApi.markAsRead(safeId);
    } catch {
      // Error silencioso — no bloquea la UI
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // ── Tiempo real: escuchar mensajes entrantes via WebSocket ──────────────────
  useEffect(() => {
    if (!socket) return;

    const safeConvId = Number(conversationId);

    const handleNewMessage = (payload: any) => {
      if (Number(payload?.conversationId) !== safeConvId) return;

      setMessages((prev) => {
        const incomingId = payload?.messageId ?? payload?.id;
        // Deduplicación: rechaza si ya existe (por id real o por rebote del propio emisor)
        if (prev.some((m) => m.id === incomingId)) return prev;

        const incoming: DirectMessage = {
          id:             incomingId,
          conversationId: safeConvId,
          senderId:       Number(payload.senderId),
          content:        payload.content ?? '',
          readAt:         null,
          createdAt:      payload.createdAt ?? new Date().toISOString(),
        };
        return [incoming, ...prev];
      });

      // Marcar como leído automáticamente si el mensaje es del otro participante
      if (Number(payload?.senderId) !== myId) {
        void messagesApi.markAsRead(safeConvId).catch(() => {});
      }
    };

    socket.on('chat_message', handleNewMessage);
    return () => { socket.off('chat_message', handleNewMessage); };
  }, [socket, conversationId, myId]);

  // ── Eliminar conversación ───────────────────────────────────────────────────
  const handleDeleteChat = () => {
    Alert.alert(
      'Eliminar Chat',
      '¿Eliminar el chat para ambos usuarios? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
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

  // ── Enviar mensaje ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

    const safeId = Number(conversationId);
    if (isNaN(safeId) || safeId <= 0) {
      Alert.alert('Error', 'ID de conversación inválido.');
      return;
    }

    // Actualización optimista: prepend porque el FlatList está invertido
    // (data[0] aparece en el fondo — el lugar donde el usuario espera ver su mensaje)
    const optimistic: DirectMessage = {
      id:             Date.now(),
      conversationId: safeId,
      senderId:       myId,
      content,
      readAt:         null,
      createdAt:      new Date().toISOString(),
    };
    setMessages((prev) => [optimistic, ...prev]);
    setInputText('');
    setIsSending(true);

    try {
      const saved = await messagesApi.sendMessage(safeId, content);
      setMessages((prev) => {
        // Reemplaza el optimista con el mensaje real y elimina duplicados que el
        // socket pudo haber insertado mientras el HTTP response estaba en vuelo.
        const replaced = prev.map((m) => (m.id === optimistic.id ? saved : m));
        const seen = new Set<number>();
        return replaced.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      });
      // Forzar refresco inmediato del inbox — evita esperar el staleTime de 30 s
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    } catch (err: any) {
      // Rollback: quitar el optimista y restaurar el texto
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(content);
      const raw = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
      const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);
      Alert.alert('Fallo en el servidor', msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={s.avatar}>
          <MaterialCommunityIcons name="account-circle-outline" size={34} color="#f05b22" />
        </View>
        <Text style={s.headerName} numberOfLines={1}>{otherUserName}</Text>
        <TouchableOpacity onPress={handleDeleteChat} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Cuerpo */}
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
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            inverted
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <MessageBubble msg={item} isMine={item.senderId === myId} />
            )}
          />
        )}

        {/* Compositor */}
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
    </SafeAreaView>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0A0A0A' },
  flex:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1C1C1E', gap: 10 },
  backBtn:       { padding: 4 },
  deleteBtn:     { padding: 6 },
  avatar:        { width: 38, height: 38, borderRadius: 19, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  headerName:    { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent:   { paddingHorizontal: 12, paddingVertical: 8 },
  bubbleRow:     { marginVertical: 4 },
  rowMine:       { alignItems: 'flex-end' },
  rowOther:      { alignItems: 'flex-start' },
  bubble:        { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 4 },
  bubbleMine:    { backgroundColor: '#f05b22', borderBottomRightRadius: 4 },
  bubbleOther:   { backgroundColor: '#1C1C1E', borderBottomLeftRadius: 4 },
  bubbleTextMine:  { color: '#fff', fontSize: 14 },
  bubbleTextOther: { color: '#E5E7EB', fontSize: 14 },
  bubbleTime:    { color: 'rgba(255,255,255,0.55)', fontSize: 10, alignSelf: 'flex-end' },
  composer:      { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#1C1C1E', gap: 10 },
  input:         { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: '#1C1C1E', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 },
  sendBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f05b22', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#3A3A3C' },
});
