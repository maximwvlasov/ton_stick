const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI constants - define these first
const TOP_BAR_HEIGHT = 50;
const PLATFORM_HEIGHT = 100;
const PLATFORM_Y = 500;
const PLAYER_SIZE = 20;
const STICK_WIDTH = 5;
const GROWING_SPEED = 3;
const FALLING_SPEED = 0.05;
const MOVING_SPEED = 2;
const PERFECT_MARGIN = 5;
const PLATFORM_Y_OFFSET = 0; // No offset needed

// Game variables
let stickLength = 0;
let isGrowing = false;
let isFalling = false;
let fallAngle = 0;
let score = 0;
let lives = 5;
let coins = 0;
let platform1X = 50;
let platform1Width = 50;
let platform2X = 200;
let platform2Width = 50;
let platform3X = 350;
let platform3Width = 50;
let playerX = platform1X + 20;
let playerY = 480;
let stickX = platform1X + platform1Width;
let stickY = 500;
let isMoving = false;
let gameOver = false;
let perfectBonus = false;
let showAdPopup = false;
let showLeaderboard = false;
let showMenu = false;

// Platform items
let platform1Heart = false;
let platform2Heart = false;
let platform3Heart = false;
let platform1Coin = false;
let platform2Coin = false;
let platform3Coin = false;

// Level variables
let currentLevel = 1;
let maxLevel = 10;
let levelProgress = 0; // Added to track level progress
let showLevelUpAnimation = false;
let levelUpTimer = 0;

// Background elements - simplified, no animations
let moonX = 300;
let moonY = 100;
let moonSize = 30;

// Telegram integration
let tg = window.Telegram ? window.Telegram.WebApp : null;

// Mock leaderboard data
const leaderboardData = [
    { name: "Player1", score: 42 },
    { name: "Player2", score: 36 },
    { name: "Player3", score: 29 },
    { name: "Player4", score: 25 },
    { name: "Player5", score: 18 },
    { name: "Player6", score: 15 },
    { name: "Player7", score: 12 },
    { name: "Player8", score: 8 },
];

// Game states
const GAME_STATE = {
    PLAYING: 'playing',
    FRIENDS: 'friends',
    REWARDS: 'rewards',
    LEADERBOARD: 'leaderboard'
};

let currentGameState = GAME_STATE.PLAYING; // Initialize game state


// Initialize the game
function init() {
    stickLength = 0;
    isGrowing = false;
    isFalling = false;
    fallAngle = 0;
    isMoving = false;
    gameOver = false;
    perfectBonus = false;
    showAdPopup = false;
    showLeaderboard = false;
    showMenu = false;
    currentLevel = 1;
    levelProgress = 0; // Reset level progress
    currentGameState = GAME_STATE.PLAYING; // Reset game state

    // Platform positioning
    platform1X = 50;
    platform1Width = getPlatformWidth();
    platform2X = 200;
    platform2Width = getPlatformWidth();
    platform3X = 350;
    platform3Width = getPlatformWidth();

    // Initialize platform items (30% chance for heart, 50% chance for coin)
    platform1Heart = false;
    platform2Heart = Math.random() < 0.3;
    platform3Heart = Math.random() < 0.3;

    platform1Coin = false;
    platform2Coin = !platform2Heart && Math.random() < 0.5;
    platform3Coin = !platform3Heart && Math.random() < 0.5;

    // Player positioning - ensure player is on top of the platform
    playerX = platform1X + 20;
    playerY = PLATFORM_Y - PLAYER_SIZE;

    // Stick position
    stickX = platform1X + platform1Width;
    stickY = PLATFORM_Y;
    sticks = [];

    // Only reset score, coins and lives when starting a new game after game over
    if (score > 0) {
        score = 0;
        lives = 5;
        coins = 0;
        currentLevel = 1;
    }

    // Initialize Telegram mini app
    if (tg) {
        tg.expand();
        tg.MainButton.setText('Share Score');
        tg.MainButton.hide();
    }
}

// Get platform width based on current level
function getPlatformWidth() {
    // Base width that decreases with level
    const baseWidth = Math.max(30, 60 - (currentLevel * 3));
    // Add some randomness
    return Math.floor(baseWidth + Math.random() * 20);
}

// Event listeners
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check for top bar button clicks
    if (clickY <= TOP_BAR_HEIGHT) {
        const buttonWidth = canvas.width / 5;
        const buttonIndex = Math.floor(clickX / buttonWidth);

        switch (buttonIndex) {
            case 0:
                currentGameState = GAME_STATE.PLAYING;
                break;
            case 1:
                currentGameState = GAME_STATE.FRIENDS;
                break;
            case 2:
                currentGameState = GAME_STATE.REWARDS;
                showAdPopup = true;
                break;
            case 3:
                currentGameState = GAME_STATE.LEADERBOARD;
                showLeaderboard = true;
                break;
            case 4:
                // Wallet action
                break;
        }
        return;
    }

    // Check for menu item clicks
    if (showMenu && clickY > TOP_BAR_HEIGHT && clickY < TOP_BAR_HEIGHT + 160 && clickX >= 10 && clickX <= 160) {
        // Leaderboard item
        if (clickY > TOP_BAR_HEIGHT && clickY < TOP_BAR_HEIGHT + 40) {
            showLeaderboard = !showLeaderboard;
            showMenu = false;
            return;
        }

        // Buy Lives item
        if (clickY > TOP_BAR_HEIGHT + 40 && clickY < TOP_BAR_HEIGHT + 80) {
            showAdPopup = true;
            showMenu = false;
            return;
        }

        // Sound toggle (placeholder)
        if (clickY > TOP_BAR_HEIGHT + 80 && clickY < TOP_BAR_HEIGHT + 120) {
            // Toggle sound would go here
            showMenu = false;
            return;
        }

        // How to Play
        if (clickY > TOP_BAR_HEIGHT + 120 && clickY < TOP_BAR_HEIGHT + 160) {
            // Show tutorial would go here
            showMenu = false;
            return;
        }

        // Restart Game
        if (clickY > TOP_BAR_HEIGHT + 160 && clickY < TOP_BAR_HEIGHT + 200) {
            init();
            showMenu = false;
            return;
        }
    }

    // Close menu if open and clicked outside
    if (showMenu && (clickY > TOP_BAR_HEIGHT + 160 || clickX > 160)) {
        showMenu = false;
        return;
    }

    // Close leaderboard if it's open and clicked outside
    if (showLeaderboard && clickY > TOP_BAR_HEIGHT) {
        showLeaderboard = false;
        return;
    }

    if (showAdPopup) {
        // Check if "Watch Ad" button is clicked
        if (clickX >= canvas.width / 2 - 100 && clickX <= canvas.width / 2 && 
            clickY >= canvas.height / 2 + 30 && clickY <= canvas.height / 2 + 70) {
            // Simulate watching an ad
            setTimeout(() => {
                lives += 1; // Add only 1 life per ad
                score += 100; // Add score
                if (lives > 5) lives = 5;

                if (lives < 5) {
                    showAdPopup = true; // Keep popup open if still need more lives
                } else {
                    showAdPopup = false;
                    gameOver = false;
                }
            }, 1000);
        }

        // Check if "Buy Lives" button is clicked
        if (clickX >= canvas.width / 2 && clickX <= canvas.width / 2 + 100 && 
            clickY >= canvas.height / 2 + 30 && clickY <= canvas.height / 2 + 70) {
            // Buy lives with coins
            if (coins >= 3) {
                coins -= 3;
                lives = 5;
                showAdPopup = false;
                gameOver = false;
            } else {
                // Visual feedback that they don't have enough coins
                // This could be enhanced with an actual message
                // For now, we'll just keep the popup open
            }
        }

        // Close button
        if (clickX >= canvas.width / 2 + 120 && clickX <= canvas.width / 2 + 140 && 
            clickY >= canvas.height / 2 - 90 && clickY <= canvas.height / 2 - 70) {
            showAdPopup = false;
        }

        return;
    }

    if (gameOver) {
        init();
        return;
    }

    if (!isGrowing && !isFalling && !isMoving) {
        isGrowing = true;
    }
});

canvas.addEventListener('mouseup', () => {
    if (isGrowing) {
        isGrowing = false;
        isFalling = true;
        fallAngle = 0;
    }
});

// Animated background elements
let fallingStars = [];
let birds = [];

// Initialize some falling stars
for (let i = 0; i < 10; i++) {
    fallingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (PLATFORM_Y - 100),
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2,
        twinkle: Math.random() > 0.5,
        twinkleSpeed: 0.03 + Math.random() * 0.05
    });
}

// Initialize some 8-bit birds
for (let i = 0; i < 4; i++) {
    birds.push({
        x: Math.random() * canvas.width,
        y: 100 + Math.random() * 150,
        speed: 0.3 + Math.random() * 0.6,
        direction: Math.random() > 0.5 ? 1 : -1,
        wingUp: false,
        flapTimer: 0
    });
}

// Draw the background based on current level
function drawBackground() {
    // Different backgrounds based on level
    switch((currentLevel - 1) % 9) {
        case 0: // Night theme (default)
            drawNightBackground();
            break;
        case 1: // Forest theme
            drawForestBackground();
            break;
        case 2: // Desert theme
            drawDesertBackground();
            break;
        case 3: // Minimalist theme (white with red circle)
            drawMinimalistBackground();
            break;
        case 4: // Winter theme
            drawWinterBackground();
            break;
        case 5: // Rainy theme
            drawRainyBackground();
            break;
        case 6: // Tropical theme
            drawTropicalBackground();
            break;
        case 7: // Space theme
            drawSpaceBackground();
            break;
        case 8: // Fantasy theme
            drawFantasyBackground();
            break;
    }

    // Draw falling stars or birds for any theme
    drawBackgroundElements();
}

// Night theme (original)
function drawNightBackground() {
    // Draw gradient sky (8-bit style)
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);

    // Draw 8-bit moon
    ctx.fillStyle = '#FFFF99';
    // Draw moon as a collection of pixels for 8-bit effect
    ctx.fillRect(moonX, moonY, moonSize, moonSize);
    ctx.fillRect(moonX - 4, moonY + 4, 4, moonSize - 8);
    ctx.fillRect(moonX + moonSize, moonY + 4, 4, moonSize - 8);
    ctx.fillRect(moonX + 4, moonY - 4, moonSize - 8, 4);
    ctx.fillRect(moonX + 4, moonY + moonSize, moonSize - 8, 4);

    // Draw static stars (8-bit style)
    ctx.fillStyle = '#FFFFFF';
    // Draw a few static stars
    for (let i = 0; i < 20; i++) {
        const x = (i * 37 + 15) % canvas.width;
        const y = ((i * 23) % (PLATFORM_Y - 80)) + 60;
        ctx.fillRect(x, y, 2, 2);
    }

    // Draw distant buildings silhouette (8-bit style)
    ctx.fillStyle = '#000022';
    for (let i = 0; i < 8; i++) {
        const buildingWidth = 30 + (i * 7) % 15;
        const buildingHeight = 80 + (i * 13) % 100;
        const buildingX = i * 50;
        ctx.fillRect(buildingX, PLATFORM_Y - buildingHeight, buildingWidth, buildingHeight);
    }
}

// Forest theme
function drawForestBackground() {
    // Forest gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#003300');
    gradient.addColorStop(1, '#006633');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);

    // Draw sun
    ctx.fillStyle = '#FFFFAA';
    ctx.fillRect(300, 70, 40, 40);
    ctx.fillRect(295, 75, 50, 30);
    ctx.fillRect(305, 65, 30, 50);

    // Draw trees (8-bit style)
    for (let i = 0; i < 6; i++) {
        const treeX = i * 70 + 15;
        const treeHeight = 100 + (i * 30) % 80;

        // Tree trunk
        ctx.fillStyle = '#663300';
        ctx.fillRect(treeX, PLATFORM_Y - treeHeight, 20, treeHeight);

        // Tree foliage (triangular shape in 8-bit style)
        ctx.fillStyle = '#00AA44';
        for (let j = 0; j < 3; j++) {
            const size = 60 - j * 10;
            const yOffset = j * 25;
            for (let k = 0; k < size; k += 2) {
                const width = Math.min(size - k, 2);
                ctx.fillRect(treeX + 10 - k/2, PLATFORM_Y - treeHeight - 10 - k + yOffset, width, 2);
            }
        }
    }
}

// Desert theme
function drawDesertBackground() {
    // Desert gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#6699FF');
    gradient.addColorStop(1, '#FFCC99');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);

    // Draw sun
    ctx.fillStyle = '#FFDD44';
    ctx.fillRect(100, 60, 50, 50);
    ctx.fillRect(90, 70, 70, 30);
    ctx.fillRect(110, 50, 30, 70);

    // Draw cacti
    for (let i = 0; i < 5; i++) {
        const cactusX = i * 90 + 30;
        const cactusHeight = 60 + (i * 20) % 40;

        // Cactus body
        ctx.fillStyle = '#116611';
        ctx.fillRect(cactusX, PLATFORM_Y - cactusHeight, 15, cactusHeight);

        // Cactus arms
        if (i % 2 === 0) {
            ctx.fillRect(cactusX - 10, PLATFORM_Y - cactusHeight + 20, 10, 8);
        } else {
            ctx.fillRect(cactusX + 15, PLATFORM_Y - cactusHeight + 30, 10, 8);
        }
    }

    // Draw dunes
    ctx.fillStyle = '#DDBB77';
    for (let i = 0; i < 4; i++) {
        const duneWidth = 120;
        const duneHeight = 40;
        const duneX = i * 100;

        // Draw a rounded dune shape with 8-bit blocks
        for (let j = 0; j < duneWidth/2; j++) {
            const height = Math.sin((j / (duneWidth/2)) * Math.PI) * duneHeight;
            ctx.fillRect(duneX + j, PLATFORM_Y - height, 4, height);
            ctx.fillRect(duneX + duneWidth - j, PLATFORM_Y - height, 4, height);
        }
    }
}

// Minimalist theme with white background and red circle
function drawMinimalistBackground() {
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);

    // Large red circle
    ctx.fillStyle = '#FF3333';
    const circleX = canvas.width / 2;
    const circleY = canvas.height / 3;
    const radius = 80;

    // Draw 8-bit style circle
    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            if (x*x + y*y <= radius*radius) {
                ctx.fillRect(circleX + x, circleY + y, 2, 2);
            }
        }
    }

    // Add some minimal geometric elements
    ctx.fillStyle = '#333333';
    for (let i = 0; i < 5; i++) {
        const size = 15 + i * 5;
        const x = 50 + i * 70;
        const y = 300;
        ctx.fillRect(x, y, size, size);
    }
    
    // Change UI text colors for better visibility on white background
    if (currentGameState === GAME_STATE.PLAYING) {
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, TOP_BAR_HEIGHT + 20);
        ctx.fillText(`Level: ${currentLevel}`, 10, TOP_BAR_HEIGHT + 40);
        ctx.fillText(`Coins: ${coins}`, 10, TOP_BAR_HEIGHT + 60);
    }
}

// Winter theme with falling snow
function drawWinterBackground() {
    // Light blue background
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#CCEEFF');
    gradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);

    // Initialize snowflakes if needed
    if (!window.snowflakes) {
        window.snowflakes = [];
        for (let i = 0; i < 100; i++) {
            window.snowflakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * PLATFORM_Y,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5
            });
        }
    }

    // Draw and update falling snow
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < window.snowflakes.length; i++) {
        const flake = window.snowflakes[i];
        
        // Update snowflake position
        flake.y += flake.speed;
        flake.x += Math.sin(Date.now() * 0.001 + i) * 0.5; // Gentle side-to-side motion
        
        // Reset snowflake if it goes off screen
        if (flake.y > PLATFORM_Y) {
            flake.y = 0;
            flake.x = Math.random() * canvas.width;
        }
        
        // Draw snowflake
        ctx.fillRect(flake.x, flake.y, flake.size, flake.size);
    }

    // Draw mountains in the background
    ctx.fillStyle = '#C0D0E0'; // Lighter grey for snowy mountains
    ctx.beginPath();
    ctx.moveTo(0, PLATFORM_Y - 80);
    ctx.lineTo(canvas.width / 3, PLATFORM_Y - 150);
    ctx.lineTo(canvas.width * 2/3, PLATFORM_Y - 120);
    ctx.lineTo(canvas.width, PLATFORM_Y - 80);
    ctx.lineTo(canvas.width, PLATFORM_Y);
    ctx.lineTo(0, PLATFORM_Y);
    ctx.closePath();
    ctx.fill();
    
    // Draw snow caps on mountains
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 3 - 20, PLATFORM_Y - 130);
    ctx.lineTo(canvas.width / 3, PLATFORM_Y - 150);
    ctx.lineTo(canvas.width / 3 + 20, PLATFORM_Y - 130);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width * 2/3 - 20, PLATFORM_Y - 100);
    ctx.lineTo(canvas.width * 2/3, PLATFORM_Y - 120);
    ctx.lineTo(canvas.width * 2/3 + 20, PLATFORM_Y - 100);
    ctx.closePath();
    ctx.fill();
}

// Rainy theme with animated rain
function drawRainyBackground() {
    // Gradient gray background to simulate storm clouds
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#505060');
    gradient.addColorStop(1, '#707080');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);
    
    // Initialize raindrops if needed
    if (!window.raindrops) {
        window.raindrops = [];
        for (let i = 0; i < 100; i++) {
            window.raindrops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * PLATFORM_Y,
                speed: Math.random() * 5 + 10,
                length: Math.random() * 10 + 5
            });
        }
    }
    
    // Draw and update rain
    ctx.fillStyle = '#C0E0FF';
    for (let i = 0; i < window.raindrops.length; i++) {
        const drop = window.raindrops[i];
        
        // Update raindrop position
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.1; // Slight angle for rain
        
        // Reset raindrop if it goes off screen
        if (drop.y > PLATFORM_Y) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
        }
        
        // Draw raindrop
        ctx.fillRect(drop.x, drop.y, 1, drop.length);
    }
    
    // Draw some puddles on the ground
    ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
    for (let i = 0; i < 5; i++) {
        const puddleWidth = 30 + Math.random() * 50;
        const puddleX = i * 80 + Math.random() * 30;
        
        // Draw oval puddle
        ctx.beginPath();
        ctx.ellipse(puddleX, PLATFORM_Y - 5, puddleWidth/2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add distant lightning flash occasionally
    if (Math.random() < 0.01) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);
    }
}

// Tropical theme with animated monkeys
function drawTropicalBackground() {
    // Gradient blue sky
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#ADD8E6'); // Light blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);
    
    // Draw sun
    ctx.fillStyle = '#FFDD44';
    ctx.beginPath();
    ctx.arc(canvas.width - 50, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw palm trees
    for (let i = 0; i < 5; i++) {
        const x = i * 100 + 50;
        const y = PLATFORM_Y - 100;
        
        // Tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, 20, 100);
        
        // Palm leaves - 8-bit style
        ctx.fillStyle = '#32CD32';
        // Left side leaves
        for (let j = 0; j < 3; j++) {
            const angle = Math.PI/3 + (j * Math.PI/12);
            const leafLength = 50 + j * 5;
            const leafX = x + 10;
            const leafY = y;
            
            ctx.save();
            ctx.translate(leafX, leafY);
            ctx.rotate(-angle);
            ctx.fillRect(0, 0, 8, leafLength);
            ctx.restore();
        }
        
        // Right side leaves
        for (let j = 0; j < 3; j++) {
            const angle = Math.PI*2/3 - (j * Math.PI/12);
            const leafLength = 50 + j * 5;
            const leafX = x + 10;
            const leafY = y;
            
            ctx.save();
            ctx.translate(leafX, leafY);
            ctx.rotate(-angle);
            ctx.fillRect(0, 0, 8, leafLength);
            ctx.restore();
        }
    }
    
    // Initialize monkeys if needed
    if (!window.monkeys) {
        window.monkeys = [];
        for (let i = 0; i < 3; i++) {
            window.monkeys.push({
                x: Math.random() * canvas.width,
                y: 100 + Math.random() * 150,
                direction: Math.random() > 0.5 ? 1 : -1,
                jumping: false,
                jumpPhase: 0,
                jumpHeight: 0
            });
        }
    }
    
    // Draw and animate 8-bit monkeys
    ctx.fillStyle = '#8B4513'; // Brown color for monkeys
    for (let i = 0; i < window.monkeys.length; i++) {
        const monkey = window.monkeys[i];
        
        // Update monkey position and jumping state
        if (Math.random() < 0.02) {
            monkey.jumping = true;
            monkey.jumpPhase = 0;
            monkey.jumpHeight = 20 + Math.random() * 30;
        }
        
        if (monkey.jumping) {
            monkey.jumpPhase += 0.1;
            if (monkey.jumpPhase >= Math.PI) {
                monkey.jumping = false;
                // Change direction sometimes after landing
                if (Math.random() < 0.5) {
                    monkey.direction *= -1;
                }
            }
        }
        
        // Move horizontally
        monkey.x += monkey.direction * (monkey.jumping ? 2 : 1);
        
        // Wrap around the screen
        if (monkey.x > canvas.width + 20) monkey.x = -20;
        if (monkey.x < -20) monkey.x = canvas.width + 20;
        
        // Calculate vertical position based on jump
        const jumpOffset = monkey.jumping ? Math.sin(monkey.jumpPhase) * monkey.jumpHeight : 0;
        
        // Draw 8-bit monkey
        // Body
        ctx.fillRect(monkey.x, monkey.y - jumpOffset, 16, 12);
        
        // Head
        ctx.fillRect(monkey.x + (monkey.direction > 0 ? 8 : -8), monkey.y - 8 - jumpOffset, 16, 16);
        
        // Arms and legs
        if (monkey.jumping) {
            // Jumping pose
            ctx.fillRect(monkey.x + (monkey.direction > 0 ? -4 : 12), monkey.y - 4 - jumpOffset, 8, 4);
            ctx.fillRect(monkey.x + (monkey.direction > 0 ? 12 : -4), monkey.y - 4 - jumpOffset, 8, 4);
        } else {
            // Standing pose
            ctx.fillRect(monkey.x + (monkey.direction > 0 ? -4 : 12), monkey.y + 2, 8, 10);
            ctx.fillRect(monkey.x + (monkey.direction > 0 ? 12 : -4), monkey.y + 2, 8, 10);
        }
        
        // Tail
        ctx.fillRect(monkey.x + (monkey.direction > 0 ? -8 : 16), monkey.y - 4 - jumpOffset, 8, 4);
        
        // Face details (eyes)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(monkey.x + (monkey.direction > 0 ? 14 : 2), monkey.y - 6 - jumpOffset, 2, 2);
        ctx.fillStyle = '#8B4513'; // Reset color for next monkey
    }
}

// Space theme with animated rockets
function drawSpaceBackground() {
    // Deep space background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(0.5, '#000022');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);
    
    // Draw distant stars (fixed)
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 23) % PLATFORM_Y;
        const size = (i % 3) + 1;
        const brightness = 0.5 + Math.sin(Date.now() * 0.001 + i) * 0.5; // Twinkle effect
        
        ctx.globalAlpha = brightness;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;
    
    // Draw some planets
    // Planet 1
    const planetRadius = 25;
    ctx.fillStyle = '#4444FF';
    ctx.beginPath();
    ctx.arc(100, 100, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Planet rings (Saturn-like)
    ctx.strokeStyle = '#AAAAFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(100, 100, planetRadius + 15, 5, Math.PI/6, 0, Math.PI * 2);
    ctx.stroke();
    
    // Planet 2
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(canvas.width - 70, 150, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Initialize rockets if needed
    if (!window.spaceRockets) {
        window.spaceRockets = [];
        for (let i = 0; i < 5; i++) {
            window.spaceRockets.push({
                x: Math.random() * canvas.width,
                y: 100 + Math.random() * (PLATFORM_Y - 200),
                speed: 1 + Math.random() * 2,
                size: 8 + Math.random() * 8,
                flameSize: 0,
                flameGrowing: true
            });
        }
    }
    
    // Draw and update 8-bit rockets
    for (let i = 0; i < window.spaceRockets.length; i++) {
        const rocket = window.spaceRockets[i];
        
        // Update rocket position
        rocket.x += rocket.speed;
        
        // Reset when off screen
        if (rocket.x > canvas.width + 50) {
            rocket.x = -30;
            rocket.y = 100 + Math.random() * (PLATFORM_Y - 200);
        }
        
        // Animate rocket flame
        if (rocket.flameGrowing) {
            rocket.flameSize += 0.2;
            if (rocket.flameSize > 3) rocket.flameGrowing = false;
        } else {
            rocket.flameSize -= 0.2;
            if (rocket.flameSize < 1) rocket.flameGrowing = true;
        }
        
        // Draw 8-bit rocket body
        ctx.fillStyle = '#DDDDDD';
        ctx.fillRect(rocket.x, rocket.y, rocket.size, rocket.size * 2);
        
        // Rocket nose cone
        ctx.fillStyle = '#FF2222';
        ctx.fillRect(rocket.x, rocket.y - rocket.size/2, rocket.size, rocket.size/2);
        
        // Rocket fins
        ctx.fillStyle = '#2222FF';
        ctx.fillRect(rocket.x - rocket.size/2, rocket.y + rocket.size * 1.5, rocket.size/2, rocket.size/2);
        ctx.fillRect(rocket.x + rocket.size, rocket.y + rocket.size * 1.5, rocket.size/2, rocket.size/2);
        
        // Rocket flame
        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(rocket.x + rocket.size/4, rocket.y + rocket.size * 2, rocket.size/2, rocket.flameSize * 2);
        
        // Flame core
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(rocket.x + rocket.size * 3/8, rocket.y + rocket.size * 2, rocket.size/4, rocket.flameSize);
    }
}

// Fantasy theme with animated dragon
function drawFantasyBackground() {
    // Magical gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, PLATFORM_Y);
    gradient.addColorStop(0, '#5533AA'); // Purple sky
    gradient.addColorStop(1, '#7744CC'); // Lighter purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_Y);
    
    // Draw mystical floating islands
    ctx.fillStyle = '#228833'; // Green islands
    for (let i = 0; i < 3; i++) {
        const x = i * 150 + 50;
        const y = 150 + (i % 2) * 100;
        const width = 80 + (i * 20);
        const height = 40;
        
        // Draw island base
        ctx.fillRect(x, y, width, height);
        
        // Draw grass on top
        ctx.fillStyle = '#33CC44';
        for (let j = 0; j < width; j += 5) {
            const grassHeight = 5 + Math.sin(j * 0.2) * 3;
            ctx.fillRect(x + j, y - grassHeight, 3, grassHeight);
        }
        
        // Draw a mystical tree on larger islands
        if (width > 100) {
            ctx.fillStyle = '#664422'; // Tree trunk
            ctx.fillRect(x + width/2 - 5, y - 30, 10, 30);
            
            ctx.fillStyle = '#224466'; // Blue magical leaves
            ctx.beginPath();
            ctx.arc(x + width/2, y - 40, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Magical particles around tree
            ctx.fillStyle = '#FFFFFF';
            for (let p = 0; p < 5; p++) {
                const angle = Date.now() * 0.001 + p * Math.PI/2.5;
                const px = x + width/2 + Math.cos(angle) * 30;
                const py = y - 40 + Math.sin(angle) * 15;
                ctx.fillRect(px, py, 2, 2);
            }
        }
        
        ctx.fillStyle = '#228833'; // Reset for next island
    }
    
    // Draw magical clouds
    ctx.fillStyle = '#9977DD';
    for (let i = 0; i < 5; i++) {
        const x = ((i * 123) + Date.now() * 0.02) % canvas.width;
        const y = 40 + i * 20;
        const width = 60 + (i * 10);
        const height = 20;
        
        // Draw cloud main body
        ctx.fillRect(x, y, width, height);
        
        // Draw cloud puffs
        for (let j = 0; j < 3; j++) {
            const puffX = x + j * (width/3);
            ctx.fillRect(puffX, y - 10, width/3, height + 10);
        }
    }
    
    // Initialize dragon if needed
    if (!window.fantasyDragon) {
        window.fantasyDragon = {
            x: 0,
            y: 80,
            direction: 1,
            wingUp: true,
            wingTimer: 0,
            fireTimer: 0,
            breathingFire: false
        };
    }
    
    const dragon = window.fantasyDragon;
    
    // Update dragon
    dragon.x += dragon.direction * 1.5;
    
    // Change direction when reaching screen edges
    if (dragon.x > canvas.width + 50) {
        dragon.x = -50;
        dragon.y = 80 + Math.random() * 100;
    }
    
    // Wing flapping animation
    dragon.wingTimer++;
    if (dragon.wingTimer > 15) {
        dragon.wingUp = !dragon.wingUp;
        dragon.wingTimer = 0;
    }
    
    // Occasionally breathe fire
    dragon.fireTimer++;
    if (dragon.fireTimer > 120) {
        dragon.breathingFire = true;
        dragon.fireTimer = 0;
    } else if (dragon.fireTimer > 30) {
        dragon.breathingFire = false;
    }
    
    // Draw 8-bit dragon
    ctx.fillStyle = '#DD2222'; // Red dragon
    
    // Dragon body
    ctx.fillRect(dragon.x, dragon.y, 30, 15);
    
    // Dragon head
    ctx.fillRect(dragon.x + 30, dragon.y - 5, 15, 15);
    
    // Dragon tail
    ctx.fillRect(dragon.x - 20, dragon.y + 5, 20, 5);
    
    // Dragon wings
    if (dragon.wingUp) {
        ctx.fillRect(dragon.x + 5, dragon.y - 15, 20, 15);
    } else {
        ctx.fillRect(dragon.x + 5, dragon.y + 15, 20, 10);
    }
    
    // Dragon legs
    ctx.fillRect(dragon.x + 5, dragon.y + 15, 5, 10);
    ctx.fillRect(dragon.x + 20, dragon.y + 15, 5, 10);
    
    // Dragon eyes
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(dragon.x + 38, dragon.y, 2, 2);
    
    // Dragon fire breath
    if (dragon.breathingFire) {
        const fireLength = 20 + Math.random() * 30;
        const fireWidth = 8 + Math.random() * 6;
        
        // Fire gradient
        const fireGradient = ctx.createLinearGradient(dragon.x + 45, 0, dragon.x + 45 + fireLength, 0);
        fireGradient.addColorStop(0, '#FFFF00');
        fireGradient.addColorStop(0.7, '#FF4400');
        fireGradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
        
        ctx.fillStyle = fireGradient;
        ctx.beginPath();
        ctx.moveTo(dragon.x + 45, dragon.y);
        ctx.lineTo(dragon.x + 45 + fireLength, dragon.y - fireWidth/2);
        ctx.lineTo(dragon.x + 45 + fireLength, dragon.y + fireWidth/2);
        ctx.closePath();
        ctx.fill();
    }
}


// Draw animated background elements (stars, birds)
function drawBackgroundElements() {
    // Draw and update falling stars
    for (let i = 0; i < fallingStars.length; i++) {
        const star = fallingStars[i];

        // Update star position
        star.y += star.speed;
        star.x -= star.speed * 0.5; // Slight diagonal movement

        // Restart star when it goes off screen
        if (star.y > PLATFORM_Y || star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * (PLATFORM_Y - 200);
        }

        // Draw star with twinkle effect
        let brightness = 1;
        if (star.twinkle) {
            brightness = 0.5 + Math.abs(Math.sin(Date.now() * star.twinkleSpeed));
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);

        // Draw trail for larger stars
        if (star.size > 2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
            ctx.fillRect(star.x + 1, star.y - 1, star.size - 1, star.size - 1);
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
            ctx.fillRect(star.x + 2, star.y - 2, star.size - 2, star.size - 2);
        }
    }

    // Draw and update 8-bit birds
    for (let i = 0; i < birds.length; i++) {
        const bird = birds[i];

        // Update bird position
        bird.x += bird.speed * bird.direction;

        // Bird flapping animation
        bird.flapTimer++;
        if (bird.flapTimer > 20) {
            bird.wingUp = !bird.wingUp;
            bird.flapTimer = 0;
        }

        // Restart bird when it goes off screen
        if ((bird.direction > 0 && bird.x > canvas.width + 20) || 
            (bird.direction < 0 && bird.x < -20)) {
            bird.direction *= -1;
            bird.y = 100 + Math.random() * 150;
        }

        // Draw 8-bit bird
        ctx.fillStyle = '#7799FF'; // Light blue birds

        // Bird body
        ctx.fillRect(bird.x, bird.y, 8, 4);

        // Bird head
        ctx.fillRect(bird.direction > 0 ? bird.x + 6 : bird.x - 2, bird.y - 2, 4, 4);

        // Bird wings
        if (bird.wingUp) {
            ctx.fillRect(bird.x + 2, bird.y - 4, 4, 4);
        } else {
            ctx.fillRect(bird.x + 2, bird.y + 4, 4, 4);
        }
    }
}

// Draw the platforms
function drawPlatforms() {
    // Platform colors based on current level theme
    let platformColor, windowColor, backgroundBetweenBuildingsColor;

    switch((currentLevel - 1) % 9) {
        case 0: // Night theme
            platformColor = '#333333';
            windowColor = '#FFFF00';
            backgroundBetweenBuildingsColor = '#000066'; // Dark blue for night sky
            break;
        case 1: // Forest theme
            platformColor = '#664422';
            windowColor = '#88FF88';
            backgroundBetweenBuildingsColor = '#004422'; // Dark green for forest
            break;
        case 2: // Desert theme
            platformColor = '#BB7722';
            windowColor = '#FFDD44';
            backgroundBetweenBuildingsColor = '#FFCC66'; // Sandy color for desert
            break;
        case 3: // Minimalist theme
            platformColor = '#222222';
            windowColor = '#FFFFFF';
            backgroundBetweenBuildingsColor = '#EEEEEE'; // Light gray for minimalist
            break;
        case 4: //Winter
            platformColor = '#A0A0A0';
            windowColor = '#FFFFFF';
            backgroundBetweenBuildingsColor = '#FFFFFF';
            break;
        case 5: //Rainy
            platformColor = '#808080';
            windowColor = '#C0C0C0';
            backgroundBetweenBuildingsColor = '#808080';
            break;
        case 6: //Tropical
            platformColor = '#006400';
            windowColor = '#32CD32';
            backgroundBetweenBuildingsColor = '#ADD8E6';
            break;
        case 7: //Space
            platformColor = '#000000';
            windowColor = '#FFFFFF';
            backgroundBetweenBuildingsColor = '#000000';
            break;
        case 8: //Fantasy
            platformColor = '#008000';
            windowColor = '#FFFFFF';
            backgroundBetweenBuildingsColor = '#008000';
            break;
    }

    // Fill the space between platforms with theme-specific color
    ctx.fillStyle = backgroundBetweenBuildingsColor;
    ctx.fillRect(0, PLATFORM_Y, canvas.width, PLATFORM_HEIGHT);

    // Draw platforms with precise positioning
    ctx.fillStyle = platformColor;
    ctx.fillRect(platform1X, PLATFORM_Y, platform1Width, PLATFORM_HEIGHT);
    ctx.fillRect(platform2X, PLATFORM_Y, platform2Width, PLATFORM_HEIGHT);
    ctx.fillRect(platform3X, PLATFORM_Y, platform3Width, PLATFORM_HEIGHT);

    // Draw building details (windows) for more 8-bit feel
    ctx.fillStyle = windowColor;

    // Windows on platform 1
    for (let i = 0; i < platform1Width / 15; i++) {
        for (let j = 0; j < 3; j++) {
            if ((i + j) % 3 === 0) { // Deterministic window pattern
                ctx.fillRect(platform1X + 5 + i * 15, PLATFORM_Y + 10 + j * 25, 8, 12);
            }
        }
    }

    // Windows on platform 2
    for (let i = 0; i < platform2Width / 15; i++) {
        for (let j = 0; j < 3; j++) {
            if ((i + j) % 3 === 1) { // Different pattern for variety
                ctx.fillRect(platform2X + 5 + i * 15, PLATFORM_Y + 10 + j * 25, 8, 12);
            }
        }
    }

    // Windows on platform 3
    for (let i = 0; i < platform3Width / 15; i++) {
        for (let j = 0; j < 3; j++) {
            if ((i + j) % 3 === 2) { // Different pattern
                ctx.fillRect(platform3X + 5 + i * 15, PLATFORM_Y + 10 + j * 25, 8, 12);
            }
        }
    }

    // Draw hearts on platforms
    if (platform1Heart) {
        drawHeart(platform1X + platform1Width/2, PLATFORM_Y - 15);
    }
    if (platform2Heart) {
        drawHeart(platform2X + platform2Width/2, PLATFORM_Y - 15);
    }
    if (platform3Heart) {
        drawHeart(platform3X + platform3Width/2, PLATFORM_Y - 15);
    }

    // Draw coins on platforms
    if (platform1Coin) {
        drawCoin(platform1X + platform1Width/2, PLATFORM_Y - 15);
    }
    if (platform2Coin) {
        drawCoin(platform2X + platform2Width/2, PLATFORM_Y - 15);
    }
    if (platform3Coin) {
        drawCoin(platform3X + platform3Width/2, PLATFORM_Y - 15);
    }

    // Bottom border
    ctx.fillStyle = platformColor;
    ctx.fillRect(0, PLATFORM_Y + PLATFORM_HEIGHT, canvas.width, 1);
}

// Helper function to draw a heart
function drawHeart(x, y) {
    const heartSize = 10;
    ctx.fillStyle = '#FF5555';

    // 8-bit style heart
    ctx.fillRect(x - heartSize/2, y - heartSize/3, heartSize, heartSize/1.5);
    ctx.fillRect(x - heartSize/2 - heartSize/3, y - heartSize/2, heartSize/3, heartSize/2);
    ctx.fillRect(x + heartSize/2, y - heartSize/2, heartSize/3, heartSize/2);
    ctx.fillRect(x - heartSize/6, y + heartSize/4, heartSize/3, heartSize/3);
}

// Helper function to draw a coin
function drawCoin(x, y) {
    const coinSize = 10;
    ctx.fillStyle = '#FFD700';

    // 8-bit style coin
    ctx.beginPath();
    ctx.arc(x, y, coinSize/2, 0, Math.PI*2);
    ctx.fill();

    // Inner detail
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(x, y, coinSize/4, 0, Math.PI*2);
    ctx.fill();
}

// Draw the player
function drawPlayer() {
    // Player body
    ctx.fillStyle = '#333';
    ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);

    // Player legs (improved with separated legs)
    ctx.fillRect(playerX + 3, playerY + PLAYER_SIZE, 4, 5);
    ctx.fillRect(playerX + PLAYER_SIZE - 7, playerY + PLAYER_SIZE, 4, 5);

    // Player sword behind the back
    ctx.fillStyle = '#808080'; // Sword blade
    ctx.fillRect(playerX - 2, playerY + PLAYER_SIZE / 4, 3, 12);
    
    // Sword handle
    ctx.fillStyle = '#8B4513'; // Brown handle
    ctx.fillRect(playerX - 2, playerY + PLAYER_SIZE / 4 - 5, 3, 5);
    
    // Player hat/head
    ctx.fillStyle = 'red';
    ctx.fillRect(playerX, playerY - 5, PLAYER_SIZE, 5);

    // Player eyes (more expressive)
    if (isMoving || isGrowing) {
        // Determined/focused eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(playerX + 5, playerY + 2, 3, 3);
        ctx.fillRect(playerX + 12, playerY + 2, 3, 3);
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(playerX + 6, playerY + 3, 1, 1);
        ctx.fillRect(playerX + 13, playerY + 3, 1, 1);
    } else {
        // Normal eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(playerX + 5, playerY + 4, 3, 3);
        ctx.fillRect(playerX + 12, playerY + 4, 3, 3);
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(playerX + 6, playerY + 5, 1, 1);
        ctx.fillRect(playerX + 13, playerY + 5, 1, 1);
    }
    
    // Add simple 8-bit face
    if (!gameOver && !isFalling) {
        // Smile
        ctx.fillStyle = '#FFF';
        ctx.fillRect(playerX + 8, playerY + 10, 4, 1);
    } else if (isFalling) {
        // Concerned face during jumping
        ctx.fillStyle = '#FFF';
        ctx.fillRect(playerX + 8, playerY + 12, 4, 1);
    }
}

// Draw the stick
function drawStick() {
    // Draw previous sticks
    for (let i = 0; i < sticks.length; i++) {
        const stick = sticks[i];
        ctx.save();
        ctx.translate(stick.x, stick.y);
        ctx.rotate(stick.angle);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -stick.length, STICK_WIDTH, stick.length);
        ctx.restore();
    }

    // Draw current stick
    if (stickLength > 0) {
        if (isGrowing) {
            // Draw growing stick straight up
            ctx.fillStyle = '#333';
            ctx.fillRect(stickX, stickY - stickLength, STICK_WIDTH, stickLength);
        } else if (isFalling) {
            // Draw falling stick with rotation
            ctx.save();
            ctx.translate(stickX, stickY);
            ctx.rotate(fallAngle);
            ctx.fillStyle = '#333';
            ctx.fillRect(0, -stickLength, STICK_WIDTH, stickLength);
            ctx.restore();
        } else if (isMoving) {
            // Draw stick horizontally during movement
            ctx.fillStyle = '#333';
            ctx.fillRect(stickX, stickY - STICK_WIDTH, stickLength, STICK_WIDTH);
        } else {
            // Default case (should not happen often)
            ctx.fillStyle = '#333';
            ctx.fillRect(stickX, stickY - stickLength, STICK_WIDTH, stickLength);
        }
    }
}

// Draw the top bar with 8-bit navigation buttons
function drawTopBar() {
    // Background
    ctx.fillStyle = '#0a294e';
    ctx.fillRect(0, 0, canvas.width, TOP_BAR_HEIGHT);

    const buttonWidth = canvas.width / 5;
    const iconSize = 28;
    const buttonPadding = 10;

    // Draw navigation buttons in 8-bit style
    // 1. Play button
    drawNavButton(0 * buttonWidth, "Играть", "#0a294e", drawCrystalIcon, currentGameState === GAME_STATE.PLAYING);

    // 2. Friends button
    drawNavButton(1 * buttonWidth, "Друзья", "#0a294e", drawFriendsIcon, currentGameState === GAME_STATE.FRIENDS);

    // 3. Rewards/Boost button
    drawNavButton(2 * buttonWidth, "Ускорить", "#0a294e", drawRocketIcon, currentGameState === GAME_STATE.REWARDS);

    // 4. Leaderboard button
    drawNavButton(3 * buttonWidth, "Рейтинг", "#4285F4", drawStarIcon, currentGameState === GAME_STATE.LEADERBOARD);

    // 5. Wallet button
    drawNavButton(4 * buttonWidth, "Кошелек", "#0a294e", drawWalletIcon, false);

    // Show lives and score when in game mode
    if (currentGameState === GAME_STATE.PLAYING) {
        // Draw 8-bit hearts for lives lower on the screen - moved down further to avoid overlap with progress bar
        for (let i = 0; i < lives; i++) {
            drawPixelHeart(canvas.width - 30 - (lives - i - 1) * 25, 140, 12);
        }

        // Draw score, level and coins
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, TOP_BAR_HEIGHT + 20);
        ctx.fillText(`Level: ${currentLevel}`, 10, TOP_BAR_HEIGHT + 40);

        // Display coin counter with coin icon
        ctx.fillText(`Coins: ${coins}`, 10, TOP_BAR_HEIGHT + 60);
        drawCoin(75, TOP_BAR_HEIGHT + 55, 12); // Add coin icon next to the counter

        // Draw level progress bar
        const progressBarWidth = 150;
        const progressBarHeight = 10;
        const progressBarX = canvas.width - progressBarWidth - 10;
        const progressBarY = TOP_BAR_HEIGHT + 25;

        // Draw progress bar background
        ctx.fillStyle = '#333333';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        // Draw progress bar fill
        ctx.fillStyle = '#4CAF50';
        const fillWidth = (levelProgress / 100) * progressBarWidth;
        ctx.fillRect(progressBarX, progressBarY, fillWidth, progressBarHeight);

        // Draw progress bar border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        // Draw level indicators
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${currentLevel} Progress`, progressBarX + progressBarWidth/2, progressBarY - 5);
        ctx.textAlign = 'left';
    }
}

// Helper function to draw navigation buttons
function drawNavButton(x, text, bgColor, iconDrawFunction, isActive) {
    const buttonWidth = canvas.width / 5;

    // Button background - highlight if active
    ctx.fillStyle = isActive ? "#4285F4" : bgColor;
    ctx.fillRect(x, 0, buttonWidth, TOP_BAR_HEIGHT);

    // Draw button icon
    iconDrawFunction(x + buttonWidth/2, 25, 24);

    // Button text
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + buttonWidth/2, TOP_BAR_HEIGHT - 10);
    ctx.textAlign = 'left';
}

// 8-bit style icon drawing functions
function drawCrystalIcon(x, y, size) {
    // Crystal icon - 8-bit style
    ctx.fillStyle = '#b3e0ff';

    // Main crystal shape
    ctx.fillRect(x - size/2, y - size/2, size, size);
    ctx.fillRect(x - size/4, y - size/1.5, size/2, size/4);

    // Highlight
    ctx.fillStyle = 'white';
    ctx.fillRect(x - size/3, y - size/3, size/6, size/6);
}

function drawFriendsIcon(x, y, size) {
    // Friends icon - 8-bit style
    ctx.fillStyle = '#b3b3cc';

    // Two people
    const personSize = size/2;

    // First person (left)
    ctx.fillRect(x - size/2, y - size/6, personSize, personSize/2); // Head
    ctx.fillRect(x - size/2, y + size/6, personSize, personSize/2); // Body

    // Second person (right)
    ctx.fillRect(x, y - size/6, personSize, personSize/2); // Head
    ctx.fillRect(x, y + size/6, personSize, personSize/2); // Body
}

function drawRocketIcon(x, y, size) {
    // Rocket icon - 8-bit style
    ctx.fillStyle = '#ff6666';

    // Rocket body
    ctx.fillRect(x - size/6, y - size/2, size/3, size);

    // Rocket top
    ctx.fillRect(x - size/6, y - size/2 - size/6, size/3, size/6);

    // Wings
    ctx.fillRect(x - size/2, y + size/6, size/3, size/6);
    ctx.fillRect(x + size/6, y + size/6, size/3, size/6);

    // Flame
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(x - size/8, y + size/2, size/4, size/4);
}

function drawStarIcon(x, y, size) {
    // Star icon - 8-bit style
    ctx.fillStyle = '#ffff99';

    // Star shape
    ctx.fillRect(x - size/10, y - size/2, size/5, size); // Vertical
    ctx.fillRect(x - size/2, y - size/10, size, size/5); // Horizontal

    // Fill in corners
    ctx.fillRect(x - size/4, y - size/4, size/2, size/2); // Center
    ctx.fillRect(x - size/3, y - size/3, size/6, size/6); // Top-left
    ctx.fillRect(x + size/6, y - size/3, size/6, size/6); // Top-right
    ctx.fillRect(x - size/3, y + size/6, size/6, size/6); // Bottom-left
    ctx.fillRect(x + size/6, y + size/6, size/6, size/6); // Bottom-right
}

function drawWalletIcon(x, y, size) {
    // Wallet icon - 8-bit style
    ctx.fillStyle = '#cccccc';

    // Wallet body
    ctx.fillRect(x - size/2, y - size/3, size, size/1.5);

    // Wallet clasp
    ctx.fillStyle = '#999999';
    ctx.fillRect(x + size/4, y - size/4, size/4, size/3);
}

// Draw 8-bit heart
function drawPixelHeart(x, y, size) {
    ctx.fillStyle = '#FF5555';

    // Main body
    ctx.fillRect(x - size/2, y, size, size/2);

    // Top curves
    ctx.fillRect(x - size/2, y - size/4, size/2, size/4);
    ctx.fillRect(x, y - size/4, size/2, size/4);

    // Diagonal connectors
    ctx.fillRect(x - size/2 - size/4, y - size/8, size/4, size/4);
    ctx.fillRect(x + size/2, y - size/8, size/4, size/4);

    // Point at bottom
    ctx.fillRect(x - size/4, y + size/2, size/2, size/4);
}

// Draw leaderboard
function drawLeaderboard() {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, TOP_BAR_HEIGHT, canvas.width, canvas.height - TOP_BAR_HEIGHT);

    // Leaderboard title
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Leaderboard', canvas.width / 2, TOP_BAR_HEIGHT + 40);

    // Draw entries
    ctx.font = '18px Arial';
    for (let i = 0; i < leaderboardData.length; i++) {
        const player = leaderboardData[i];
        const y = TOP_BAR_HEIGHT + 80 + i * 30;

        // Rank and name
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${player.name}`, 50, y);

        // Score
        ctx.textAlign = 'right';
        ctx.fillText(`${player.score}`, canvas.width - 50, y);
    }

    // Current player's position (example)
    const userRank = 4; // Example rank
    const userY = TOP_BAR_HEIGHT + 80 + (userRank - 1) * 30;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(30, userY - 20, canvas.width - 60, 25);

    // Close instructions
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '16px Arial';
    ctx.fillText('Tap anywhere to close', canvas.width / 2, canvas.height - 30);

    ctx.textAlign = 'left';
}

// Draw game over screen
function drawGameOver() {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';

    if (showAdPopup) {
        // Ad popup with more interactive elements

        // Popup window with shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = 'white';
        roundedRect(ctx, canvas.width / 2 - 150, canvas.height / 2 - 100, 300, 200, 10);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Popup border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 150, canvas.height / 2 - 100, 300, 200, 10);
        ctx.stroke();

        // Close button
        ctx.fillStyle = '#FF5555';
        roundedRect(ctx, canvas.width / 2 + 120, canvas.height / 2 - 90, 20, 20, 5);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('✕', canvas.width / 2 + 130, canvas.height / 2 - 76);

        // Title and text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Get More Lives', canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = '18px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '16px Arial';
        ctx.fillText('Continue Playing?', canvas.width / 2, canvas.height / 2);

        // Draw buttons with better styling
        // Watch Ad button
        ctx.fillStyle = '#4285F4';
        roundedRect(ctx, canvas.width / 2 - 110, canvas.height / 2 + 30, 100, 40, 8);

        // Buy Lives button
        ctx.fillStyle = '#34A853';
        roundedRect(ctx, canvas.width / 2 + 10, canvas.height / 2 + 30, 100, 40, 8);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Watch Ad', canvas.width / 2 - 60, canvas.height / 2 + 55);
        ctx.fillText('Buy Lives', canvas.width / 2 + 60, canvas.height / 2 + 55);

        // Display coin cost
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText('(2 ads)', canvas.width / 2 - 60, canvas.height / 2 + 75);
        ctx.fillText(`(${coins >= 3 ? '✓' : ''} 3 coins)`, canvas.width / 2 + 60, canvas.height / 2 + 75);

        // Add coin icon next to Buy Lives button
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + 30, canvas.height / 2 + 30, 8, 0, Math.PI*2);
        ctx.fill();
    } else {
        // Regular game over screen with better styling
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;

        ctx.font = 'bold 36px Arial';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText(`Level: ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`Coins: ${coins}`, canvas.width / 2, canvas.height / 2 + 40);

        // Restart button
        ctx.fillStyle = '#4285F4';
        roundedRect(ctx, canvas.width / 2 - 80, canvas.height / 2 + 70, 160, 50, 8);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Play Again', canvas.width / 2, canvas.height / 2 + 100);

        // Share button (if Telegram is available)
        if (tg) {
            ctx.fillStyle = '#34A853';
            roundedRect(ctx, canvas.width / 2 - 80, canvas.height / 2 + 130, 160, 50, 8);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('Share Score', canvas.width / 2, canvas.height / 2 + 160);
        }
    }

    ctx.textAlign = 'left';
}

// Check if the player landed successfully
function checkLanding() {
    // Calculate where the stick ends when it falls completely
    const stickEnd = platform1X + platform1Width + stickLength;
    const perfectLanding = Math.abs(stickEnd - platform2X) < PERFECT_MARGIN;

    if (stickEnd >= platform2X && stickEnd <= platform2X + platform2Width) {
        // Successful landing
        if (perfectLanding) {
            score += 2;
            perfectBonus = true;
            // Perfect landing gives extra level progress
            levelProgress += 25; // 4 perfect jumps = level up
        } else {
            score++;
            perfectBonus = false;
            // Regular landing
            levelProgress += 20; // 5 regular jumps = level up
        }

        // Check if player levels up
        if (levelProgress >= 100 && currentLevel < maxLevel) {
            currentLevel++;
            levelProgress = 0;

            // Visual notification for level up
            showLevelUpAnimation = true;
            levelUpTimer = Date.now();
        }

        // Don't add to sticks array yet - we'll use the current stick for visuals until player moves

        // Reset fall angle but keep stick length for now
        fallAngle = Math.PI / 2; // Horizontal position
        isMoving = true;

        // Share score with Telegram when player gets a new high score
        if (tg && score % 10 === 0) {
            tg.MainButton.setText(`Share Score: ${score}`);
            tg.MainButton.show();
            tg.MainButton.onClick(function() {
                tg.sendData(JSON.stringify({
                    action: 'share_score',
                    score: score,
                    level: currentLevel,
                    coins: coins
                }));
            });
        }
    } else {
        // Player failed to land
        lives--;

        if (lives <= 0) {
            // Out of lives, show ad popup
            showAdPopup = true;
            gameOver = true;

            // Allow sharing final score on Telegram
            if (tg) {
                tg.MainButton.setText(`Share Final Score: ${score}`);
                tg.MainButton.show();
                tg.MainButton.onClick(function() {
                    tg.sendData(JSON.stringify({
                        action: 'share_score',
                        score: score,
                        level: currentLevel,
                        coins: coins,
                        game_over: true
                    }));
                });
            }
        } else {
            // Player still has lives, reset position but keep score
            playerX = platform1X + 20;
            stickLength = 0;
            fallAngle = 0;
            isFalling = false;
            isMoving = false;
        }
    }
}

// Function to check for collectibles when player reaches a platform
function checkCollectibles() {
    // Check if player reaches the heart on platform 2
    if (platform2Heart && playerX >= platform2X + platform2Width/2 - 15 && playerX <= platform2X + platform2Width/2 + 15) {
        lives++;
        if (lives > 5) lives = 5; // Cap at 5 lives
        platform2Heart = false;
    }

    // Check if player reaches the coin on platform 2
    if (platform2Coin && playerX >= platform2X + platform2Width/2 - 15 && playerX <= platform2X + platform2Width/2 + 15) {
        coins++;
        platform2Coin = false;
    }
}

// Keep track of sticks
let sticks = [];

// Move platforms for the next round
function setupNextRound() {
    // Now we add the current stick to the sticks array
    sticks.push({
        x: platform1X + platform1Width,
        y: PLATFORM_Y,
        length: stickLength,
        angle: Math.PI / 2 // Horizontal
    });

    // Generate new platform - gaps increase with level
    const minGap = 50 + (currentLevel * 5);
    const maxGap = 100 + (currentLevel * 10);
    const gap = minGap + Math.random() * (maxGap - minGap);

    // Shift everything to keep player on left side
    const shift = platform2X - 100;

    // Adjust all elements by the shift amount
    platform1X = platform1X - shift;
    platform2X = platform2X - shift;
    platform3X = platform3X - shift;
    playerX = playerX - shift;

    // Adjust all existing sticks
    for (let i = 0; i < sticks.length; i++) {
        sticks[i].x -= shift;
    }

    // Setup for next platform
    platform1X = platform2X;
    platform1Width = platform2Width;
    platform1Heart = platform2Heart;
    platform1Coin = platform2Coin;

    // Create new platform with width based on level
    platform2X = platform1X + platform1Width + gap;
    platform2Width = getPlatformWidth();

    // Decide if the next platform should have a heart (30% chance)
    platform2Heart = Math.random() < 0.3;

    // Decide if the next platform should have a coin (50% chance, only if no heart)
    platform2Coin = !platform2Heart && Math.random() < 0.5;

    // Generate a third platform to ensure two are visible ahead
    platform3X = platform2X + platform2Width + (minGap + Math.random() * (maxGap - minGap));
    platform3Width = getPlatformWidth();

    // Decide if the third platform should have items
    platform3Heart = Math.random() < 0.3;
    platform3Coin = !platform3Heart && Math.random() < 0.5;

    // Reset stick for next growth
    stickX = platform1X + platform1Width;
    stickLength = 0;
    fallAngle = 0;
    isFalling = false;
    isMoving = false;

    // Remove off-screen sticks
    sticks = sticks.filter(stick => stick.x > -50);
}

// Update game state
function update() {
    if (isGrowing) {
        stickLength += GROWING_SPEED;
    }

    if (isFalling) {
        fallAngle += FALLING_SPEED;
        if (fallAngle >= Math.PI / 2) {
            fallAngle = Math.PI / 2; // Ensure stick doesn't rotate past horizontal
            isFalling = false;
            checkLanding();
        }
    }

    if (isMoving) {
        // Move the player
        playerX += MOVING_SPEED;

        // Check for collectibles during movement
        checkCollectibles();

        // When player reaches the next platform
        if (playerX >= platform2X + 20) {
            playerX = platform2X + 20;
            setupNextRound();
        }
    }

    // Keep player visible on screen
    if (playerX > canvas.width - PLAYER_SIZE) {
        adjustGameView();
    }
}

// Adjust game view to keep player on screen
function adjustGameView() {
    const adjustment = MOVING_SPEED * 2;
    platform1X -= adjustment;
    platform2X -= adjustment;
    platform3X -= adjustment;
    playerX -= adjustment;
    stickX -= adjustment;

    // Adjust all existing sticks
    for (let i = 0; i < sticks.length; i++) {
        sticks[i].x -= adjustment;
    }
}

// Helper function to draw rounded rectangles
function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
}


// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update();

    // Draw background first
    drawBackground();

    drawPlatforms();
    drawStick();
    drawPlayer();
    drawTopBar();

    // Draw UI elements based on game state
    if (showLeaderboard) {
        drawLeaderboard();
    } else if (gameOver || showAdPopup) {
        drawGameOver();
    }

    // Draw level up animation
    if (showLevelUpAnimation) {
        const animationDuration = 3000; // 3 seconds
        const elapsedTime = Date.now() - levelUpTimer;

        if (elapsedTime < animationDuration) {
            // Show level up notification with pulse effect
            const pulse = Math.sin(elapsedTime / 200) * 0.2 + 0.8; // Pulse between 0.6 and 1.0
            const alpha = 1 - (elapsedTime / animationDuration); // Fade out over time

            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.font = `bold ${Math.floor(30 * pulse)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`LEVEL UP!`, canvas.width / 2, canvas.height / 2 - 70);
            ctx.fillText(`Level ${currentLevel}`, canvas.width / 2, canvas.height / 2 - 30);

            // Draw theme name
            let themeName = "";
            switch((currentLevel - 1) % 9) {
                case 0: themeName = "Night City"; break;
                case 1: themeName = "Forest"; break;
                case 2: themeName = "Desert"; break;
                case 3: themeName = "Minimalist"; break;
                case 4: themeName = "Winter"; break;
                case 5: themeName = "Rainy"; break;
                case 6: themeName = "Tropical"; break;
                case 7: themeName = "Space"; break;
                case 8: themeName = "Fantasy"; break;
            }

            ctx.font = `bold ${Math.floor(20 * pulse)}px Arial`;
            ctx.fillText(`Theme: ${themeName}`, canvas.width / 2, canvas.height / 2 + 10);
        } else {
            showLevelUpAnimation = false;
        }
    }

    // Draw perfect bonus indicator on top of everything else
    if (perfectBonus && !showLeaderboard && !showAdPopup && !gameOver) {
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText('Perfect!', playerX - 10, playerY - 20);
    }

    // Draw collected coin animation
    if (platform2Coin === false && playerX >= platform2X && playerX <= platform2X + platform2Width && isMoving) {
        ctx.fillStyle = 'gold';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+1', playerX, playerY - 30);

        // Add animated coin that floats up
        const animationTime = Date.now() % 1000;
        if (animationTime < 500) {
            drawCoin(playerX, playerY - 40 - (animationTime / 50), 14);
        }
        ctx.textAlign = 'left';
    }

    // Draw collected heart animation
    if (platform2Heart === false && playerX >= platform2X && playerX <= platform2X + platform2Width && isMoving) {
        ctx.fillStyle = '#FF5555';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+1', playerX, playerY - 30);

        // Add animated heart that floats up
        const animationTime = Date.now() % 1000;
        if (animationTime < 500) {
            drawPixelHeart(playerX, playerY - 40 - (animationTime / 50), 14);
        }
        ctx.textAlign = 'left';
    }

    requestAnimationFrame(gameLoop);
}

// Initialize and start the game
init();
gameLoop();