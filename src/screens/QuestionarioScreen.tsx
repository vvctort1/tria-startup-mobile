import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { colors, radius, spacing, typography, shadow } from '../theme';

const ESPECIES = ['Cachorro', 'Gato'];
const RACAS_CACHORRO = ['SRD', 'Poodle', 'Golden Retriever', 'Shih Tzu', 'Pug', 'Outra'];
const RACAS_GATO = ['SRD', 'Siamês', 'Persa', 'Angorá', 'Outra'];

const STEPS = ['Sobre você', 'Seu pet', 'Termos'];

export function QuestionarioScreen() {
  const { user, setHasCompletedQuestionnaire } = useAuth();
  const [step, setStep] = useState(1);

  const [nomeTutor, setNomeTutor] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomePet, setNomePet] = useState('');
  const [especie, setEspecie] = useState('');
  const [raca, setRaca] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState<'especie' | 'raca' | null>(null);

  const handleTelefoneChange = (texto: string) => {
    let numeros = texto.replace(/\D/g, '');
    if (numeros.length > 11) numeros = numeros.slice(0, 11);
    setTelefone(numeros);
  };

  const handleAvancarParaPet = () => {
    if (!nomeTutor.trim()) return Alert.alert('Atenção', 'Preencha seu nome.');
    if (telefone.length < 10) return Alert.alert('Atenção', 'Telefone inválido.');
    setStep(2);
  };

  const handleFinalizar = async () => {
    if (!user) return;
    if (!nomePet.trim() || !especie.trim() || !raca.trim())
      return Alert.alert('Atenção', 'Preencha os dados do pet.');
    if (!aceitouTermos) return Alert.alert('Atenção', 'Aceite os termos para continuar.');
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          tutor: { nome: nomeTutor, telefone },
          pets: [{ nome: nomePet, especie, raca }],
          termosAceitos: true,
          hasCompletedQuestionnaire: true,
        },
        { merge: true }
      );
      setHasCompletedQuestionnaire(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
    }
  };

  const abrirModal = (tipo: 'especie' | 'raca') => {
    if (tipo === 'raca' && !especie)
      return Alert.alert('Atenção', 'Selecione a espécie primeiro.');
    setTipoSelecao(tipo);
    setModalVisible(true);
  };

  const selecionarItem = (item: string) => {
    if (tipoSelecao === 'especie') {
      setEspecie(item);
      setRaca('');
    } else {
      setRaca(item);
    }
    setModalVisible(false);
  };

  const getOpcoes = () =>
    tipoSelecao === 'especie'
      ? ESPECIES
      : especie === 'Cachorro'
      ? RACAS_CACHORRO
      : RACAS_GATO;

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completar Perfil</Text>
        <Text style={styles.headerSub}>Passo {step} de {STEPS.length}</Text>
      </View>

      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < step ? styles.progressDone : styles.progressPending,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepLabel}>{STEPS[step - 1]}</Text>

        {step === 1 && (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <TextInput
                style={inputStyle('nome')}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
                value={nomeTutor}
                onChangeText={setNomeTutor}
                onFocus={() => setFocusedField('nome')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Telefone</Text>
              <TextInput
                style={inputStyle('tel')}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
                value={telefone}
                onChangeText={handleTelefoneChange}
                onFocus={() => setFocusedField('tel')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAvancarParaPet} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Próximo</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome do pet</Text>
              <TextInput
                style={inputStyle('pet')}
                placeholder="Como ele se chama?"
                placeholderTextColor={colors.textMuted}
                value={nomePet}
                onChangeText={setNomePet}
                onFocus={() => setFocusedField('pet')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Espécie</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectBtn]}
                onPress={() => abrirModal('especie')}
              >
                <Text style={especie ? styles.selectValue : styles.selectPlaceholder}>
                  {especie || 'Selecionar espécie'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Raça</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectBtn, !especie && styles.inputDisabled]}
                onPress={() => abrirModal('raca')}
              >
                <Text style={raca ? styles.selectValue : styles.selectPlaceholder}>
                  {raca || 'Selecionar raça'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setStep(1)}>
                <Text style={styles.ghostBtnText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => {
                if (!nomePet.trim() || !especie || !raca)
                  return Alert.alert('Atenção', 'Preencha os dados do pet.');
                setStep(3);
              }}>
                <Text style={styles.primaryBtnText}>Próximo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.form}>
            <View style={styles.termsCard}>
              <Text style={styles.termsTitle}>Termos de Uso e Privacidade</Text>
              <Text style={styles.termsBody}>
                O TRIA oferece suporte preliminar de triagem veterinária com inteligência artificial. As avaliações geradas pela plataforma não substituem o diagnóstico de um médico veterinário habilitado.{'\n\n'}Ao continuar, você autoriza o uso dos dados fornecidos para melhorar a experiência clínica dentro da plataforma.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.termsToggle}
              onPress={() => setAceitouTermos(!aceitouTermos)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
                {aceitouTermos && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsToggleText}>
                Li e concordo com os Termos de Uso e Política de Privacidade
              </Text>
            </TouchableOpacity>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setStep(2)}>
                <Text style={styles.ghostBtnText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }, !aceitouTermos && styles.primaryBtnDisabled]}
                onPress={handleFinalizar}
                disabled={!aceitouTermos}
              >
                <Text style={styles.primaryBtnText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {tipoSelecao === 'especie' ? 'Selecionar espécie' : 'Selecionar raça'}
            </Text>
            <FlatList
              data={getOpcoes()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selecionarItem(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  headerSub: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.7,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressDone: {
    backgroundColor: colors.accent,
  },
  progressPending: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stepLabel: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.sm,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadow.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  ghostBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ghostBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  termsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    ...shadow.sm,
    marginBottom: spacing.md,
  },
  termsTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  termsBody: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  termsToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  termsToggleText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
    color: colors.textPrimary,
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
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalCancelBtn: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '500',
  },
});
