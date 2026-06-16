import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';

const HORARIOS_MOCK = ['14/06 - 10:00', '14/06 - 14:30', '15/06 - 09:00'];

export function VetProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  
  const vet = route.params?.vet;

  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Novos estados para os pets reais
  const [meusPets, setMeusPets] = useState<any[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<any>(null);
  const [loadingPets, setLoadingPets] = useState(false);

  // Busca os pets do usuário no Firestore quando ele abre o perfil do veterinário
  useEffect(() => {
    const buscarPetsDoUsuario = async () => {
      if (!user) return;
      setLoadingPets(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const petsArray = docSnap.data().pets || [];
          setMeusPets(petsArray);
          if (petsArray.length > 0) {
            setPetSelecionado(petsArray[0]); // Seleciona o primeiro pet por padrão
          }
        }
      } catch (error) {
        console.error("Erro ao buscar pets:", error);
      } finally {
        setLoadingPets(false);
      }
    };

    buscarPetsDoUsuario();
  }, [user]);

  const abrirModal = () => {
    if (!horarioSelecionado) return Alert.alert('Atenção', 'Selecione um horário primeiro.');
    if (meusPets.length === 0) return Alert.alert('Atenção', 'Você precisa cadastrar um pet no seu Perfil primeiro.');
    setModalVisible(true);
  };

  const confirmarAgendamento = async () => {
    try {
      if (!user || !petSelecionado) return;
      
      await addDoc(collection(db, 'consultas'), {
        userId: user.uid,
        vetId: vet.id,
        vetName: vet.name,
        specialty: vet.specialty,
        date: horarioSelecionado?.split(' - ')[0],
        time: horarioSelecionado?.split(' - ')[1],
        petName: petSelecionado.nome,
        status: 'agendada',
        createdAt: new Date()
      });

      setModalVisible(false);
      Alert.alert('Sucesso', 'Consulta agendada com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Consultas') }
      ]);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível agendar.');
    }
  };

  if (!vet) return <View style={styles.container}><Text>Erro ao carregar perfil.</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Logo TRIA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: vet.avatar }} style={styles.avatarGrande} />
          <Text style={styles.vetName}>{vet.name}</Text>
          <Text style={styles.vetSpecialty}>{vet.specialty} • ⭐ {vet.rating.toFixed(1)}</Text>
        </View>

        <Text style={styles.bio}>
          Médico(a) veterinário(a) especializado(a) em oferecer o melhor cuidado para o seu pet. Experiência de mais de 10 anos na área clínica e cirúrgica.
        </Text>

        <Text style={styles.sectionTitle}>Horários de Atendimento</Text>
        <View style={styles.horariosContainer}>
          {HORARIOS_MOCK.map((horario) => (
            <TouchableOpacity 
              key={horario} 
              style={[styles.horarioBtn, horarioSelecionado === horario && styles.horarioBtnSelected]}
              onPress={() => setHorarioSelecionado(horario)}
            >
              <Text style={horarioSelecionado === horario ? styles.horarioTextSelected : styles.horarioText}>
                {horario}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.agendarBtn} onPress={abrirModal}>
          <Text style={styles.agendarBtnText}>📅 Agendar Consulta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CONFIRMAÇÃO */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIcon}>
              <Text style={{ fontSize: 20 }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalResumoHeader}>
              <View style={styles.modalResumoBox}>
                <Text style={styles.modalResumoLabel}>Data</Text>
                <Text style={styles.modalResumoValor}>{horarioSelecionado?.split(' - ')[0]}</Text>
              </View>
              <View style={styles.modalResumoBox}>
                <Text style={styles.modalResumoLabel}>Horário</Text>
                <Text style={styles.modalResumoValor}>{horarioSelecionado?.split(' - ')[1]}</Text>
              </View>
            </View>

            <Text style={styles.modalTitle}>Selecionar Pet</Text>
            
            {loadingPets ? (
              <ActivityIndicator size="large" color="#6666ff" />
            ) : (
              <ScrollView style={{ maxHeight: 200 }}>
                {meusPets.map((pet) => (
                  <TouchableOpacity 
                    key={pet.nome} // Usando o nome como chave primária simplificada
                    style={[styles.petCard, petSelecionado?.nome === pet.nome && styles.petCardSelected]}
                    onPress={() => setPetSelecionado(pet)}
                  >
                    <Image source={{ uri: pet.avatar || 'https://via.placeholder.com/150' }} style={styles.petIconReal} />
                    <View>
                      <Text style={styles.petName}>{pet.nome}</Text>
                      <Text style={styles.petDesc}>{pet.especie}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmarAgendamento}>
              <Text style={styles.confirmBtnText}>Confirmar Agendamento</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 70,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backButton: {
    paddingRight: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGrande: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  vetName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002244',
  },
  vetSpecialty: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  bio: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  horariosContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  horarioBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  horarioBtnSelected: {
    backgroundColor: '#002244',
    borderColor: '#002244',
  },
  horarioText: {
    fontSize: 16,
    color: '#333',
  },
  horarioTextSelected: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  agendarBtn: {
    backgroundColor: '#6666ff',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  agendarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  closeIcon: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 5,
  },
  modalResumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  modalResumoBox: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalResumoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  modalResumoValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002244',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  petCardSelected: {
    borderColor: '#6666ff',
    backgroundColor: '#eef2ff',
  },
  petIconReal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#ccc',
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  petDesc: {
    fontSize: 14,
    color: '#666',
  },
  confirmBtn: {
    backgroundColor: '#6666ff',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});