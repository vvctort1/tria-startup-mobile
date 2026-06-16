import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Modal, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const ESPECIES = ['Cachorro', 'Gato'];
const RACAS_CACHORRO = ['SRD', 'Poodle', 'Golden Retriever', 'Shih Tzu', 'Pug', 'Outra'];
const RACAS_GATO = ['SRD', 'Siamês', 'Persa', 'Angorá', 'Outra'];

export function QuestionarioScreen() {
  const { user, setHasCompletedQuestionnaire } = useAuth();
  const [step, setStep] = useState(1);

  const [nomeTutor, setNomeTutor] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomePet, setNomePet] = useState('');
  const [especie, setEspecie] = useState(''); 
  const [raca, setRaca] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);

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
    if (!nomePet.trim() || !especie.trim() || !raca.trim()) return Alert.alert('Atenção', 'Preencha os dados do pet.');
    if (!aceitouTermos) return Alert.alert('Atenção', 'Aceite os termos.');

    try {
      console.log("1. Tentando salvar no Firebase...");
      
      const userRef = doc(db, 'users', user.uid);
      
      await setDoc(userRef, {
        tutor: { nome: nomeTutor, telefone },
        pets: [{ nome: nomePet, especie, raca }],
        termosAceitos: true,
        hasCompletedQuestionnaire: true,
      }, { merge: true });

      console.log("2. Salvo com sucesso! Alterando a tela...");
      setHasCompletedQuestionnaire(true);
      
    } catch (error) {
      console.error("Erro no Firebase:", error);
      Alert.alert('Erro', 'Não foi possível salvar os dados. Verifique a consola.');
    }
  };

  const abrirModalEspecie = () => {
    setTipoSelecao('especie');
    setModalVisible(true);
  };

  const abrirModalRaca = () => {
    if (!especie) return Alert.alert('Atenção', 'Selecione a espécie primeiro.');
    setTipoSelecao('raca');
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

  const getOpcoesModal = () => tipoSelecao === 'especie' ? ESPECIES : (especie === 'Cachorro' ? RACAS_CACHORRO : RACAS_GATO);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.centerContent} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 20, marginBottom: 20 }}>Complete seu Perfil</Text>

        {step === 1 && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ marginBottom: 10 }}>1. Sobre Você</Text>
            <TextInput style={styles.input} placeholder="Nome Completo" value={nomeTutor} onChangeText={setNomeTutor} />
            <TextInput style={styles.input} placeholder="Telefone (apenas números)" keyboardType="numeric" maxLength={11} value={telefone} onChangeText={handleTelefoneChange} />
            <TouchableOpacity onPress={handleAvancarParaPet} style={{ padding: 10 }}><Text>Próximo</Text></TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ marginBottom: 10 }}>2. Sobre seu Pet</Text>
            <TextInput style={styles.input} placeholder="Nome do Pet" value={nomePet} onChangeText={setNomePet} />
            <TouchableOpacity onPress={abrirModalEspecie} style={styles.input}>
              <Text>{especie || 'Selecione a Espécie'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={abrirModalRaca} style={styles.input}>
              <Text>{raca || 'Selecione a Raça'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
              <TouchableOpacity onPress={() => setStep(1)}><Text>Voltar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(3)}><Text>Próximo</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ marginBottom: 10 }}>3. Termos de Uso</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Switch value={aceitouTermos} onValueChange={setAceitouTermos} />
              <Text style={{ marginLeft: 10 }}>Eu concordo com os Termos</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <TouchableOpacity onPress={() => setStep(2)}><Text>Voltar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleFinalizar}><Text>Finalizar</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, width: '80%', borderRadius: 10 }}>
            <FlatList
              data={getOpcoesModal()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selecionarItem(item)} style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee' }}>
                  <Text style={{ textAlign: 'center' }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 15, marginTop: 10 }}>
              <Text style={{ textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  centerContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  input: {
    borderWidth: 1, 
    borderColor: '#ccc', 
    width: '100%', 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5, 
    textAlign: 'center' 
  },
});