
// ==========================================
// ASTEROIDS: GALACTIC WARFARE V3
// Main Game Engine
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const goldText = document.getElementById("gold");
const roundText = document.getElementById("round");
const livesText = document.getElementById("lives");

const startScreen = document.getElementById("start-screen");
const shopScreen = document.getElementById("shop-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const shopGoldText = document.getElementById("shop-gold");
const shopItems = document.getElementById("shop-items");

let width = 1000;
let height = 650;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ==========================================
// GAME VARIABLES
// ==========================================

let running = false;
let paused = false;
let inShop = false;
let gameOver = false;

let score = 0;
let gold = 0;
let round = 1;
let lives = 20;
let nextShopScore = 5000;

let asteroids = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let goldDrops = [];
let particles = [];
let helpers = [];

let boss = null;
let bossBullets = [];

let lastTime = 0;
let asteroidSpawnTimer = 0;
let enemySpawnTimer = 0;
let bossSpawnedThisRound = false;

const keys = {};

let bestScore = Number(localStorage.getItem("galacticBestScore")) || 0;

// ==========================================
// PLAYER SHIP
// ==========================================

const ship = {
  x: width / 2,
  y: height / 2,
  angle: -Math.PI / 2,
  speedX: 0,
  speedY: 0,
  radius: 17,
  shootCooldown: 0,
  invincible: 0,
  shieldActive: false
};

// ==========================================
// UPGRADES
// ==========================================

const upgradeList = [
  {
    id: "shield",
    name: "Regenerating Shield",
    description: "Protects your ship from damage.",
    cost: 100,
    level: 0
  },
  {
    id: "laser",
    name: "Laser Cannon",
    description: "Improves your main weapon.",
    cost: 100,
    level: 0
  },
  {
    id: "helpers",
    name: "Helper Squadron",
    description: "Adds a companion ship that attacks.",
    cost: 150,
    level: 0
  },
  {
    id: "spread",
    name: "Plasma Spread",
    description: "Fires multiple projectiles.",
    cost: 125,
    level: 0
  },
  {
    id: "emp",
    name: "EMP Pulse",
    description: "Damages nearby enemies.",
    cost: 150,
    level: 0
  },
  {
    id: "missiles",
    name: "Homing Missiles",
    description: "Fires extra tracking projectiles.",
    cost: 175,
    level: 0
  },
  {
    id: "overdrive",
    name: "Overdrive",
    description: "Increases ship speed.",
    cost: 100,
    level: 0
  },
  {
    id: "drones",
    name: "Orbital Drones",
    description: "Drones orbit and damage asteroids.",
    cost: 150,
    level: 0
  },
  {
    id: "nova",
    name: "Nova Explosion",
    description: "Creates a damaging energy blast.",
    cost: 200,
    level: 0
  },
  {
    id: "magnet",
    name: "Gold Magnet",
    description: "Attracts gold from farther away.",
    cost: 100,
    level: 0
  },
  {
    id: "heavy",
    name: "Heavy Cannon",
    description: "Fires slower but stronger shots.",
    cost: 150,
    level: 0
  },
  {
    id: "phase",
    name: "Phase Shift",
    description: "Temporarily protects your ship.",
    cost: 175,
    level: 0
  },
  {
    id: "repair",
    name: "Nano Repair",
    description: "Occasionally restores a life.",
    cost: 200,
    level: 0
  },
  {
    id: "berserker",
    name: "Berserker Mode",
    description: "Increases weapon damage.",
    cost: 200,
    level: 0
  }
];

function getUpgrade(id) {
  return upgradeList.find(item => item.id === id);
}

function upgradeLevel(id) {
  return getUpgrade(id).level;
}

// ==========================================
// START AND RESET
// ==========================================

function resetGame() {
  score = 0;
  gold = 0;
  round = 1;
  lives = 20;
  nextShopScore = 5000;

  asteroids = [];
  bullets = [];
  enemyBullets = [];
  enemies = [];
  goldDrops = [];
  particles = [];
  helpers = [];

  boss = null;
  bossBullets = [];

  asteroidSpawnTimer = 0;
  enemySpawnTimer = 0;
  bossSpawnedThisRound = false;

  ship.x = width / 2;
  ship.y = height / 2;
  ship.angle = -Math.PI / 2;
  ship.speedX = 0;
  ship.speedY = 0;
  ship.shootCooldown = 0;
  ship.invincible = 3;

  upgradeList.forEach(upgrade => {
    upgrade.level = 0;
    upgrade.cost = upgrade.id === "helpers" ? 150 :
      upgrade.id === "missiles" ? 175 :
      upgrade.id === "nova" ? 200 :
      upgrade.id === "repair" ? 200 :
      upgrade.id === "berserker" ? 200 :
      upgrade.id === "phase" ? 175 :
      upgrade.id === "emp" ? 150 :
      upgrade.id === "drones" ? 150 :
      upgrade.id === "heavy" ? 150 :
      upgrade.id === "spread" ? 125 : 100;
  });

  spawnWave();
  updateHUD();
}

function startGame() {
  resetGame();

  running = true;
  paused = false;
  inShop = false;
  gameOver = false;

  startScreen.classList.add("hidden");
  shopScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("restart-button").addEventListener("click", startGame);

document.getElementById("continue-button").addEventListener("click", () => {
  inShop = false;
  shopScreen.classList.add("hidden");
});

// ==========================================
// KEYBOARD CONTROLS
// ==========================================

window.addEventListener("keydown", event => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key.toLowerCase()] = true;

  if (event.key.toLowerCase() === "p" && running && !inShop && !gameOver) {
    paused = !paused;
  }

  if (event.key.toLowerCase() === "e" && running && !inShop) {
    useEMP();
  }

  if (event.key.toLowerCase() === "q" && running && !inShop) {
    usePhaseShift();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

// ==========================================
// ASTEROIDS
// ==========================================

function spawnWave() {
  const amount = Math.min(5 + round * 2, 30);

  for (let i = 0; i < amount; i++) {
    const side = Math.floor(Math.random() * 4);
    let x = Math.random() * width;
    let y = Math.random() * height;

    if (side === 0) x = 0;
    if (side === 1) x = width;
    if (side === 2) y = 0;
    if (side === 3) y = height;

    createAsteroid(x, y, 45 + Math.random() * 25, 2);
  }
}

function createAsteroid(x, y, radius, level, golden = false) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (35 + Math.random() * 45) * (1 + round * 0.025);

  asteroids.push({
    x,
    y,
    radius,
    level,
    health: Math.max(2, Math.ceil(radius / 10)),
    maxHealth: Math.max(2, Math.ceil(radius / 10)),
    speedX: Math.cos(angle) * speed,
    speedY: Math.sin(angle) * speed,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 2,
    golden,
    shape: Array.from({ length: 10 }, () => 0.75 + Math.random() * 0.4)
  });
}

// ==========================================
// SHOOTING
// ==========================================

function shoot() {
  const level = upgradeLevel("laser");
  const spreadLevel = upgradeLevel("spread");
  const heavyLevel = upgradeLevel("heavy");
  const berserkerLevel = upgradeLevel("berserker");

  const damage = 1 + level + heavyLevel * 2 + berserkerLevel * 2;
  const speed = 550;

  const numberOfShots = 1 + Math.min(spreadLevel, 4);

  for (let i = 0; i < numberOfShots; i++) {
    const spreadAngle = (i - (numberOfShots - 1) / 2) * 0.15;

    bullets.push({
      x: ship.x,
      y: ship.y,
      speedX: Math.cos(ship.angle + spreadAngle) * speed,
      speedY: Math.sin(ship.angle + spreadAngle) * speed,
      damage,
      radius: heavyLevel > 0 ? 6 : 3,
      life: 1.5
    });
  }

  if (upgradeLevel("missiles") > 0) {
    fireMissile();
  }
}

function fireMissile() {
  const count = Math.min(upgradeLevel("missiles"), 4);

  for (let i = 0; i < count; i++) {
    bullets.push({
      x: ship.x,
      y: ship.y,
      speedX: Math.cos(ship.angle + (Math.random() - 0.5)) * 350,
      speedY: Math.sin(ship.angle + (Math.random() - 0.5)) * 350,
      damage: 3 + upgradeLevel("missiles"),
      radius: 6,
      life: 2,
      missile: true
    });
  }
}

// ==========================================
// GOLD
// ==========================================

function dropGold(x, y, radius) {
  const amount = Math.floor(
    radius < 25 ? 5 + Math.random() * 6 :
    radius < 50 ? 15 + Math.random() * 11 :
    radius < 75 ? 30 + Math.random() * 21 :
    60 + Math.random() * 41
  );

  goldDrops.push({
    x,
    y,
    amount,
    radius: 7,
    life: 15
  });
}

function collectGold(drop) {
  gold += drop.amount;
  updateHUD();
}

// ==========================================
// ENEMIES
// ==========================================

function spawnEnemy() {
  enemies.push({
    x: Math.random() < 0.5 ? 0 : width,
    y: Math.random() * height,
    radius: 18,
    health: 3 + round,
    speed: 45 + round * 3,
    shootTimer: 1.5
  });
}

// ==========================================
// BOSSES
// ==========================================

function spawnBoss() {
  boss = {
    x: width / 2,
    y: 100,
    radius: 65,
    health: 100 + round * 35,
    maxHealth: 100 + round * 35,
    speedX: 100,
    shootTimer: 1,
    name: round >= 20 ? "LEGENDARY DESTROYER" : "GALACTIC WARLORD"
  };

  bossSpawnedThisRound = true;
}

function damageBoss(damage) {
  if (!boss) return;

  boss.health -= damage;

  if (boss.health <= 0) {
    createExplosion(boss.x, boss.y, 70);
    score += 1500 + round * 100;
    gold += 100 + round * 10;
    boss = null;
    updateHUD();
    checkShop();
  }
}

// ==========================================
// EXPLOSIONS
// ==========================================

function createExplosion(x, y, amount) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 220;

    particles.push({
      x,
      y,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.7,
      radius: 2 + Math.random() * 4
    });
  }
}

// ==========================================
// DESTROY ASTEROIDS
// ==========================================

function destroyAsteroid(asteroid) {
  const index = asteroids.indexOf(asteroid);
  if (index === -1) return;

  asteroids.splice(index, 1);

  score += Math.round(asteroid.radius * 2);

  createExplosion(asteroid.x, asteroid.y, 18);

  if (asteroid.golden) {
    dropGold(asteroid.x, asteroid.y, asteroid.radius);
  }

  if (asteroid.radius > 20) {
    const newRadius = asteroid.radius * 0.55;

    createAsteroid(asteroid.x, asteroid.y, newRadius, asteroid.level - 1);
    createAsteroid(asteroid.x, asteroid.y, newRadius, asteroid.level - 1);
  }

  updateHUD();
  checkShop();
}

// ==========================================
// SHOP
// ==========================================

function checkShop() {
  if (score >= nextShopScore && !inShop && !gameOver) {
    nextShopScore += 5000;
    openShop();
  }
}

function openShop() {
  inShop = true;
  shopScreen.classList.remove("hidden");
  renderShop();
}

function renderShop() {
  shopGoldText.textContent = gold;
  shopItems.innerHTML = "";

  upgradeList.forEach(upgrade => {
    const item = document.createElement("div");
    item.className = "shop-item";

    const levelText = upgrade.level < 5
      ? `Level ${upgrade.level} / 5`
      : `Evolution Level ${upgrade.level}`;

    item.innerHTML = `
      <h3>${upgrade.name}</h3>
      <p>${upgrade.description}</p>
      <p>${levelText}</p>
      <p>Cost: ${upgrade.cost} gold</p>
      <button type="button">BUY UPGRADE</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      buyUpgrade(upgrade.id);
    });

    shopItems.appendChild(item);
  });
}

function buyUpgrade(id) {
  const upgrade = getUpgrade(id);

  if (!upgrade || gold < upgrade.cost) return;

  gold -= upgrade.cost;
  upgrade.level++;

  upgrade.cost = Math.floor(upgrade.cost * 1.45);

  if (id === "helpers") {
    helpers.push({
      angle: helpers.length * 1.5,
      shootTimer: 0
    });
  }

  updateHUD();
  renderShop();
}

// ==========================================
// SPECIAL ABILITIES
// ==========================================

let empCooldown = 0;
let phaseCooldown = 0;
let repairTimer = 0;

function useEMP() {
  if (upgradeLevel("emp") === 0 || empCooldown > 0) return;

  const range = 180 + upgradeLevel("emp") * 40;

  asteroids.forEach(asteroid => {
    const distance = Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y);

    if (distance < range) {
      asteroid.health -= 3 + upgradeLevel("emp") * 2;
    }
  });

  enemies.forEach(enemy => {
    const distance = Math.hypot(enemy.x - ship.x, enemy.y - ship.y);

    if (distance < range) {
      enemy.health -= 10;
    }
  });

  if (boss) {
    const distance = Math.hypot(boss.x - ship.x, boss.y - ship.y);

    if (distance < range) {
      damageBoss(10 + upgradeLevel("emp") * 5);
    }
  }

  createExplosion(ship.x, ship.y, 50);
  empCooldown = Math.max(3, 12 - upgradeLevel("emp"));
}

function usePhaseShift() {
  if (upgradeLevel("phase") === 0 || phaseCooldown > 0) return;

  ship.invincible = 2 + upgradeLevel("phase");
  phaseCooldown = Math.max(5, 15 - upgradeLevel("phase"));
  createExplosion(ship.x, ship.y, 25);
}

function useNova() {
  if (upgradeLevel("nova") === 0) return;

  const range = 150 + upgradeLevel("nova") * 50;

  asteroids.forEach(asteroid => {
    const distance = Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y);

    if (distance < range) {
      asteroid.health -= 8 + upgradeLevel("nova") * 4;
    }
  });

  if (boss) {
    damageBoss(15 + upgradeLevel("nova") * 10);
  }

  createExplosion(ship.x, ship.y, 100);
}

// ==========================================
// COLLISION
// ==========================================

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function damagePlayer() {
  if (ship.invincible > 0) return;

  if (upgradeLevel("shield") > 0 && !ship.shieldActive) {
    ship.shieldActive = true;
    ship.invincible = 2;
    return;
  }

  lives--;
  ship.invincible = 2;
  createExplosion(ship.x, ship.y, 30);

  updateHUD();

  if (lives <= 0) {
    endGame();
  }
}

// ==========================================
// HUD
// ==========================================

function updateHUD() {
  scoreText.textContent = score;
  goldText.textContent = gold;
  roundText.textContent = round;
  livesText.textContent = lives;
}

// ==========================================
// GAME OVER
// ==========================================

function endGame() {
  running = false;
  gameOver = true;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("galacticBestScore", bestScore);
  }

  document.getElementById("final-score").textContent = score;
  document.getElementById("final-round").textContent = round;

  gameOverScreen.classList.remove("hidden");
}

// ==========================================
// UPDATE GAME
// ==========================================

function update(deltaTime) {
  if (!running || paused || inShop || gameOver) return;

  const dt = Math.min(deltaTime, 0.04);

  ship.shootCooldown -= dt;
  ship.invincible -= dt;
  empCooldown -= dt;
  phaseCooldown -= dt;

  // Movement
  if (keys["a"] || keys["arrowleft"]) {
    ship.angle -= 4 * dt;
  }

  if (keys["d"] || keys["arrowright"]) {
    ship.angle += 4 * dt;
  }

  if (keys["w"] || keys["arrowup"]) {
    const thrust = 260 + upgradeLevel("overdrive") * 35;

    ship.speedX += Math.cos(ship.angle) * thrust * dt;
    ship.speedY += Math.sin(ship.angle) * thrust * dt;
  }

  const maxSpeed = 300 + upgradeLevel("overdrive") * 40;
  const speed = Math.hypot(ship.speedX, ship.speedY);

  if (speed > maxSpeed) {
    ship.speedX = (ship.speedX / speed) * maxSpeed;
    ship.speedY = (ship.speedY / speed) * maxSpeed;
  }

  ship.x += ship.speedX * dt;
  ship.y += ship.speedY * dt;

  ship.speedX *= 0.99;
  ship.speedY *= 0.99;

  ship.x = (ship.x + width) % width;
  ship.y = (ship.y + height) % height;

  // Shooting
  if (keys[" "] && ship.shootCooldown <= 0) {
    shoot();
    ship.shootCooldown = upgradeLevel("heavy") > 0 ? 0.35 : 0.22;
  }

  // Asteroid spawning
  asteroidSpawnTimer -= dt;

  if (asteroidSpawnTimer <= 0 && asteroids.length < 35) {
    createAsteroid(
      Math.random() * width,
      Math.random() * height,
      35 + Math.random() * 30,
      2,
      Math.random() < 0.12
    );

    asteroidSpawnTimer = Math.max(0.5, 2 - round * 0.04);
  }

  // Enemies
  enemySpawnTimer -= dt;

  if (round >= 3 && enemySpawnTimer <= 0 && enemies.length < 5) {
    spawnEnemy();
    enemySpawnTimer = Math.max(3, 12 - round * 0.3);
  }

  // Boss every fifth round
  if (round % 5 === 0 && !bossSpawnedThisRound && !boss) {
    spawnBoss();
  }

  // Bullets
  bullets.forEach(bullet => {
    bullet.x += bullet.speedX * dt;
    bullet.y += bullet.speedY * dt;
    bullet.life -= dt;
  });

  bullets = bullets.filter(bullet => bullet.life > 0);

  // Asteroids
  asteroids.forEach(asteroid => {
    asteroid.x += asteroid.speedX * dt;
    asteroid.y += asteroid.speedY * dt;
    asteroid.rotation += asteroid.rotationSpeed * dt;

    asteroid.x = (asteroid.x + width) % width;
    asteroid.y = (asteroid.y + height) % height;

    if (distanceBetween(ship, asteroid) < ship.radius + asteroid.radius * 0.7) {
      damagePlayer();
    }
  });

  // Bullet and asteroid collisions
  bullets.forEach(bullet => {
    asteroids.forEach(asteroid => {
      if (bullet.used) return;

      if (distanceBetween(bullet, asteroid) < bullet.radius + asteroid.radius) {
        asteroid.health -= bullet.damage;
        bullet.used = true;

        if (asteroid.health <= 0) {
          destroyAsteroid(asteroid);
        }
      }
    });

    if (boss && !bullet.used && distanceBetween(bullet, boss) < bullet.radius + boss.radius) {
      damageBoss(bullet.damage);
      bullet.used = true;
    }

    enemies.forEach(enemy => {
      if (!bullet.used && distanceBetween(bullet, enemy) < bullet.radius + enemy.radius) {
        enemy.health -= bullet.damage;
        bullet.used = true;

        if (enemy.health <= 0) {
          score += 100;
          createExplosion(enemy.x, enemy.y, 20);
          enemies.splice(enemies.indexOf(enemy), 1);
          updateHUD();
          checkShop();
        }
      }
    });
  });

  bullets = bullets.filter(bullet => !bullet.used);

  // Enemy movement and shooting
  enemies.forEach(enemy => {
    const angle = Math.atan2(ship.y - enemy.y, ship.x - enemy.x);

    enemy.x += Math.cos(angle) * enemy.speed * dt;
    enemy.y += Math.sin(angle) * enemy.speed * dt;

    enemy.shootTimer -= dt;

    if (enemy.shootTimer <= 0) {
      enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        speedX: Math.cos(angle) * 220,
        speedY: Math.sin(angle) * 220,
        radius: 5,
        life: 3
      });

      enemy.shootTimer = 2;
    }

    if (distanceBetween(ship, enemy) < ship.radius + enemy.radius) {
      damagePlayer();
    }
  });

  // Enemy bullets
  enemyBullets.forEach(bullet => {
    bullet.x += bullet.speedX * dt;
    bullet.y += bullet.speedY * dt;
    bullet.life -= dt;

    if (distanceBetween(ship, bullet) < ship.radius + bullet.radius) {
      damagePlayer();
      bullet.life = 0;
    }
  });

  enemyBullets = enemyBullets.filter(bullet => bullet.life > 0);

  // Boss movement and attacks
  if (boss) {
    boss.x += boss.speedX * dt;

    if (boss.x < boss.radius || boss.x > width - boss.radius) {
      boss.speedX *= -1;
    }

    boss.shootTimer -= dt;

    if (boss.shootTimer <= 0) {
      const angle = Math.atan2(ship.y - boss.y, ship.x - boss.x);

      for (let i = -1; i <= 1; i++) {
        bossBullets.push({
          x: boss.x,
          y: boss.y,
          speedX: Math.cos(angle + i * 0.25) * 250,
          speedY: Math.sin(angle + i * 0.25) * 250,
          radius: 8,
          life: 4
        });
      }

      boss.shootTimer = 1.2;
    }

    if (distanceBetween(ship, boss) < ship.radius + boss.radius) {
      damagePlayer();
    }
  }

  bossBullets.forEach(bullet => {
    bullet.x += bullet.speedX * dt;
    bullet.y += bullet.speedY * dt;
    bullet.life -= dt;

    if (distanceBetween(ship, bullet) < ship.radius + bullet.radius) {
      damagePlayer();
      bullet.life = 0;
    }
  });

  bossBullets = bossBullets.filter(bullet => bullet.life > 0);

  // Gold drops and magnet
  goldDrops.forEach(drop => {
    drop.life -= dt;

    const magnetRange = 45 + upgradeLevel("magnet") * 75;
    const distance = distanceBetween(ship, drop);

    if (distance < magnetRange) {
      const angle = Math.atan2(ship.y - drop.y, ship.x - drop.x);
      drop.x += Math.cos(angle) * 180 * dt;
      drop.y += Math.sin(angle) * 180 * dt;
    }

    if (distanceBetween(ship, drop) < ship.radius + drop.radius) {
      collectGold(drop);
      drop.life = 0;
    }
  });

  goldDrops = goldDrops.filter(drop => drop.life > 0);

  // Helper ships
  helpers.forEach(helper => {
    helper.angle += dt * 1.5;
    helper.x = ship.x + Math.cos(helper.angle) * 65;
    helper.y = ship.y + Math.sin(helper.angle) * 65;

    helper.shootTimer -= dt;

    if (helper.shootTimer <= 0) {
      const target = asteroids[0];

      if (target) {
        const angle = Math.atan2(target.y - helper.y, target.x - helper.x);

        bullets.push({
          x: helper.x,
          y: helper.y,
          speedX: Math.cos(angle) * 450,
          speedY: Math.sin(angle) * 450,
          damage: 2 + upgradeLevel("helpers"),
          radius: 4,
          life: 1.5
        });
      }

      helper.shootTimer = 0.8;
    }
  });

  // Orbital drones
  if (upgradeLevel("drones") > 0) {
    asteroids.forEach(asteroid => {
      const distance = distanceBetween(ship, asteroid);

      if (distance < 75 + upgradeLevel("drones") * 15) {
        asteroid.health -= dt * upgradeLevel("drones") * 2;
      }
    });
  }

  // Nano repair
  if (upgradeLevel("repair") > 0 && lives < 20) {
    repairTimer += dt;

    if (repairTimer > Math.max(15, 60 - upgradeLevel("repair") * 5)) {
      lives++;
      repairTimer = 0;
      updateHUD();
    }
  }

  // Particles
  particles.forEach(particle => {
    particle.x += particle.speedX * dt;
    particle.y += particle.speedY * dt;
    particle.life -= dt;
  });

  particles = particles.filter(particle => particle.life > 0);

  // Remove destroyed asteroids
  asteroids.slice().forEach(asteroid => {
    if (asteroid.health <= 0) {
      destroyAsteroid(asteroid);
    }
  });

  // New round
  if (asteroids.length === 0 && !boss && round < 500) {
    round++;
    bossSpawnedThisRound = false;
    spawnWave();
    updateHUD();
  }

  if (round >= 500 && !boss && asteroids.length === 0) {
    endGame();
  }
}

// ==========================================
// DRAWING
// ==========================================

function drawBackground() {
  ctx.fillStyle = "#030611";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 100; i++) {
    const x = (i * 137) % width;
    const y = (i * 79) % height;

    ctx.fillStyle = "rgba(180, 210, 255, 0.6)";
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawShip() {
  if (ship.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  // Engine glow
  ctx.fillStyle = "#ff9d35";
  ctx.beginPath();
  ctx.moveTo(-12, -7);
  ctx.lineTo(-30 - Math.random() * 10, 0);
  ctx.lineTo(-12, 7);
  ctx.fill();

  // Ship body
  ctx.fillStyle = "#d8f6ff";
  ctx.strokeStyle = "#43cfff";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-14, -13);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Shield effect
  if (upgradeLevel("shield") > 0 && ship.shieldActive) {
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = "#39dfff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawAsteroids() {
  asteroids.forEach(asteroid => {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);

    ctx.beginPath();

    asteroid.shape.forEach((point, i) => {
      const angle = (i / asteroid.shape.length) * Math.PI * 2;
      const x = Math.cos(angle) * asteroid.radius * point;
      const y = Math.sin(angle) * asteroid.radius * point;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.closePath();

    ctx.fillStyle = asteroid.golden ? "#8b6b19" : "#555e78";
    ctx.strokeStyle = asteroid.golden ? "#ffd84a" : "#a8b5d1";
    ctx.lineWidth = asteroid.golden ? 3 : 2;

    ctx.fill();
    ctx.stroke();

    // Health bar
    if (asteroid.health < asteroid.maxHealth) {
      const barWidth = asteroid.radius * 1.5;

      ctx.fillStyle = "#441111";
      ctx.fillRect(-barWidth / 2, -asteroid.radius - 12, barWidth, 5);

      ctx.fillStyle = "#ff5555";
      ctx.fillRect(
        -barWidth / 2,
        -asteroid.radius - 12,
        barWidth * Math.max(0, asteroid.health / asteroid.maxHealth),
        5
      );
    }

    ctx.restore();
  });
}

function drawBullets() {
  bullets.forEach(bullet => {
    ctx.fillStyle = bullet.missile ? "#ff9c35" : "#68eaff";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBoss() {
  if (!boss) return;

  ctx.fillStyle = "#9b245e";
  ctx.strokeStyle = "#ff5d9b";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(boss.name, boss.x, boss.y - boss.radius - 18);

  const barWidth = width * 0.6;

  ctx.fillStyle = "#481010";
  ctx.fillRect(width * 0.2, 20, barWidth, 16);

  ctx.fillStyle = "#ff3434";
  ctx.fillRect(
    width * 0.2,
    20,
    barWidth * Math.max(0, boss.health / boss.maxHealth),
    16
  );
}

function drawGold() {
  goldDrops.forEach(drop => {
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("+" + drop.amount, drop.x, drop.y - 14);
  });
}

function drawParticles() {
  particles.forEach(particle => {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = "#ffb347";

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function drawHelpers() {
  helpers.forEach(helper => {
    ctx.fillStyle = "#54eaff";
    ctx.beginPath();
    ctx.arc(helper.x, helper.y, 9, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEnemyBullets() {
  [...enemyBullets, ...bossBullets].forEach(bullet => {
    ctx.fillStyle = "#ff4040";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
  drawBackground();
  drawAsteroids();
  drawGold();
  drawBullets();
  drawEnemyBullets();
  drawEnemies();
  drawBoss();
  drawHelpers();
  drawParticles();
  drawShip();

  if (paused && running) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", width / 2, height / 2);
  }
}

// ==========================================
// MAIN GAME LOOP
// ==========================================

function gameLoop(timestamp) {
  const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
