const Bounds = require('../bounds');
const KeyListener = require('./key-listener');
const MouseListener = require('./mouse-listener');
const {incrementGameState} = require('../state');

module.exports = class Viewport {
	constructor(args) {
		const {key = true, mouse = true} = (args.listeners || {});

		this.id = incrementGameState('lastViewportId');
		this.width = args.width || 0;
		this.height = args.height || 0;
		this.position = {
			x: args.x || 0,
			y: args.y || 0
		};
		this.layer = args.layer || 1;
		this.world = args.world;
		this.world.connectViewport(this);
		this.bounds = new Bounds(this.width, this.height, this.position);
		this.view = {
			position: {
				x: args.view.x || 0,
				y: args.view.y || 0
			}
		};
		this.view.bounds = new Bounds(this.width, this.height, this.view.position);
		this.keyListener = key ? new KeyListener(this) : false;
		this.mouseListener = mouse ? new MouseListener(this) : false;
		this.enabled = true;
	}

	updateView({x, y}) {
		this.view.position.x = x;
		this.view.position.y = y;
		this.view.bounds.update({
			width: this.width,
			height: this.height,
			x,
			y
		});
	}
};
