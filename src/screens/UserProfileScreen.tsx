import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { colors, radius, spacing, typography, shadow } from '../theme';

const ESPECIES = ['Cachorro', 'Gato'];
const RACAS_CACHORRO = [
  'SRD (Sem Raça Definida)', 'Poodle', 'Golden Retriever', 'Labrador', 'Shih Tzu',
  'Yorkshire', 'Pug', 'Bulldog Francês', 'Pastor Alemão', 'Beagle', 'Outra',
];
const RACAS_GATO = [
  'SRD (Sem Raça Definida)', 'Siamês', 'Persa', 'Maine Coon', 'Angorá',
  'Sphynx', 'Bengal', 'Ragdoll', 'British Shorthair', 'Outra',
];

export function UserProfileScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [settingsModal, setSettingsModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [petModal, setPetModal] = useState(false);
  const [pickerModal, setPickerModal] = useState(false);
  const [pickerType, setPickerType] = useState<'especie' | 'raca' | null>(null);

  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [nomePet, setNomePet] = useState('');
  const [especie, setEspecie] = useState('');
  const [raca, setRaca] = useState('');
  const [avatarTemp, setAvatarTemp] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setEditNome(data.tutor?.nome || '');
        setEditTelefone(data.tutor?.telefone || '');
      }
    } catch {
      console.error('Erro ao buscar perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserData(); }, [user]);

  const processarImagem = async (origem: 'camera' | 'galeria') => {
    const config: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    };
    let result;
    if (origem === 'camera') {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(config);
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync(config);
    }
    if (!result.canceled && result.assets[0].base64 && user) {
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateDoc(doc(db, 'users', user.uid), { avatarUri: base64Image });
        fetchUserData();
      } catch {
        Alert.alert('Erro', 'Falha ao salvar a foto.');
      }
    }
  };

  const handleMudarFoto = () => {
    Alert.alert('Foto de Perfil', 'Escolha uma opção:', [
      { text: 'Câmera', onPress: () => processarImagem('camera') },
      { text: 'Galeria', onPress: () => processarImagem('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSalvarPerfil = async () => {
    if (!editNome.trim()) return Alert.alert('Atenção', 'O nome não pode ficar vazio.');
    try {
      if (!user) return;
      await updateDoc(doc(db, 'users', user.uid), {
        'tutor.nome': editNome,
        'tutor.telefone': editTelefone,
      });
      setEditProfileModal(false);
      fetchUserData();
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar dados.');
    }
  };

  const abrirModalAdicionarPet = () => {
    setEditingPetId(null);
    setNomePet(''); setEspecie(''); setRaca(''); setAvatarTemp(null);
    setPetModal(true);
  };

  const abrirModalEditarPet = (pet: any) => {
    setEditingPetId(pet.id);
    setNomePet(pet.nome); setEspecie(pet.especie); setRaca(pet.raca); setAvatarTemp(pet.avatar || null);
    setPetModal(true);
  };

  const handleSalvarPet = async () => {
    if (!nomePet || !especie || !raca) return Alert.alert('Atenção', 'Preencha todos os campos.');
    try {
      if (!user) return;
      const petsAtuais = userData?.pets || [];
      let novosPets = [...petsAtuais];
      const fotoFinal = avatarTemp || '';
      if (editingPetId) {
        const idx = novosPets.findIndex((p: any) => p.id === editingPetId);
        if (idx > -1) novosPets[idx] = { ...novosPets[idx], nome: nomePet, especie, raca, avatar: fotoFinal };
      } else {
        novosPets.push({ id: Date.now().toString(), nome: nomePet, especie, raca, avatar: fotoFinal });
      }
      await updateDoc(doc(db, 'users', user.uid), { pets: novosPets });
      setPetModal(false);
      fetchUserData();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar o pet.');
    }
  };

  const handleExcluirPet = (petId: string) => {
    Alert.alert('Remover pet', 'Tem certeza que deseja remover este pet?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          const novosPets = (userData?.pets || []).filter((p: any) => p.id !== petId);
          await updateDoc(doc(db, 'users', user.uid), { pets: novosPets });
          fetchUserData();
        },
      },
    ]);
  };

  const abrirPicker = (tipo: 'especie' | 'raca') => {
    if (tipo === 'raca' && !especie) return Alert.alert('Atenção', 'Selecione a espécie primeiro.');
    setPickerType(tipo);
    setPickerModal(true);
  };

  const selecionarItemPicker = (item: string) => {
    if (pickerType === 'especie') {
      setEspecie(item);
      setRaca('');
      const isDog = item === 'Cachorro';
      setAvatarTemp(
        isDog
          ? `https://placedog.net/400/400?id=${Math.floor(Math.random() * 100)}`
          : `https://cataas.com/cat?width=400&height=400&v=${Math.random()}`
      );
    } else {
      setRaca(item);
    }
    setPickerModal(false);
  };

  const getOpcoesPicker = () =>
    pickerType === 'especie' ? ESPECIES : especie === 'Cachorro' ? RACAS_CACHORRO : RACAS_GATO;

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  const initials = userData?.tutor?.nome
    ? userData.tutor.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsModal(true)}>
          <Ionicons name="settings-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleMudarFoto} style={styles.avatarWrapper} activeOpacity={0.8}>
            {userData?.avatarUri ? (
              <Image source={{ uri: userData.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color={colors.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{userData?.tutor?.nome || 'Sem nome'}</Text>
            <TouchableOpacity onPress={() => setEditProfileModal(true)} style={styles.editBtn}>
              <Ionicons name="pencil" size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileEmail}>{userData?.email}</Text>
          {userData?.tutor?.telefone ? (
            <View style={styles.phoneBadge}>
              <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.phoneText}>{userData.tutor.telefone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Pets</Text>
          <TouchableOpacity style={styles.addPetBtn} onPress={abrirModalAdicionarPet}>
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.addPetText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {!userData?.pets?.length ? (
          <View style={styles.emptyPets}>
            <Ionicons name="paw-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyPetsText}>Nenhum pet cadastrado.</Text>
          </View>
        ) : (
          userData.pets.map((pet: any) => (
            <View key={pet.id} style={styles.petCard}>
              {pet.avatar ? (
                <Image source={{ uri: pet.avatar }} style={styles.petAvatar} />
              ) : (
                <View style={[styles.petAvatar, styles.petAvatarPlaceholder]}>
                  <Ionicons name="paw" size={20} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.nome}</Text>
                <Text style={styles.petDesc}>{pet.especie} • {pet.raca}</Text>
              </View>
              <View style={styles.petActions}>
                <TouchableOpacity style={styles.petActionBtn} onPress={() => abrirModalEditarPet(pet)}>
                  <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.petActionBtn} onPress={() => handleExcluirPet(pet.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Settings dropdown */}
      <Modal visible={settingsModal} transparent animationType="fade">
        <TouchableOpacity style={styles.settingsOverlay} activeOpacity={1} onPress={() => setSettingsModal(false)}>
          <View style={styles.settingsMenu}>
            <TouchableOpacity
              style={styles.settingsMenuItem}
              onPress={() => { setSettingsModal(false); signOut(auth); }}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.settingsMenuText}>Sair da conta</Text>
            </TouchableOpacity>
            <View style={styles.settingsMenuDivider} />
            <TouchableOpacity
              style={styles.settingsMenuItem}
              onPress={() => {
                setSettingsModal(false);
                Alert.alert('Excluir conta', 'Esta ação é irreversível. Deseja continuar?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                      try { if (auth.currentUser) await deleteUser(auth.currentUser); }
                      catch { Alert.alert('Erro', 'Faça login novamente para excluir a conta.'); }
                    },
                  },
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.settingsMenuText, { color: colors.danger }]}>Excluir conta</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit profile modal */}
      <Modal visible={editProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <TextInput
                style={inputStyle('editNome')}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
                value={editNome}
                onChangeText={setEditNome}
                onFocus={() => setFocusedField('editNome')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Telefone</Text>
              <TextInput
                style={inputStyle('editTel')}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.textMuted}
                value={editTelefone}
                onChangeText={setEditTelefone}
                keyboardType="numeric"
                onFocus={() => setFocusedField('editTel')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setEditProfileModal(false)}>
                <Text style={styles.ghostBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSalvarPerfil}>
                <Text style={styles.primaryBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pet modal */}
      <Modal visible={petModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalSheetScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{editingPetId ? 'Editar pet' : 'Novo pet'}</Text>

              <View style={styles.petPreviewRow}>
                {avatarTemp ? (
                  <Image source={{ uri: avatarTemp }} style={styles.petPreviewImg} />
                ) : (
                  <View style={[styles.petPreviewImg, styles.petPreviewPlaceholder]}>
                    <Ionicons name="paw-outline" size={28} color={colors.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nome do pet</Text>
                <TextInput
                  style={inputStyle('petNome')}
                  placeholder="Como ele se chama?"
                  placeholderTextColor={colors.textMuted}
                  value={nomePet}
                  onChangeText={setNomePet}
                  onFocus={() => setFocusedField('petNome')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Espécie</Text>
                <TouchableOpacity style={[styles.input, styles.selectBtn]} onPress={() => abrirPicker('especie')}>
                  <Text style={especie ? styles.selectValue : styles.selectPlaceholder}>
                    {especie || 'Selecionar espécie'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Raça</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectBtn, !especie && styles.inputDisabled]}
                  onPress={() => abrirPicker('raca')}
                >
                  <Text style={raca ? styles.selectValue : styles.selectPlaceholder}>
                    {raca || 'Selecionar raça'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => setPetModal(false)}>
                  <Text style={styles.ghostBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSalvarPet}>
                  <Text style={styles.primaryBtnText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Picker modal */}
      <Modal visible={pickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {pickerType === 'especie' ? 'Selecionar espécie' : 'Selecionar raça'}
            </Text>
            <FlatList
              data={getOpcoesPicker()}
              keyExtractor={(item) => item}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => selecionarItemPicker(item)}>
                  <Text style={styles.pickerItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelPickerBtn} onPress={() => setPickerModal(false)}>
              <Text style={styles.cancelPickerText}>Cancelar</Text>
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
  loadingContainer: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.accentLight,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  profileName: {
    ...typography.h3,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  phoneText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  addPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  addPetText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  emptyPets: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  emptyPetsText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  petCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  petAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    ...typography.body,
    fontWeight: '600',
  },
  petDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  petActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  petActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: spacing.lg,
  },
  settingsMenu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: 200,
    ...shadow.md,
    overflow: 'hidden',
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  settingsMenuText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingsMenuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheetScroll: {
    justifyContent: 'flex-end',
    flexGrow: 1,
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
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  petPreviewRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  petPreviewImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  petPreviewPlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  fieldGroup: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
  },
  input: {
    backgroundColor: colors.inputBg,
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
    opacity: 0.45,
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
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  ghostBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  ghostBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cancelPickerBtn: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  cancelPickerText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '500',
  },
});
