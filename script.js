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
        
        // Aumentar a distância mínima para dar sensação de que o tanque está mais longe
        if (distance > 150) {
            this.tank.x += (dx / distance) * this.tank.speed;
            this.tank.y += (dy / distance) * this.tank.speed;
        }
        
        this.tank.angle = Math.atan2(dy, dx);
        
        const now = Date.now();
        if (now - this.tank.lastShot > 1200) { // Tiro mais rápido para melhor jogabilidade
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
            
            // Verificar colisão com o ponteiro do mouse (área maior para melhor detecção)
            const distanceToMouse = Math.sqrt(
                Math.pow(bullet.x - this.mouse.x, 2) + Math.pow(bullet.y - this.mouse.y, 2)
            );
            if (distanceToMouse < 35) {
                this.createRealisticExplosion(bullet.x, bullet.y, 'hit');
                this.bullets.splice(i, 1);
                continue;
            }
            
            if (bullet.life <= 0 || 
                bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.createRealisticExplosion(bullet.x, bullet.y, 'miss');
                this.bullets.splice(i, 1);
            }
        }
    }
    
    createRealisticExplosion(x, y, hitType = 'hit') {
        const isHit = hitType === 'hit';
        const baseParticleCount = isHit ? 25 : 15;
        const particleCount = baseParticleCount + Math.random() * (isHit ? 20 : 10);
        
        // Criar ondas de choque múltiplas
        for (let wave = 0; wave < (isHit ? 3 : 2); wave++) {
            setTimeout(() => {
                this.createShockwave(x, y, wave, isHit);
            }, wave * 50);
        }
        
        // Partículas principais com física mais realista
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.8;
            const baseSpeed = isHit ? 4 + Math.random() * 6 : 2 + Math.random() * 4;
            const speed = baseSpeed * (0.7 + Math.random() * 0.6);
            const size = isHit ? 4 + Math.random() * 12 : 3 + Math.random() * 8;
            const life = isHit ? 40 + Math.random() * 30 : 25 + Math.random() * 20;
            
            // Diferentes tipos de partículas para mais realismo
            const particleType = Math.random();
            let type, color;
            
            if (particleType < 0.3) {
                type = 'spark';
                color = { r: 255, g: 220 + Math.random() * 35, b: 100 + Math.random() * 50 };
            } else if (particleType < 0.6) {
                type = 'fire';
                color = { r: 255, g: 80 + Math.random() * 120, b: Math.random() * 30 };
            } else if (particleType < 0.8) {
                type = 'smoke';
                color = { r: 60 + Math.random() * 40, g: 60 + Math.random() * 40, b: 60 + Math.random() * 40 };
            } else {
                type = 'debris';
                color = { r: 100 + Math.random() * 50, g: 80 + Math.random() * 40, b: 60 + Math.random() * 30 };
            }
            
            this.explosions.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                maxSize: size,
                life: life,
                maxLife: life,
                gravity: type === 'smoke' ? -0.05 : (type === 'debris' ? 0.15 : 0.08),
                friction: type === 'smoke' ? 0.99 : 0.97,
                color: color,
                type: type,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
        
        // Explosão central mais dramática
        this.explosions.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 0,
            maxSize: isHit ? 80 + Math.random() * 40 : 50 + Math.random() * 25,
            life: isHit ? 35 : 25,
            maxLife: isHit ? 35 : 25,
            gravity: 0,
            friction: 1,
            color: { r: 255, g: 255, b: 255 },
            type: 'core',
            intensity: isHit ? 1.5 : 1.0
        });
        
        // Adicionar flash de luz para acertos
        if (isHit) {
            this.explosions.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                size: 120,
                maxSize: 120,
                life: 8,
                maxLife: 8,
                gravity: 0,
                friction: 1,
                color: { r: 255, g: 255, b: 255 },
                type: 'flash'
            });
        }
    }
    
    createShockwave(x, y, waveIndex, isHit) {
        const maxSize = isHit ? 100 + waveIndex * 30 : 60 + waveIndex * 20;
        const life = 20 - waveIndex * 3;
        
        this.explosions.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: waveIndex * 10,
            maxSize: maxSize,
            life: life,
            maxLife: life,
            gravity: 0,
            friction: 1,
            color: { r: 255, g: 200 - waveIndex * 50, b: 100 - waveIndex * 30 },
            type: 'shockwave',
            waveIndex: waveIndex
        });
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.life--;
            
            // Atualizar posição com física
            explosion.x += explosion.vx;
            explosion.y += explosion.vy;
            
            // Aplicar gravidade e fricção
            explosion.vy += explosion.gravity;
            explosion.vx *= explosion.friction;
            explosion.vy *= explosion.friction;
            
            // Atualizar rotação para debris
            if (explosion.rotationSpeed) {
                explosion.rotation += explosion.rotationSpeed;
            }
            
            // Atualizar tamanho baseado no tipo
            const progress = 1 - explosion.life / explosion.maxLife;
            
            if (explosion.type === 'core') {
                // Explosão central cresce rapidamente e depois diminui
                if (progress < 0.2) {
                    explosion.size = (progress / 0.2) * explosion.maxSize;
                } else {
                    explosion.size = explosion.maxSize * (1 - (progress - 0.2) / 0.8);
                }
            } else if (explosion.type === 'flash') {
                // Flash diminui rapidamente
                explosion.size = explosion.maxSize * (1 - progress * progress);
            } else if (explosion.type === 'shockwave') {
                // Onda de choque expande rapidamente
                explosion.size = explosion.maxSize * Math.min(1, progress * 3);
            } else if (explosion.type === 'smoke') {
                // Fumaça cresce e depois diminui lentamente
                if (progress < 0.4) {
                    explosion.size = explosion.maxSize * (progress / 0.4);
                } else {
                    explosion.size = explosion.maxSize * (1 - (progress - 0.4) * 0.3);
                }
            } else {
                // Outras partículas diminuem gradualmente
                explosion.size = (explosion.life / explosion.maxLife) * explosion.maxSize;
            }
            
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
            tankElement.style.zIndex = '-10';
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
        const alpha = explosion.life / explosion.maxLife;
        const { r, g, b } = explosion.color;
        
        this.ctx.save();
        
        if (explosion.type === 'core') {
            // Explosão central com gradiente radial mais intenso
            const intensity = explosion.intensity || 1.0;
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.size
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95 * intensity})`);
            gradient.addColorStop(0.2, `rgba(255, 240, 150, ${alpha * 0.8 * intensity})`);
            gradient.addColorStop(0.5, `rgba(255, 150, 50, ${alpha * 0.6 * intensity})`);
            gradient.addColorStop(0.8, `rgba(255, 80, 0, ${alpha * 0.3 * intensity})`);
            gradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (explosion.type === 'flash') {
            // Flash de luz branca intensa
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.size
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 200, ${alpha * 0.4})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (explosion.type === 'shockwave') {
            // Onda de choque circular
            const waveAlpha = alpha * (0.6 - explosion.waveIndex * 0.15);
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${waveAlpha})`;
            this.ctx.lineWidth = 3 - explosion.waveIndex * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Adicionar brilho interno
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size * 0.9, 0, Math.PI * 2);
            this.ctx.stroke();
            
        } else if (explosion.type === 'spark') {
            // Partículas de faísca com brilho intenso
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            
            // Desenhar como estrela para faíscas
            this.ctx.translate(explosion.x, explosion.y);
            this.ctx.rotate(explosion.rotation || 0);
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                const x = Math.cos(angle) * explosion.size;
                const y = Math.sin(angle) * explosion.size;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // Centro brilhante
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, explosion.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (explosion.type === 'smoke') {
            // Partículas de fumaça
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (explosion.type === 'debris') {
            // Detritos com rotação
            this.ctx.translate(explosion.x, explosion.y);
            this.ctx.rotate(explosion.rotation || 0);
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.fillRect(-explosion.size/2, -explosion.size/2, explosion.size, explosion.size);
            
            // Adicionar brilho nas bordas
            this.ctx.strokeStyle = `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 20)}, ${alpha * 0.6})`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-explosion.size/2, -explosion.size/2, explosion.size, explosion.size);
            
        } else {
            // Partículas de fogo padrão melhoradas
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `rgba(${r}, ${Math.floor(g/2)}, 0, ${alpha})`;
            
            // Gradiente para fogo
            const fireGradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.size
            );
            fireGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
            fireGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha})`);
            fireGradient.addColorStop(1, `rgba(${Math.floor(r*0.7)}, ${Math.floor(g*0.3)}, 0, ${alpha * 0.3})`);
            
            this.ctx.fillStyle = fireGradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
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

// Aguardar carregamento do DOM
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Inicializar jogo
        const game = new BattleCityGame();
        
        // Adicionar sons de hover
        addHoverSounds();
        
        // Inicializar perfil
        initializeProfile();
        
        // Inicializar comentários
        initializeComments();
        
        // Verificar se usuário está logado
        checkLoginStatus();
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
});

// Verificação de Login
function checkLoginStatus() {
    // Verifica se o banco de dados está disponível e se há sessão ativa
    if (!window.dbClient || !window.dbClient.isLoggedIn()) {
        // Se não estiver logado, redireciona para a página de login
        alert('🔒 Você precisa fazer login para acessar esta página!');
        window.location.href = 'index.html';
        return;
    }
    
    const currentUser = window.dbClient.getCurrentUser();
    console.log('✅ Usuário logado:', currentUser.username);
    
    // Adicionar botão de logout
    addLogoutButton();
}

// Adicionar botão de logout
function addLogoutButton() {
    const profileCard = document.querySelector('.profile-card');
    if (profileCard && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
        logoutBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff4757;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.3s ease;
        `;
        
        logoutBtn.addEventListener('mouseover', () => {
            logoutBtn.style.background = '#ff3742';
        });
        
        logoutBtn.addEventListener('mouseout', () => {
            logoutBtn.style.background = '#ff4757';
        });
        
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                if (window.dbClient) {
                    window.dbClient.logout();
                }
                alert('👋 Logout realizado com sucesso!');
                window.location.href = 'index.html';
            }
        });
        
        profileCard.style.position = 'relative';
        profileCard.appendChild(logoutBtn);
    }
}

// Funções globais para verificação de login
window.isLoggedIn = function() {
    return window.dbClient && window.dbClient.isLoggedIn();
};

window.getCurrentUser = function() {
    if (window.dbClient && window.dbClient.isLoggedIn()) {
        const user = window.dbClient.getCurrentUser();
        return user ? user.username : null;
    }
    return null;
};

window.logout = function() {
    if (window.dbClient) {
        window.dbClient.logout();
    }
    alert('👋 Logout realizado com sucesso!');
    window.location.href = 'index.html';
};

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

function initializeProfile() {
    console.log('🎯 Inicializando sistema de interações...');
    
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    
    // Carregar dados salvos
    let interactions = JSON.parse(localStorage.getItem('portfolioInteractions')) || {
        likes: 0,
        dislikes: 0,
        userInteractions: {}
    };
    
    // Atualizar display
    function updateDisplay() {
        likeCount.textContent = interactions.likes;
        dislikeCount.textContent = interactions.dislikes;
    }
    
    // Salvar interações
    function saveInteractions() {
        localStorage.setItem('portfolioInteractions', JSON.stringify(interactions));
    }
    
    // Verificar se usuário já interagiu
    function hasUserInteracted() {
        const currentUser = window.getCurrentUser();
        return currentUser && interactions.userInteractions[currentUser];
    }
    
    // Event listeners
    likeBtn.addEventListener('click', function() {
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            alert('🔒 Você precisa fazer login para curtir!');
            return;
        }
        
        if (!hasUserInteracted()) {
            const currentUser = window.getCurrentUser();
            interactions.likes++;
            interactions.userInteractions[currentUser] = 'like';
            updateDisplay();
            saveInteractions();
            soundSystem.play('like');
        } else {
            alert('✋ Você já interagiu com este portfólio!');
        }
    });

    dislikeBtn.addEventListener('click', function() {
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            alert('🔒 Você precisa fazer login para descurtir!');
            return;
        }
        
        if (!hasUserInteracted()) {
            const currentUser = window.getCurrentUser();
            interactions.dislikes++;
            interactions.userInteractions[currentUser] = 'dislike';
            updateDisplay();
            saveInteractions();
            soundSystem.play('dislike');
        } else {
            alert('✋ Você já interagiu com este portfólio!');
        }
    });
    
    // Inicializar display
    updateDisplay();
    
    console.log('✅ Sistema de interações inicializado');
}

// Sistema de Comentários
function initializeComments() {
    const commentsBtn = document.getElementById('commentsBtn');
    const commentsSidebar = document.getElementById('commentsSidebar');
    const commentsOverlay = document.getElementById('commentsOverlay');
    const closeCommentsBtn = document.getElementById('closeComments');
    const submitCommentBtn = document.getElementById('submitComment');
    const commentInput = document.getElementById('commentInput');
    const commentsList = document.getElementById('commentsList');
    const commentCount = document.getElementById('commentCount');
    
    let comments = JSON.parse(localStorage.getItem('portfolioComments')) || [];
    
    // Atualizar contador de comentários
    function updateCommentCount() {
        commentCount.textContent = comments.length;
    }
    
    // Renderizar comentários
    function renderComments() {
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">Nenhum comentário ainda. Seja o primeiro!</div>';
        } else {
            commentsList.innerHTML = comments.map((comment, index) => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">Visitante</span>
                        <span class="comment-date">${comment.date}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <button class="comment-like" data-index="${index}">
                            <i class="fas fa-heart"></i> ${comment.likes || 0}
                        </button>
                        <button class="comment-delete" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        updateCommentCount();
    }
    
    // Abrir sidebar de comentários
    commentsBtn.addEventListener('click', () => {
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            alert('🔒 Você precisa fazer login para ver os comentários!');
            return;
        }
        commentsSidebar.classList.add('open');
        commentsOverlay.classList.add('active');
        soundSystem.play('comment');
        renderComments();
    });
    
    // Fechar sidebar de comentários
    function closeComments() {
        commentsSidebar.classList.remove('open');
        commentsOverlay.classList.remove('active');
    }
    
    closeCommentsBtn.addEventListener('click', closeComments);
    commentsOverlay.addEventListener('click', closeComments);
    
    // Enviar comentário
    submitCommentBtn.addEventListener('click', () => {
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            alert('🔒 Você precisa fazer login para comentar!');
            return;
        }
        const text = commentInput.value.trim();
        if (text) {
            const newComment = {
                text: text,
                date: new Date().toLocaleDateString('pt-BR'),
                likes: 0
            };
            comments.push(newComment);
            localStorage.setItem('portfolioComments', JSON.stringify(comments));
            commentInput.value = '';
            renderComments();
            soundSystem.play('comment');
        }
    });
    
    // Event delegation para likes e delete
    commentsList.addEventListener('click', (e) => {
        if (e.target.closest('.comment-like')) {
            if (!window.isLoggedIn || !window.isLoggedIn()) {
                alert('🔒 Você precisa fazer login para curtir comentários!');
                return;
            }
            const index = parseInt(e.target.closest('.comment-like').dataset.index);
            comments[index].likes = (comments[index].likes || 0) + 1;
            localStorage.setItem('portfolioComments', JSON.stringify(comments));
            renderComments();
            soundSystem.play('like');
        }
        
        if (e.target.closest('.comment-delete')) {
            if (!window.isLoggedIn || !window.isLoggedIn()) {
                alert('🔒 Você precisa fazer login para deletar comentários!');
                return;
            }
            const index = parseInt(e.target.closest('.comment-delete').dataset.index);
            comments.splice(index, 1);
            localStorage.setItem('portfolioComments', JSON.stringify(comments));
            renderComments();
        }
    });
    
    // Enter para enviar comentário
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitCommentBtn.click();
        }
    });
    
    // Inicializar contador
    updateCommentCount();
}