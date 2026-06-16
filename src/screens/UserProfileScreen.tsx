import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Modal, TextInput, Alert, ActivityIndicator, FlatList 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';

const ESPECIES = ['Cachorro', 'Gato'];
const RACAS_CACHORRO = [
  'SRD (Sem Raça Definida)', 'Poodle', 'Golden Retriever', 'Labrador', 'Shih Tzu', 
  'Yorkshire', 'Pug', 'Bulldog Francês', 'Bulldog Inglês', 'Spitz Alemão', 
  'Pastor Alemão', 'Beagle', 'Dachshund (Salsicha)', 'Chihuahua', 'Border Collie', 
  'Pinscher', 'Pitbull', 'Rottweiler', 'Boxer', 'Cocker Spaniel', 'Outra'
];
const RACAS_GATO = [
  'SRD (Sem Raça Definida)', 'Siamês', 'Persa', 'Maine Coon', 'Angorá', 
  'Sphynx', 'Bengal', 'Ragdoll', 'British Shorthair', 'Himalaia', 'Outra'
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

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setEditNome(data.tutor?.nome || '');
        setEditTelefone(data.tutor?.telefone || '');
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserData(); }, [user]);

  const handleMudarFoto = () => {
    Alert.alert('Foto de Perfil', 'Escolha uma opção:', [
      { text: 'Câmera', onPress: () => processarImagem('camera') },
      { text: 'Galeria', onPress: () => processarImagem('galeria') },
      { text: 'Cancelar', style: 'cancel' }
    ]);
  };

  const processarImagem = async (origem: 'camera' | 'galeria') => {
    let result;
    const config: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true
    };

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
      } catch (error) {
        Alert.alert('Erro', 'Falha ao salvar a foto.');
      }
    }
  };

  const handleSalvarPerfil = async () => {
    if (!editNome.trim()) return Alert.alert('Atenção', 'O nome não pode ficar vazio.');
    try {
      if (!user) return;
      await updateDoc(doc(db, 'users', user.uid), {
        'tutor.nome': editNome,
        'tutor.telefone': editTelefone
      });
      setEditProfileModal(false);
      fetchUserData();
    } catch (error) {
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
    setNomePet(pet.nome); setEspecie(pet.especie); setRaca(pet.raca); setAvatarTemp(pet.avatar);
    setPetModal(true);
  };

  const handleSalvarPet = async () => {
    if (!nomePet || !especie || !raca) return Alert.alert('Atenção', 'Preencha todos os campos do pet.');
    try {
      if (!user) return;
      
      const petsAtuais = userData?.pets || [];
      let novosPets = [...petsAtuais];
      
      const fotoFinal = avatarTemp || 'https://via.placeholder.com/150';

      if (editingPetId) {
        const petIndex = novosPets.findIndex((p: any) => p.id === editingPetId);
        if (petIndex > -1) {
          novosPets[petIndex] = { ...novosPets[petIndex], nome: nomePet, especie, raca, avatar: fotoFinal };
        }
      } else {
        novosPets.push({
          id: Date.now().toString(),
          nome: nomePet, especie, raca, avatar: fotoFinal
        });
      }

      await updateDoc(doc(db, 'users', user.uid), { pets: novosPets });
      setPetModal(false);
      fetchUserData();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar o pet.');
    }
  };

  const handleExcluirPet = async (petId: string) => {
    Alert.alert('Excluir Pet', 'Tem certeza que deseja remover este pet?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          if (!user) return;
          const novosPets = (userData?.pets || []).filter((p: any) => p.id !== petId);
          await updateDoc(doc(db, 'users', user.uid), { pets: novosPets });
          fetchUserData();
        }
      }
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
      
      // Gera a foto imediatamente após a seleção da espécie
      const isDog = item === 'Cachorro';
      const fotoAleatoria = isDog ? `https://placedog.net/400/400?id=${Math.floor(Math.random() * 100)}` : `https://cataas.com/cat?width=400&height=400&v=${Math.random()}`;
      setAvatarTemp(fotoAleatoria);
      
    } else {
      setRaca(item);
    }
    setPickerModal(false);
  };

  const getOpcoesPicker = () => {
    if (pickerType === 'especie') return ESPECIES;
    return especie === 'Cachorro' ? RACAS_CACHORRO : RACAS_GATO;
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={() => setSettingsModal(true)}>
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={handleMudarFoto} style={styles.avatarContainer}>
            {userData?.avatarUri ? (
              <Image source={{ uri: userData.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={{ fontSize: 40 }}>👤</Text></View>
            )}
            <View style={styles.cameraIconBadge}><Text style={{ fontSize: 12 }}>📷</Text></View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.userName}>{userData?.tutor?.nome}</Text>
            <TouchableOpacity onPress={() => setEditProfileModal(true)}>
              <Text>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userEmail}>{userData?.email}</Text>
          <Text style={styles.userPhone}>{userData?.tutor?.telefone}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Pets</Text>
          <TouchableOpacity onPress={abrirModalAdicionarPet} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {userData?.pets?.length > 0 ? (
          userData.pets.map((pet: any) => (
            <View key={pet.id} style={styles.petCard}>
              <Image source={{ uri: pet.avatar }} style={styles.petAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{pet.nome}</Text>
                <Text style={styles.petDesc}>{pet.especie} • {pet.raca}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <TouchableOpacity onPress={() => abrirModalEditarPet(pet)}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleExcluirPet(pet.id)}><Text>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>Nenhum pet cadastrado.</Text>
        )}
      </ScrollView>

      <Modal visible={settingsModal} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSettingsModal(false)}>
          <View style={styles.settingsMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => signOut(auth)}>
              <Text style={styles.menuItemText}>Sair da Conta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={async () => {
              try { if (auth.currentUser) await deleteUser(auth.currentUser); } 
              catch { Alert.alert('Erro', 'Faça login novamente para excluir a conta.'); }
            }}>
              <Text style={[styles.menuItemText, { color: 'red' }]}>Excluir Conta</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={editProfileModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={styles.formContainer}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TextInput style={styles.input} placeholder="Seu Nome" value={editNome} onChangeText={setEditNome} />
            <TextInput style={styles.input} placeholder="Telefone" value={editTelefone} onChangeText={setEditTelefone} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#ccc' }]} onPress={() => setEditProfileModal(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={handleSalvarPerfil}><Text style={{ color: '#fff' }}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={petModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={styles.formContainer}>
            <Text style={styles.modalTitle}>{editingPetId ? 'Editar Pet' : 'Novo Pet'}</Text>
            
            <View style={styles.previewImageContainer}>
              {avatarTemp ? (
                <Image source={{ uri: avatarTemp }} style={styles.previewAvatar} />
              ) : (
                <View style={[styles.previewAvatar, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 30 }}>🐾</Text>
                </View>
              )}
            </View>

            <TextInput style={styles.input} placeholder="Nome do Pet" value={nomePet} onChangeText={setNomePet} />
            
            <TouchableOpacity style={styles.input} onPress={() => abrirPicker('especie')}>
              <Text>{especie || 'Selecionar Espécie'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.input} onPress={() => abrirPicker('raca')}>
              <Text>{raca || 'Selecionar Raça'}</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#ccc' }]} onPress={() => setPetModal(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={handleSalvarPet}><Text style={{ color: '#fff' }}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={pickerModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlayFull}>
          <View style={styles.pickerContainer}>
            <Text style={styles.modalTitle}>Selecione</Text>
            <FlatList
              data={getOpcoesPicker()}
              keyExtractor={(item) => item}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => selecionarItemPicker(item)}>
                  <Text style={styles.pickerItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={{ padding: 15, marginTop: 10 }} onPress={() => setPickerModal(false)}>
              <Text style={{ textAlign: 'center', color: 'red' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
},
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
},
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#002244' 
},
  content: { 
    padding: 20 
},
  userInfo: { 
    alignItems: 'center', 
    marginBottom: 30, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10, 
    elevation: 1 
},
  avatarContainer: { 
    position: 'relative', 
    marginBottom: 15 
},
  avatarImage: { 
    width: 90, 
    height: 90, 
    borderRadius: 45 
},
  avatarPlaceholder: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#eee', 
    justifyContent: 'center', 
    alignItems: 'center' 
},
  cameraIconBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    width: 30, 
    height: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#ddd' 
},
  userName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
},
  userEmail: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 2 
},
  userPhone: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 2 
},
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
},
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#002244' 
},
  addBtn: { 
    backgroundColor: '#eef2ff', 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    borderRadius: 20 
},
  addBtnText: { 
    color: '#6666ff', 
    fontWeight: 'bold' 
},
  petCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    elevation: 1 
},
  petAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25,
     marginRight: 15, 
     backgroundColor: '#eee' 
    },
  petName: { 
    fontSize: 16, 
    fontWeight: 'bold' 
},
  petDesc: { 
    fontSize: 14, 
    color: '#666' 
},
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    justifyContent: 'flex-start', 
    alignItems: 'flex-end', 
    padding: 20, 
    paddingTop: 80
},
  settingsMenu: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    width: 200, 
    elevation: 5 
},
  menuItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
},
  menuItemText: { 
    fontSize: 16, 
    color: '#333' 
},

  modalOverlayFull: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
},
  formContainer: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10 
},
  previewImageContainer: { 
    alignItems: 'center', 
    marginBottom: 20 
},
  previewAvatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40 
},
  pickerContainer: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10 
},
  pickerItem: { 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
},
  pickerItemText: { 
    fontSize: 16, 
    textAlign: 'center' 
},
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
},
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 15, 
    marginBottom: 10, 
    backgroundColor: '#fff', 
    justifyContent: 'center' 
},
  btn: { 
    flex: 1, 
    padding: 15, 
    alignItems: 'center', 
    borderRadius: 8, 
    backgroundColor: '#6666ff'
}
});