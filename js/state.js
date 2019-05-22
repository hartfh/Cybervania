const state = {
	canvasPosition: {x: 0, y: 0},
	pixelRatio: 1,
	lastBodyID: 0,
	lastWorldID: 0,
	lastViewportID: 0,
	tickCounter: 0
};

module.exports = {
	getGameState(...sections) {
		let value = state;

		for(const section of sections) {
			if(value.hasOwnProperty(section)) {
				value = value[section];
			}
		}

		return value;
	},
	incrementGameState(key) {
		if(state.hasOwnProperty(key)) {
			return ++state[key];
		}
	},
	updateGameState(key, value) {
		if(state.hasOwnProperty(key)) {
			state[key] = value;
		}
	}
};
