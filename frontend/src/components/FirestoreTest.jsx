import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function FirestoreTest() {

  const runTest = async () => {
    console.clear();
    console.log("--- INICIANDO TESTE DEFINITIVO ---");

    const email = "luisdev.py@gmail.com"; // <-- COLOQUE SEU EMAIL AQUI
    const password = "@Akld90#3"; // <-- COLOQUE SUA SENHA AQUI

    try {
      console.log("1. Tentando fazer login...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("2. Login bem-sucedido! UID:", user.uid);

      const userDocRef = doc(db, 'users', user.uid);
      console.log("3. Preparando para buscar documento no caminho:", userDocRef.path);

      const userDocSnap = await getDoc(userDocRef);
      console.log("4. Busca no Firestore concluída.");

      if (userDocSnap.exists()) {
        console.log("5. SUCESSO! Documento encontrado:", userDocSnap.data());
        alert("SUCESSO! O documento do usuário foi encontrado no Firestore.");
      } else {
        console.log("5. FALHA! Documento NÃO encontrado no Firestore.");
        alert("FALHA! O login funcionou, mas o documento do usuário não foi encontrado no Firestore.");
      }

    } catch (error) {
      console.error("ERRO GERAL NO TESTE:", error);
      alert(`Um erro ocorreu: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Teste Final de Conexão com Firestore</h2>
      <p>Este teste vai logar e tentar ler o seu documento na coleção 'users'.</p>
      <p>Abra o console (F12) antes de clicar.</p>
      <button 
        onClick={runTest}
        style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
      >
        Rodar Teste
      </button>
    </div>
  );
}