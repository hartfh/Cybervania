const Bounds = require('../bounds');
const List = require('../data-structures/list');
const Display = require('./display');
//const {getGameData} = require('../../data/game-data');
const {incrementGameState} = require('../state');

module.exports = class Body {
	constructor(args) {
		//this.category
		//this.mask
		this.id = incrementGameState('lastBodyID');
		this.world = null;
		this.position = {
			x: args.x || 0,
			y: args.y || 0
		};
		this.chamfer = args.chamfer || 0;
		this.velocity = args.velocity || {x: 0, y: 0};

		// static/sleeping?
		// ghost (do not track collissions)
		// sensor: collisions tracked and pairs notified, but does not prevent movement
		this.visible = true;
		this.height = args.height || 0;
		this.width = args.width || 0;
		this.bounds = new Bounds(this.width, this.height, this.position);
		//this.inputs = new List();
		this.inputs = false;
		this.display = new Display(args, this);
		//this.sprite = args.sprite ? new Sprite(args.sprite, this) : false;
		//this.text = args.text ? new Text() : false;
		this.refreshSpriteFrame = false;
		this.tethers = false;
		this.bitmask = args.bitmask;
	}

	disableInput(eventName) {
		this.inputs.disableItem(eventName);
	}

	enableInput(eventName) {
		this.inputs.enableItem(eventName);
	}

	tether(body, relative) {
		this.maybeInitTethers();

		this.tethers.addItem({tethered: body, relative}, body.id);
	}

	untether(body) {
		this.tethers.removeItem(body.id);
	}

	maybeInitInputs() {
		if(!this.inputs) {
			this.inputs = new List();
		}
	}

	maybeInitTethers() {
		if(!this.tethers) {
			this.tethers = new List();
		}
	}

	// "inputs" for sensor events?
		// might need sensors be able to toggle key input events

	addMouseInput(eventName, {callback = () => {}, key = false, scroll = false}) {
		this.maybeInitInputs();

		this.world.viewports.eachItem(viewport => {
			if(viewport.mouseListener) {
				viewport.mouseListener.addBody(this, eventName);
			}
		});

		this.inputs.addItem({callback, scroll}, `${eventName}-${key}`);
	}

	addKeyInput(eventName, {callback = () => {}, key = false}) {
		this.maybeInitInputs();

		this.world.viewports.eachItem(viewport => {
			if(viewport.keyListener) {
				viewport.keyListener.addBody(this, eventName);
			}
		});

		this.inputs.addItem({callback, scroll}, `${eventName}-${key}`);
	}

	hasMouseInput(eventName, key, scroll = false) {
		const input = this.inputs.getItem(`${eventName}-${key}`);

		if( input && input.scroll == scroll ) {
			return input;
		}

		return {};
	}

	hasKeyInput(eventName, key) {
		const input = this.inputs.getItem(`${eventName}-${key}`);

		if(input) {
			return input;
		}

		return {};
	}
}
