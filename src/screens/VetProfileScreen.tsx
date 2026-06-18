import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { colors, radius, spacing, typography, shadow } from '../theme';

const HORARIOS_MOCK = [
  { label: '14 Jun', time: '10:00', slot: '14/06 - 10:00' },
  { label: '14 Jun', time: '14:30', slot: '14/06 - 14:30' },
  { label: '15 Jun', time: '09:00', slot: '15/06 - 09:00' },
];

export function VetProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const vet = route.params?.vet;

  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [meusPets, setMeusPets] = useState<any[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<any>(null);
  const [loadingPets, setLoadingPets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const buscarPets = async () => {
      if (!user) return;
      setLoadingPets(true);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const pets = snap.data().pets || [];
          setMeusPets(pets);
          if (pets.length > 0) setPetSelecionado(pets[0]);
        }
      } catch {
        console.error('Erro ao buscar pets');
      } finally {
        setLoadingPets(false);
      }
    };
    buscarPets();
  }, [user]);

  const abrirModal = () => {
    if (!horarioSelecionado) return Alert.alert('Atenção', 'Selecione um horário primeiro.');
    if (meusPets.length === 0) return Alert.alert('Atenção', 'Cadastre um pet no seu Perfil primeiro.');
    setModalVisible(true);
  };

  const confirmarAgendamento = async () => {
    if (!user || !petSelecionado) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'consultas'), {
        userId: user.uid,
        vetId: vet.id,
        vetName: vet.name,
        specialty: vet.specialty,
        date: horarioSelecionado?.split(' - ')[0],
        time: horarioSelecionado?.split(' - ')[1],
        petName: petSelecionado.nome,
        status: 'agendada',
        createdAt: new Date(),
      });
      setModalVisible(false);
      Alert.alert('Agendamento confirmado', `Sua consulta com ${vet.name} foi agendada.`, [
        { text: 'Ver consultas', onPress: () => navigation.navigate('Consultas') },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível agendar.');
    } finally {
      setSaving(false);
    }
  };

  if (!vet) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorText}>Perfil não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil do Veterinário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <Image source={{ uri: vet.avatar }} style={styles.avatar} />
          <Text style={styles.vetName}>{vet.name}</Text>
          <Text style={styles.vetSpecialty}>{vet.specialty}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F6A623" />
              <Text style={styles.ratingValue}>{vet.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.statDivider} />
            <Text style={styles.statText}>+10 anos de experiência</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.bioText}>
            Médico(a) veterinário(a) especializado(a) em {vet.specialty.toLowerCase()}, com foco no bem-estar animal e atendimento humanizado. Atende animais de pequeno e médio porte, oferecendo diagnóstico preciso e tratamento baseado em evidências.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horários disponíveis</Text>
          <View style={styles.slotsGrid}>
            {HORARIOS_MOCK.map((h) => {
              const isSelected = horarioSelecionado === h.slot;
              return (
                <TouchableOpacity
                  key={h.slot}
                  style={[styles.slot, isSelected && styles.slotSelected]}
                  onPress={() => setHorarioSelecionado(h.slot)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.slotDate, isSelected && styles.slotTextSelected]}>
                    {h.label}
                  </Text>
                  <Text style={[styles.slotTime, isSelected && styles.slotTextSelected]}>
                    {h.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scheduleBtn, !horarioSelecionado && styles.scheduleBtnDisabled]}
          onPress={abrirModal}
          activeOpacity={0.85}
          disabled={!horarioSelecionado}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.white} />
          <Text style={styles.scheduleBtnText}>Agendar Consulta</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Confirmar agendamento</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Data</Text>
                <Text style={styles.summaryValue}>{horarioSelecionado?.split(' - ')[0]}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Horário</Text>
                <Text style={styles.summaryValue}>{horarioSelecionado?.split(' - ')[1]}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Veterinário</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{vet.name.split(' ')[0]}</Text>
              </View>
            </View>

            <Text style={styles.modalSubtitle}>Selecionar pet</Text>

            {loadingPets ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: spacing.lg }} />
            ) : (
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                {meusPets.map((pet) => (
                  <TouchableOpacity
                    key={pet.nome}
                    style={[styles.petRow, petSelecionado?.nome === pet.nome && styles.petRowSelected]}
                    onPress={() => setPetSelecionado(pet)}
                  >
                    <View style={styles.petIconWrapper}>
                      <Ionicons name="paw" size={18} color={petSelecionado?.nome === pet.nome ? colors.accent : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.petName}>{pet.nome}</Text>
                      <Text style={styles.petDesc}>{pet.especie} • {pet.raca}</Text>
                    </View>
                    {petSelecionado?.nome === pet.nome && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
              onPress={confirmarAgendamento}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmBtnText}>Confirmar agendamento</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
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
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.accentLight,
  },
  vetName: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: 4,
  },
  vetSpecialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A6700',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },
  statText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  bioText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  slotsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  slot: {
    flex: 1,
    minWidth: 90,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  slotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  slotTime: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotTextSelected: {
    color: colors.white,
  },
  scheduleBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadow.sm,
  },
  scheduleBtnDisabled: {
    opacity: 0.4,
  },
  scheduleBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.label,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  petRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  petIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petName: {
    ...typography.body,
    fontWeight: '600',
  },
  petDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadow.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
