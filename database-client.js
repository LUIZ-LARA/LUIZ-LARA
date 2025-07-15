/**
 * Cliente de Banco de Dados Firebase Realtime Database
 * Conecta diretamente ao Firebase para salvar e ler dados de usuários
 */

class DatabaseClient {
    constructor() {
        this.isInitialized = false;
        // URL do Firebase Realtime Database fornecida pelo usuário
        this.firebaseUrl = 'https://salvedataportifoliogithub-default-rtdb.firebaseio.com';
        this.usersEndpoint = `${this.firebaseUrl}/users.json`;
    }

    /**
     * Inicializa a conexão com o Firebase
     */
    async initialize() {
        try {
            // Testa a conexão com o Firebase
            const response = await fetch(this.firebaseUrl + '/.json');
            if (response.ok) {
                console.log('Conexão com Firebase estabelecida com sucesso!');
                this.isInitialized = true;
                return true;
            } else {
                throw new Error('Erro ao conectar com Firebase');
            }
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
            return false;
        }
    }

    /**
     * Função simples de hash para senhas (em produção, use bcrypt)
     */
    hashPassword(password) {
        // Hash simples usando btoa e reversão da string
        // NOTA: Em produção, use uma biblioteca de hash segura como bcrypt
        const reversed = password.split('').reverse().join('');
        return btoa(reversed + 'salt_secreto');
    }

    /**
     * Gera um ID único para novos usuários
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Busca todos os usuários do Firebase
     */
    async getAllUsers() {
        try {
            const response = await fetch(this.usersEndpoint);
            if (response.ok) {
                const users = await response.json();
                return users || {};
            }
            return {};
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return {};
        }
    }

    /**
     * Registra um novo usuário
     */
    async register(username, email, password) {
        if (!this.isInitialized) {
            throw new Error('Firebase não inicializado');
        }

        try {
            // Busca usuários existentes
            const existingUsers = await this.getAllUsers();
            
            // Verifica se usuário ou email já existe
            const userExists = Object.values(existingUsers).some(user => 
                user.username === username || user.email === email
            );
            
            if (userExists) {
                throw new Error('Usuário ou email já existe');
            }

            // Hash da senha
            const passwordHash = this.hashPassword(password);
            
            // Cria novo usuário
            const userId = this.generateUserId();
            const newUser = {
                id: userId,
                username: username,
                email: email,
                password_hash: passwordHash,
                created_at: new Date().toISOString()
            };

            // Salva no Firebase
            const response = await fetch(`${this.firebaseUrl}/users/${userId}.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                console.log('Usuário registrado com sucesso no Firebase!');
                return { success: true, message: 'Usuário registrado com sucesso!' };
            } else {
                throw new Error('Erro ao salvar usuário no Firebase');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Faz login do usuário
     */
    async login(username, password) {
        if (!this.isInitialized) {
            throw new Error('Firebase não inicializado');
        }

        try {
            const passwordHash = this.hashPassword(password);
            
            // Busca todos os usuários
            const users = await this.getAllUsers();
            
            // Procura usuário com credenciais corretas
            const user = Object.values(users).find(user => 
                user.username === username && user.password_hash === passwordHash
            );
            
            if (user) {
                // Remove senha do objeto de sessão
                const sessionUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email
                };
                
                // Salva sessão no localStorage
                localStorage.setItem('currentUser', JSON.stringify(sessionUser));
                console.log('Login realizado com sucesso!');
                return { success: true, user: sessionUser };
            } else {
                return { success: false, message: 'Credenciais inválidas' };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    /**
     * Faz logout do usuário
     */
    logout() {
        localStorage.removeItem('currentUser');
        console.log('Logout realizado com sucesso!');
        return { success: true };
    }

    /**
     * Verifica se há uma sessão ativa
     */
    checkSession() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            return { success: true, user: JSON.parse(currentUser) };
        }
        return { success: false };
    }

    /**
     * Lista todos os usuários (para fins de demonstração)
     */
    async getUsers() {
        if (!this.isInitialized) {
            throw new Error('Firebase não inicializado');
        }

        try {
            const users = await this.getAllUsers();
            const userList = Object.values(users).map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }));
            
            return { success: true, users: userList };
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return { success: false, message: 'Erro ao buscar usuários' };
        }
    }

    /**
     * Mostra mensagem de sucesso
     */
    showSuccessMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        message.innerHTML = `
            <strong>✅ Sucesso!</strong><br>
            ${text}
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    /**
     * Mostra mensagem de erro
     */
    showErrorMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        message.innerHTML = `
            <strong>❌ Erro!</strong><br>
            ${text}
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 4000);
    }

    /**
     * Limpa o cache local
     */
    clearLocalCache() {
        localStorage.removeItem('currentUser');
        console.log('Cache local limpo!');
    }

    /**
     * Testa a conexão com Firebase
     */
    async testConnection() {
        try {
            const response = await fetch(this.firebaseUrl + '/.json');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Instância global do cliente de banco de dados
const dbClient = new DatabaseClient();

// Exporta para uso global
window.dbClient = dbClient;