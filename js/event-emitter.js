module.exports = class EventEmitter {
	constructor() {
		this.events = {};
	}

	dispatch(event, data) {
		if( !this.events[event] ) {
			return;
		}

		for(let i = 0; i < this.events[event].length; i++) {
			const actions = this.events[event][i];

			for(const prop in actions) {
				actions[prop](data);
			}
		}
	}

	subscribe(event, callback, handle) {
		if( !this.events[event] ) {
			this.events[event] = []; // new event
		}

		const action = {};

		action[handle] = callback;

		for(let i = 0; i < this.events[event].length; i++) {
			if( this.events[event][i].hasOwnProperty(handle) ) {
				return;
			}
		}

		this.events[event].push(action);
	}

	unsubscribe(event, handle) {
		for(let i = 0; i < this.events[event].length; i++) {
			if( this.events[event][i].hasOwnProperty(handle) ) {
				delete this.events[event][i][handle];

				this.events[event].splice(i, 1);

				break;
			}
		}
	}
};
