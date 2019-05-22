const {updateGameState} = require('./state');
const {CANVAS} = require('./constants');

module.exports = class Canvas {
	constructor() {
		this.container;
		this.context;
		this.elem;
		this.pixelRatio;

		this.createCanvas();

		window.addEventListener('resize', (() => {
			this.updateScreenSize();
		}));
	}

	updateScreenSize() {
		const screenHeight	= window.innerHeight;
		const screenWidth		= document.body.clientWidth;

		this.container.style.height = `${screenHeight}px`;
		this.pixelRatio = Math.floor(screenWidth / CANVAS.WIDTH);

		const vportHeight		= CANVAS.HEIGHT * this.pixelRatio;
		const vportWidth		= CANVAS.WIDTH * this.pixelRatio;
		const canvasFromTop	= (screenHeight - vportHeight) / 2;
		const canvasFromLeft	= (screenWidth - vportWidth) / 2;

		this.elem.style.top	= `${canvasFromTop}px`;
		this.elem.style.left	= `${canvasFromLeft}px`;
		this.elem.width		= vportWidth;
		this.elem.height		= vportHeight;

		updateGameState('canvasPosition', {x: canvasFromLeft, y: canvasFromTop});
		updateGameState('pixelRatio', this.pixelRatio);
	}

	createCanvas() {
		this.elem = document.createElement('canvas');

		this.elem.id		= CANVAS.CANVAS_ID;
		this.elem.width	= CANVAS.WIDTH;
		this.elem.height	= CANVAS.HEIGHT;

		this.container = document.getElementById(CANVAS.CONTAINER_ID);
		this.context	= this.elem.getContext('2d');

		this.container.appendChild(this.elem);

		this.buffer = {};
		this.buffer.elem = document.createElement('canvas');
		this.buffer.context = this.buffer.elem.getContext('2d');
		this.buffer.elem.width = CANVAS.WIDTH;
		this.buffer.elem.height = CANVAS.HEIGHT;
	}
};
