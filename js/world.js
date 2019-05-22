const List = require('./data-structures/list');
const {incrementGameState} = require('./state');

module.exports = class World {
	// database/map?
	constructor() {
		this.id = incrementGameState('lastWorldId');
		this.bodies = new List();
		this.viewports = new List();
	}

	connectViewport(viewport) {
		this.viewports.addItem(viewport, viewport.id);
	}

	disconnectViewport(viewport) {
		this.viewports.removeItem(viewport.id);
	}

	getBodies() {
		return this.bodies.getItems();
	}

	addBodies(...bodies) {
		bodies.forEach((body) => {
			this.bodies.addItem(body)

			body.world = this;
		});
	}

	/*
	removeBodies(...bodies) {
		bodies.forEach((body) => {
			this.bodies.removeItem(body)
		});
	}
	*/
};
