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
            { x: 3, y: 3, width: 1, height: 1, image: "images/apple.png", behaviours: [physicsBehaviour, collectableBehaviour], attributes: [] },
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

let cspawnTime = 4;
let espawnTime = 6;

const easingRate = 0.05;
const cameraSmoothSpeed = 0.08;

const appleData = ["images/apple.png", [collectableBehaviour], []];
const enemyData = ["images/enemy.png", [physicsBehaviour, enemyBehaviour, rayBehaviour], [["solid", true], ["physics", true], ["pathfinding", true]]];

const lmButton = document.getElementById("lm-button");
let mode = "dark";

lmButton.addEventListener("click", (ev) => {
    console.log("clicked");
    for (const element of document.children) {
        if (mode === "dark") {
            element.classList.add("light-mode");
            element.classList.remove("dark-mode");
            mode = "light";
        } else {
            element.classList.add("dark-mode");
            element.classList.remove("light-mode");
            mode = "dark";
        };
    };
});

function spawnEntityAroundPlayer(player, entity) {
    let vx = player.vx;
    let vy = player.vy;
    let zoom = Game.cam_zoom;
    let minDist = (Game.canvas.width / zoom) / 2 + 128;
    let spawnDist = minDist + (Math.random() * (64 * 3));

    let spawnX = player.x;
    let spawnY = player.y;

    let isMovingX = Math.abs(vx) > 0.01;
    let isMovingY = Math.abs(vy) > 0.01;

    if (isMovingX && isMovingY) {
        spawnX += vx > 0 ? spawnDist : -spawnDist;
        spawnY += vy > 0 ? -spawnDist : spawnDist;
    } else if (isMovingX) {
        spawnX += vx > 0 ? spawnDist : -spawnDist;
        spawnY += (Math.random() - 0.5) * 256;
    } else if (isMovingY) {
        spawnY += vy > 0 ? -spawnDist : spawnDist;
        spawnX += (Math.random() - 0.5) * 256;
    } else {
        let angle = Math.random() * Math.PI * 2;
        spawnX += Math.cos(angle) * spawnDist;
        spawnY -= Math.sin(angle) * spawnDist;
    };

    createEntity(spawnX, spawnY, 64, 64, entity[0], entity[1], entity[2]);
};

Game.ctx.font = "bold 36px Arial";
Game.ctx.fillStyle = "#ccdce7";
Game.ctx.textAlign = "center";
Game.ctx.textBaseline = "middle";

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

    const targetZoom = 1 / (1 + Game.score * 0.08);

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
            cspawnTime = 4;
            spawnEntityAroundPlayer(sn, appleData);
        };

        espawnTime -= dt;
        if (espawnTime <= 0) {
            espawnTime = 6;
            spawnEntityAroundPlayer(sn, enemyData);
        };
    };

    if (sn) {
        Game.ctx.fillText(Game.score, Game.canvas.width / 2, 64);
    } else {
        Game.ctx.fillText("Game over! Your score was " + Game.score + "! Try again. (refresh the tab)", Game.canvas.width / 2, 64);
    };

    lt = ct;
};


requestAnimationFrame(loop);