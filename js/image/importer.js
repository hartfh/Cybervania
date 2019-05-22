const {FONT_CHARACTERS} = require('../constants');

module.exports = (dataSet, fontName, font) => {
	for(const i in FONT_CHARACTERS) {
		let character = FONT_CHARACTERS[i];

		if( character == '.' ) {
			character = 'escaped_dot';
		}

		const xPosition = i % font.charsPerLine * font.width;
		const yPosition = Math.floor(i / font.charsPerLine) * font.height;

		font.colors.forEach(color => {
			const sheet = `${fontName}-${color}`;

			dataSet[`${sheet}-${character}`] = {
				sheet,
				x: xPosition,
				y: yPosition,
				w: font.width,
				h: font.height
			};
		});
	}
};
