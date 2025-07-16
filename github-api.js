class GitHubAPI {
    constructor() {
        this.token = 'YOUR_GITHUB_TOKEN'; // Token removido por questões de segurança
        this.owner = 'LUIZ-LARA';
        this.repo = 'luiz-lara';
        this.baseURL = 'https://api.github.com';
        this.dataFile = 'data/interactions.json';
        this.init();
    }

    async init() {
        console.log('🔗 GitHub API iniciada');
        console.log(`📂 Repositório: ${this.owner}/${this.repo}`);
        
        await this.ensureDataFileExists();
    }

    async initialize() {
        return await this.init();
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    async ensureDataFileExists() {
        try {
            const response = await fetch(`${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`, {
                headers: this.getHeaders()
            });

            if (response.status === 404) {
                console.log('📄 Arquivo de dados não existe, criando...');
                await this.createInitialDataFile();
            } else if (response.ok) {
                console.log('✅ Arquivo de dados encontrado');
            } else {
                console.error('❌ Erro ao verificar arquivo:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro na verificação:', error);
        }
    }

    async createInitialDataFile() {
        const initialData = {
            profile: {
                views: 0,
                likes: 0,
                dislikes: 0,
                lastUpdated: new Date().toISOString()
            },
            comments: [],
            user_interactions: {},
            metadata: {
                created: new Date().toISOString(),
                version: '1.0',
                description: 'Dados de interações do perfil GitHub'
            }
        };

        const content = btoa(JSON.stringify(initialData, null, 2));

        try {
            const response = await fetch(`${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: '🎯 Inicializar arquivo de dados de interações',
                    content: content,
                    branch: 'main'
                })
            });

            if (response.ok) {
                console.log('✅ Arquivo de dados criado com sucesso');
                return true;
            } else {
                console.error('❌ Erro ao criar arquivo:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro na criação:', error);
            return false;
        }
    }

    async loadData() {
        try {
            const response = await fetch(`${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content);
                const data = JSON.parse(content);
                console.log('📥 Dados carregados do GitHub:', data);
                return { data, sha: fileData.sha };
            } else {
                console.error('❌ Erro ao carregar dados:', response.status);
                return null;
            }
        } catch (error) {
            console.error('❌ Erro no carregamento:', error);
            return null;
        }
    }

    async saveData(newData, commitMessage = '💾 Atualizar dados de interações') {
        try {
            const currentFile = await this.loadData();
            if (!currentFile) {
                console.error('❌ Não foi possível carregar dados atuais');
                return false;
            }

            newData.metadata = {
                ...newData.metadata,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'GitHub API Integration'
            };

            const content = btoa(JSON.stringify(newData, null, 2));

            const response = await fetch(`${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: commitMessage,
                    content: content,
                    sha: currentFile.sha,
                    branch: 'main'
                })
            });

            if (response.ok) {
                console.log('✅ Dados salvos no GitHub com sucesso');
                return true;
            } else {
                const errorData = await response.json();
                console.error('❌ Erro ao salvar:', response.status, errorData);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro no salvamento:', error);
            return false;
        }
    }

    async incrementViews() {
        const result = await this.loadData();
        if (result) {
            result.data.profile.views += 1;
            result.data.profile.lastUpdated = new Date().toISOString();
            return await this.saveData(result.data, '👁️ Incrementar visualizações');
        }
        return false;
    }

    async addLike(userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            if (result.data.user_interactions[userId]?.liked) {
                console.log('⚠️ Usuário já curtiu');
                return false;
            }

            if (result.data.user_interactions[userId]?.disliked) {
                result.data.profile.dislikes -= 1;
            }

            result.data.profile.likes += 1;
            result.data.user_interactions[userId] = {
                liked: true,
                disliked: false,
                timestamp: new Date().toISOString()
            };
            result.data.profile.lastUpdated = new Date().toISOString();
            
            return await this.saveData(result.data, '👍 Adicionar like');
        }
        return false;
    }

    async addDislike(userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            if (result.data.user_interactions[userId]?.disliked) {
                console.log('⚠️ Usuário já descurtiu');
                return false;
            }

            if (result.data.user_interactions[userId]?.liked) {
                result.data.profile.likes -= 1;
            }

            result.data.profile.dislikes += 1;
            result.data.user_interactions[userId] = {
                liked: false,
                disliked: true,
                timestamp: new Date().toISOString()
            };
            result.data.profile.lastUpdated = new Date().toISOString();
            
            return await this.saveData(result.data, '👎 Adicionar dislike');
        }
        return false;
    }

    async removeLike(userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            if (!result.data.user_interactions[userId]?.liked) {
                console.log('⚠️ Usuário não tem like para remover');
                return false;
            }

            result.data.profile.likes -= 1;
            result.data.user_interactions[userId] = {
                liked: false,
                disliked: false,
                timestamp: new Date().toISOString()
            };
            result.data.profile.lastUpdated = new Date().toISOString();
            
            return await this.saveData(result.data, '👍 Remover like');
        }
        return false;
    }

    async removeDislike(userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            if (!result.data.user_interactions[userId]?.disliked) {
                console.log('⚠️ Usuário não tem dislike para remover');
                return false;
            }

            result.data.profile.dislikes -= 1;
            result.data.user_interactions[userId] = {
                liked: false,
                disliked: false,
                timestamp: new Date().toISOString()
            };
            result.data.profile.lastUpdated = new Date().toISOString();
            
            return await this.saveData(result.data, '👎 Remover dislike');
        }
        return false;
    }

    async addComment(comment, author = 'Anônimo', userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            const newComment = {
                id: Date.now().toString(),
                author: author,
                userId: userId,
                text: comment,
                timestamp: new Date().toISOString(),
                likes: 0,
                likedBy: []
            };

            result.data.comments.push(newComment);
            result.data.profile.lastUpdated = new Date().toISOString();
            
            const success = await this.saveData(result.data, `💬 Novo comentário de ${author}`);
            if (success) {
                return newComment;
            }
        }
        return null;
    }

    async likeComment(commentId, userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            const comment = result.data.comments.find(c => c.id === commentId);
            if (comment) {
                if (!comment.likedBy.includes(userId)) {
                    comment.likes += 1;
                    comment.likedBy.push(userId);
                    result.data.profile.lastUpdated = new Date().toISOString();
                    
                    return await this.saveData(result.data, `❤️ Curtir comentário ${commentId}`);
                }
            }
        }
        return false;
    }

    async removeComment(commentId, userId = 'anonymous') {
        const result = await this.loadData();
        if (result) {
            const commentIndex = result.data.comments.findIndex(c => c.id === commentId && c.userId === userId);
            if (commentIndex !== -1) {
                result.data.comments.splice(commentIndex, 1);
                result.data.profile.lastUpdated = new Date().toISOString();
                
                return await this.saveData(result.data, `🗑️ Remover comentário ${commentId}`);
            }
        }
        return false;
    }

    async getComments() {
        try {
            const result = await this.loadData();
            if (result && result.data) {
                return result.data.comments || [];
            }
            return [];
        } catch (error) {
            console.error('❌ Erro ao carregar comentários:', error);
            return [];
        }
    }

    formatCommentDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;
        
        return date.toLocaleDateString('pt-BR');
    }

    async getStats() {
        const result = await this.loadData();
        if (result) {
            return {
                views: result.data.profile.views,
                likes: result.data.profile.likes,
                dislikes: result.data.profile.dislikes,
                comments: result.data.comments.length,
                lastUpdated: result.data.profile.lastUpdated,
                totalInteractions: Object.keys(result.data.user_interactions).length
            };
        }
        return null;
    }

    async getUserInteraction(userId = 'anonymous') {
        const result = await this.loadData();
        if (result && result.data.user_interactions[userId]) {
            return result.data.user_interactions[userId];
        }
        return { liked: false, disliked: false };
    }

    async syncWithLocal() {
        try {
            const githubData = await this.loadData();
            if (githubData) {
                localStorage.setItem('github_sync_data', JSON.stringify(githubData.data));
                localStorage.setItem('github_last_sync', new Date().toISOString());
                console.log('🔄 Sincronização com localStorage concluída');
                return githubData.data;
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
        }
        return null;
    }

    getLocalSyncData() {
        const data = localStorage.getItem('github_sync_data');
        const lastSync = localStorage.getItem('github_last_sync');
        
        if (data && lastSync) {
            return {
                data: JSON.parse(data),
                lastSync: new Date(lastSync),
                isRecent: (Date.now() - new Date(lastSync).getTime()) < 300000
            };
        }
        return null;
    }
}

const githubAPI = new GitHubAPI();
window.githubAPI = githubAPI;