import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { colors, radius, spacing, typography, shadow } from '../theme';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  agendada: { label: 'Agendada', bg: colors.accentLight, text: colors.greenDark },
  realizada: { label: 'Realizada', bg: colors.primaryLight, text: colors.primary },
  cancelada: { label: 'Cancelada', bg: colors.dangerLight, text: colors.danger },
};

type Consulta = {
  id: string;
  vetName: string;
  specialty: string;
  petName: string;
  date: string;
  time: string;
  status: string;
};

export function ConsultasScreen() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'consultas'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data: Consulta[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Consulta));
      setConsultas(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const upcoming = consultas.filter((c) => c.status === 'agendada');
  const past = consultas.filter((c) => c.status !== 'agendada');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Consultas</Text>
        <Text style={styles.headerSub}>{upcoming.length} próxima{upcoming.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : consultas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
            <Text style={styles.emptyBody}>
              Acesse a aba de Veterinários para agendar uma consulta com um profissional.
            </Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Próximas</Text>
                {upcoming.map((c) => (
                  <ConsultaCard key={c.id} consulta={c} />
                ))}
              </View>
            )}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Histórico</Text>
                {past.map((c) => (
                  <ConsultaCard key={c.id} consulta={c} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConsultaCard({ consulta }: { consulta: Consulta }) {
  const statusCfg = STATUS_CONFIG[consulta.status] ?? STATUS_CONFIG.agendada;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardDateCol}>
        <Text style={styles.cardDay}>{consulta.date?.split('/')[0]}</Text>
        <Text style={styles.cardMonth}>
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][
            parseInt(consulta.date?.split('/')[1] ?? '1') - 1
          ]}
        </Text>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <Text style={styles.cardVetName}>{consulta.vetName}</Text>
        <Text style={styles.cardSpecialty}>{consulta.specialty}</Text>
        <View style={styles.cardMetaRow}>
          <View style={styles.cardMeta}>
            <Ionicons name="paw-outline" size={12} color={colors.textMuted} />
            <Text style={styles.cardMetaText}>{consulta.petName}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.cardMetaText}>{consulta.time}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
        <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
      </View>
    </TouchableOpacity>
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
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    minHeight: 300,
  },
  loadingState: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  cardDateCol: {
    width: 44,
    alignItems: 'center',
    flexShrink: 0,
  },
  cardDay: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 26,
  },
  cardMonth: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardVetName: {
    ...typography.body,
    fontWeight: '600',
  },
  cardSpecialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
