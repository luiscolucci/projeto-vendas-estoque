import { useState, createContext, useContext, useEffect } from 'react';
import { auth, db } from '../firebaseConfig'; // Importamos os serviços que configuramos
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Cria o contexto em si
const AuthContext = createContext();

// Hook personalizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};

// Componente Provedor do Contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect que roda uma vez para verificar o estado de login
  // Substitua o useEffect existente
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    console.log('onAuthStateChanged: Status de login mudou. Usuário atual:', currentUser);
    if (currentUser) {
      console.log('Usuário logado encontrado. UID:', currentUser.uid);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Vamos ver o que getDoc nos retorna
      const userDocSnap = await getDoc(userDocRef);
      console.log('Resultado da busca no Firestore:', userDocSnap.exists());
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log('Documento do usuário encontrado. Role:', userData.role);
        setUser(currentUser);
        setRole(userData.role);
      } else {
        console.log('Documento do usuário NÃO encontrado no Firestore.');
      }
    } else {
      console.log('Nenhum usuário logado.');
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  // Função para login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Se o login for bem-sucedido, a função onAuthStateChanged acima será ativada e atualizará o estado
      return userCredential;
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  };

  // Função para logout
  const logout = () => {
    signOut(auth);
    setUser(null);
    setRole(null);
  };

  const value = {
    user,
    role,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};