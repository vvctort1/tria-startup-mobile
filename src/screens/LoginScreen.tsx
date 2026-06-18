import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { colors, radius, spacing, typography, shadow } from '../theme';

export function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email.trim().toLowerCase(),
          hasCompletedQuestionnaire: false,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro na autenticação. Verifique seus dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/LogoTria1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Triagem de Risco com Inteligência Artificial</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRegistering ? 'Criar conta' : 'Entrar na conta'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isRegistering
              ? 'Preencha os dados abaixo para começar'
              : 'Acesse a plataforma com seu e-mail'}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <TextInput
              style={inputStyle('email')}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[inputStyle('password'), styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isRegistering && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirmar senha</Text>
              <TextInput
                style={inputStyle('confirm')}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isRegistering ? 'Criar conta' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={toggleMode}>
            <Text style={styles.secondaryBtnText}>
              {isRegistering
                ? 'Já tenho uma conta — Entrar'
                : 'Não tenho conta — Cadastrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legalText}>
          Ao continuar, você concorda com os Termos de Uso e Política de Privacidade da TRIA.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 300,
    height: 100,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  cardTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
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
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 80,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
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
    opacity: 0.6,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  legalText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
});
