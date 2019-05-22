const randomFromTo = (min, max) => {
	return (Math.random() * (max - min) ) + min;
};

const hexToRgb = (hex) => {
	const colorR = hex.substr(1, 2);
	const colorG = hex.substr(3, 2);
	const colorB = hex.substr(5);

	return {
		r: parseInt(colorR, 16),
		g: parseInt(colorG, 16),
		b: parseInt(colorB, 16)
	};
};

const getGradiatedColors = (hexA, hexB, steps) => {
	const adjDist = steps - 1;
	const rgbA = hexToRgb(hexA);
	const rgbB = hexToRgb(hexB);
	const key = [];
	const increments = {
		r: (rgbA.r - rgbB.r) / adjDist,
		g: (rgbA.g - rgbB.g) / adjDist,
		b: (rgbA.b - rgbB.b) / adjDist
	};

	for(let i = 0; i < adjDist; i++) {
		const stepValues = {
			r: Math.round(rgbA.r - i * increments.r),
			g: Math.round(rgbA.g - i * increments.g),
			b: Math.round(rgbA.b - i * increments.b)
		};
		const hexR = (stepValues.r).toString(16).padStart(2, '0');
		const hexG = (stepValues.g).toString(16).padStart(2, '0');
		const hexB = (stepValues.b).toString(16).padStart(2, '0');

		key.push(`#${hexR}${hexG}${hexB}`);
	}

	key.push(hexB);

	return key;
};

module.exports = {
	getGradiatedColors,
	hexToRgb,
	randomFromTo
};
