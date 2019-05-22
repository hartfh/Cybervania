const fonts = require('./fonts');
const images = require('./images');
const sheets = require('./sheets');
const sprites = require('./sprites');
const viewports = require('./viewports');

const assignElevationLayers = (dataObj) => {
	const baseLayer = 1000;

	for(let i = -10; i < 41; i++) {
		dataObj[`elev:${i}`] = 1000 + i;
	}
};

const data = {
	fonts,
	images,
	layers: {
		//'layer-1-backfacing': 9,
		'layer-1': 10,
		//'layer-2-backfacing': 19,
		'layer-2': 20,
		//'layer-3-backfacing': 29,
		'layer-3': 30,
		'layer-sub-1': 8
	},
	sheets,
	sprites,
	textures: {},
	tile: {
		TEMPERATURES: {
			FROZEN: 'frozen',
			COLD: 'cold',
			COOL: 'cool',
			TEMPERATE: 'temperate',
			WARM: 'warm',
			HOT: 'hot'
			//SCORCHING: 'scorching'
		},
		terrain: []
	},
	tilesetFilters: {},
	viewports
};

assignElevationLayers(data.layers);

module.exports = {
	getGameData(...sections) {
		let value = data;

		for(const section of sections) {
			if(value.hasOwnProperty(section)) {
				value = value[section];
			}
		}

		return value;
		//return JSON.parse(JSON.stringify(value));
	},
	updateGameData(key, value) {
		if(data.hasOwnProperty(key)) {
			data[key] = value;
		}
	}
};
