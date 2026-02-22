import Phaser from 'phaser';

// ---- Audio System ----
let audioCtx = null;
let musicInterval = null;
let musicGain = null;

const NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25,
};

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.15;
        musicGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, time, duration, type, vol, dest) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.setValueAtTime(vol * 0.7, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.01);
}

// Sound effects
function sfxBombDrop() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
}

function sfxHit() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const len = audioCtx.sampleRate * 0.15;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.1));
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(t);
}

function sfxMissile() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
}

function sfxExplosion() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const len = audioCtx.sampleRate * 0.5;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(t);
    // Low rumble
    const osc = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    g2.gain.setValueAtTime(0.15, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g2);
    g2.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
}

function sfxVictory() {
    ensureAudio();
    const t = audioCtx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
        playTone(freq, t + i * 0.12, 0.3, 'square', 0.1, audioCtx.destination);
    });
}

// Music tracks
const GAME_MELODY = [
    ['E4', 0.5], ['E4', 0.5], ['G4', 0.5], [null, 0.5], ['A4', 0.5], [null, 0.5], ['B4', 1],
    ['A4', 0.5], ['G4', 0.5], ['E4', 1], ['D4', 0.5], ['E4', 0.5], [null, 1],
    ['E4', 0.5], ['E4', 0.5], ['G4', 0.5], [null, 0.5], ['A4', 0.5], [null, 0.5], ['C5', 1],
    ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['E4', 1], [null, 1],
    ['D4', 0.5], ['D4', 0.5], ['E4', 0.5], [null, 0.5], ['G4', 1], ['A4', 1],
    ['G4', 0.5], ['E4', 0.5], ['D4', 1], ['E4', 2],
    ['C4', 0.5], ['D4', 0.5], ['E4', 0.5], ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['E4', 0.5], ['D4', 0.5],
    ['E4', 2], [null, 2],
];

const GAME_BASS = [
    ['E3', 1], [null, 1], ['E3', 1], [null, 1],
    ['A3', 1], [null, 1], ['A3', 1], [null, 1],
    ['E3', 1], [null, 1], ['E3', 1], [null, 1],
    ['G3', 1], [null, 1], ['B3', 1], [null, 1],
    ['D3', 1], [null, 1], ['D3', 1], [null, 1],
    ['A3', 1], [null, 1], ['A3', 1], [null, 1],
    ['C3', 1], [null, 1], ['D3', 1], [null, 1],
    ['E3', 1], [null, 1], ['E3', 1], [null, 1],
];

const BDAY_MELODY = [
    ['C4', 0.5], ['C4', 0.5],
    ['D4', 1], ['C4', 1], ['F4', 1],
    ['E4', 3],
    ['C4', 0.5], ['C4', 0.5],
    ['D4', 1], ['C4', 1], ['G4', 1],
    ['F4', 3],
    ['C4', 0.5], ['C4', 0.5],
    ['C5', 1], ['A4', 1], ['F4', 1],
    ['E4', 1], ['D4', 2],
    ['Bb4', 0.5], ['Bb4', 0.5],
    ['A4', 1], ['F4', 1], ['G4', 1],
    ['F4', 3],
];

const BDAY_BASS = [
    [null, 1],
    ['F3', 3],
    ['C3', 3],
    [null, 1],
    ['F3', 3],
    ['F3', 3],
    [null, 1],
    ['C3', 3],
    ['G3', 3],
    [null, 1],
    ['F3', 3],
    ['F3', 3],
];

function stopMusic() {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
    if (musicGain && audioCtx) {
        musicGain.disconnect();
        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.15;
        musicGain.connect(audioCtx.destination);
    }
}

function startMusic(melody, bass, bpm) {
    ensureAudio();
    stopMusic();

    const beatDur = 60 / bpm;
    let loopBeats = 0;
    melody.forEach(([_, b]) => loopBeats += b);
    const loopDur = loopBeats * beatDur;

    let nextLoop = audioCtx.currentTime;

    function scheduleLoop() {
        let t = nextLoop;
        melody.forEach(([note, beats]) => {
            const dur = beats * beatDur;
            if (note) playTone(NOTES[note], t, dur * 0.85, 'square', 0.1, musicGain);
            t += dur;
        });
        t = nextLoop;
        bass.forEach(([note, beats]) => {
            const dur = beats * beatDur;
            if (note) playTone(NOTES[note], t, dur * 0.85, 'triangle', 0.08, musicGain);
            t += dur;
        });
        nextLoop += loopDur;
    }

    scheduleLoop();
    musicInterval = setInterval(() => {
        if (audioCtx.currentTime > nextLoop - 2) scheduleLoop();
    }, 500);
}

// ---- Game ----
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 360,
    height: 640,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: true,
        antialias: false
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {}

function create() {
    this.isGameOver = false;
    this.isVictory = false;
    this.audioStarted = false;

    createTextures(this);

    // World is taller than viewport so camera can pan
    const worldH = 1280;
    this.cameras.main.setBounds(0, 0, 360, worldH);
    this.physics.world.setBounds(0, 0, 360, worldH);

    // Space background — fills entire world
    this.add.rectangle(180, worldH / 2, 360, worldH, 0x000011);

    // Static stars across the full world height
    for (let i = 0; i < 150; i++) {
        const x = Phaser.Math.Between(0, 360);
        const y = Phaser.Math.Between(0, worldH);
        this.add.image(x, y, 'star');
    }

    // Game elements live in the lower portion of the world
    const groundY = worldH - 30;
    const domeY = worldH - 60;

    // Moon surface
    this.ground = this.add.tileSprite(180, groundY, 360, 60, 'ground');
    this.physics.add.existing(this.ground, true);

    // Dome
    this.dome = this.add.sprite(180, domeY, 'dome');
    this.dome.setOrigin(0.5, 1);
    this.physics.add.existing(this.dome, true);
    this.dome.hits = 0;
    // Persistent graphics layer for accumulating cracks
    this.crackGraphics = this.add.graphics();
    this.crackGraphics.setPosition(180 - 80, domeY - 80);

    // Saucer — starts hidden off-screen
    this.saucer = this.physics.add.sprite(-50, worldH - 490, 'saucer');
    this.saucer.setCollideWorldBounds(true);
    this.saucer.setVisible(false);
    this.saucer.body.enable = false;

    // Controls - track target position for smooth movement
    // Offset saucer below and left of the touch point for visibility
    const TOUCH_OFFSET_X = -40;
    const TOUCH_OFFSET_Y = 60;
    this.saucerTarget = { x: 180, y: worldH - 490 };
    this.input.on('pointermove', (pointer) => {
        if (this.isGameOver || !this.gameStarted) return;
        if (pointer.isDown) {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.saucerTarget.x = worldPoint.x + TOUCH_OFFSET_X;
            this.saucerTarget.y = worldPoint.y + TOUCH_OFFSET_Y;
        }
    });
    this.input.on('pointerdown', (pointer) => {
        if (!this.gameStarted) return;
        if (this.isGameOver) return;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.saucerTarget.x = worldPoint.x;
        this.saucerTarget.y = worldPoint.y + TOUCH_OFFSET_Y;
    });

    // Bombing timer
    this.bombs = this.physics.add.group();
    this.time.addEvent({
        delay: 2500,
        callback: dropBomb,
        callbackScope: this,
        loop: true
    });

    // Missile timer
    this.missiles = this.physics.add.group();
    this.time.addEvent({
        delay: 3000,
        callback: launchMissile,
        callbackScope: this,
        loop: true
    });

    // Physics overlaps
    this.physics.add.overlap(this.bombs, this.dome, hitDome, null, this);
    this.physics.add.overlap(this.bombs, this.ground, hitGround, null, this);
    this.physics.add.overlap(this.missiles, this.saucer, hitSaucer, null, this);
    this.physics.add.overlap(this.missiles, this.ground, hitGround, null, this);

    // Title — fixed to camera
    this.titleText = this.add.text(180, 30, 'MOON MISSION', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '20px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(500);

    // Scanlines — fixed to camera
    for (let i = 0; i < 640; i += 4) {
        this.add.rectangle(180, i, 360, 2, 0x000000, 0.1).setDepth(1000).setScrollFactor(0);
    }

    // Start screen — camera shows only stars at the top
    this.gameStarted = false;
    this.physics.pause();
    this.cameras.main.scrollY = 0;
    this.titleText.setVisible(false);

    const startText = this.add.text(180, 300, 'TAP TO START', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '28px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

    this.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1
    });

    this.input.once('pointerdown', () => {
        ensureAudio();
        startMusic(GAME_MELODY, GAME_BASS, 150);
        startText.destroy();

        // Pan camera down to reveal the moon
        const targetScrollY = worldH - 640;
        this.tweens.add({
            targets: this.cameras.main,
            scrollY: targetScrollY,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                this.gameStarted = true;
                this.physics.resume();
                this.titleText.setVisible(true);
            }
        });

        // UFO flies in during the pan
        this.saucer.setVisible(true);
        this.saucer.body.enable = true;
        this.saucer.setPosition(-50, worldH - 490);
        this.tweens.add({
            targets: this.saucer,
            x: 180,
            duration: 1000,
            delay: 1000,
            ease: 'Power2'
        });
    });
}

function update(time, delta) {
    if (!this.gameStarted) return;

    // Smooth saucer movement — lerp toward target
    if (!this.isGameOver && !this.isVictory) {
        const lerpFactor = 1 - Math.pow(0.001, delta / 1000);
        this.saucer.x += (this.saucerTarget.x - this.saucer.x) * lerpFactor;
        this.saucer.y += (this.saucerTarget.y - this.saucer.y) * lerpFactor;
    }

    this.missiles.getChildren().forEach(missile => {
        if (!this.isGameOver && !this.isVictory) {
            const angle = Phaser.Math.Angle.Between(missile.x, missile.y, this.saucer.x, this.saucer.y);
            missile.setAcceleration(Math.cos(angle) * 160, Math.sin(angle) * 160);
            missile.setMaxVelocity(220);
            missile.rotation = Math.atan2(missile.body.velocity.y, missile.body.velocity.x);
        } else {
            missile.setAcceleration(0, 0);
            missile.rotation = Math.atan2(missile.body.velocity.y, missile.body.velocity.x);
        }
    });

    if (this.updateBanner) {
        this.updateBanner();
    }
}

function dropBomb() {
    if (!this.gameStarted || this.isGameOver || this.isVictory) return;
    const bomb = this.bombs.create(this.saucer.x, this.saucer.y + 20, 'bomb');
    bomb.setVelocityY(300);
    sfxBombDrop();
}

function launchMissile() {
    if (!this.gameStarted || this.isGameOver || this.isVictory) return;
    const x = 180 + (Math.random() > 0.5 ? 60 : -60);
    const missile = this.missiles.create(x, 1180, 'missile');
    missile.setVelocityY(-140);
    sfxMissile();
}

function smallExplosion(scene, x, y) {
    const p = scene.add.particles(0, 0, 'star', {
        x: x,
        y: y,
        speed: { min: 30, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        lifespan: 400,
        quantity: 8,
        tint: 0xffa500,
        emitting: false
    });
    p.explode();
}

function hitDome(dome, bomb) {
    smallExplosion(this, bomb.x, bomb.y);
    bomb.destroy();
    if (this.isVictory) return;

    sfxHit();
    this.dome.hits++;
    // Draw new crack lines that accumulate on top of existing ones
    this.crackGraphics.lineStyle(2, 0x444444, 1);
    const numLines = 2 + this.dome.hits;
    for (let j = 0; j < numLines; j++) {
        this.crackGraphics.lineBetween(
            Phaser.Math.Between(30, 130),
            Phaser.Math.Between(10, 70),
            Phaser.Math.Between(30, 130),
            Phaser.Math.Between(10, 70)
        );
    }

    if (this.dome.hits >= 5) {
        startVictory(this);
    }
}

function hitGround(ground, projectile) {
    smallExplosion(this, projectile.x, projectile.y);
    projectile.destroy();
}

function hitSaucer(saucer, missile) {
    missile.destroy();
    if (this.isGameOver || this.isVictory) return;

    explodeSaucer(this);
}

function explodeSaucer(scene) {
    scene.isGameOver = true;
    scene.saucer.setVisible(false);
    scene.saucer.body.enable = false;
    sfxExplosion();

    const p = scene.add.particles(0, 0, 'star', {
        x: scene.saucer.x,
        y: scene.saucer.y,
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 3, end: 0 },
        lifespan: 1000,
        gravityY: 100,
        quantity: 20,
        emitting: false
    });
    p.explode();

    scene.time.delayedCall(2000, respawnSaucer, [], scene);
}

function respawnSaucer() {
    this.isGameOver = false;
    this.saucer.setPosition(-50, 790);
    this.saucer.setVisible(true);
    this.saucer.body.enable = true;

    this.tweens.add({
        targets: this.saucer,
        x: 180,
        duration: 1000,
        ease: 'Power2'
    });
}

function startVictory(scene) {
    if (scene.isVictory) return;
    scene.isVictory = true;
    // Dome sinks behind the ground while shaking
    scene.ground.setDepth(10);
    scene.dome.setDepth(5);
    scene.crackGraphics.setDepth(5);
    scene.tweens.add({
        targets: [scene.dome, scene.crackGraphics],
        y: '+=80',
        duration: 3000,
        ease: 'Power2',
        onUpdate: () => {
            scene.dome.x = 180 + (Math.random() - 0.5) * 8;
            scene.crackGraphics.x = scene.dome.x - 80;
        },
        onComplete: () => {
            scene.dome.setVisible(false);
            scene.crackGraphics.setVisible(false);
        }
    });

    // Switch music
    stopMusic();
    scene.time.delayedCall(600, () => {
        startMusic(BDAY_MELODY, BDAY_BASS, 140);
    });

    // Self-destruct all missiles
    scene.missiles.getChildren().forEach(missile => {
        const p = scene.add.particles(0, 0, 'star', {
            x: missile.x,
            y: missile.y,
            speed: { min: 30, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: 600,
            quantity: 10,
            emitting: false
        });
        p.explode();
    });
    scene.missiles.clear(true, true);

    const cakeY = scene.ground.y - 24;
    const cake = scene.add.sprite(180, cakeY, 'cake').setOrigin(0.5, 1);

    // Animated candle flames
    const cakeLeft = 180 - 60; // cake texture is 120 wide, origin 0.5
    const cakeTop = cakeY - 120; // origin 1 means bottom at cakeY
    const candleXPositions = [35, 48, 60, 72, 85];
    candleXPositions.forEach(cx => {
        scene.add.particles(0, 0, 'star', {
            x: cakeLeft + cx + 2,
            y: cakeTop + 18,
            speed: { min: 5, max: 15 },
            angle: { min: 250, max: 290 },
            scale: { start: 1.5, end: 0 },
            lifespan: 300,
            frequency: 80,
            tint: [0xffff00, 0xffa500, 0xff6600],
            blendMode: 'ADD'
        });
    });

    // Fireworks
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    scene.time.addEvent({
        delay: 600,
        repeat: 20,
        callback: () => {
            const camTop = scene.cameras.main.scrollY;
            const x = Phaser.Math.Between(50, 310);
            const y = Phaser.Math.Between(camTop + 100, camTop + 400);
            const color = Phaser.Utils.Array.GetRandom(colors);

            const p = scene.add.particles(0, 0, 'star', {
                x: x,
                y: y,
                speed: { min: 60, max: 180 },
                angle: { min: 0, max: 360 },
                scale: { start: 3, end: 0 },
                lifespan: 1000,
                quantity: 40,
                tint: color,
                emitting: false
            });
            p.explode();
        },
        callbackScope: scene
    });

    // Animate UFO to center of screen
    scene.tweens.add({
        targets: scene.saucer,
        x: 180,
        y: scene.cameras.main.scrollY + 280,
        duration: 2500,
        ease: 'Power2'
    });

    // Banner — unfurls downward from the saucer
    const bannerRestOffset = 100;
    const banner = scene.add.container(scene.saucer.x, scene.saucer.y);
    const bg = scene.add.image(0, 25, 'banner_base').setOrigin(0.5, 0.5);
    const text = scene.add.text(0, 25, 'HAPPY BIRTHDAY\nALLYSA!', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '20px',
        color: '#ff0000',
        fontWeight: 'bold',
        align: 'center'
    }).setOrigin(0.5);
    banner.add([bg, text]);
    banner.bannerOffset = 10;
    banner.scaleY = 0;

    const string = scene.add.graphics();

    // Unfurl: scale from 0 to 1 vertically while dropping down
    scene.tweens.add({
        targets: banner,
        scaleY: 1,
        bannerOffset: bannerRestOffset,
        duration: 1800,
        ease: 'Power2'
    });

    let bannerTime = 0;
    scene.updateBanner = () => {
        bannerTime += 0.03;
        const undulateX = Math.sin(bannerTime * 2) * 6;
        const undulateY = Math.cos(bannerTime * 3) * 3;

        banner.x = scene.saucer.x + undulateX;
        banner.y = scene.saucer.y + banner.bannerOffset + undulateY;
        banner.rotation = Math.sin(bannerTime * 1.5) * 0.05;

        string.clear();
        string.lineStyle(2, 0xffffff, 1);
        string.lineBetween(scene.saucer.x, scene.saucer.y, banner.x, banner.y);
    };

    // Hide the title text on victory
    scene.titleText.setVisible(false);
}

function createTextures(scene) {
    let graphics = scene.make.graphics({ x: 0, y: 0, add: false });

    // Star
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('star', 2, 2);
    graphics.clear();

    // Ground (irregular moon surface)
    graphics.fillStyle(0x777777, 1);
    graphics.fillRect(0, 0, 120, 60);
    // Varied surface patches
    graphics.fillStyle(0x888888, 1);
    graphics.fillRect(0, 0, 120, 3);
    graphics.fillStyle(0x6a6a6a, 1);
    graphics.fillRect(10, 3, 25, 4);
    graphics.fillRect(70, 2, 15, 5);
    graphics.fillRect(45, 5, 20, 3);
    // Craters
    graphics.fillStyle(0x555555, 1);
    graphics.fillCircle(20, 25, 8);
    graphics.fillCircle(85, 35, 10);
    graphics.fillCircle(55, 18, 5);
    graphics.fillStyle(0x666666, 1);
    graphics.fillCircle(20, 24, 6);
    graphics.fillCircle(85, 34, 7);
    graphics.fillCircle(55, 17, 3);
    // Rocks and pebbles
    graphics.fillStyle(0x999999, 1);
    graphics.fillRect(42, 40, 5, 3);
    graphics.fillRect(100, 15, 4, 3);
    graphics.fillRect(8, 45, 3, 2);
    graphics.fillStyle(0x5a5a5a, 1);
    graphics.fillRect(30, 50, 7, 4);
    graphics.fillRect(75, 12, 6, 3);
    graphics.fillRect(105, 45, 5, 4);
    // Surface roughness
    graphics.fillStyle(0x6e6e6e, 1);
    graphics.fillRect(0, 8, 8, 2);
    graphics.fillRect(35, 12, 12, 2);
    graphics.fillRect(90, 6, 10, 2);
    graphics.fillRect(60, 48, 15, 2);
    graphics.generateTexture('ground', 120, 60);
    graphics.clear();

    // Saucer
    graphics.fillStyle(0x00ffff, 1);
    graphics.fillRect(8, 12, 32, 8);
    graphics.fillRect(12, 8, 24, 4);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(16, 4, 16, 4);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(12, 14, 4, 4);
    graphics.fillRect(32, 14, 4, 4);
    graphics.generateTexture('saucer', 48, 24);
    graphics.clear();

    // Dome
    graphics.fillStyle(0x999999, 1);
    graphics.beginPath();
    graphics.arc(80, 80, 80, Math.PI, 0, false);
    graphics.lineTo(160, 80);
    graphics.lineTo(0, 80);
    graphics.closePath();
    graphics.fillPath();
    graphics.fillStyle(0xbbbbbb, 1);
    graphics.fillCircle(50, 40, 10);
    graphics.generateTexture('dome', 160, 80);
    graphics.clear();

    // Bomb (classic round bomb with fuse)
    graphics.fillStyle(0x333333, 1);
    graphics.fillCircle(10, 14, 8);
    graphics.fillStyle(0x222222, 1);
    graphics.fillCircle(10, 14, 6);
    graphics.fillStyle(0x555555, 1);
    graphics.fillCircle(8, 11, 3);
    // Fuse stem
    graphics.fillStyle(0x666666, 1);
    graphics.fillRect(9, 2, 2, 6);
    // Fuse spark
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(10, 2, 2);
    graphics.fillStyle(0xffa500, 1);
    graphics.fillCircle(10, 1, 1);
    graphics.generateTexture('bomb', 20, 22);
    graphics.clear();

    // Missile
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 2, 12, 4);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(10, 2, 4, 4);
    graphics.fillStyle(0xffa500, 1);
    graphics.fillRect(0, 0, 2, 8);
    graphics.generateTexture('missile', 14, 8);
    graphics.clear();

    // Cake (detailed with candles)
    // Bottom tier
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(10, 70, 100, 40);
    // Bottom tier frosting
    graphics.fillStyle(0xFFB6C1, 1);
    graphics.fillRect(10, 70, 100, 8);
    // Bottom tier drip details
    graphics.fillStyle(0xFF69B4, 1);
    graphics.fillRect(20, 78, 4, 6);
    graphics.fillRect(40, 78, 4, 8);
    graphics.fillRect(60, 78, 4, 5);
    graphics.fillRect(80, 78, 4, 7);
    graphics.fillRect(96, 78, 4, 6);
    // Top tier
    graphics.fillStyle(0x9B5523, 1);
    graphics.fillRect(25, 45, 70, 25);
    // Top tier frosting
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(25, 45, 70, 8);
    // Top tier drip details
    graphics.fillStyle(0xFFB6C1, 1);
    graphics.fillRect(30, 53, 3, 5);
    graphics.fillRect(50, 53, 3, 6);
    graphics.fillRect(70, 53, 3, 4);
    graphics.fillRect(85, 53, 3, 5);
    // Candles
    const candleColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    const candleXPositions = [35, 48, 60, 72, 85];
    for (let c = 0; c < 5; c++) {
        graphics.fillStyle(candleColors[c], 1);
        graphics.fillRect(candleXPositions[c], 25, 4, 20);
        // Flame
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(candleXPositions[c], 19, 4, 6);
        graphics.fillStyle(0xffa500, 1);
        graphics.fillRect(candleXPositions[c] + 1, 21, 2, 3);
    }
    // Plate
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillRect(5, 110, 110, 4);
    graphics.generateTexture('cake', 120, 120);
    graphics.clear();

    // Banner (bigger, taller for two lines)
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 240, 60);
    graphics.generateTexture('banner_base', 240, 60);
    graphics.clear();
}
