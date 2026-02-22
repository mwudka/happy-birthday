import Phaser from 'phaser';

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

    createTextures(this);

    // Space background
    this.add.rectangle(180, 320, 360, 640, 0x000011);

    // Parallax stars
    this.stars = [];
    for (let i = 0; i < 80; i++) {
        const x = Phaser.Math.Between(0, 360);
        const y = Phaser.Math.Between(0, 640);
        const star = this.add.image(x, y, 'star');
        star.speedY = Phaser.Math.FloatBetween(0.05, 0.2);
        star.parallaxFactor = Phaser.Math.FloatBetween(0.02, 0.1);
        this.stars.push(star);
    }

    // Moon surface
    this.ground = this.add.tileSprite(180, 610, 360, 60, 'ground');
    this.physics.add.existing(this.ground, true);

    // Dome
    this.dome = this.add.sprite(180, 580, 'dome');
    this.dome.setOrigin(0.5, 1);
    this.physics.add.existing(this.dome, true);
    this.dome.hits = 0;
    this.domeCracks = this.add.sprite(180, 580, 'cracks_1').setOrigin(0.5, 1).setVisible(false);

    // Saucer
    this.saucer = this.physics.add.sprite(180, 150, 'saucer');
    this.saucer.setCollideWorldBounds(true);

    // Controls
    this.input.on('pointermove', (pointer) => {
        if (this.isGameOver) return;
        if (pointer.isDown) {
            this.saucer.x = pointer.x;
            this.saucer.y = pointer.y;
        }
    });
    this.input.on('pointerdown', (pointer) => {
        if (this.isGameOver) return;
        this.saucer.x = pointer.x;
        this.saucer.y = pointer.y;
    });

    // Bombing timer
    this.bombs = this.physics.add.group();
    this.time.addEvent({
        delay: 1500,
        callback: dropBomb,
        callbackScope: this,
        loop: true
    });

    // Missile timer
    this.missiles = this.physics.add.group();
    this.time.addEvent({
        delay: 4000,
        callback: launchMissile,
        callbackScope: this,
        loop: true
    });

    // Physics overlaps
    this.physics.add.overlap(this.bombs, this.dome, hitDome, null, this);
    this.physics.add.overlap(this.bombs, this.ground, hitGround, null, this);
    this.physics.add.overlap(this.missiles, this.saucer, hitSaucer, null, this);
    this.physics.add.overlap(this.missiles, this.ground, hitGround, null, this);

    this.titleText = this.add.text(180, 30, 'BIRTHDAY MOON MISSION', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '20px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);

    // Scanlines for retro look
    for (let i = 0; i < 640; i += 4) {
        this.add.rectangle(180, i, 360, 2, 0x000000, 0.1).setDepth(1000);
    }
}

function update() {
    this.stars.forEach(star => {
        star.y += star.speedY;
        if (star.y > 640) star.y = 0;

        const offsetX = (this.saucer.x - 180) * star.parallaxFactor;
        star.x = (star.x - offsetX * 0.01);
        if (star.x > 360) star.x = 0;
        if (star.x < 0) star.x = 360;
    });

    this.missiles.getChildren().forEach(missile => {
        if (!this.isGameOver && !this.isVictory) {
            const angle = Phaser.Math.Angle.Between(missile.x, missile.y, this.saucer.x, this.saucer.y);
            missile.setAcceleration(Math.cos(angle) * 120, Math.sin(angle) * 120);
            missile.setMaxVelocity(180);
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
    if (this.isGameOver || this.isVictory) return;
    const bomb = this.bombs.create(this.saucer.x, this.saucer.y + 20, 'bomb');
    bomb.setVelocityY(300);
}

function launchMissile() {
    if (this.isGameOver || this.isVictory) return;
    const x = 180 + (Math.random() > 0.5 ? 60 : -60);
    const missile = this.missiles.create(x, 540, 'missile');
    missile.setVelocityY(-100);
}

function hitDome(dome, bomb) {
    bomb.destroy();
    if (this.isVictory) return;

    this.dome.hits++;
    if (this.dome.hits >= 1 && this.dome.hits <= 4) {
        this.domeCracks.setVisible(true);
        this.domeCracks.setTexture('cracks_' + this.dome.hits);
    }

    if (this.dome.hits >= 5) {
        startVictory(this);
    }
}

function hitGround(ground, projectile) {
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
    this.saucer.setPosition(-50, 150);
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
    scene.dome.setVisible(false);
    scene.domeCracks.setVisible(false);

    scene.add.sprite(180, 580, 'cake').setOrigin(0.5, 1);

    // Fireworks
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    scene.time.addEvent({
        delay: 600,
        repeat: 20,
        callback: () => {
            const x = Phaser.Math.Between(50, 310);
            const y = Phaser.Math.Between(100, 400);
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

    // Banner
    const banner = scene.add.container(scene.saucer.x, scene.saucer.y + 60);
    const bg = scene.add.image(0, 0, 'banner_base');
    const text = scene.add.text(0, 0, 'HAPPY BIRTHDAY!', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        color: '#ff0000',
        fontWeight: 'bold'
    }).setOrigin(0.5);
    banner.add([bg, text]);
    banner.alpha = 0;

    const string = scene.add.graphics();

    scene.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 500
    });

    scene.updateBanner = () => {
        banner.x = scene.saucer.x;
        banner.y = scene.saucer.y + 60;

        string.clear();
        string.lineStyle(2, 0xffffff, 1);
        string.lineBetween(scene.saucer.x, scene.saucer.y, banner.x, banner.y - 15);
    };

    scene.titleText.setText('MISSION ACCOMPLISHED!');
    scene.titleText.setColor('#ffff00');
}

function createTextures(scene) {
    let graphics = scene.make.graphics({ x: 0, y: 0, add: false });

    // Star
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('star', 2, 2);
    graphics.clear();

    // Ground
    graphics.fillStyle(0x777777, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.fillStyle(0x555555, 1);
    graphics.fillRect(5, 5, 10, 10);
    graphics.fillRect(25, 20, 8, 8);
    graphics.generateTexture('ground', 40, 40);
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

    // Bomb
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 6, 10);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0, 6, 3);
    graphics.generateTexture('bomb', 6, 10);
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

    // Cake
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(5, 15, 30, 20);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(5, 15, 30, 5);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(20, 12, 3);
    graphics.generateTexture('cake', 40, 40);
    graphics.clear();

    // Banner
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 140, 30);
    graphics.generateTexture('banner_base', 140, 30);
    graphics.clear();

    for (let i = 1; i <= 4; i++) {
        graphics.lineStyle(2, 0x444444, 1);
        for (let j = 0; j < i * 2; j++) {
            graphics.lineBetween(
                Phaser.Math.Between(40, 120),
                Phaser.Math.Between(20, 60),
                Phaser.Math.Between(40, 120),
                Phaser.Math.Between(20, 60)
            );
        }
        graphics.generateTexture('cracks_' + i, 160, 80);
        graphics.clear();
    }
}
