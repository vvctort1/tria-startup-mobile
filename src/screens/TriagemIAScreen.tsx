import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ia';
  imageUri?: string;
};

const SYSTEM_PROMPT =
  'Você é a assistente de pré-triagem veterinária da plataforma TRIA. Analise os sintomas e imagens com rigor clínico. Forneça avaliação preliminar objetiva, sempre recomendando consultas com veterinários parceiros da plataforma para diagnóstico definitivo. Seja empática, clara e profissional. Responda em português. Sempre inicie o chat deixando claro ao usuário que não se trata de um diagnóstico e é sempre necessário consultar profissionais. No final da interação, sempre mostre ao usuário o grau de 1 a 5 da gravidade prevista do sintomas apresentados.';

export function TriagemIAScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Olá! Sou a assistente de triagem da TRIA. Descreva os sintomas do seu pet ou envie uma foto para que eu possa ajudá-lo com uma avaliação preliminar.',
      sender: 'ia',
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const enviarParaGemini = async () => {
    if (!prompt.trim() && !imageBase64) return;

    const novaMensagemUsuario: Message = {
      id: Date.now().toString(),
      text: prompt.trim(),
      sender: 'user',
      imageUri: imageUri || undefined,
    };

    setMessages((prev) => [...prev, novaMensagemUsuario]);

    const textoEnviado = prompt;
    const imagemBase64 = imageBase64;
    setPrompt('');
    setImageUri(null);
    setImageBase64(null);
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const historico = messages
        .map((m) => `${m.sender === 'user' ? 'Tutor' : 'Assistente'}: ${m.text}`)
        .join('\n');
      const promptCompleto = `${SYSTEM_PROMPT}\n\nHistórico:\n${historico}\n\nTutor: ${textoEnviado}`;

      let result;
      if (imagemBase64) {
        result = await model.generateContent([
          promptCompleto,
          { inlineData: { data: imagemBase64, mimeType: 'image/jpeg' } },
        ]);
      } else {
        result = await model.generateContent(promptCompleto);
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: result.response.text(), sender: 'ia' },
      ]);
    } catch {
      Alert.alert('Erro', 'Falha ao processar a resposta da IA. Tente novamente.');
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const canSend = (prompt.trim().length > 0 || !!imageUri) && !loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Triagem com IA</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Assistente online</Text>
          </View>
        </View>
        <Image
          source={require('../../assets/LogoTria1.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isUser = item.sender === 'user';
            return (
              <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowIA]}>
                {!isUser && (
                  <View style={styles.iaAvatar}>
                    <Ionicons name="pulse" size={14} color={colors.accent} />
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleIA]}>
                  {item.imageUri && (
                    <Image source={{ uri: item.imageUri }} style={styles.msgImage} />
                  )}
                  {item.text ? (
                    <Text style={isUser ? styles.textUser : styles.textIA}>{item.text}</Text>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            loading ? (
              <View style={[styles.msgRow, styles.msgRowIA]}>
                <View style={styles.iaAvatar}>
                  <Ionicons name="pulse" size={14} color={colors.accent} />
                </View>
                <View style={[styles.bubble, styles.bubbleIA, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={styles.typingText}>Analisando...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {imageUri && (
          <View style={styles.attachRow}>
            <Image source={{ uri: imageUri }} style={styles.attachThumb} />
            <View style={styles.attachInfo}>
              <Text style={styles.attachLabel}>Imagem anexada</Text>
              <Text style={styles.attachSub}>Pronta para envio</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => { setImageUri(null); setImageBase64(null); }}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Descreva os sintomas..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
            onPress={enviarParaGemini}
            disabled={!canSend}
          >
            <Ionicons name="send" size={18} color={canSend ? colors.white : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
  },
  headerLogo: {
    width: 70,
    height: 70,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowIA: {
    justifyContent: 'flex-start',
  },
  iaAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleIA: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
    ...shadow.sm,
  },
  textUser: {
    ...typography.body,
    color: colors.white,
    lineHeight: 22,
  },
  textIA: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  msgImage: {
    width: 200,
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    resizeMode: 'cover',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  typingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  attachInfo: {
    flex: 1,
  },
  attachLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  attachSub: {
    ...typography.caption,
    color: colors.accent,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnActive: {
    backgroundColor: colors.accent,
  },
  sendBtnDisabled: {
    backgroundColor: colors.background,
  },
});
