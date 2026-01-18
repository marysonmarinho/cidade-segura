// login-script.js

// Aguardar o Firebase carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, verificando Firebase...');
    if (typeof window.auth === '' || typeof window.db === 'undefined') {
        console.error('Firebase não inicializado! Auth:', window.auth, 'DB:', window.db);
        alert('Erro: Firebase não carregou. Verifique o console.');
        return;
    }
    
    const auth = window.auth;
    const db = window.db;
    console.log('Auth e DB carregados no login:', auth, db);
    
    // Agora adicionar os event listeners
    setupEventListeners(auth, db);
});

function setupEventListeners(auth, db) {
    // Gerenciar Login e Cadastro
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Login form submetido');
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'home.html';  // CORRIGIDO: Redirecionar para a página de relatório após login
        } catch (error) {
            alert('Erro no login: ' + error.message);
        }
    });
    
    document.getElementById('show-register').addEventListener('click', function() {
        console.log('Botão show-register clicado');
        document.getElementById('login_form').style.display = 'none';
        document.getElementById('register_form').style.display = 'flex';
    });
    
    document.getElementById('show-login').addEventListener('click', function() {
        console.log('Botão show-login clicado');
        document.getElementById('register_form').style.display = 'none';
        document.getElementById('login_form').style.display = 'flex';
    });
    
    document.querySelector('#register_form form').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Register form submetido');
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const dataNascimento = document.getElementById('data-nascimento').value;
        const newPassword = document.getElementById('new-password').value;
        
        const idade = calcularIdade(dataNascimento);
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, newPassword);
            await db.collection('users').doc(userCredential.user.uid).set({
                nome: nome,
                email: email,
                dataNascimento: dataNascimento,
                idade: idade
            });
            alert('Cadastro bem-sucedido!');
            document.getElementById('register_form').style.display = 'none';
            document.getElementById('login_form').style.display = 'flex';
        } catch (error) {
            alert('Erro no cadastro: ' + error.message);
        }
    });
    
    // Novo: Esqueceu senha
    document.getElementById('forgot-password').addEventListener('click', async function() {
        const email = prompt('Digite seu e-mail cadastrado para redefinir a senha:');
        if (email) {
            try {
                await auth.sendPasswordResetEmail(email);
                alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
            } catch (error) {
                alert('Erro ao enviar e-mail: ' + error.message);
            }
        }
    });
    
    // Alternar modo claro/escuro
    document.getElementById('mode_icon').addEventListener('click', function() {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            this.classList.remove('fa-moon');
            this.classList.add('fa-sun');
        } else {
            this.classList.remove('fa-sun');
            this.classList.add('fa-moon');
        }
    });
    
    document.getElementById('mode_icon_register').addEventListener('click', function() {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            this.classList.remove('fa-moon');
            this.classList.add('fa-sun');
        } else {
            this.classList.remove('fa-sun');
            this.classList.add('fa-moon');
        }
    });
}

function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}