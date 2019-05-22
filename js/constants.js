const constants = {};

constants.CANVAS = {
	CONTAINER_ID: 'viewport-container',
	CANVAS_ID: 'main-viewport',
	WIDTH: 480,
	HEIGHT: 270
};

constants.COLLIDER = {
	EDGE_BUFFER: 10,
	PARTITION_SIZE: 100,
	BITMASKS: {
		character: {
			category: 0x0010,
			mask: 0x1111
		},
		terrain: {
			category: 0x0001,
			mask: 0x1111
		},
		ui: {
			category: 0x0100,
			mask: 0x0000
		}
	}
};

constants.LISTENER = {
	EVENT_TYPES: {
		MOUSE_DOWN: "mousedown",
		MOUSE_UP: "mouseup",
		MOUSE_WHEEL: "mousewheel",
		MOUSE_MOVE: "mousemove",
		MOUSE_DRAG: "mousedrag",
		KEY_DOWN: "keydown",
		KEY_UP: "keyup"
	}
};

constants.PATHS = {
	ASSETS_DIR: `${__dirname}/../assets/`,
	DATA_DIR: `${__dirname}/../data/`,
	DB_DIR: `${__dirname}/../db/`,
	IMG_DIR: `${__dirname}/../assets/img/`,
	SOUND_DIR: `${__dirname}/../assets/sound/`
};

constants.SPRITE = {
	FACINGS: ['e', 'w', 's', 'n', 'se', 'sw', 'ne', 'nw'],
	MODES: [
		'normal',
		'attacking',
		'attacking-moving',
		'attacking-moving-reacting',
		'attacking-moving-reacting-damaged',
		'attacking-moving-damaged',
		'attacking-reacting',
		'attacking-reacting-damaged',
		'attacking-damaged',
		'moving',
		'moving-reacting',
		'moving-reacting-damaged',
		'moving-damaged',
		'reacting',
		'reacting-damaged',
		'damaged'
	],
	MODE_FALLBACKS: {
		'attacking': ['attacking-damaged', 'attacking-reacting-damaged', 'attacking-reacting', 'attacking-moving-damaged', 'attacking-moving-reacting-damaged', 'attacking-moving-reacting', 'attacking-moving', 'moving'],
		'moving': ['moving-damaged', 'moving-reacting-damaged', 'moving-reacting'],
		'reacting': ['reacting-damaged'],
		'damaged': []
	}
};

constants.VIEWPORT = {
	EDGE_BUFFER: 50
};

constants.FONT_CHARACTERS = [
	' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4',
	'5', '6', '7', '8', '9',	':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
	'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^',
	'_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
	't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}'
];


/*
tile_size
viewport dimensions
*/

module.exports = constants;
