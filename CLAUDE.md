@AGENTS.md

# TRIA — App de Triagem Veterinária com IA

Startup de medicina veterinária. O app permite que tutores de pets descrevam sintomas e enviem fotos, e uma IA (Gemini multimodal) realiza uma pré-triagem antes do atendimento com um veterinário real cadastrado na plataforma.

## Stack técnica

- **Framework:** React Native + Expo SDK 56 (Managed Workflow)
- **Linguagem:** TypeScript 6
- **React:** 19.2.3 / React Native 0.85.3
- **IA / Visão Computacional:** Google Gemini (`@google/generative-ai` v0.24.1) — modelo `gemini-2.5-flash` preferido; aceita texto + imagem (multimodal)
- **Auth + Banco:** Firebase v12 — `firebase/auth` com persistência via AsyncStorage; `firebase/firestore` com `experimentalForceLongPolling: true`
- **Navegação:** `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- **Imagens:** `expo-image-picker`
- **Storage local:** `@react-native-async-storage/async-storage`

## Estrutura de pastas

```
tria-startup-mobile/
├── App.tsx                    # Entry point — lógica de navegação raiz
├── index.ts                   # Registro do app Expo
├── app.json                   # Config Expo
├── assets/                    # Ícones e splash
└── src/
    ├── contexts/
    │   └── AuthContext.tsx    # Auth state + flag hasCompletedQuestionnaire
    ├── hooks/
    │   └── useAuth.ts         # Consome AuthContext
    ├── screens/
    │   ├── OnboardingScreen.tsx    # Exibida só no primeiro lançamento
    │   ├── LoginScreen.tsx         # Login / cadastro Firebase
    │   ├── QuestionarioScreen.tsx  # Questionário inicial sobre o pet
    │   ├── MenuScreen.tsx          # Bottom tab navigator principal
    │   ├── TriagemIAScreen.tsx     # Chat com IA (Gemini + imagem)
    │   ├── VetsScreen.tsx          # Listagem de veterinários
    │   ├── VetProfileScreen.tsx    # Perfil individual do vet
    │   ├── ConsultasScreen.tsx     # Consultas agendadas
    │   └── UserProfileScreen.tsx   # Perfil do tutor
    └── services/
        └── firebaseConfig.ts  # Inicialização Firebase (auth, db)
```

## Fluxo de navegação

```
App.tsx (RootNavigation)
 ├── isFirstLaunch = true  → OnboardingScreen
 ├── !user                 → LoginScreen
 ├── !hasCompletedQuestionnaire → QuestionarioScreen
 └── autenticado + questionário → MenuScreen (bottom tabs)
       ├── Tab "IA"           → TriagemIAScreen
       ├── Tab "Veterinários" → VetStackScreen (VetsList → VetProfile)
       ├── Tab "Consultas"    → ConsultasScreen
       └── Tab "Perfil"       → UserProfileScreen
```

## Variáveis de ambiente

Todas prefixadas com `EXPO_PUBLIC_` (obrigatório para Expo expor ao bundle):

```
EXPO_PUBLIC_GEMINI_API_KEY
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

## Paleta de cores

| Papel       | Valor     |
|-------------|-----------|
| Primária    | `#002244` (azul escuro naval) |
| Acento      | `#00ffff` (ciano) |
| Background  | `#f5f5f5` |
| Branco      | `#ffffff` |

## Decisões técnicas importantes

- **Firebase Firestore** usa `experimentalForceLongPolling: true` — necessário para React Native; não remover.
- **Firebase Auth** inicializado com `getReactNativePersistence(AsyncStorage)` — mantém sessão entre aberturas do app.
- **Primeiro lançamento** detectado pela chave `@app_first_launch` no AsyncStorage.
- **Estado do questionário** (`hasCompletedQuestionnaire`) é lido do Firestore (`users/{uid}`) no `onAuthStateChanged`.
- **Gemini multimodal:** imagem é enviada em base64 (`inlineData`) junto com o prompt de texto.

## Comandos

```bash
npm start          # Expo Go (dev)
npm run android    # Emulador Android
npm run ios        # Simulador iOS
npm run web        # Navegador
```

## Regras de desenvolvimento

- Sempre consultar a doc do Expo SDK 56 antes de usar APIs Expo: https://docs.expo.dev/versions/v56.0.0/
- Para modelos Gemini, consultar `/claude-api` skill — nunca assumir IDs de modelos da memória.
- Novos screens vão em `src/screens/` e são importados em `MenuScreen.tsx` (tabs) ou `App.tsx` (pré-auth).
- Novos serviços externos vão em `src/services/`.
- Estilos usam `StyleSheet.create` inline no próprio arquivo de screen — sem CSS externo.
- Não usar `StyleSheet` global compartilhado; cada screen é autossuficiente.
- TypeScript estrito — sem `any` desnecessário.
