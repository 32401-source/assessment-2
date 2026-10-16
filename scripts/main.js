import { Game } from "./game.js";
import { createEntity, drawBehaviour, animBehaviour, playableBehaviour, physicsBehaviour, enemyBehaviour, rayBehaviour, collectableBehaviour, healthBehaviour } from "./entities.js";

window.addEventListener("keydown", (ev) => {
    Game.keys[ev.key.toUpperCase()] = true;
});

window.addEventListener("keyup", (ev) => {
    Game.keys[ev.key.toUpperCase()] = false;
});

let lt = performance.now();

const levels = [
    {
        start: [0, 0],
        entities: [
            { x: 5, y: 0, width: 1, height: 1, image: "images/apple.png", behaviours: [physicsBehaviour, collectableBehaviour], attributes: [] },
        ],
    },
];

function loadLevel(lvl) {
    let level = levels[lvl];
    for (const e of level.entities) {
        createEntity(e.x * 64, e.y * 64, e.width * 64, e.height * 64, e.image, e.behaviours, e.attributes);
    };

    createEntity(level.start[0], level.start[1], 64, 64, "images/snake.png", [playableBehaviour, healthBehaviour], [["physics", true], ["hasIv", true], ["solid", true], ["moveStyle", "constant"], ["friction", false], ["speed", 8]]);
};

loadLevel(0);

function absMod(x, y) {
    return ((x % y) + y) % y;
};

let bgs = [];

for (let i = 0; i < 4; i++) {
    let bg = new Image;
    bg.src = "images/background.png";
    bgs.push(bg);
};

const hearts = [];

for (let i = 0; i < 3; i++) {
    let heart = new Image;
    heart.src = "images/heart.png";
    hearts.push(heart);
};

function drawBackground() {
    let tw = bgs[0].naturalWidth;
    let th = bgs[0].naturalHeight;
    if (!tw) return;

    let zoom = Game.cam_zoom;
    let left = Game.cam_pos[0] - (Game.canvas.width / (2 * zoom));
    let top = Game.cam_pos[1] - (Game.canvas.height / (2 * zoom));
    let i0 = Math.floor(left / tw);
    let j0 = Math.floor(top / th);
    let cols = Math.ceil(Game.canvas.width / (tw * zoom)) + 1;
    let rows = Math.ceil(Game.canvas.height / (th * zoom)) + 1;

    for (let i = i0; i < i0 + cols; i++) {
        for (let j = j0; j < j0 + rows; j++) {
            let img = bgs[absMod(i, 2) + 2 * absMod(j, 2)];
            Game.ctx.save();
            Game.ctx.translate(Game.canvas.width / 2, Game.canvas.height / 2);
            Game.ctx.scale(zoom, zoom);
            Game.ctx.drawImage(img, i * tw - Game.cam_pos[0], j * th - Game.cam_pos[1]);
            Game.ctx.restore();
        };
    };
};

let cspawnTime = 6;
let espawnTime = 10;

const easingRate = 0.05;
const cameraSmoothSpeed = 0.08;

const appleData = ["images/apple.png", [collectableBehaviour], []];
const enemyData = ["images/placeholder.png", [physicsBehaviour, enemyBehaviour, rayBehaviour], [["solid", true], ["physics", true], ["pathfinding", true]]];

function spawnEntityAroundPlayer(player, entity) {
    let vx = player.vx;
    let vy = player.vy;
    let zoom = Game.cam_zoom;
    let minDist = (Game.canvas.width / zoom) / 2 + 128;
    let spawnDist = minDist + (Math.random() * 256);

    let spawnX = player.x;
    let spawnY = player.y;

    let isMovingX = Math.abs(vx) > 0.01;
    let isMovingY = Math.abs(vy) > 0.01;

    if (isMovingX && isMovingY) {
        spawnX += vx > 0 ? spawnDist : -spawnDist;
        spawnY += vy > 0 ? -spawnDist : spawnDist;
    } else if (isMovingX) {
        spawnX += vx > 0 ? spawnDist : -spawnDist;
        spawnY += (Math.random() - 0.5) * 400;
    } else if (isMovingY) {
        spawnY += vy > 0 ? -spawnDist : spawnDist;
        spawnX += (Math.random() - 0.5) * 400;
    } else {
        let angle = Math.random() * Math.PI * 2;
        spawnX += Math.cos(angle) * spawnDist;
        spawnY -= Math.sin(angle) * spawnDist;
    };

    createEntity(spawnX, spawnY, 64, 64, entity[0], entity[1], entity[2]);
};

function loop() {
    requestAnimationFrame(loop);

    Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
    let ct = performance.now();
    let dt = ((ct - lt) / 1000) || 0.01;

    drawBackground();

    for (const obj of Game.objects) {
        if (obj.update) obj.update(dt);
    };

    let sn = Game.objects.find(a => a.player);

    const targetZoom = 1 / (1 + Game.score * 0.05);

    Game.cam_zoom += (targetZoom - Game.cam_zoom) * easingRate;
    Game.cam_zoom = Math.max(0.1, Game.cam_zoom);

    if (sn) {
        Game.cam_pos[0] += (sn.x - Game.cam_pos[0]) * cameraSmoothSpeed;
        Game.cam_pos[1] += (sn.y - Game.cam_pos[1]) * cameraSmoothSpeed;
        for (let i = 0; i < sn.health; i++) {
            Game.ctx.drawImage(hearts[i], i * 80, 20);
        };

        cspawnTime -= dt;
        if (cspawnTime <= 0) {
            cspawnTime = 6;
            spawnEntityAroundPlayer(sn, appleData);
        };

        espawnTime -= dt;
        if (espawnTime <= 0) {
            espawnTime = 8;
            spawnEntityAroundPlayer(sn, enemyData);
        };
    };



    lt = ct;
};


requestAnimationFrame(loop);