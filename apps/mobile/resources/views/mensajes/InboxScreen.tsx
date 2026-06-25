import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { messagesApi, Conversation } from '../../../app/Providers/messages/messages.api';
import { staffApi, StaffCatalogEntry } from '../../../app/Providers/staff/api/staff.api';
import { userApi, ClientSearchResult } from '../../../app/Providers/users/api/user.api';
import { useAuth } from '../../../app/Shared/hooks/useAuth';

type RootParamList = {
  Chat: { conversationId: number; otherUserName: string };
};
type Nav = NativeStackNavigationProp<RootParamList>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ENTRENADOR:    'Entrenador',
  NUTRICIONISTA: 'Nutricionista',
  INSTRUCTOR:    'Instructor',
  COORDINADOR:   'Coordinador',
};

const resolveOtherUser = (conv: Conversation, myId: number) =>
  conv.clientId === myId ? conv.trainer : conv.client;

const resolveFullName = (u: Conversation['client'] | Conversation['trainer']): string => {
  const first = u?.profile?.firstName ?? '';
  const last  = u?.profile?.lastName  ?? '';
  return [first, last].filter(Boolean).join(' ') || 'Usuario';
};

const resolveTrainerName = (entry: StaffCatalogEntry): string => {
  if (entry.fullName) return entry.fullName;
  if (entry.name) return entry.name;
  const first = (entry as any).profile?.firstName ?? (entry as any).firstName ?? '';
  const last  = (entry as any).profile?.lastName  ?? (entry as any).lastName  ?? '';
  return [first, last].filter(Boolean).join(' ') || '—';
};

// ── Tarjeta de conversación activa ────────────────────────────────────────────

const ConversationCard = ({
  conv,
  myId,
  onPress,
}: {
  conv:    Conversation;
  myId:    number;
  onPress: () => void;
}) => {
  const other    = resolveOtherUser(conv, myId);
  const name     = resolveFullName(other);
  const anyOther = other as any;
  const role     = anyOther?.role
    ? (ROLE_LABELS[String(anyOther.role).toUpperCase()] ?? String(anyOther.role))
    : null;
  const branch = anyOther?.gymName ?? anyOther?.branchName ?? null;
  const brand  = anyOther?.brandName ?? null;
  const subtitle = [role, branch, brand].filter(Boolean).join(' · ') || 'Chat activo';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.avatar}>
        <MaterialCommunityIcons name="account-circle-outline" size={40} color="#f05b22" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={1}>{name}</Text>
        <Text style={s.cardSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
    </TouchableOpacity>
  );
};

// ── Tarjeta de entrenador (modo búsqueda) ─────────────────────────────────────

const TrainerSearchCard = ({
  entry,
  loading,
  onPress,
}: {
  entry:   StaffCatalogEntry;
  loading: boolean;
  onPress: () => void;
}) => {
  const name   = resolveTrainerName(entry);
  const branch = (entry as any).branchName ?? (entry as any).gymName ?? (entry as any).gym?.name ?? null;
  const brand  = (entry as any).brandName  ?? (entry as any).gym?.parent?.name ?? null;
  const role   = ROLE_LABELS[((entry as any).role ?? '').toUpperCase()] ?? (entry as any).role ?? '—';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75} disabled={loading}>
      <View style={[s.avatar, s.avatarBlue]}>
        <MaterialCommunityIcons name="account-tie" size={26} color="#38BDF8" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={1}>{name}</Text>
        <View style={s.metaRow}>
          <MaterialCommunityIcons name="shield-star-outline" size={11} color="#38BDF8" />
          <Text style={s.cardSub}>{role}</Text>
          {branch && (
            <>
              <Text style={s.dot}>·</Text>
              <MaterialCommunityIcons name="dumbbell" size={11} color="#555" />
              <Text style={s.cardSub} numberOfLines={1}>{branch}</Text>
            </>
          )}
        </View>
        {brand && (
          <View style={s.metaRow}>
            <MaterialCommunityIcons name="office-building-outline" size={11} color="#444" />
            <Text style={s.cardSubMuted} numberOfLines={1}>{brand}</Text>
          </View>
        )}
      </View>
      {loading
        ? <ActivityIndicator size="small" color="#38BDF8" />
        : <MaterialCommunityIcons name="message-plus-outline" size={22} color="#38BDF8" />
      }
    </TouchableOpacity>
  );
};

// ── Tarjeta de cliente (modo búsqueda para entrenadores) ─────────────────────

const ClientSearchCard = ({
  client,
  loading,
  onPress,
}: {
  client:  ClientSearchResult;
  loading: boolean;
  onPress: () => void;
}) => {
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75} disabled={loading}>
      <View style={[s.avatar, s.avatarGreen]}>
        <MaterialCommunityIcons name="account" size={26} color="#22C55E" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={1}>{name}</Text>
        <View style={s.metaRow}>
          <MaterialCommunityIcons name="account-outline" size={11} color="#22C55E" />
          <Text style={s.cardSub}>Cliente</Text>
          <Text style={s.dot}>·</Text>
          <Text style={[s.cardSub, { color: '#444' }]} numberOfLines={1}>{client.email}</Text>
        </View>
      </View>
      {loading
        ? <ActivityIndicator size="small" color="#22C55E" />
        : <MaterialCommunityIcons name="message-plus-outline" size={22} color="#22C55E" />
      }
    </TouchableOpacity>
  );
};

// ── Pantalla principal ────────────────────────────────────────────────────────

export const InboxScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user }   = useAuth();
  const myId       = Number((user as any)?.userId ?? 0);
  const myLevel    = Number((user as any)?.level  ?? 0);

  // Staff (nivel 2-3: entrenadores, nutricionistas, instructores) busca clientes.
  // Clientes (nivel 1) buscan staff del catálogo.
  const isStaff = myLevel >= 2 && myLevel <= 3;

  const [searchQuery,  setSearchQuery]  = useState('');
  const [startingChat, setStartingChat] = useState<number | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const isSearching = searchQuery.length > 0;

  // ── Conversaciones activas ────────────────────────────────────────────────────
  const {
    data: conversations = [],
    isLoading: loadingInbox,
    isError: errorInbox,
    refetch: refetchInbox,
  } = useQuery<Conversation[]>({
    queryKey: ['inbox'],
    queryFn:  messagesApi.getInbox,
    staleTime: 30_000,
  });

  // ── Búsqueda: Staff → busca clientes (GET /api/users/chat/clients) ────────────
  const { data: clientResults = [], isLoading: loadingClients } = useQuery<ClientSearchResult[]>({
    queryKey: ['chat-search-clients', searchQuery],
    queryFn:  () => userApi.searchClients(searchQuery),
    staleTime: 60_000,
    enabled:  isSearching && isStaff,
  });

  // ── Búsqueda: Cliente → busca staff del catálogo ──────────────────────────────
  const { data: catalogRaw, isLoading: loadingCatalog } = useQuery({
    queryKey: ['staff-catalog-inbox'],
    queryFn:  () => staffApi.getCatalog({ limit: 100, offset: 0 }),
    staleTime: 5 * 60_000,
    enabled:  isSearching && !isStaff,
  });

  const catalog: StaffCatalogEntry[] = useMemo(
    () => Array.isArray((catalogRaw as any)?.data) ? (catalogRaw as any).data : [],
    [catalogRaw],
  );

  const filteredTrainers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || isStaff) return [];
    return catalog.filter(e => {
      const name   = resolveTrainerName(e).toLowerCase();
      const branch = ((e as any).branchName ?? (e as any).gymName ?? (e as any).gym?.name ?? '').toLowerCase();
      const brand  = ((e as any).brandName ?? (e as any).gym?.parent?.name ?? '').toLowerCase();
      const role   = ((e as any).role ?? '').toLowerCase();
      return name.includes(q) || branch.includes(q) || brand.includes(q) || role.includes(q);
    });
  }, [catalog, searchQuery, isStaff]);

  const loadingSearch = isStaff ? loadingClients : loadingCatalog;

  // ── Iniciar conversación ──────────────────────────────────────────────────────
  const handleStartChat = async (trainerId: number, trainerName: string) => {
    if (startingChat !== null) return;
    setStartingChat(trainerId);
    try {
      const conv = await messagesApi.startConversation(trainerId);
      setSearchQuery('');
      (navigation as any).navigate('Chat', { conversationId: conv.id, otherUserName: trainerName });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo iniciar la conversación.';
      Alert.alert('Error', msg);
    } finally {
      setStartingChat(null);
    }
  };

  const openChat = (conv: Conversation) => {
    const other = resolveOtherUser(conv, myId);
    (navigation as any).navigate('Chat', {
      conversationId: conv.id,
      otherUserName:  resolveFullName(other),
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchInbox();
    setRefreshing(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Mensajes</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color="#555" />
        <TextInput
          style={s.searchInput}
          placeholder={isStaff ? 'Buscar cliente...' : 'Buscar entrenador...'}
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {isSearching && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Modo búsqueda ── */}
      {isSearching ? (
        loadingSearch ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#f05b22" />
          </View>
        ) : isStaff ? (
          /* Entrenador buscando clientes */
          <FlatList
            data={clientResults}
            keyExtractor={(item) => `client-${item.id}`}
            contentContainerStyle={clientResults.length === 0 ? s.emptyContainer : s.listContent}
            ListEmptyComponent={
              <View style={s.centered}>
                <MaterialCommunityIcons name="account-search-outline" size={52} color="#3A3A3C" />
                <Text style={s.emptyText}>Sin clientes para "{searchQuery}"</Text>
              </View>
            }
            renderItem={({ item }) => (
              <ClientSearchCard
                client={item}
                loading={startingChat === item.id}
                onPress={() => {
                  const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email;
                  handleStartChat(item.id, name);
                }}
              />
            )}
          />
        ) : (
          /* Cliente buscando entrenadores */
          <FlatList
            data={filteredTrainers}
            keyExtractor={(item, i) => `trainer-${item.id}-${i}`}
            contentContainerStyle={filteredTrainers.length === 0 ? s.emptyContainer : s.listContent}
            ListEmptyComponent={
              <View style={s.centered}>
                <MaterialCommunityIcons name="account-search-outline" size={52} color="#3A3A3C" />
                <Text style={s.emptyText}>Sin resultados para "{searchQuery}"</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TrainerSearchCard
                entry={item}
                loading={startingChat === item.id}
                onPress={() => handleStartChat(item.id, resolveTrainerName(item))}
              />
            )}
          />
        )
      ) : /* ── Modo inbox ── */ loadingInbox ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#f05b22" />
        </View>
      ) : errorInbox ? (
        <View style={s.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={s.errorText}>No se pudo cargar los mensajes</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetchInbox()}>
            <Text style={s.retryLabel}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={conversations.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f05b22" />
          }
          ListEmptyComponent={
            <View style={s.centered}>
              <MaterialCommunityIcons name="message-outline" size={56} color="#3A3A3C" />
              <Text style={s.emptyText}>Sin conversaciones activas</Text>
              <Text style={s.emptyHint}>Usa el buscador para iniciar un chat</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationCard conv={item} myId={myId} onPress={() => openChat(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A0A0A' },
  header:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '700' },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1C1C1E', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2D' },
  searchInput:  { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 0 },

  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyContainer: { flex: 1 },
  listContent:    { paddingVertical: 4, paddingBottom: 120 },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 16, marginVertical: 5, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: '#1C1C1E' },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF5E0044' },
  avatarBlue:  { borderColor: '#38BDF844', backgroundColor: '#0a1929' },
  avatarGreen: { borderColor: '#22C55E44', backgroundColor: '#052e16' },
  cardBody:   { flex: 1, gap: 3 },
  cardName:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardSub:    { color: '#666', fontSize: 12 },
  cardSubMuted: { color: '#444', fontSize: 11 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  dot:        { color: '#444', fontSize: 12 },

  errorText:  { color: '#EF4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  emptyText:  { color: '#555', fontSize: 14, textAlign: 'center' },
  emptyHint:  { color: '#3A3A3C', fontSize: 12, textAlign: 'center' },
  retryBtn:   { paddingVertical: 10, paddingHorizontal: 28, backgroundColor: '#1C1C1E', borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  retryLabel: { color: '#f05b22', fontSize: 14, fontWeight: '600' },
});
