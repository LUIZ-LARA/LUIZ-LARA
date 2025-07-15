let tank = null;
let mouseX = 0;
let mouseY = 0;
let isMouseInWindow = true;
let searchAngle = 0;
let searchDirection = { x: 1, y: 0 };
let searchTimer = 0;
let searchChangeInterval = 120;
let currentRotation = 0;
let targetRotation = 0;
let bullets = [];
let explosions = [];
let lastShot = 0;
let tankX = window.innerWidth / 2;
let tankY = window.innerHeight / 2;

function updateTankPosition() {
    tankX = window.innerWidth / 2;
    tankY = window.innerHeight / 2;
}

window.addEventListener('resize', updateTankPosition);

function initTank() {
    console.log('🎯 Iniciando sistema do tanque...');

    tank = document.getElementById('pixelTank');

    if (!tank) {
        console.error('❌ Elemento do tanque não encontrado!');
        alert('Erro: Tanque não encontrado no DOM!');
        return;
    }

    console.log('✅ Tanque encontrado:', tank);

    tankX = window.innerWidth / 2;
    tankY = window.innerHeight / 2;

    tank.style.left = `${tankX}px`;
    tank.style.top = `${tankY}px`;
    tank.style.transform = `translate(-50%, -50%) rotate(0deg)`;

    tank.style.display = 'block';
    tank.style.visibility = 'visible';
    tank.style.opacity = '1';

    console.log('🚀 Tanque inicializado no centro:', tankX, tankY);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', () => { isMouseInWindow = true; });
    document.addEventListener('mouseleave', () => { isMouseInWindow = false; });

    animate();
}

function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMouseInWindow = true;
}


function normalizeAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
}
function animate() {
    if (!tank) return;

    const now = Date.now();

    if (isMouseInWindow) {
        const dx = mouseX - tankX;
        const dy = mouseY - tankY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 80) {
            tankX += (dx / distance) * 0.8;
            tankY += (dy / distance) * 0.8;
        }

        targetRotation = Math.atan2(dy, dx);

        let rotationDiff = normalizeAngle(targetRotation - currentRotation);
        currentRotation += rotationDiff * 0.1;

        tank.style.left = `${tankX}px`;
        tank.style.top = `${tankY}px`;
        tank.style.transform = `translate(-50%, -50%) rotate(${currentRotation}rad)`;

        if (now - lastShot > 800) {
            createBullet();
            lastShot = now;
        }
    } else {
        searchTimer++;

        if (searchTimer >= searchChangeInterval ||
            tankX <= 50 || tankX >= window.innerWidth - 50 ||
            tankY <= 50 || tankY >= window.innerHeight - 50) {

            const directions = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 },
                { x: 1, y: 1 },
                { x: -1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: -1 }
            ];

            searchDirection = directions[Math.floor(Math.random() * directions.length)];
            searchTimer = 0;
            searchChangeInterval = 60 + Math.random() * 120;
        }

        const searchSpeed = 0.8;
        tankX += searchDirection.x * searchSpeed;
        tankY += searchDirection.y * searchSpeed;

        tankX = Math.max(60, Math.min(window.innerWidth - 60, tankX));
        tankY = Math.max(60, Math.min(window.innerHeight - 60, tankY));

        targetRotation = Math.atan2(searchDirection.y, searchDirection.x);

        let rotationDiff = targetRotation - currentRotation;
        if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
        if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
        currentRotation += rotationDiff * 0.1;

        tank.style.left = `${tankX}px`;
        tank.style.top = `${tankY}px`;
        tank.style.transform = `translate(-50%, -50%) rotate(${currentRotation}rad)`;

        if (now - lastShot > 1500) {
            createBulletInDirection();
            lastShot = now;
        }
    }

    tank.style.opacity = '1';

    updateBullets();

    requestAnimationFrame(animate);
}

function createBullet() {
    const dx = mouseX - tankX;
    const dy = mouseY - tankY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const cannonLength = 32;
    const bulletStartX = tankX + Math.cos(angle) * cannonLength;
    const bulletStartY = tankY + Math.sin(angle) * cannonLength;

    bullets.push({
        x: bulletStartX,
        y: bulletStartY,
        vx: (dx / distance) * 5,
        vy: (dy / distance) * 5,
        life: 120
    });
}

function createBulletToCenter() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = centerX - tankX;
    const dy = centerY - tankY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const cannonLength = 32;
    const bulletStartX = tankX + Math.cos(angle) * cannonLength;
    const bulletStartY = tankY + Math.sin(angle) * cannonLength;

    bullets.push({
        x: bulletStartX,
        y: bulletStartY,
        vx: (dx / distance) * 5,
        vy: (dy / distance) * 5,
        life: 120
    });
}

function createBulletInDirection() {
    const angle = Math.atan2(searchDirection.y, searchDirection.x);

    const cannonLength = 32;
    const bulletStartX = tankX + Math.cos(angle) * cannonLength;
    const bulletStartY = tankY + Math.sin(angle) * cannonLength;
    bullets.push({
        x: bulletStartX,
        y: bulletStartY,
        vx: searchDirection.x * 5,
        vy: searchDirection.y * 5,
        life: 120
    });
}

function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        size: 0,
        maxSize: 30,
        life: 30,
        maxLife: 30
    });
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.life--;
        explosion.size = (1 - explosion.life / explosion.maxLife) * explosion.maxSize;

        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
    }
}

function drawExplosions() {
    explosions.forEach(explosion => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = (explosion.x - explosion.size / 2) + 'px';
        div.style.top = (explosion.y - explosion.size / 2) + 'px';
        div.style.width = explosion.size + 'px';
        div.style.height = explosion.size + 'px';
        div.style.borderRadius = '50%';
        div.style.backgroundColor = `rgba(255, ${150 + explosion.life * 8}, 50, ${explosion.life / explosion.maxLife})`;
        div.style.pointerEvents = 'none';
        div.style.zIndex = '1000';
        document.body.appendChild(div);

        setTimeout(() => {
            if (div.parentNode) {
                div.parentNode.removeChild(div);
            }
        }, 50);
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        if (isMouseInWindow) {
            const distanceToMouse = Math.sqrt(
                Math.pow(bullet.x - mouseX, 2) + Math.pow(bullet.y - mouseY, 2)
            );
            if (distanceToMouse < 20) {
                createExplosion(bullet.x, bullet.y);
                bullets.splice(i, 1);
                continue;
            }
        }

        if (bullet.x < 20 || bullet.x > window.innerWidth - 20 ||
            bullet.y < 20 || bullet.y > window.innerHeight - 20) {
            createExplosion(bullet.x, bullet.y);
            bullets.splice(i, 1);
            continue;
        }

        if (bullet.life <= 0) {
            bullets.splice(i, 1);
        }
    }

    updateExplosions();

    drawExplosions();

    drawBullets();
}

function drawBullets() {
    document.querySelectorAll('.bullet').forEach(b => b.remove());
    bullets.forEach(bullet => {
        const bulletEl = document.createElement('div');
        bulletEl.className = 'bullet';
        bulletEl.style.position = 'fixed';
        bulletEl.style.width = '6px';
        bulletEl.style.height = '6px';
        bulletEl.style.backgroundColor = '#ffff00';
        bulletEl.style.borderRadius = '50%';
        bulletEl.style.left = bullet.x + 'px';
        bulletEl.style.top = bullet.y + 'px';
        bulletEl.style.zIndex = '999';
        bulletEl.style.pointerEvents = 'none';
        document.body.appendChild(bulletEl);
    });
}
document.addEventListener('DOMContentLoaded', initTank);

if (document.readyState !== 'loading') {
    initTank();
}