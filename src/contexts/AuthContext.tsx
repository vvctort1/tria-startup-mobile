import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasCompletedQuestionnaire: boolean;
  setHasCompletedQuestionnaire: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasCompletedQuestionnaire: false,
  setHasCompletedQuestionnaire: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setHasCompletedQuestionnaire(docSnap.data().hasCompletedQuestionnaire || false);
          } else {
            setHasCompletedQuestionnaire(false);
          }
        } catch (error) {
          console.error("Erro ao buscar dados de onboarding:", error);
          setHasCompletedQuestionnaire(false);
        }
      } else {
        setHasCompletedQuestionnaire(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hasCompletedQuestionnaire, setHasCompletedQuestionnaire }}>
      {children}
    </AuthContext.Provider>
  );
};