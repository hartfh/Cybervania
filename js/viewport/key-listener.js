const List = require('../data-structures/list');

const {LISTENER} = require('../constants');
const {
	KEY_DOWN,
	KEY_UP
} = LISTENER.EVENT_TYPES;
const BODY_LISTS = [
	"allBodies",
	"keyboardDownBodies",
	"keyboardUpBodies"
];

module.exports = class KeyListener {
	constructor(viewport) {
		this.viewport					= viewport;
		this.enabled					= true;

		BODY_LISTS.forEach(listName => {
			this[listName] = new List();
		});

		window.addEventListener(KEY_DOWN,		this.keyInput.bind(this));
		window.addEventListener(KEY_UP,			this.keyInput.bind(this));
	}

	enable() {
		this.enabled = true;
	}

	disable() {
		this.enabled = false;
	}

	keyInput(e) {
		const {key} = e;

		e.preventDefault();

		if( e.type == "keyup" ) {
			this.triggerEvent(KEY_UP, key);
		} else if( e.type == "keydown" ) {
			this.triggerEvent(KEY_DOWN, key);
		}
	}

	static testEvent(eventName, bodyList = new List(), key) {
		bodyList.eachItem((body) => {
			const {callback} = body.hasKeyInput(eventName, key);

			if( callback ) {
				callback(body, key);
			}
		});
	}

	triggerEvent(eventName, key) {
		if(this.enabled) {
			switch(eventName) {
				case KEY_DOWN:
					this.constructor.testEvent(eventName, this.keyboardDownBodies, key);
					break;
				case KEY_UP:
					this.constructor.testEvent(eventName, this.keyboardUpBodies, key);
					break;
				default:
					break;
			}
		}
	}

	addBody(body, eventName) {
		this.allBodies.addItem(body, body.id);

		switch(eventName) {
			case KEY_DOWN:
				this.keyboardDownBodies.addItem(body, body.id);
				break;
			case KEY_UP:
				this.keyboardUpBodies.addItem(body, body.id);
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
