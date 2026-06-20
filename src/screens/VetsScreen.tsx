import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme';

const MOCK_VETS = [
  { id: '1', name: 'Dra. Ana Silva', specialty: 'Clínica Geral', rating: 4.8, reviews: 142, avatar: 'https://randomuser.me/api/portraits/women/44.jpg', available: true },
  { id: '2', name: 'Dr. Carlos Santos', specialty: 'Dermatologia', rating: 4.5, reviews: 98, avatar: 'https://randomuser.me/api/portraits/men/32.jpg', available: true },
  { id: '3', name: 'Dra. Beatriz Costa', specialty: 'Ortopedia', rating: 3.8, reviews: 61, avatar: 'https://randomuser.me/api/portraits/women/68.jpg', available: false },
  { id: '4', name: 'Dr. Fernando Lima', specialty: 'Clínica Geral', rating: 4.2, reviews: 77, avatar: 'https://randomuser.me/api/portraits/men/46.jpg', available: true },
  { id: '5', name: 'Dra. Mariana Alves', specialty: 'Cardiologia', rating: 4.9, reviews: 203, avatar: 'https://randomuser.me/api/portraits/women/12.jpg', available: true },
  { id: '6', name: 'Dr. Ricardo Gomes', specialty: 'Comportamento', rating: 3.6, reviews: 44, avatar: 'https://randomuser.me/api/portraits/men/22.jpg', available: false },
  { id: '7', name: 'Dra. Paula Nunes', specialty: 'Nutrição', rating: 4.7, reviews: 119, avatar: 'https://randomuser.me/api/portraits/women/33.jpg', available: true },
];

const TAGS = ['Todos', 'Clínica Geral', 'Dermatologia', 'Ortopedia', 'Cardiologia', 'Nutrição', 'Comportamento'];

function StarRating({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name="star" size={12} color="#F6A623" />
      <Text style={ratingStyles.value}>{value.toFixed(1)}</Text>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  value: { fontSize: 13, fontWeight: '600', color: '#0D3B5E' },
});

export function VetsScreen() {
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState('Todos');

  const filtered = MOCK_VETS.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(searchText.toLowerCase()) ||
      v.specialty.toLowerCase().includes(searchText.toLowerCase());
    const matchTag = selectedTag === 'Todos' || v.specialty === selectedTag;
    return matchSearch && matchTag;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Veterinários</Text>
        <Text style={styles.headerSub}>{filtered.length} profissionais disponíveis</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou especialidade..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScroll}
        >
          <View style={styles.tagsRow}>
            {TAGS.map((tag, index) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedTag === tag && styles.tagActive,
                  index === 0 && { marginLeft: spacing.lg },
                  index < TAGS.length - 1 ? { marginRight: spacing.sm } : null,
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={[styles.tagText, selectedTag === tag && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum veterinário encontrado.</Text>
            </View>
          ) : (
            filtered.map((vet) => (
              <TouchableOpacity
                key={vet.id}
                style={styles.card}
                onPress={() => navigation.navigate('VetProfile', { vet })}
                activeOpacity={0.85}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: vet.avatar }} style={styles.avatar} />
                    {vet.available && <View style={styles.availableBadge} />}
                  </View>
                  <View style={styles.vetInfo}>
                    <Text style={styles.vetName}>{vet.name}</Text>
                    <Text style={styles.vetSpecialty}>{vet.specialty}</Text>
                    <View style={styles.metaRow}>
                      <StarRating value={vet.rating} />
                      <Text style={styles.reviewCount}>({vet.reviews})</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.availTag, vet.available ? styles.availTagOn : styles.availTagOff]}>
                    <Text style={[styles.availTagText, vet.available ? styles.availTagTextOn : styles.availTagTextOff]}>
                      {vet.available ? 'Disponível' : 'Ocupado'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginTop: 8 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
  },
  headerSub: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.7,
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 48,
    gap: spacing.sm,
    ...shadow.sm,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  tagsScroll: {
    flexGrow: 0,
    marginBottom: spacing.xs,
    height: 30,
  },
  tagsRow: {
    flexDirection: 'row',
    paddingRight: spacing.xl,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tagTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.border,
  },
  availableBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  vetInfo: {
    flex: 1,
    gap: 3,
  },
  vetName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vetSpecialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  availTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  availTagOn: {
    backgroundColor: colors.accentLight,
  },
  availTagOff: {
    backgroundColor: colors.background,
  },
  availTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availTagTextOn: {
    color: colors.greenDark,
  },
  availTagTextOff: {
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
