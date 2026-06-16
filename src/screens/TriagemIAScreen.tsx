import React, { useState, useRef, useEffect } from 'react';
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
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ia';
  imageUri?: string;
};

export function TriagemIAScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Olá! Sou a assistente inteligente da TRIA. Como posso ajudar o seu pet hoje? Você pode me descrever os sintomas ou enviar uma foto.',
      sender: 'ia'
    }
  ]);
  
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Efeito para rolar a tela para baixo sempre que o loading mudar (para mostrar o balão de "pensando")
  useEffect(() => {
    if (loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [loading]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
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
      imageUri: imageUri || undefined
    };

    setMessages(prev => [...prev, novaMensagemUsuario]);
    
    const textoEnviado = prompt;
    const imagemEnviadaBase64 = imageBase64;
    setPrompt('');
    setImageUri(null);
    setImageBase64(null);
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

      const historicoTexto = messages.map(m => `${m.sender === 'user' ? 'Tutor' : 'Assistente IA'}: ${m.text}`).join('\n');
      const contextoVeterinario = "Você é uma IA de pré-triagem veterinária. Analise os sintomas descritos e a imagem fornecida. Dê uma avaliação preliminar, mas avise sempre que o diagnóstico final deve ser feito pelo veterinário da plataforma. Seja empática e direta.";
      
      const promptCompleto = `${contextoVeterinario}\n\nHistórico da conversa:\n${historicoTexto}\n\nTutor: ${textoEnviado}`;

      let result;

      if (imagemEnviadaBase64) {
        const imagePart = {
          inlineData: {
            data: imagemEnviadaBase64,
            mimeType: 'image/jpeg'
          }
        };
        result = await model.generateContent([promptCompleto, imagePart]);
      } else {
        result = await model.generateContent(promptCompleto);
      }

      const respostaTexto = result.response.text();
      
      const novaMensagemIA: Message = {
        id: (Date.now() + 1).toString(),
        text: respostaTexto,
        sender: 'ia'
      };

      setMessages(prev => [...prev, novaMensagemIA]);

    } catch (error: any) {
      console.error("ERRO GEMINI:", error);
      Alert.alert('Erro Técnico', 'Falha ao processar a resposta da IA.');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperIA]}>
        <View style={[styles.messageBubble, isUser ? styles.messageUser : styles.messageIA]}>
          {item.imageUri && (
            <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
          )}
          {item.text ? <Text style={isUser ? styles.textUser : styles.textIA}>{item.text}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Triagem Inteligente</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        // Renderiza o indicador de digitação no final da lista se estiver carregando
        ListFooterComponent={
          loading ? (
            <View style={[styles.messageWrapper, styles.messageWrapperIA]}>
              <View style={[styles.messageBubble, styles.messageIA, styles.typingIndicator]}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.typingText}>A IA está analisando...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {imageUri && (
        <View style={styles.attachmentPreview}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setImageUri(null); setImageBase64(null); }}>
            <Text style={styles.removeImageText}>X</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
          <Text style={{ fontSize: 24 }}>📷</Text>
        </TouchableOpacity>
        
        <TextInput 
          style={styles.input} 
          placeholder="Digite sua mensagem..." 
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, (!prompt.trim() && !imageUri) ? styles.sendButtonDisabled : null]} 
          onPress={enviarParaGemini} 
          disabled={loading || (!prompt.trim() && !imageUri)}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    padding: 20, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#ddd', 
    paddingTop: 60 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#002244' 
  },
  chatContainer: { 
    padding: 15, 
    paddingBottom: 20 
  },
  messageWrapper: { 
    marginBottom: 15, 
    flexDirection: 'row' 
  },
  messageWrapperUser: { 
    justifyContent: 'flex-end' 
  },
  messageWrapperIA: { 
    justifyContent: 'flex-start' 
  },
  
  messageBubble: { 
    maxWidth: '80%', 
    padding: 12, 
    borderRadius: 15 
  },
  messageUser: { 
    backgroundColor: '#002244', 
    borderBottomRightRadius: 5 
  },
  messageIA: { 
    backgroundColor: '#e0e0e0', 
    borderBottomLeftRadius: 5 
  },
  
  textUser: { 
    color: '#fff', 
    fontSize: 16 
  },
  textIA: { 
    color: '#333', 
    fontSize: 16 
  },
  
  messageImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 5, 
    resizeMode: 'cover' 
  },
  
  // Estilos do novo balão de "digitando"
  typingIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 15 
  },
  typingText: { 
    color: '#666', 
    fontSize: 14, 
    fontStyle: 'italic' 
  },

  attachmentPreview: { 
    flexDirection: 'row', 
    padding: 10, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#ddd' 
  },
  previewImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 8
  },
  removeImageBtn: { 
    position: 'absolute', 
    top: 5, 
    left: 60, 
    backgroundColor: 'red', 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  removeImageText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 12 
  },

  footer: { 
    flexDirection: 'row', 
    padding: 10, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#ddd', 
    alignItems: 'flex-end' 
  },
  iconButton: { 
    padding: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  input: { 
    flex: 1, 
    minHeight: 45, 
    maxHeight: 100, 
    backgroundColor: '#f9f9f9', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingTop: 12, 
    fontSize: 16 
  },
  sendButton: { 
    marginLeft: 10, 
    backgroundColor: '#00ffff', 
    paddingVertical: 12,
    paddingHorizontal: 20, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: { 
    backgroundColor: '#ccc' 
  },
  sendButtonText: { 
    color: '#002244', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});