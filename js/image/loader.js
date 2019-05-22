const {PATHS} = require('../constants');
const {getGameData, updateGameData} = require(`${PATHS.DATA_DIR}/game-data`);

const imageLoader = new function() {
	const _self		= this;
	const _images	= getGameData('images');
	const _sheets	= getGameData('sheets');
	let _callback	= null;

	function _setupImages() {
		for(const index in _images) {
			const image = _images[index];

			_images[index].src = _sheets[image.sheet];
		}

		updateGameData('images', _images);
		updateGameData('sheets', _sheets);

		_callback();
	}

	function _loadSheets(index) {
		//const self = arguments.callee;
		const key	= Object.keys(_sheets)[index];
		const data	= _sheets[key];
		const image	= document.getElementById('img-loader');

		image.onload = function() {
			const nextIndex = index + 1;

			_sheets[key] = image.src;

			if( nextIndex < Object.keys(_sheets).length ) {
				_loadSheets(nextIndex);
			} else {
				_setupImages();
			}
		}

		image.src = PATHS.IMG_DIR + data;
	}

	_self.load = function(callback = function() {}) {
		_callback = callback;

		if( Object.keys(_sheets).length > 0 ) {
			_loadSheets(0);
		}
	};
};

module.exports = function(callback) {
	imageLoader.load(callback);
};
