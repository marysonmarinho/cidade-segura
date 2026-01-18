// firebase-config.js

// Configuração do Firebase (substitua pelos valores reais do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyD4mI6A-yrrgbf8R5w5zNHXDOQJEcKKWk0",
  authDomain: "cidadeseguratcc.firebaseapp.com",
  projectId: "cidadeseguratcc",
  storageBucket: "cidadeseguratcc.firebasestorage.app",
  messagingSenderId: "30045969424",
  appId: "1:30045969424:web:6bf0580ee1e25906efbe95",
  measurementId: "G-EET7XBEHHR"
};

// Debug: Verificar se os scripts do Firebase carregaram
console.log('Firebase scripts carregados? Firebase:', typeof firebase);

// Inicializar Firebase v8
try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Debug
    console.log('Firebase inicializado com sucesso:', auth, db);
    
    // Tornar global
    window.auth = auth;
    window.db = db;
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}