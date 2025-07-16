class SoundSystem {
    constructor() {
        this.sounds = {
            like: new Audio('Sons/Gostei.mp3'),
            dislike: new Audio('Sons/Não_Gostei.mp3'),
            comment: new Audio('Sons/comentarios.mp3'),
            hover: new Audio('Sons/mauseSobre.mp3')
        };
        
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
            sound.preload = 'auto';
        });
    }
    
    play(soundName) {
        try {
            if (this.sounds[soundName]) {
                const sound = this.sounds[soundName];
                sound.currentTime = 0;
                
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        setTimeout(() => {
                            sound.pause();
                            sound.currentTime = 0;
                        }, 2000);
                    }).catch(e => {
                        console.log('Som não pôde ser reproduzido:', e);
                    });
                }
            }
        } catch (error) {
            console.log('Erro ao reproduzir som:', error);
        }
    }
}

const soundSystem = new SoundSystem();

class BattleCityGame {
    constructor() {
        this.canvas = document.getElementById('battleCityCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tank = null;
        this.bullets = [];
        this.explosions = [];
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.lastShot = 0;
        
        this.setupCanvas();
        this.createTank();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    createTank() {
        this.tank = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            angle: 0,
            speed: 1.2,
            size: 32,
            lastShot: 0
        };
    }
    
    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    updateTank() {
        const dx = this.mouse.x - this.tank.x;
        const dy = this.mouse.y - this.tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 80) {
            this.tank.x += (dx / distance) * this.tank.speed;
            this.tank.y += (dy / distance) * this.tank.speed;
        }
        
        this.tank.angle = Math.atan2(dy, dx);
        
        
        const now = Date.now();
        if (now - this.tank.lastShot > 1500) {
            this.createBullet(this.tank);
            this.tank.lastShot = now;
        }
    }
    
    createBullet(tank) {
        this.bullets.push({
            x: tank.x + Math.cos(tank.angle) * tank.size,
            y: tank.y + Math.sin(tank.angle) * tank.size,
            vx: Math.cos(tank.angle) * 4,
            vy: Math.sin(tank.angle) * 4,
            life: 120
        });
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || 
                bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.createExplosion(bullet.x, bullet.y);
                this.bullets.splice(i, 1);
            }
        }
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            size: 0,
            maxSize: 30,
            life: 20
        });
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.life--;
            explosion.size = (1 - explosion.life / 20) * explosion.maxSize;
            
            if (explosion.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    drawTank() {
        const tank = this.tank;
        this.ctx.save();
        this.ctx.translate(tank.x, tank.y);
        this.ctx.rotate(tank.angle);
        
        this.updateTankElement();
        
        this.ctx.restore();
    }
    
    updateTankElement() {
        const tank = this.tank;
        const tankElement = document.getElementById('pixelTank');
        
        if (tankElement) {
            tankElement.style.left = tank.x + 'px';
            tankElement.style.top = tank.y + 'px';
            
            const angleDegrees = (tank.angle * 180 / Math.PI);
            tankElement.style.transform = `translate(-50%, -50%) rotate(${angleDegrees}deg)`;
            
            tankElement.style.display = 'block';
            tankElement.style.opacity = '1';
            tankElement.style.zIndex = '10';
        }
    }
    
    drawBullet(bullet) {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(bullet.x - bullet.vx, bullet.y - bullet.vy, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawExplosion(explosion) {
        const alpha = explosion.life / 20;
        this.ctx.fillStyle = `rgba(255, ${100 + alpha * 155}, 0, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateTank();
        this.updateBullets();
        this.updateExplosions();
        
        this.drawTank();
        
        this.bullets.forEach(bullet => this.drawBullet(bullet));
        
        this.explosions.forEach(explosion => this.drawExplosion(explosion));
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    const likeCountSpan = likeBtn?.querySelector('.like-count');
    const dislikeCountSpan = dislikeBtn?.querySelector('.dislike-count');
    const viewsCountElement = document.getElementById('viewsCount');
    const moodElement = document.querySelector('.mood-emoji');
    const commentsBtn = document.getElementById('commentsBtn');
    const commentsCount = document.getElementById('commentCount');
    const commentsSidebar = document.getElementById('commentsSidebar');
    const commentsOverlay = document.getElementById('commentsOverlay');
    const closeCommentsBtn = document.getElementById('closeComments');
    const commentForm = document.getElementById('commentForm');
    const commentInput = document.getElementById('commentInput');
    const commentAuthor = document.getElementById('commentAuthor');
    const commentsList = document.getElementById('commentsList');

    async function initializeProfile() {
        try {
            console.log('🚀 Inicializando perfil com GitHub API...');
            
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('user_id', userId);
            }
            
            await githubAPI.incrementViews();
            
            const stats = await githubAPI.getStats();
            if (stats) {
                updateViewsDisplay(stats.views);
                
                if (likeCountSpan) likeCountSpan.textContent = stats.likes;
                if (dislikeCountSpan) dislikeCountSpan.textContent = stats.dislikes;
                
                console.log('📊 Estatísticas carregadas:', stats);
            }
            
            const userInteraction = await githubAPI.getUserInteraction(userId);
            if (userInteraction && (userInteraction.liked || userInteraction.disliked)) {
                if (userInteraction.liked) {
                    likeBtn.style.background = 'rgba(255, 0, 100, 0.3)';
                    likeBtn.style.borderColor = '#ff0064';
                    likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + stats.likes + '</span> ✓';
                    likeBtn.disabled = true;
                    dislikeBtn.disabled = false;
                    dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + stats.dislikes + '</span> Trocar';
                } else if (userInteraction.disliked) {
                    dislikeBtn.style.background = 'rgba(100, 100, 100, 0.3)';
                    dislikeBtn.style.borderColor = '#666';
                    dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + stats.dislikes + '</span> ✓';
                    dislikeBtn.disabled = true;
                    likeBtn.disabled = false;
                    likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + stats.likes + '</span> Trocar';
                }
            }
            
            console.log('✅ Perfil inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar perfil:', error);
            initializeProfileFallback();
        }
    }
    
    function initializeProfileFallback() {
        console.log('🔄 Usando fallback local...');
        const profileData = JSON.parse(localStorage.getItem('profile_data')) || { likes: 0, dislikes: 0, views: 0, userInteraction: null };
        
        if (!sessionStorage.getItem('viewCounted')) {
            profileData.views++;
            sessionStorage.setItem('viewCounted', 'true');
        }
        
        localStorage.setItem('profile_data', JSON.stringify(profileData));
        updateViewsDisplay(profileData.views);
        if (likeCountSpan) likeCountSpan.textContent = profileData.likes;
        if (dislikeCountSpan) dislikeCountSpan.textContent = profileData.dislikes;
        
        if (profileData.userInteraction === 'like') {
            likeBtn.style.background = 'rgba(255, 0, 100, 0.3)';
            likeBtn.style.borderColor = '#ff0064';
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + profileData.likes + '</span> ✓';
            likeBtn.disabled = true;
            dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + profileData.dislikes + '</span> Trocar';
        } else if (profileData.userInteraction === 'dislike') {
            dislikeBtn.style.background = 'rgba(100, 100, 100, 0.3)';
            dislikeBtn.style.borderColor = '#666';
            dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + profileData.dislikes + '</span> ✓';
            dislikeBtn.disabled = true;
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + profileData.likes + '</span> Trocar';
        }
    }

    function updateViewsDisplay(views) {
        if (viewsCountElement) {
            viewsCountElement.textContent = `${formatNumber(views)} visualizações`;
        }
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    function updateMoodDisplay(mood) {
        if (moodElement) {
            const emoji = '😊';
            moodElement.textContent = emoji;
            
            moodElement.style.animation = 'none';
            setTimeout(() => {
                if (mood === 'ecstatic' || mood === 'very_happy') {
                    moodElement.style.animation = 'bounce 2s infinite';
                } else if (mood === 'happy') {
                    moodElement.style.animation = 'pulse 3s infinite';
                }
            }, 10);
        }
    }

    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            soundSystem.play('like');
            try {
                const userId = localStorage.getItem('user_id');
                const userInteraction = await githubAPI.getUserInteraction(userId);
                
                if (userInteraction && userInteraction.disliked) {
                    likeBtn.disabled = true;
                    likeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Trocando...';
                    
                    await githubAPI.removeDislike(userId);
                    await githubAPI.addLike(userId);
                } else {
                    likeBtn.disabled = true;
                    likeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Curtindo...';
                    
                    await githubAPI.addLike(userId);
                }
                
                const stats = await githubAPI.getStats();
                
                likeCountSpan.textContent = stats.likes;
                dislikeCountSpan.textContent = stats.dislikes;
                likeBtn.style.background = 'rgba(255, 0, 100, 0.3)';
                likeBtn.style.borderColor = '#ff0064';
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + stats.likes + '</span> ✓';
                likeBtn.disabled = true;
                
                dislikeBtn.disabled = false;
                dislikeBtn.style.background = '';
                dislikeBtn.style.borderColor = '';
                dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + stats.dislikes + '</span> Trocar';
                
            } catch (error) {
                console.error('❌ Erro ao processar like:', error);
                let profileData = JSON.parse(localStorage.getItem('profile_data')) || { views: 0, likes: 0, dislikes: 0, userInteraction: null };
                
                if (profileData.userInteraction === 'dislike') {
                    profileData.dislikes--;
                    profileData.likes++;
                } else {
                    profileData.likes++;
                }
                profileData.userInteraction = 'like';
                localStorage.setItem('profile_data', JSON.stringify(profileData));
                
                likeCountSpan.textContent = profileData.likes;
                dislikeCountSpan.textContent = profileData.dislikes;
                
                likeBtn.style.background = 'rgba(255, 0, 100, 0.3)';
                likeBtn.style.borderColor = '#ff0064';
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + profileData.likes + '</span> ✓';
                likeBtn.disabled = true;
                
                dislikeBtn.disabled = false;
                dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + profileData.dislikes + '</span> Trocar';
            }
        });
    }

    if (dislikeBtn) {
        dislikeBtn.addEventListener('click', async () => {
            soundSystem.play('dislike');
            try {
                const userId = localStorage.getItem('user_id');
                const userInteraction = await githubAPI.getUserInteraction(userId);
                
                if (userInteraction && userInteraction.liked) {
                    dislikeBtn.disabled = true;
                    dislikeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Trocando...';
                    
                    await githubAPI.removeLike(userId);
                    await githubAPI.addDislike(userId);
                } else {
                    dislikeBtn.disabled = true;
                    dislikeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
                    
                    await githubAPI.addDislike(userId);
                }
                
                const stats = await githubAPI.getStats();
                
                likeCountSpan.textContent = stats.likes;
                dislikeCountSpan.textContent = stats.dislikes;
                dislikeBtn.style.background = 'rgba(100, 100, 100, 0.3)';
                dislikeBtn.style.borderColor = '#666';
                dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + stats.dislikes + '</span> ✓';
                dislikeBtn.disabled = true;
                
                likeBtn.disabled = false;
                likeBtn.style.background = '';
                likeBtn.style.borderColor = '';
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + stats.likes + '</span> Trocar';
                
            } catch (error) {
                console.error('❌ Erro ao processar dislike:', error);
                let profileData = JSON.parse(localStorage.getItem('profile_data')) || { views: 0, likes: 0, dislikes: 0, userInteraction: null };
                
                if (profileData.userInteraction === 'like') {
                    profileData.likes--;
                    profileData.dislikes++;
                } else {
                    profileData.dislikes++;
                }
                profileData.userInteraction = 'dislike';
                localStorage.setItem('profile_data', JSON.stringify(profileData));
                
                likeCountSpan.textContent = profileData.likes;
                dislikeCountSpan.textContent = profileData.dislikes;
                
                dislikeBtn.style.background = 'rgba(100, 100, 100, 0.3)';
                dislikeBtn.style.borderColor = '#666';
                dislikeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> <span class="dislike-count">' + profileData.dislikes + '</span> ✓';
                dislikeBtn.disabled = true;
                
                likeBtn.disabled = false;
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + profileData.likes + '</span> Trocar';
            }
        });
    }

    function openCommentsSidebar() {
        if (commentsSidebar && commentsOverlay) {
            commentsSidebar.classList.add('open');
            commentsOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCommentsSidebar() {
        if (commentsSidebar && commentsOverlay) {
            commentsSidebar.classList.remove('open');
            commentsOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (commentsBtn) {
        commentsBtn.addEventListener('click', () => {
            soundSystem.play('comment');
            openCommentsSidebar();
            if (!githubAPI) {
                initializeComments();
            }
        });
    }

    if (closeCommentsBtn) {
        closeCommentsBtn.addEventListener('click', closeCommentsSidebar);
    }

    if (commentsOverlay) {
        commentsOverlay.addEventListener('click', closeCommentsSidebar);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && commentsSidebar && commentsSidebar.classList.contains('open')) {
            closeCommentsSidebar();
        }
    });

    let currentUserId = null;
    let githubAPI = null;
    async function initializeComments() {
        try {
            githubAPI = new GitHubAPI();
            await githubAPI.initialize();
            
            currentUserId = localStorage.getItem('userId') || generateUserId();
            localStorage.setItem('userId', currentUserId);
            
            await loadComments();
            
            setupCommentEventListeners();
            
            console.log('✅ Sistema de comentários inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar comentários:', error);
            showCommentsError('Erro ao carregar comentários. Tente novamente mais tarde.');
        }
    }


    function setupCommentEventListeners() {
        const submitBtn = document.getElementById('submitComment');
        const commentForm = document.querySelector('.comment-form');
        
        if (submitBtn && commentForm) {
            submitBtn.addEventListener('click', handleCommentSubmit);
            

            document.getElementById('commentInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    handleCommentSubmit();
                }
            });
        }
    }


    async function loadComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        try {
            commentsList.innerHTML = '<div class="loading-comments"><i class="fas fa-spinner fa-spin"></i> Carregando comentários...</div>';
            
            const comments = await githubAPI.getComments();
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="no-comments"><i class="fas fa-comment-slash"></i> Nenhum comentário ainda. Seja o primeiro!</div>';
                return;
            }
            

            comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            commentsList.innerHTML = comments.map(comment => createCommentElement(comment)).join('');
            

            addCommentActionListeners();
            
        } catch (error) {
            console.error('❌ Erro ao carregar comentários:', error);
            showCommentsError('Erro ao carregar comentários.');
        }
    }


    function createCommentElement(comment) {
        const isOwner = comment.author === localStorage.getItem('lastCommentAuthor');
        const hasLiked = comment.likedBy && comment.likedBy.includes(currentUserId);
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <i class="fas fa-user"></i>
                        ${escapeHtml(comment.author)}
                        ${isOwner ? '<span class="user-badge">Você</span>' : ''}
                    </div>
                    <div class="comment-date">${githubAPI.formatCommentDate(comment.timestamp)}</div>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div class="comment-actions">
                    <button class="comment-like ${hasLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                        <i class="fas fa-heart"></i>
                        <span>${comment.likes || 0}</span>
                    </button>
                    ${isOwner ? `<button class="comment-delete" data-comment-id="${comment.id}">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>` : ''}
                </div>
            </div>
        `;
    }


    function addCommentActionListeners() {

        document.querySelectorAll('.comment-like').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const commentId = e.currentTarget.dataset.commentId;
                await handleCommentLike(commentId, e.currentTarget);
            });
        });
        

        document.querySelectorAll('.comment-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const commentId = e.currentTarget.dataset.commentId;
                await handleCommentDelete(commentId);
            });
        });
    }


    async function handleCommentSubmit() {
        const authorInput = document.getElementById('commentAuthor');
        const textInput = document.getElementById('commentInput');
        const submitBtn = document.getElementById('submitComment');
        
        if (!authorInput || !textInput || !submitBtn) return;
        
        const author = authorInput.value.trim();
        const text = textInput.value.trim();
        
        if (!author || !text) {
            alert('Por favor, preencha seu nome e comentário.');
            return;
        }
        
        if (author.length > 50) {
            alert('Nome muito longo (máximo 50 caracteres).');
            return;
        }
        
        if (text.length > 500) {
            alert('Comentário muito longo (máximo 500 caracteres).');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            
            await githubAPI.addComment(author, text);
            

            localStorage.setItem('lastCommentAuthor', author);
            

            textInput.value = '';
            

            await loadComments();
            

            showCommentSuccess('Comentário enviado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao enviar comentário:', error);
            alert('Erro ao enviar comentário. Tente novamente.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Comentário';
        }
    }


    async function handleCommentLike(commentId, button) {
        try {
            button.disabled = true;
            
            const success = await githubAPI.likeComment(commentId, currentUserId);
            
            if (success) {

                await loadComments();
            }
            
        } catch (error) {
            console.error('❌ Erro ao curtir comentário:', error);
        } finally {
            button.disabled = false;
        }
    }


    async function handleCommentDelete(commentId) {
        if (!confirm('Tem certeza que deseja excluir este comentário?')) {
            return;
        }
        
        try {
            const success = await githubAPI.removeComment(commentId);
            
            if (success) {
                await loadComments();
                showCommentSuccess('Comentário excluído com sucesso!');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir comentário:', error);
            alert('Erro ao excluir comentário. Tente novamente.');
        }
    }


    function showCommentsError(message) {
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = `
                <div class="no-comments" style="color: #ff6b6b;">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
    }


    function showCommentSuccess(message) {

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00ff88, #00cc66);
            color: #000;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `<i class="fas fa-check"></i> ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }


    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    function generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function toggleComments() {
        const sidebar = document.getElementById('commentsSidebar');
        sidebar.classList.toggle('active');
        

        if (sidebar.classList.contains('active') && !githubAPI) {
            initializeComments();
        }
    }


    function addHoverSounds() {

        const interactiveElements = [
            '.like-btn',
            '.dislike-btn', 
            '.comments-btn',
            '.social-link',
            '.project-card',
            '.skill-item',
            '.nav-link',
            'button',
            '.btn',
            '.comment-like',
            '.comment-delete',
            '#submitComment',
            '.close-comments'
        ];
        

        interactiveElements.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.addEventListener('mouseenter', () => {
                    soundSystem.play('hover');
                });
            });
        });
        

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        interactiveElements.forEach(selector => {
                            if (node.matches && node.matches(selector)) {
                                node.addEventListener('mouseenter', () => {
                                    soundSystem.play('hover');
                                });
                            }

                            node.querySelectorAll && node.querySelectorAll(selector).forEach(element => {
                                element.addEventListener('mouseenter', () => {
                                    soundSystem.play('hover');
                                });
                            });
                        });
                    }
                });
            });
        });
        

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    addHoverSounds();
    
    initializeProfile();
});