import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setPassword('');
    setConfirmPassword('');
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha seu e-mail e senha.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Digite um endereço de e-mail válido.');
      return;
    }

    if (isRegistering) {
      if (!confirmPassword.trim()) {
        Alert.alert('Atenção', 'Confirme sua senha.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Senhas não conferem', 'A senha e a confirmação precisam ser iguais.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, 'users', uid), {
          email: email.trim().toLowerCase(),
          hasCompletedQuestionnaire: false,
          createdAt: new Date(),
        });
        
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, marginBottom: 20 }}>
          {isRegistering ? 'Criar Conta' : 'Acesse sua Conta'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Confirme sua senha"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        )}

        <TouchableOpacity onPress={handleAuth} disabled={loading} style={{ padding: 10, marginVertical: 10 }}>
          {loading ? <ActivityIndicator /> : <Text>{isRegistering ? 'Cadastrar' : 'Entrar'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} style={{ padding: 10 }}>
          <Text>{isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
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
    borderRadius: 5 
  },
});