/* eslint-disable no-console */
const fs = require('fs');
const MaxRectsPacker = require('maxrects-packer');
const Datastore = require('nedb');
const {PATHS} = require('../constants');
const {getGameData, updateGameData} = require(`${PATHS.DATA_DIR}/game-data`);

const converter = new function() {
	const _self 	= this;
	const _encoded	= {};
	const _images	= getGameData('images');
	const _sheets	= getGameData('sheets');
	let _db			= false;
	let _canvas		= false;
	let _context	= false;

	function _loadSheet(encoded, index, callback) {
		const key	= Object.keys(encoded.sheets)[index];
		const data	= encoded.sheets[key];
		const image = new Image();

		image.onload = function() {
			if( index + 1 < Object.keys(encoded.sheets).length ) {
				_loadSheet(encoded, index + 1, callback);
			} else {
				// Adjust image data
				for(const i in encoded.images) {
					const imgData = encoded.images[i];

					_images[i].x		= imgData.x;
					_images[i].y		= imgData.y;
					_images[i].sheet	= imgData.sheet;
				}

				// Adjust sheet data
				const imageSheets = {};

				for(const s in encoded.sheets) {
					imageSheets[s] = encoded.sheets[s];
				}

				updateGameData('sheets', imageSheets);
				updateGameData('images', _images);
				callback();
			}
		}

		image.src = data;
	}

	function _pasteBinImages(packer, binIndex = 0, rectIndex = 0, binComplete = () => {}) {
		const bin			= packer.bins[binIndex];
		const image			= new Image();
		const binImgData	= bin.rects[rectIndex];

		image.onload = function() {
			_context.drawImage(
				this,
				_images[binImgData.data].x,
				_images[binImgData.data].y,
				_images[binImgData.data].w,
				_images[binImgData.data].h,
				binImgData.x,
				binImgData.y,
				binImgData.width,
				binImgData.height
			);

			// Update the image data with their new sheets and positions within them
			_images[binImgData.data].x			= binImgData.x;
			_images[binImgData.data].y			= binImgData.y;
			_images[binImgData.data].sheet	= `spritesheet-${binIndex}`;

			if( rectIndex + 1 < packer.bins[binIndex].rects.length ) {
				_pasteBinImages(packer, binIndex, rectIndex + 1, binComplete);
			} else {
				binComplete();
			}
		}

		image.src = PATHS.IMG_DIR + _sheets[_images[binImgData.data].sheet];
	}

	function _pasteBin(packer, binIndex = 0, binsComplete = () => {}) {
		const bin = packer.bins[binIndex];

		_canvas.width	= bin.width;
		_canvas.height	= bin.height;

		_context.globalCompositeOperation = 'source-over';
		_context.fillStyle = 'transparent';
		_context.fillRect(0, 0, _canvas.width, _canvas.height);

		_pasteBinImages(packer, binIndex, 0, () => {
			// Dump canvas data
			_encoded[`spritesheet-${binIndex}`] = _canvas.toDataURL('image/png');

			if( binIndex + 1 < packer.bins.length ) {
				// Move on to the next bin
				_pasteBin(packer, binIndex + 1, binsComplete);
			} else {
				binsComplete();
			}
		});
	}

	function _binImages() {
		const packer = new MaxRectsPacker(1024, 1024);
		const contents = [];

		for(var i in _images) {
			const image = _images[i];
			const shape = {width: image.w, height: image.h, data: i};

			contents.push(shape);
		}

		packer.addArray(contents);

		_pasteBin(packer, 0, () => {
			_db.insert({sheets: _encoded, images: _images}, (err) => {

				if(err) {
					console.log('Bin encoding problem occurred', err);
				} else {
					console.log('Bin encoding complete');
				}

				for(var s in _encoded) {
					const sheet = _encoded[s];
					const data = sheet.replace(/^data:image\/\w+;base64,/u, '');
					const buffer = Buffer.from(data, 'base64');

					fs.writeFile(`assets/test-${s}.png`, buffer, () => {
						console.log('completed writing');
					});
				}
			});
		});
	}

	_self.encode = () => {
		fs.unlink(`${PATHS.ASSETS_DIR}/encoded-img-data`, () => {
			_canvas	= document.createElement('canvas');
			_context	= _canvas.getContext('2d');

			_db = new Datastore({filename: `${PATHS.ASSETS_DIR}/encoded-img-data`, autoload: true});

			if( Object.keys(_images).length > 0 ) {
				_binImages();
			}
		});
	};

	_self.decode = (callback = () => {}) => {
		_db = new Datastore({filename: `${PATHS.ASSETS_DIR}/encoded-img-data`, autoload: true});

		_db.findOne({}, (err, doc) => {
			if(doc) {
				_loadSheet(doc, 0, callback);
			}
			if(err) {
				throw(err);
			}
		});
	};
};

module.exports = {
	decodeImages: converter.decode,
	encodeImages: converter.encode
};
