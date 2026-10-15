import { Game } from "./game.js";

function cross(p1, p2) {
    let x1 = p1[0];
    let y1 = p1[1];
    let x2 = p2[0];
    let y2 = p2[1];
    return ((x1 * y2) - (y1 * x2));
};

function subtractPoints(p1, p2) {
    return [p1[0] - p2[0], p1[1] - p2[1]];
};

export const animBehaviour = {
    currentFrame: 0,
    frameWidth: 64,
    frameHeight: 64,
};

export const camBehaviour = {
    parentObj: null,
    follow() {
        if (!this.parentObj) return;
        if (!this.parentObj.x) return;
        if (!this.parentObj.y) return;
    },
};

export const collectableBehaviour = {
    collectable: true,

    collect() {
        Game.score += 1;
        this.delete();
    },
};

export function createEntity(x, y, width, height, image, behaviours, attributes) {
    let entity = {
        x: x, y: y, width: width, height: height
    };

    entity.image = new Image;
    entity.image.src = image;

    Object.assign(entity, objBehaviour);
    Object.assign(entity, physicsBehaviour);
    Object.assign(entity, drawBehaviour);

    behaviours.forEach(b => {
        Object.assign(entity, b);
    });

    attributes.forEach(attr => {
        entity[attr[0]] = attr[1];
    });

    entity.refresh();
    entity.add();

    return entity;
};

export const drawBehaviour = {
    refresh() {
        if (!this.x) this.x = 0;
        if (!this.y) this.y = 0;
        if (!this.vx) this.vx = 0;
        if (!this.vy) this.vy = 0;
        if (!this.width) this.width = 64;
        if (!this.height) this.height = 64;
        if (!this.image) {
            this.image = new Image;
            this.image.src = "images/placeholder.png";
        };
    },

    draw() {
        if ((!this.image) || this.image.naturalHeight === 0) return;
        if (this.currentFrame) {

        } else {
            Game.ctx.save();
            const screenCenterX = Game.canvas.width / 2;
            const screenCenterY = Game.canvas.height / 2;
            Game.ctx.translate(screenCenterX, screenCenterY);
            Game.ctx.scale(Game.cam_zoom, Game.cam_zoom);

            const drawX = this.x - Game.cam_pos[0];
            const drawY = this.y - Game.cam_pos[1];
            
             Game.ctx.drawImage(
                this.image, 
                drawX, 
                drawY, 
                this.width, 
                this.height
            );
            
            Game.ctx.restore();
        };
    },
};

export const enemyBehaviour = {
    eplayer: null,
    pathfinding: false,
    viewRangeSquared: (7 * 64) * (7 * 64),
    speed: 0.5,

    findPlayer() {
        let objs = Game.objects;
        let filter = objs.filter((a) => a.player);
        if (filter.length === 0) return;
        let player = filter[0];
        let dx = (this.x || 0) - player.x;
        let dy = (this.y || 0) - player.y;
        let distSquared = (dx * dx) + (dy * dy);
        if (distSquared > this.viewRangeSquared) return;
        this.eplayer = player;
    },

    move(dt) {
        if (!this.eplayer) return;
        let dx = (this.x || 0) - this.eplayer.x;
        let dy = (this.y || 0) - this.eplayer.y;
        let distSquared = (dx * dx) + (dy * dy);
        if (distSquared > this.viewRangeSquared) {
            this.eplayer = null;
            return;
        };
        let magnitude = Math.sqrt(distSquared);
        let canSee = true;
        if (this.castRay) {
            let ray = this.castRay(-dx, -dy, Infinity, ["eplayer", "collectable",]);
            canSee = (ray !== null && ray[0] === this.eplayer);
        };
        if (!canSee) {
            return;
        };
        if (magnitude > this.speed) {
            let scale = this.speed / magnitude;
            this.vx -= (dx * scale * 60 * dt);
            this.vy += (dy * scale * dt * 60);
        } else {
            this.vx -= (dx * 60 * dt);
            this.vy += (dy * 60 * dt);
        };
    }
};

export const healthBehaviour = {
    health: 3,
    iv: 0,
    hasIv: false,
    takeDamage(dmg) {
        if (this.iv <= 0) {
            this.health -= dmg;
            if (this.health <= 0) {
                this.delete();
            };
            if (this.hasIv) this.iv = 1;
        };
    },
};

export const objBehaviour = {
    add() {
        Game.objects.push(this);
    },
    delete() {
        const index = Game.objects.indexOf(this);

        if (index !== -1) {
            Game.objects.splice(index, 1);
        };
    },
    update(dt) {
        if (this.move) this.move(dt);
        if (this.updatePos) this.updatePos();
        if (this.draw) this.draw();
        if (this.findPlayer && !this.eplayer) {
            this.findPlayer();
        };
        if (this.follow && this.parentObj) this.follow();

        if (this.iv) this.iv -= dt;
    },
};

export const physicsBehaviour = {
    physics: false,
    gravity: false,
    solid: false,
    friction: true,

    collisionHelper(obj1, obj2) {
        return (obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height);
    },

    checkCollisions() {
        let prev_x = this.x - this.vx;
        let prev_y = this.y + this.vy;
        let gameObjects = Game.objects;
        if (gameObjects.length === 1) return;

        for (const obj of gameObjects) {
            if (obj === this) continue;
            if (!obj.solid && !obj.collectable) continue;
            if (!this.collisionHelper(this, obj)) continue;

            if (obj.collectable && obj.collect && this.player === true) {
                obj.collect();
                continue;
            };

            let was_above = (prev_y + this.height <= obj.y);
            let was_below = (prev_y >= obj.y + obj.height);
            let was_right = (prev_x >= (obj.x + obj.width));
            let was_left = (prev_x + this.width <= obj.x);

            if (was_above) {
                this.vy = 0;
                this.y = obj.y - this.height;
            } else if (was_below) {
                this.vy = 0;
                this.y = obj.y + obj.height;
            } else if (was_right) {
                this.vx = 0;
                this.x = obj.x + obj.width;
            } else if (was_left) {
                this.vx = 0;
                this.x = obj.x - this.width;
            };
        };
    },

    updatePos() {
        this.x += this.vx;
        this.y -= this.vy;
        if (this.physics && this.checkCollisions) {
            this.checkCollisions();
        };
        if (this.friction) this.vx *= Game.friction;
        if (this.friction && !this.gravity) this.vy *= Game.friction;
    },
};

export const playableBehaviour = {
    speed: 1.5,
    player: true,
    moveStyle: "basic",
    trail: [],
    blockCount: 0,
    dist: 0,
    trailSpacing: 16,

    move(dt) {
        while (Game.score > this.blockCount) {
            createEntity(this.x, this.y, 64, 64, "images/snake.png", [playerBlocks], [["head", this], ["id", this.blockCount]]);
            this.blockCount += 1;
        };
        if (this.moveStyle === "basic") {
            if (Game.keys["W"] === true) {
                this.vy += (this.speed * 60 * dt);
            } else if (Game.keys["S"] === true) {
                this.vy -= (this.speed * 60 * dt);
            };
            if (Game.keys["D"] === true) {
                this.vx += (this.speed * 60 * dt);
            } else if (Game.keys["A"] === true) {
                this.vx -= (this.speed * 60 * dt);
            };
        } else if (this.moveStyle === "constant") {
            let ix = 0;
            let iy = 0;

            if (Game.keys["W"] && (this.vy !== -1)) iy += 1;
            if (Game.keys["S"] && (this.vy !== 1)) iy -= 1;
            if (Game.keys["D"] && (this.vx !== -1)) ix += 1;
            if (Game.keys["A"] && (this.vx !== 1)) ix -= 1;

            let mag = Math.hypot(ix, iy);
            if (mag > 0) {
                this.vx = (ix / mag) * this.speed;
                this.vy = (iy / mag) * this.speed;
            };
        };

        Game.cam_pos[0] += (this.x - Game.cam_pos[0]) / 4;
        Game.cam_pos[1] += (this.y - Game.cam_pos[1]) / 4;
        this.dist += Math.hypot(this.vx, this.vy);
        this.trail.push([this.x, this.y, this.dist]);
        let cap = (this.blockCount + 2) * Math.ceil(64 / this.speed);
        while (this.trail.length > cap) this.trail.shift();
    },
};

export const playerBlocks = {
    head: null,
    id: 0,
    move() {
        if (!this.head) return;
        let target = this.head.dist - (64 * (this.id + 1));
        let t = this.head.trail;
        if (t.length === 0 || target <= t[0][2]) {
            this.x = t[0][0]; this.y = t[0][1];
            return;
        };
        for (let i = t.length - 1; i > 0; i--) {
            if (t[i - 1][2] <= target && target <= t[i][2]) {
                let f = (target - t[i - 1][2]) / (t[i][2] - t[i][2 - 1]);
                this.x = t[i - 1][0] + (t[i][0] - t[i - 1][0]) * f;
                this.y = t[i - 1][1] + (t[i][1] - t[i - 1][1]) * f;
                return;
            };
        };
    }
};

export const rayBehaviour = {
    castRay(dirX, dirY, rayLength, exProperties) {
        let lenSq = (dirX * dirX) + (dirY * dirY);
        if (lenSq == 0) return null;
        let len = Math.sqrt(lenSq);
        let delta = [dirX / len, dirY / len];

        let result = null;
        let hit = null;

        let rl = (rayLength === Infinity ? 300 : rayLength)
        let lowestDistance = rayLength;
        let centre = [this.x + (this.width / 2), this.y + (this.height / 2)];

        let ox = this.x + (this.width / 2) - Game.cam_pos[0] + (Game.canvas.width / 2);
        let oy = this.y + (this.height / 2) - Game.cam_pos[1] + (Game.canvas.height / 2);

        for (const obj of Game.objects) {
            if (obj === this) continue;

            if (exProperties.some(p => obj[p])) continue;

            let corners = [[obj.x, obj.y], [obj.x + obj.width, obj.y], [obj.x + obj.width, obj.y + obj.height], [obj.x, obj.y + obj.height]];

            for (let i = 0; i < 4; i++) {
                let a = corners[i];
                let b = corners[(i + 1) % 4];
                let e = subtractPoints(b, a);
                let c = subtractPoints(a, centre);

                let denom = cross(delta, e);
                if (denom === 0) continue;

                let t = cross(c, e) / denom;
                let s = cross(c, delta) / denom;
                if (t < 0 || s < 0 || s > 1) continue;

                if (t < lowestDistance) {
                    lowestDistance = t;
                    result = obj;
                    hit = [centre[0] + t * delta[0], centre[1] + t * delta[1]];
                };
            };
        };
        return (result === null) ? null : [result, hit, lowestDistance];
    },
};