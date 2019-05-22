const List = require('../data-structures/list');
const {getGameState} = require('../state');
const {getGameData} = require('../../data/game-data');

const {LISTENER} = require('../constants');
const {
	MOUSE_DOWN,
	MOUSE_UP,
	MOUSE_WHEEL,
	MOUSE_MOVE,
	MOUSE_DRAG
} = LISTENER.EVENT_TYPES;
const BODY_LISTS = [
	"allBodies",
	"mouseClickBodies",
	"mouseUnclickBodies",
	"mouseDragBodies",
	"mouseMoveBodies",
	"mouseWheelBodies"
];

module.exports = class Listener {
	constructor(viewport) {
		this.viewport					= viewport;
		this.cursorVportPosition	= {x: 0, y: 0};
		this.mouseDown					= false;
		this.mouseButton				= false;
		this.direction					= false;
		this.enabled					= true;

		BODY_LISTS.forEach((listName) => {
			this[listName] = new List();
		});

		window.addEventListener(MOUSE_DOWN,		this.mouseDownInput.bind(this));
		window.addEventListener(MOUSE_UP,		this.mouseUpInput.bind(this));
		window.addEventListener(MOUSE_WHEEL,	this.mouseWheelInput.bind(this));
		window.addEventListener(MOUSE_MOVE,		this.mouseMove.bind(this));
	}

	enable() {
		this.enabled = true;
	}

	disable() {
		this.enabled = false;
	}

	static getMouseEventButton(e) {
		let button;

		switch(e.button) {
			case 0:
				button = "left";
				break;
			case 1:
				button = "wheel";
				break;
			case 2:
				button = "right";
				break;
			default:
				button = false;
				break;
		}

		return button;
	}

	mouseDownInput(e) {
		e.preventDefault();

		const mouseButton	= this.constructor.getMouseEventButton(e);

		this.mouseDown		= true;
		this.mouseButton	= mouseButton;
		this.direction		= false;

		this.triggerEvent(MOUSE_DOWN, {point: this.cursorVportPosition});
	}

	mouseUpInput(e) {
		e.preventDefault();

		this.triggerEvent(MOUSE_UP, {point: this.cursorVportPosition});

		this.mouseButton	= false;
		this.mouseDown		= false;
		this.direction		= false;
	}

	mouseWheelInput(e) {
		e.preventDefault();

		this.direction		= (e.deltaY > 0) ? "down" : "up";
		this.mouseButton	= "wheel";

		this.triggerEvent(MOUSE_WHEEL, {point: this.cursorVportPosition});
	}

	mouseMove(e) {
		this.updateCursorPosition(e);

		if( this.mouseDown ) {
			this.mouseDrag(this.cursorVportPosition);
		} else {
			//this.mouseButton = false;
		}

		this.triggerEvent(MOUSE_MOVE, {point: this.cursorVportPosition});
	}

	mouseDrag(point) {
		this.triggerEvent(MOUSE_DRAG, point);
	}

	updateCursorPosition(e) {
		const point = {
			x:	e.pageX,
			y:	e.pageY
		};

		// Convert browser coordinates into viewport coordinates
		point.x -= getGameState('canvasPosition', 'x');
		point.y -= getGameState('canvasPosition', 'y');
		point.x /= getGameState('pixelRatio');
		point.y /= getGameState('pixelRatio');
		point.x -= this.viewport.position.x;
		point.y -= this.viewport.position.y;
		point.x += this.viewport.view.position.x;
		point.y += this.viewport.view.position.y;

		this.cursorVportPosition = point;
	}

	updateCursorFromScroll(xAdjust = 0, yAdjust = 0) {
		if( !this.mouseDown ) {
			return;
		}

		// BUG: needs to only trigger move event somehow.
		this.triggerEvent(MOUSE_DOWN, {point: this.cursorVportPosition, scroll: true});
	}

	createEventObject() {
		return {
			position: this.cursorVportPosition,
			mouseButton: this.mouseButton,
			mouseDown: this.mouseDown,
			direction: this.direction
		};
	}

	testEvent(
		eventName,
		bodyList = new List(),
		{
			point = {x: 0, y: 0},
			scroll = false,
			keyless = false
		}
	) {
		let highestIndex = 0;
		let highestCallback = null;
		let highestBody = null;

		if( !this.viewport.view.bounds.encompass(point) ) {
			return;
		}

		bodyList.eachItem((body) => {
			const {callback} = body.hasMouseInput(eventName, this.mouseButton, scroll);

			if( keyless || callback ) {
				//const sprite = getGameData('sprites', body.sprite.name);
				//const zIndex = getGameData('layers', sprite.layer);
				const zIndex = getGameData('layers', body.display.layer);

				if( zIndex > highestIndex ) {
					//console.log(body.bounds, point)
					if( body.bounds.encompass(point) ) {
						if( !body.chamfer || !body.bounds.chamferedRegion(point, body.chamfer) ) {
							highestIndex		= zIndex;
							highestCallback	= callback;
							highestBody			= body;
						}
					}
				}
			}
		});

		if(highestCallback) {
			highestCallback(highestBody, this.createEventObject());
		}
	}

	triggerEvent(eventName, {point, scroll}) {
		if(this.enabled) {
			switch(eventName) {
				case MOUSE_DOWN:
					this.testEvent(eventName, this.mouseClickBodies, {point, scroll});
					break;
				case MOUSE_UP:
					this.testEvent(eventName, this.mouseUnclickBodies, {point});
					break;
				case MOUSE_WHEEL:
					this.testEvent(eventName, this.mouseWheelBodies, {point, scroll});
					break;
				case MOUSE_MOVE:
					this.testEvent(eventName, this.mouseMoveBodies, {point, keyless: true});
					break;
				case MOUSE_DRAG:
					this.testEvent(eventName, this.mouseDragBodies, {point});
					break;
				default:
					break;
			}
		}
	}

	addBody(body, eventName) {
		this.allBodies.addItem(body, body.id);

		switch(eventName) {
			case MOUSE_DOWN:
				this.mouseClickBodies.addItem(body, body.id);
				break;
			case MOUSE_UP:
				this.mouseUnclickBodies.addItem(body, body.id);
				break;
			case MOUSE_WHEEL:
				this.mouseWheelBodies.addItem(body, body.id);
				break;
			case MOUSE_MOVE:
				this.mouseMoveBodies.addItem(body, body.id);
				break;
			case MOUSE_DRAG:
				this.mouseDragBodies.addItem(body, body.id);
				break;
			default:
				break;
		}
	}

	removeBody(body) {
		BODY_LISTS.forEach((listName) => {
			this[listName].removeItem(body.id);
		});
	}
};
