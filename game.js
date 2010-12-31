(function () {
	var Keyboard, ctx, width, height, player, enemy, ball, digits;
	
	function createArray(length, defaultValue) {
		return new Array(length).join('x').split('x').map(function () {
			return defaultValue;
		});
	}

	Keyboard = (function () {
		var keys = createArray(256, 0);

		function captureKey(key) {
			return key === 13 || (key >= 32 && key <= 40);
		}

		return ({
			KEY_ENTER: 13,
			KEY_SPACE: 32,
			KEY_UP: 38,
			KEY_DOWN: 40,

			onKeyDown: function (event) {
				if (!captureKey(event.keyCode)) {
					return;
				}

				keys[event.keyCode & 0xff] = 1;
				event.preventDefault();
				return false;
			},

			onKeyUp: function (event) {
				if (!captureKey(event.keyCode)) {
					return;
				}

				keys[event.keyCode & 0xff] = 0;
				event.preventDefault();
				return false;
			},

			isKeyDown: function (key) {
				return keys[key & 0xff] === 1;
			}
		});
	}());

	function Rect(x, y, width, height) {
		this.reset = function () {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		};
		this.reset();
	}
	Rect.prototype.update = function (delta) {};
	Rect.prototype.render = function (ctx) {
		ctx.fillStyle = '#fff';
		ctx.fillRect(this.x | 0, this.y | 0, this.width, this.height);
	};
	Rect.prototype.keepInBounds = function () {
		this.x = Math.max(0, Math.min(width - this.width, this.x));
		this.y = Math.max(0, Math.min(height - this.height, this.y));
	};

	width = 640;
	height = 480;

	actors = [];
	actors.push(player = new Rect(25, 200, 15, 100));
	actors.push(enemy = new Rect(width - 40, 200, 15, 100));
	actors.push(ball = new Rect((width / 2) - 7, (height / 2) - 7, 15, 15));

	player.score = 0;
	enemy.score = 0;

	digits = [0xf99f, 0x6227, 0xe24f, 0xf31f, 0x9f11, 0x742f, 0x8f9f, 0xf248, 0xff9f, 0xf9f1].map(function (digit) {
		var pattern = digit.toString(2);
		while (pattern.length < 16) {
			pattern = '0' + pattern;
		}
		return pattern.split('');
	});

	(function () {
		var pixelSize = 5;
		digits.render = function (number, x, y) {
			ctx.fillStyle = '#fff';
			('' + (number | 0)).split('').forEach(function (digit, place) {
				digits[digit].forEach(function (pixel, index) {
					if (+pixel !== 1) {
						return;
					}

					ctx.fillRect(
						(x + place * pixelSize * 4) + pixelSize * place + pixelSize * (index % 4), 
						y + pixelSize * Math.floor(index / 4),
						pixelSize, pixelSize
					);
				});
			});
		};
	}());

	ball.vx = 0;
	ball.vy = 0;
	ball.update = function (delta) {
		this.x += this.vx * .5 * delta;
		this.y += this.vy * .5 * delta;
		this.keepInBounds();

		// Collision with player's paddle
		if (this.x <= player.x + player.width && this.x + this.width >= player.x) {
			if (this.y >= player.y && this.y + this.height <= player.y + player.height) {
				this.vx = -this.vx;
				return;
			}
		}

		// Collision with enemy's paddle
		if (this.x + this.width >= enemy.x && this.x < enemy.x + enemy.width) {
			if (this.y >= enemy.y && this.y + this.height <= player.y + player.height) {
				this.vx = -this.vx;
				return;
			}
		}

		if (this.x <= 0) { // Collision with left wall
			enemy.score += 1;
			actors.reset();
		} else if (this.x >= width - this.width) { // Collision with right wall
			player.score += 1;
			actors.reset();
		} else if (this.y <= 0 || this.y >= height - this.height) {
			// Bounce off top/bottom wall
			this.vy = -this.vy;
		}
	};

	player.update = function (delta) {
		if (Keyboard.isKeyDown(Keyboard.KEY_DOWN)) {
			this.y += .35 * delta;
		} else if (Keyboard.isKeyDown(Keyboard.KEY_UP)) {
			this.y -= .35 * delta;
		}
		this.keepInBounds();
	};

	ctx = (function () {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.tabIndex = 0;
		canvas.addEventListener('keydown', Keyboard.onKeyDown, false);
		canvas.addEventListener('keyup', Keyboard.onKeyUp, false);
		document.body.appendChild(canvas);
		return canvas.getContext('2d');
	}());

	function update(delta) {
		actors.forEach(function (actor) {
			actor.update(delta);
		});
		render();
	}

	function render() {
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, width, height);

		// Draw center line
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(width / 2, 0);
		ctx.lineTo(width / 2, height);
		ctx.stroke();

		// Draw center square
		ctx.strokeRect((width / 2) - 25, (height / 2) - 25, 50, 50);

		// Draw scores
		digits.render(player.score, (width / 2) - 100, 10);
		digits.render(enemy.score, (width / 2) + 80, 10);

		actors.forEach(function (actor) {
			actor.render(ctx);
		});
	}

	(function () {
		Date.now = Date.now || (function () {
			return new Date().getTime();
		});
		var lastUpdate = Date.now();

		(function loop() {
			var now = Date.now();
			update(now - lastUpdate);
			lastUpdate = now;
			setTimeout(loop, 10);
		}());
	}());
}());
