const fs = require('fs');
const {getGradiatedColors, hexToRgb} = require('./util/tools');
const HexGrid = require('./data-structures/hex-grid');
const HexCompass = require('./data-structures/hex-compass');
const {HEX_DIRECTIONS} = require('../data/strings');

/*
Plateau (dry, hilly-high), badlands (dry, high-temp, hilly-low), wetland (low,  wet), tundra,
temperate/tropical rainforest, deciduous forest, desert, scrubland, steppe, savannah (flat, low, low-moisture, med-temp),
grassland, boreal forest, coral reef, salt marsh, swamp/mangrove, lake, river, litoral, kelp forest

Temperature: 0 - 100
Moisture: 0 - 100
Elevation: -7 - 20
		moisture
temp

*/

// Adjust moisture adjacene to rivers and lakes (wetland, floodplain)
// Coastal areas near salt-water with elevation 0 can become wetlands

// Sea level
const biomeMatrix =
[
	['moonscape',		'moonscape',	'ice',			'ice',					'ice'],
	['tundra',			'tundra',		'grassland',	'boreal forest',		'boreal forest'],
	['grassland',		'shrubland',	'woodland',		'woodland',				'evergreen forest'],
	['scrubland',		'grassland',	'shrubland',	'woodland',				'temperate rainforest'],
	['desert',			'scrubland',	'savanna',		'woodland',				'temperate rainforest'],
	['hot desert',		'desert',		'scrubland',	'savanna',				'tropical rainforest']
];
const biomeColorMap = {
	'boreal forest': '#129b50',
	'desert': '#d19955',
	'evergreen forest': '#117569',
	'hot desert': '#ef7b2d',
	'ice': '#f3f3ff',
	'grassland': '#8caa63',
	'moonscape': '#9090a9',
	'savanna': '#c3e291',
	'scrubland': '#c9c07a',
	'shrubland': '#65994f',
	'temperate rainforest': '#5c8e6e',
	'tropical rainforest': '#364900',
	'tundra': '#8cada9',
	'woodland': '#3e6b1a'
};

// Low-hill elevation
// badlands

// High elevation (reduce temperature a little, and past a certain point reduce moisture)
// taiga, alpine tundra, ice/polar

// River adjacent
// floodplain, swamp, delta

// Coast
// salt marsh, mangroves, sandy beach, cliffs, rocky/rugged

// Inlet types:
// cove, bay, mudflat?, lagoon


const createDataExemplar = () => {
	return {
		depth: 0,
		elevation: 0,
		//freshwater: false
		moisture: 0,
		//mountain: false
		land: false,
		//peak: false
		temperature: 0,
		/*
		elevation: {
			bodies: [],
			value: 0
		},
		*/
		//events?
		//city
		//structure may need to be array
		structure: {
			body: false,
			value: ""
		},
		terrain: {
			body: false,
			value: ""
		},
		// reference army group?
		unit: {
			body: false
		},
		// litoral coast, sea, river, ocean
		water: {
			body: false,
			value: ""
		},
		// dust storm, hurricane, atmospheric storm, lightning, rain + clouds
		weather: {
			body: false,
			value: ""
		}
	};
};

class MapGenerator {
	constructor() {
		this.grid = false;
		this.height = 0;
		this.width = 0;
		this.gridData = {};
	}
	static countNeighbors(cell, minElev) {
		let count = 0;

		HEX_DIRECTIONS.forEach(dir => {
			const nghbr = cell[dir]
			if( nghbr.elevation >= minElev ) {
				count++;
			}
		});

		return count;
	}
	generate(width, height) {
		this.height = height;
		this.width = width;
		this.grid = new HexGrid(width, height, {
			data: true,
			meta: true,
			scratch: true,
			wrapX: true
		}, createDataExemplar);

		this.seedContinents();
		this.detectAreas();

		// Land depths
		let landDepth = 1;
		while(true) {
			const test = dataPoint => {
				return dataPoint.land;
			};
			const passthrough = dataPoint => {
				return dataPoint.freshwater;
			};
			const flood = dataPoint => {
				return dataPoint.freshwater;
			};

			if(!this.setDepths(landDepth, test, passthrough, flood)) {
				break;
			}

			landDepth++;
		}

		for(let d = 1; d < 9; d++) {
			const test = dataPoint => {
				return !dataPoint.land;
			};

			this.setDepths(d, test);
		}

		this.setTemperatures();

		/*
		// Setting depths using getRing
		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			const landTest = dataPoint => {
				return (dataPoint.land === true);
			};
			const waterTest = dataPoint => {
				return (dataPoint.land === false);
			};
			const test = dataPoint.land ? landTest : waterTest;

			let radius = 1;

			ringLoop:
			while(true) {
				const ring = self.getRing(x, y, radius);
				let internalMapPoints = 0;

				for(let r = 0; r < ring.length; r++) {
					const nghbr = ring[r];
					const nghbrDataPoint = self.getDataPoint(nghbr.x, nghbr.y);

					if(nghbrDataPoint) {
						internalMapPoints++;

						if(!test(nghbrDataPoint)) {
							break ringLoop;
						}
					}
				}

				if(!internalMapPoints) {
					break ringLoop;
				}

				radius++;
			}

			self.setDataPoint(x, y, {
				depth: radius - 1,
			});
		});
		*/

		//let successes = 0;
		//const maxSuccesses = 30;


		/*
		// Mountain base growing. Unneeded but shows use of grow extra action arg
		this.grid.addFilter((point, x, y) => {
			const dataPoint = this.grid.getDataPoint(x, y);

			if(dataPoint.special2) {
				return point;
			}

			return false;
		});

		const special2GrowAction = (x, y, self) => {
			self.setDataPoint(x, y, {
				special2: true
			});
		};
		this.grid.refresh().grow(35, special2GrowAction).refresh().grow(60, special2GrowAction).refresh().grow(40, special2GrowAction).clearFilter();
		*/

		/*
		// Mountain Elevation v1
		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.peak) {
				//const peakHeight = 7 + Math.ceil(Math.random() * 5);
				let peakHeight = 6 + Math.floor(dataPoint.peak * 0.15);

				if(peakHeight >= 8) {
					peakHeight = 4 + Math.ceil(Math.random() * 8);
				}
				const peakDataPoint = self.getDataPoint(x, y);

				if(peakDataPoint.elevation <= peakHeight && peakDataPoint.depth >= peakHeight) {
					this.setPointElevation(x, y, peakHeight, (ringDataPoint, ringTargetElevation) => {
						return (ringDataPoint && ringDataPoint.elevation < ringTargetElevation && ringDataPoint.land && ringDataPoint.depth >= ringTargetElevation);//&& !ringDataPoint.peak
					});
				}
			}
		});
		*/

		this.createMountains();
		this.setPeakElevations();
		//this.raiseRandomLandAreas();
		this.createRivers();
		this.setWaterElevation();
		this.raiseRandomCoastalAreas();
		this.raiseRandomWaterAreas();
		this.setMoisture();
		this.adjustMoistureFromDepth();
		this.adjustMoistureFromAirCurrents();
		this.adjustMoistureFromElevation();
		this.adjustTemperatureFromElevation();


		this.print();

		return this.grid;
	}
	detectAreas() {
		const legend = {
			land: {},
			water: {}
		};
		let idIndex = 1;

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.areaID) {
				return;
			}
			let innerLoops = 0;

			let testNext = [{x, y}];
			const rootIsLand = dataPoint.land;

			whileLoop:
			while(testNext.length) {
				const testCoords = {};

				testNext.forEach(testCoord => {
					const testDataPoint = self.getDataPoint(testCoord.x, testCoord.y);

					if(!testDataPoint.areaID) {
						const testMetaPoint = self.getMetaPoint(testCoord.x, testCoord.y);

						HEX_DIRECTIONS.forEach(direction => {
							const dirCoords = testMetaPoint[direction];

							if(dirCoords) {
								const dirDataPoint = self.getDataPoint(dirCoords.x, dirCoords.y);

								if(!dirDataPoint.areaID && rootIsLand === dirDataPoint.land) {
									const key = `${dirCoords.x}-${dirCoords.y}`;

									if(!testCoords[key]) {
										testCoords[key] = dirCoords;
									}
								}
							}
						});

						self.setDataPoint(testCoord.x, testCoord.y, {
							areaID: idIndex
						});

						const legendTypeKey = testDataPoint.land ? 'land' : 'water';

						if(!legend[legendTypeKey][idIndex]) {
							legend[legendTypeKey][idIndex] = 0;
						}

						legend[legendTypeKey][idIndex] += 1;
					}
				});

				testNext = Object.values(testCoords);
			}

			idIndex++;
		});
		console.log("legend", legend);

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(!dataPoint.land && legend.water[dataPoint.areaID] < 400) {
				self.setDataPoint(x, y, {
					freshwater: true,
					special6: true
				});
			}
		});
	}
	createRivers() {
		let numRivers = 0;
		const minRiverLength = 18;
		const maxRiverLength = 46;
		const maxNumRivers = 32;

		const createRiverBranch = (x, y, config, self) => {
			const {isBranch, minRiverLength, maxRiverLength, maxNumRivers} = config;
			const riverPoints = {};
			let currentCoords = {x, y};
			let prevDirection;
			let numSameDirs = 0;
			const compass = new HexCompass();

			while(true) {
				const currentDataPoint = self.getDataPoint(currentCoords.x, currentCoords.y);

				riverPoints[`${currentCoords.x}-${currentCoords.y}`] = currentCoords;

				const ring = self.getRing(currentCoords.x, currentCoords.y);
				const nextPossible = {};
				const ringKey = {};

				ring.forEach((ringCoords, i) => {
					ringKey[HEX_DIRECTIONS[i]] = ringCoords;
				});

				ring.forEach((ringCoords, i) => {
					const ringDataPoint = self.getDataPoint(ringCoords.x, ringCoords.y);
					const key = `${ringCoords.x}-${ringCoords.y}`;
					const testDirection = HEX_DIRECTIONS[i];

					if(ringDataPoint && ringDataPoint.land && ringDataPoint.depth >= currentDataPoint.depth && !riverPoints[key] && !ringDataPoint.river) {
						compass.dir = testDirection;

						const {left, right} = compass.adjacent;
						const leftKey = `${ringKey[left].x}-${ringKey[left].y}`;
						const rightKey = `${ringKey[right].x}-${ringKey[right].y}`;
						let acceptableDirection;

						if(!riverPoints[leftKey] && !riverPoints[rightKey]) {
							const waterTestRing = self.getRing(ringCoords.x, ringCoords.y);
							let waterAdjacent;

							waterLoop:
							for(let w = 0; w < waterTestRing.length; w++) {
								const waterTestCoords = waterTestRing[w];
								const waterTestDataPoint = self.getDataPoint(waterTestCoords.x, waterTestCoords.y);

								if(!waterTestDataPoint.land || waterTestDataPoint.river) {
									waterAdjacent = true;

									break waterLoop;
								}
							}

							if(!waterAdjacent) {
								nextPossible[testDirection] = {x: ringCoords.x, y: ringCoords.y};
							}
						}
					}
				});

				if(Object.values(nextPossible).length) {
					if(numSameDirs >= 2) {
						delete nextPossible[prevDirection];

						numSameDirs = 0;
					}
					if(Object.values(nextPossible).length) {
						const dirKey = Object.keys(nextPossible).randomize().pop();

						if(dirKey === prevDirection) {
							numSameDirs++;
						}

						currentCoords = nextPossible[dirKey];
						prevDirection = dirKey;
					} else {
						break;
					}
				} else {
					break;
				}

				if(Object.values(riverPoints).length >= maxRiverLength) {
					break;
				}
			}

			const finalPoints = Object.values(riverPoints);

			if(finalPoints.length >= minRiverLength) {
				finalPoints.forEach(riverPoint => {
					self.setDataPoint(riverPoint.x, riverPoint.y, {
						river: true,
						special4: true
					});
				});

				if(!isBranch) {
					numRivers++;
				}
				/*
				if(!isBranch && finalPoints.length > 24) {
					createRiverBranch(finalPoints[20].x, finalPoints[20].y, {isBranch: true, minRiverLength: 8, maxRiverLength: 20, maxNumRivers: 1}, self);
				}
				*/
			}

			if(numRivers >= maxNumRivers) {
				return true;
			}
		};

		this.grid.eachPointRandom((point, x, y, self) => {
			const dataPoint = self.getDataPoint(x, y);

			if(dataPoint.land && dataPoint.depth === 0 && dataPoint.temperature > 12) {
				return createRiverBranch(x, y, {minRiverLength, maxRiverLength, maxNumRivers}, self);
			}
		});
	}
	createMountains() {
		const rangeSizes = [
			{
				len: 35,
				max: 40,
				used: 0
			},
			{
				len: 70,
				max: 20,
				used: 0
			},
			{
				len: 110,
				max: 6,
				used: 0
			},
			{
				len: 150,
				max: 3,
				used: 0
			},
			{
				len: 200,
				max: 2,
				used: 0
			},
			{
				len: 250,
				max: 1,
				used: 0
			}
		];

		this.grid.eachPointRandom((point, randX, randY, self) => {
			const randDataPoint = self.getDataPoint(randX, randY);

			if(randDataPoint.land && randDataPoint.depth >= 3) {
				const rays = self.castRays(randX, randY, (x, y) => {
					const dataPoint = self.getDataPoint(x, y);

					return (dataPoint && dataPoint.land && !dataPoint.mountain);
				});
				let longestDir = {
					length: 0,
					dir: false
				};
				Object.entries(rays).forEach(([dir, rayPoints]) => {
					if(rayPoints.length > longestDir.length) {
						longestDir = {
							dir,
							length: rayPoints.length
						};
					}
				});

				const path = self.getWindingPath(randX, randY, {maxLength: 250, startDir: longestDir.dir});
				const minLandLength = 13;

				if(path.length < minLandLength) {
					return;
				}

				// Find final true path
				const truePath = [];

				for(let i = 0; i < path.length; i++) {
					const {x, y} = path[i];
					const dataPoint = self.getDataPoint(x, y);

					if(!dataPoint.land || dataPoint.mountain || dataPoint.depth < 3) {
						break;
					} else {
						truePath.push({x, y});
					}
				}

				if(truePath.length < minLandLength) {
					return;
				}

				let lengthSlotFound;
				let filledRanges = 0;

				lengthSlotLoop:
				for(let i = 0; i < rangeSizes.length; i++) {
					const rangeData = rangeSizes[i];

					if(truePath.length <= rangeData.len) {
						if(rangeData.used < rangeData.max) {
							lengthSlotFound = true;
							rangeData.used++;

							if(rangeData.used == rangeData.max) {
								filledRanges++;
							}
						} else {
							break lengthSlotLoop;
						}
					}
				}

				if(filledRanges == rangeSizes.length) {
					return true;
				}
				if(!lengthSlotFound) {
					return;
				}

				truePath.forEach(({x, y}, i) => {
					self.setDataPoint(x, y, {mountain: true});

					if( Math.random() > 0.35 ) {
						let peakPosition = i < truePath.length / 2 ? i + 2 : truePath.length - i + 1;

						peakPosition = Math.ceil(peakPosition * 0.32);

						if(peakPosition > 7) {
							peakPosition = 2 + Math.floor(Math.random() * 7);
						}

						self.setDataPoint(x, y, {peak: peakPosition});
					}
				});
			}
		});

		console.log("rangeSizes", rangeSizes);
	}
	setPeakElevations() {
		const maxElev = 10;
		let currentElev = 2;
		let numAffectedLastSweep = 1;

		masterLoop:
		while(numAffectedLastSweep && currentElev <= maxElev) {
			numAffectedLastSweep = 0;

			this.grid.eachDataPoint((dataPoint, x, y, self) => {
				if(dataPoint.peak && (dataPoint.elevation < dataPoint.peak) && dataPoint.peak >= currentElev) {
					const pointsToRaise = [];
					let radius = 1;

					ringLoop:
					while(true) {
						const double = Math.random() > 0.65;
						const ringElev = currentElev - radius;
						//const ring = self.getRing(x, y, radius);
						//const ring = [...self.getRing(x, y, radius), ...self.getRing(x, y, radius + 1)];
						const ring = double ? [...self.getRing(x, y, radius), ...self.getRing(x, y, radius + 1)] : self.getRing(x, y, radius);

						for(let i = 0; i < ring.length; i++) {
							const ringDataPoint = self.getDataPoint(ring[i].x, ring[i].y);

							if(ringDataPoint.land) {
								if(ringDataPoint.peak && ringDataPoint.peak < ringElev) {
									pointsToRaise.push({x: ring[i].x, y: ring[i].y});
								} else if(ringDataPoint.elevation < ringElev) {
									pointsToRaise.push({x: ring[i].x, y: ring[i].y});
								}
							} else {
								return;
							}
						}

						numAffectedLastSweep += pointsToRaise.length + 1;

						if(!pointsToRaise.length) {
							break ringLoop;
						}
						if(radius >= currentElev - 1) {
							break ringLoop;
						}

						//radius++;
						//radius += 2;
						radius += double ? 2 : 1;
					}

					pointsToRaise.forEach(raisePoint => {
						const ownHeight = self.getDataPoint(raisePoint.x, raisePoint.y).elevation;

						self.setDataPoint(raisePoint.x, raisePoint.y, {
							elevation: ownHeight + 1,
							peak: false
						});
					});

					self.setDataPoint(x, y, {
						elevation: currentElev
					});
				}
			});

			currentElev++;
		}

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.peak && Math.random() > 0.73) {
				const randSize = 80 + Math.floor(Math.random() * 200);

				this.grid.getBlobShape(x, y, randSize).forEach(({x, y}) => {
					const blobDataPoint = this.grid.getDataPoint(x, y);

					if(blobDataPoint.land && Math.random() > 0.15) {
						this.grid.setDataPoint(x, y, {
							elevation: blobDataPoint.elevation + 1
						});
					}
				});
			}
		});
	}
	raiseRandomCoastalAreas() {
		this.grid.eachPointRandom((point, randStartX, randStartY, self) => {
			if(Math.random() > 0.03) {
				return;
			}

			const startDataPoint = this.grid.getDataPoint(randStartX, randStartY);

			if(!startDataPoint.land && startDataPoint.elevation > -4) {
				const randSize = 10 + Math.floor(Math.random() * 300);

				this.grid.getBlobShape(randStartX, randStartY, randSize).forEach(({x, y}) => {
					const dataPoint = this.grid.getDataPoint(x, y);

					if(!dataPoint.land && Math.random() > 0.15) {
						const calcElevation = dataPoint.elevation + 1;

						this.grid.setDataPoint(x, y, {
							elevation: calcElevation > -1 ? -1 : calcElevation
						});
					}
				});
			}
		});
	}
	raiseRandomWaterAreas() {
		let successes = 0;
		const maxSuccess = 80;

		this.grid.eachPointRandom((point, randStartX, randStartY, self) => {
			const startDataPoint = this.grid.getDataPoint(randStartX, randStartY);

			if(!startDataPoint.land) {
				const randSize = 30 + Math.floor(Math.random() * 300);

				this.grid.getBlobShape(randStartX, randStartY, randSize).forEach(({x, y}) => {
					const dataPoint = this.grid.getDataPoint(x, y);

					if(!dataPoint.land && Math.random() > 0.15) {
						const calcElevation = dataPoint.elevation + 1;

						this.grid.setDataPoint(x, y, {
							elevation: calcElevation > -1 ? -1 : calcElevation
						});
					}
				});

				if(++successes >= maxSuccess) {
					return true;
				}
			}
		});
	}
	raiseRandomLandAreas() {
		let successes = 0;
		const maxSuccess = 40;

		this.grid.eachPointRandom((point, randStartX, randStartY, self) => {
			const startDataPoint = this.grid.getDataPoint(randStartX, randStartY);

			if(startDataPoint.land) {
				const randSize = 50 + Math.floor(Math.random() * 300);

				this.grid.getBlobShape(randStartX, randStartY, randSize).forEach(({x, y}) => {
					const dataPoint = this.grid.getDataPoint(x, y);

					if(dataPoint.land && Math.random() > 0.15) {
						this.grid.setDataPoint(x, y, {
							elevation: dataPoint.elevation + 1
						});
					}
				});

				if(++successes >= maxSuccess) {
					return true;
				}
			}
		});
	}
	setPointElevation(centerX, centerY, targetElev, test) {
		this.grid.setDataPoint(centerX, centerY, {
			elevation: targetElev
		});

		let radius = 1;
		let spread = 0;

		while(true) {
			let adjustedRing = 0;
			const ringTargetElevation = targetElev - radius + spread;// - Math.round(Math.random());
			const ring = this.grid.getRing(centerX, centerY, radius);

			ring.forEach(({x, y}) => {
				const ringDataPoint = this.grid.getDataPoint(x, y);

				if( test(ringDataPoint, ringTargetElevation) ) {
					let finalElevation = ringTargetElevation - Math.round(Math.random());

					if(finalElevation < 0) {
						finalElevation = 0;
					}

					this.grid.setDataPoint(x, y, {
						elevation: finalElevation,
						land: true
					});
					this.grid.setPoint(x, y, 1);

					adjustedRing = true;
				}
			});

			if(Math.random() > 0.7) {
				spread++;
			}

			if(!adjustedRing) {
				break;
			}
			if(radius > 30) {
				break;
			}

			radius++;
		}
	}
	seedContinents() {
		// Ice Caps
		{
			const path = this.grid.getBlobShape(Math.floor(this.width / 2), 0, 4700);
			const path2 = this.grid.getBlobShape(Math.floor(this.width / 2), this.height - 1, 4700);

			[...path, ...path2].forEach(({x, y}) => {
				this.grid.setPoint(x, y, 1);
			});
		}
		// Continents
		const BIG_SIZES = [5000, 4000, 4000, 3200, 3000, 2600];
		for(let i = 0; i < BIG_SIZES.length; i++) {
			const randStart = this.grid.getRandomPoint({x: 0, y: Math.ceil(this.height * 0.3)}, {x: this.width - 1, y: Math.floor(this.height * 0.7)});
			const path = this.grid.getBlobShape(randStart.x, randStart.y, BIG_SIZES[i]);

			path.forEach(({x, y}) => {
				this.grid.setPoint(x, y, 1);
			});
		}

		const SIZES = [2500, 2000, 1600, 1200, 900, 900, 900, 900, 900, 900, 700, 500, 500, 300, 300, 200, 200, 50, 50, 50, 50, 40, 40, 20, 20, 20, 20, 20, 20, 20];
		for(let i = 0; i < SIZES.length; i++) {
			//const randStart = this.grid.getRandomPoint({x: 0, y: Math.ceil(this.height * 0.13)}, {x: this.width - 1, y: Math.floor(this.height * 0.87)});
			let randStart;
			while(true) {
				randStart = this.grid.getRandomPoint({x: 0, y: Math.ceil(this.height * 0.13)}, {x: this.width - 1, y: Math.floor(this.height * 0.87)});

				if( !this.grid.getPoint(randStart.x, randStart.y) ) {
					break;
				}
			}
			const path = this.grid.getBlobShape(randStart.x, randStart.y, SIZES[i]);

			path.forEach(({x, y}) => {
				this.grid.setPoint(x, y, 1);
			});
		}
		this.grid.refresh().grow().refresh().fill().refresh();
		this.grid.eachPoint((point, x, y, self) => {
			if(point) {
				self.setDataPoint(x, y, {
					elevation: 1,
					land: true
				})
			}
		});
	}
	setMoisture() {
		const halfGlobeWidth = this.height * 0.5;
		const poleWidth = halfGlobeWidth * 0.25;
		const innerWidth = halfGlobeWidth * 0.75 * 0.5;

		const band1 = poleWidth;
		const band2 = poleWidth + innerWidth;
		const band3 = poleWidth + innerWidth * 2;
		const band4 = poleWidth + innerWidth * 3;
		const band5 = poleWidth + innerWidth * 4;

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			let moisture = 100;

			/*
			switch(true) {
				case y > band5:
					moisture = 100 - Math.round(100 * (y - band5) / poleWidth);
					break;
				case y > band4:
					moisture = Math.round(100 * (y - band4) / innerWidth);
					break;
				case y > band3:
					moisture = 100 - Math.round(100 * (y - band3) / innerWidth);
					break;
				case y > band2:
					moisture = Math.round(100 * (y - band2) / innerWidth);
					break;
				case y > band1:
					moisture = 100 - Math.round(100 * (y - band1) / innerWidth);
					break;
				default:
					moisture = Math.round(100 * y / poleWidth);
					break;
			}

			moisture += 20;

			if(moisture > 100) {
				moisture = 100;
			}
			*/
			if(dataPoint.land) {
				moisture = 65;
			}

			self.setDataPoint(x, y, {moisture});
		});
	}
	adjustMoistureFromElevation() {
		const initialShadowPoints = [];
		const edgePoints = [];
		const edgeBlobPoints = [];

		// Reduce moisture in areas west of mountains
		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.peak) {
				let shadow = 6;
				let shadowLength = dataPoint.peak * 4;

				if(shadowLength > 25) {
					shadowLength = 25;
				}

				while(shadow < shadowLength) {
					const shadowX = x - shadow;
					const offsetDataPoint = self.getDataPoint(shadowX, y);

					if(!offsetDataPoint.land || offsetDataPoint.rainshadow) {
						break;
					}

					self.setDataPoint(shadowX, y, {
						rainshadow: true
					});

					initialShadowPoints.push({x: shadowX, y});

					shadow++;
				}
			}
		});

		// Add irregularity to edges
		this.grid.addFilter((point, x, y) => {
			const dataPoint = this.grid.getDataPoint(x, y);

			if(dataPoint.rainshadow) {
				return point;
			}

			return false;
		});

		this.grid.refresh().eachPoint((point, x, y, self) => {
			if(point) {
				const metaPoint = self.getMetaPoint(x, y);

				if(metaPoint.edge) {
					const blobSize = 4 + Math.floor(Math.random() * 25);
					const blob = self.getBlobShape(x, y, blobSize);

					edgeBlobPoints.push(blob);
				}
			}
		}, true).refresh();

		edgeBlobPoints.forEach(blob => {
			blob.forEach(({x, y}) => {
				const dataPoint = this.grid.getDataPoint(x, y);

				if(dataPoint.land) {
					this.grid.setDataPoint(x, y, {
						rainshadow: true
					});
				}
			});
		});

		// ***TEMP
		/*
		this.grid.addFilter((point, x, y) => {
			const dataPoint = this.grid.getDataPoint(x, y);

			if(dataPoint.rainshadow) {
				return point;
			}

			return false;
		});

		this.grid.refresh().eachPoint((point, x, y, self) => {
			if(point) {
				const metaPoint = self.getMetaPoint(x, y);

				if(metaPoint.edge) {
					self.setDataPoint(x, y, {
						special2: true
					});
				}
			}
		}, true).refresh();
		*/
		// ***END TEMP

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.rainshadow) {
				const calcMoisture = dataPoint.moisture - 30;

				self.setDataPoint(x, y, {
					moisture: calcMoisture < 0 ? 0 : calcMoisture
				});
			}
		});
	}
	adjustMoistureFromAirCurrents() {
		const castWindRay = (x, y, {direction, nextCoordsIncr, xLimitTest, yLimitTest, maxAdjust = 35}) => {
			let currentX = x;
			let currentY = y;
			let airMoisture = 50;
			let extension = 0;

			while(true) {
				const metaPoint = this.grid.getMetaPoint(currentX, currentY);
				const dataPoint = this.grid.getDataPoint(currentX, currentY);
				let pointMoisture = dataPoint.moisture;

				if(!metaPoint || !dataPoint) {
					break;
				}

				if(dataPoint.land) {
					const rawDiff = dataPoint.moisture - airMoisture;
					const diff = Math.abs(rawDiff);
					let adjustment = diff > maxAdjust ? maxAdjust : diff;

					adjustment -= extension;

					if(adjustment < 0) {
						break;
					}

					if(rawDiff > 0) {
						pointMoisture -= adjustment;
						//airMoisture += 1;
					} else {
						pointMoisture += adjustment;
						airMoisture -= 3;
					}

					if(pointMoisture > 100) {
						pointMoisture = 100;
					}

					this.grid.setDataPoint(currentX, currentY, {
						moisture: pointMoisture
					});

					if(Math.random() > 0.75) {
						const blobSize = 3 + Math.floor(Math.random() * 20);
						const blob = this.grid.getBlobShape(currentX, currentY, blobSize);

						blob.forEach(blobPoint => {
							const blobDataPoint = this.grid.getDataPoint(blobPoint.x, blobPoint.y);

							if(blobDataPoint && blobDataPoint.land) {
								this.grid.setDataPoint(blobPoint.x, blobPoint.y, {
									moisture: pointMoisture
								});
							}
						});
					}
				} else {
					airMoisture += (dataPoint.freshwater ? 1 : 4);
				}

				if(airMoisture > 130) {
					airMoisture = 130;
				}
				if(airMoisture < 0) {
					airMoisture = 0;
				}

				let nextCoords;

				if(direction) {
					nextCoords = metaPoint[direction];
				}
				if(nextCoordsIncr) {
					nextCoords = {x: currentX + nextCoordsIncr.x, y: currentY + nextCoordsIncr.y};
				}

				if(!nextCoords) {
					break;
				} else {
					currentX = nextCoords.x;
					currentY = nextCoords.y;
				}

				if(yLimitTest) {
					if(yLimitTest(currentY)) {
						const nextDataPoint = this.grid.getDataPoint(currentX, currentY);

						if(!nextDataPoint || !nextDataPoint.land) {
							break;
						}

						extension++;
					}
				}
				if(xLimitTest) {
					if(xLimitTest(currentX)) {
						const nextDataPoint = this.grid.getDataPoint(currentX, currentY);

						if(!nextDataPoint || !nextDataPoint.land) {
							break;
						}

						extension++;
					}
				}
			}
		};

		const nConvergenceY1 = Math.floor(this.height / 4);
		let nConvergenceY2 = Math.ceil(this.height / 4);
		const sConvergenceY1 = Math.floor(this.height * 3 / 4);
		let sConvergenceY2 = Math.ceil(this.height * 3 / 4);
		const equatorY1 = Math.floor(this.height / 2);
		let equatorY2 = Math.ceil(this.height / 2);

		if(nConvergenceY1 === nConvergenceY2) {
			nConvergenceY2++;
		}
		if(sConvergenceY1 === sConvergenceY2) {
			sConvergenceY2++;
		}
		if(equatorY1 === equatorY2) {
			equatorY2++;
		}

		for(let x = 0; x < this.grid.width; x++) {
			// Diagonal
			castWindRay(x, nConvergenceY1, {direction: HEX_DIRECTIONS[1], yLimitTest: currentY => { if(currentY < 0) { return true; } }});
			castWindRay(x, nConvergenceY2, {direction: HEX_DIRECTIONS[4], yLimitTest: currentY => { if(currentY > equatorY1) { return true; } }});
			castWindRay(x, sConvergenceY1, {direction: HEX_DIRECTIONS[1], yLimitTest: currentY => { if(currentY < equatorY2) { return true; } }});
			castWindRay(x, sConvergenceY2, {direction: HEX_DIRECTIONS[4], yLimitTest: currentY => { if(currentY >= this.grid.height) { return true; } }});
		}

		for(let x = 0; x < this.grid.width; x++) {
			// Vertical
			castWindRay(x, nConvergenceY1, {direction: HEX_DIRECTIONS[0], yLimitTest: currentY => { if(currentY < 0) { return true; } }, maxAdjust: 10});
			castWindRay(x, nConvergenceY2, {direction: HEX_DIRECTIONS[3], yLimitTest: currentY => { if(currentY > equatorY1) { return true; } }, maxAdjust: 10});
			castWindRay(x, sConvergenceY1, {direction: HEX_DIRECTIONS[0], yLimitTest: currentY => { if(currentY < equatorY2) { return true; } }, maxAdjust: 10});
			castWindRay(x, sConvergenceY2, {direction: HEX_DIRECTIONS[3], yLimitTest: currentY => { if(currentY >= this.grid.height) { return true; } }, maxAdjust: 10});
		}

		// Horizontal
		for(let y = 0; y < nConvergenceY2; y++) {
			castWindRay(0, y, {nextCoordsIncr: {x: 1, y: 0}, xLimitTest: currentX => { if(currentX > this.grid.width - 1) { return true; } }, maxAdjust: 8});
		}
		for(let y = nConvergenceY2; y < equatorY1; y++) {
			castWindRay(this.grid.width - 1, y, {nextCoordsIncr: {x: -1, y: 0}, xLimitTest: currentX => { if(currentX < 0) { return true; } }, maxAdjust: 8});
		}
		for(let y = equatorY1; y < sConvergenceY1; y++) {
			castWindRay(0, y, {nextCoordsIncr: {x: 1, y: 0}, xLimitTest: currentX => { if(currentX > this.grid.width - 1) { return true; } }, maxAdjust: 8});
		}
		for(let y = sConvergenceY2; y < this.grid.height; y++) {
			castWindRay(this.grid.width - 1, y, {nextCoordsIncr: {x: -1, y: 0}, xLimitTest: currentX => { if(currentX < 0) { return true; } }, maxAdjust: 8});
		}
	}
	adjustMoistureFromDepth() {
		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.land) {
				let moistureAdj = (10 - dataPoint.depth) * 3;

				if(moistureAdj > 0) {
					let calcMoisture = dataPoint.moisture + moistureAdj;

					self.setDataPoint(x, y, {
						moisture: calcMoisture > 100 ? 100 : calcMoisture
					});
				}
			}
		});
	}
	adjustTemperatureFromElevation() {
		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(dataPoint.land) {
				const tempReduction = (dataPoint.elevation - 1) * 7;

				if(tempReduction) {
					const calcTemperature = dataPoint.temperature - tempReduction;

					self.setDataPoint(x, y, {
						temperature: calcTemperature > 0 ? calcTemperature : 0
					});
				}
			}
		});
	}
	setTemperatures() {
		const poleBuffer = 8;
		const halfHeight = this.height * 0.5;
		const slope = 100 / (halfHeight - poleBuffer);

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			let temperature;

			if(y > halfHeight) {
				temperature = 100 - Math.floor(slope * (y - halfHeight));
			} else {
				temperature = Math.ceil(slope * (y - poleBuffer));
			}
			if(temperature < 0) {
				temperature = 0;
			}
			if(temperature > 100) {
				temperature = 100;
			}

			self.setDataPoint(x, y, {temperature});
		});
		/*
		const temperatureList = Object.values(TEMPERATURES);
		const temperatureWeights = [1, 2, 3, 3, 3, 2];
		const totalWeight = temperatureWeights.reduce((agg, val) => {
			agg += val;

			return agg;
		}, 0);
		const bandWidth = this.height * 0.5 / totalWeight;

		this.grid.eachPoint((point, x, y, self) => {
			let pointSet;
			let northLat = 0;

			for(let i = 0; i < temperatureList.length; i++) {
				northLat += bandWidth * temperatureWeights[i];

				const southLat = this.height - northLat - 1;

				if(point) {
					if( y < northLat || y > southLat ) {
						self.setDataPoint(x, y, {
							temperature: {
								value: temperatureList[i]
							}
						});

						pointSet = true;

						break;
					}
				}
			}

			if(!pointSet) {
				self.setDataPoint(x, y, {
					temperature: {
						value: temperatureList[temperatureList.length - 1]
					}
				});
			}
		});
		*/
	}
	detectAreaRecursively(x, y, test, grid, excludedPoints = {}, depth = 0) {
		const dataPoint = grid.getDataPoint(x, y);
		const metaPoint = grid.getMetaPoint(x, y);
		const nextPoints = [];
		let ownPoints = [{x, y}];
		let failedPoints = [];

		if(!depth) {
			excludedPoints[`${x}-${y}`] = true;
		}
		if(depth > 20) {
			return {
				failedPoints: [{x, y}],
				ownPoints: []
			};
		}

		for(let i = 0, len = HEX_DIRECTIONS.length; i < len; i++) {
			const dir = HEX_DIRECTIONS[i];
			const nghbrCoords = metaPoint[dir];

			if(nghbrCoords) {
				const nghbrData = grid.getDataPoint(nghbrCoords.x, nghbrCoords.y);
				const key = `${nghbrCoords.x}-${nghbrCoords.y}`;

				if(test(nghbrData) && !excludedPoints[key]) {
					excludedPoints[key] = true;
					nextPoints.push({x: nghbrCoords.x, y: nghbrCoords.y});
				}
			}
		}

		for(let i = 0; i < nextPoints.length; i++) {
			const coord = nextPoints[i];
			const results = this.detectAreaRecursively(coord.x, coord.y, test, grid, excludedPoints, depth + 1);

			if(!depth && results.failedPoints.length) {
				for(let f = 0; f < results.failedPoints.length; f++) {
					nextPoints.push(results.failedPoints[f]);
				}
			}
			if(depth) {
				failedPoints = [...failedPoints, ...results.failedPoints];
			}

			ownPoints = [...ownPoints, ...results.ownPoints];
		}

		if(!depth) {
			return ownPoints;
		}

		return {
			failedPoints,
			ownPoints
		};
	}
	setDepths(depth, test, passthrough = () => {}, flood = () => {}) {
		const sinkPoints = [];

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(!test(dataPoint)) {
				return;
			}
			if(dataPoint.depth === depth - 1) {
				let valid = true;
				const metaPoint = self.getMetaPoint(x, y);

				for(let i = 0, len = HEX_DIRECTIONS.length; i < len; i++) {
					const dir = HEX_DIRECTIONS[i];
					const nghbrCoords = metaPoint[dir];

					if(nghbrCoords) {
						const nghbrData = self.getDataPoint(nghbrCoords.x, nghbrCoords.y);

						/*
						if(flood(nghbrData)) {
							const floodPoints = this.detectAreaRecursively(nghbrCoords.x, nghbrCoords.y, flood, self);

							floodPoints.forEach(({x, y}) => {
								this.grid.setDataPoint(x, y, {
									depth
								});
							});
						}
						*/

						if((!test(nghbrData) || nghbrData.depth !== depth - 1) && !passthrough(nghbrData)) {
							valid = false;
							break;
						}
					}
				}
				/*
				const test = this.detectAreaRecursively(0, 0, dataPoint => {
					return dataPoint.land;
				}, this.grid);
				console.log("test", test, test.length);


				test.forEach(({x, y}) => {
					this.grid.setDataPoint(x, y, {
						special3: true
					});
				});
				*/

				if(valid) {
					sinkPoints.push({x, y});
				}
			}
		});

		sinkPoints.forEach(({x, y}) => {
			this.grid.setDataPoint(x, y, {
				depth
			})
		});

		return sinkPoints.length;
	}
	setWaterElevation() {
		const waterDepthElevationKey = [-1, -2, -3, -4, -5, -6, -7, -8, -9];

		this.grid.eachDataPoint((dataPoint, x, y, self) => {
			if(!dataPoint.land) {
				const elevation = (dataPoint.depth >= waterDepthElevationKey.length) ? -9 : waterDepthElevationKey[dataPoint.depth];

				self.setDataPoint(x, y, {
					elevation
				});
			}
		});
	}
	getBiomeHex(dataPoint) {
		const valueMax = 100;
		//const numValueBuckets = 5;
		const numMoistureValueBuckets = 5;
		const numTemperatureValueBuckets = 6;
		//const divisor = (valueMax + 1) / numValueBuckets;
		const moistureDivisor = (valueMax + 1) / numMoistureValueBuckets;
		const temperatureDivisor = (valueMax + 1) / numTemperatureValueBuckets;
		const {elevation, moisture, temperature} = dataPoint;

		const rawTemperatureIndex = temperature / temperatureDivisor;
		const rawMoistureIndex = moisture / moistureDivisor;

		let temperatureRemainder = rawTemperatureIndex - Math.floor(rawTemperatureIndex);
		let moistureRemainder = rawMoistureIndex - Math.floor(rawMoistureIndex);

		if(temperatureRemainder < 0.4) {
			temperatureRemainder = 0;
		}
		if(temperatureRemainder > 0.6) {
			temperatureRemainder = 1;
		}

		if(moistureRemainder < 0.4) {
			moistureRemainder = 0;
		}
		if(moistureRemainder > 0.6) {
			moistureRemainder = 1;
		}

		let temperatureIndex = Math.random() < temperatureRemainder ? Math.ceil(rawTemperatureIndex) : Math.floor(rawTemperatureIndex);
		let moistureIndex = Math.random() < moistureRemainder ? Math.ceil(rawMoistureIndex) : Math.floor(rawMoistureIndex);

		if(temperatureIndex >= numTemperatureValueBuckets) {
			temperatureIndex = numTemperatureValueBuckets - 1;
		}
		if(moistureIndex >= numMoistureValueBuckets) {
			moistureIndex = numMoistureValueBuckets - 1;
		}

		const type = biomeMatrix[temperatureIndex][moistureIndex];

		return biomeColorMap[type];
	}
	print() {
		const VIS_TILE_SIZE = 5;
		const CALC_DOC_WIDTH = this.width * VIS_TILE_SIZE * 0.75 + VIS_TILE_SIZE;
		const CALC_DOC_HEIGHT = this.height * VIS_TILE_SIZE + this.height + VIS_TILE_SIZE / 2;

		if( !fs.existsSync('z_htmlMap.html') ) {
			fs.createWriteStream('z_htmlMap.html');
		}

		const htmlMap = fs.openSync('z_htmlMap.html', 'w');

		/*
		fs.writeSync(htmlMap, `<html><head><title>Visual Map</title><style type="text/css">body { background: black; margin: 0; padding: 0; } .offset { top: 9px; } .box { position: relative; border-radius: 50%; margin: 0 1px 1px 0; width: ${VIS_TILE_SIZE}px; height: ${VIS_TILE_SIZE}px; float: left; }</style></head><body>`);
		fs.writeSync(htmlMap, '<div class="map-container" style="padding: 40px 30px;">');

		this.grid.eachPoint((point, x, y, self) => {
			const metaPoint = self.getMetaPoint(x, y);
			let hex = '#224499';

			if(point) {
				hex = '#a0d070';

				if(metaPoint.edge) {
					hex = '#f09030';
				}
			}

			const clear = (x === 0) ? "clear: left; " : "";
			const offset = metaPoint.offset ? "offset" : "";
			fs.writeSync(htmlMap, `<div class="box ${offset}" style="${clear}background: ${hex}" data-coords="[${x},${y}]"></div>`);
		});

		fs.writeSync(htmlMap, '</div>');
		fs.writeSync(htmlMap, '</body></html>');
		fs.closeSync(htmlMap);
		*/
		const temperatureColorKey = getGradiatedColors('#335577', '#ee9977', 101);
		const moistureColorKey = getGradiatedColors('#eeaa77', '#55dd88', 101);
		//const elevationColorKey = getGradiatedColors('#47995a', '#995d47', 10);
		const elevationColorKey = [...getGradiatedColors('#47995a', '#cee522', 5), ...getGradiatedColors('#e8d122', '#e26f22', 6)];

		fs.writeSync(htmlMap, `
			<html>
			<header>
			<title>Visual Map</title>
			<style type="text/css">
				body {
					background: black;
					font-family: Arial;
					width: ${CALC_DOC_WIDTH};
				}
				canvas {
					border-width: 0;
					border-style: solid;
					border-color: white;
					margin-top: calc(${CALC_DOC_HEIGHT}px * -0.19);
					transform: scale(1, 0.62);
				}
				.box {
					width: ${VIS_TILE_SIZE}px;
					height: ${VIS_TILE_SIZE}px;
					float: left;
				}
				#color-switcher span {
					cursor: pointer;
					margin-right: 12px;
				}
			</style>
			</header>
			<body>`);
		fs.writeSync(htmlMap, `
			<div id="color-switcher" style="border: 1px solid white; padding: 10px; color: white;">
				<span onclick="setHexType('biome')">Biome</span>
				<span onclick="setHexType('elevation')">Elevation</span>
				<span onclick="setHexType('moisture')">Moisture</span>
				<span onclick="setHexType('temperature')">Temperature</span>
			</div>
		`);
		fs.writeSync(htmlMap, `<canvas id="canvas" width="${CALC_DOC_WIDTH}" height="${CALC_DOC_HEIGHT}"></canvas>`);
		fs.writeSync(htmlMap, '<script type="text/javascript">');
		fs.writeSync(htmlMap, `function setHexType(type) { hexType = type; drawCanvas(); }`);

		let varData = '';

		this.grid.eachPoint((point, x, y, self) => {
			const metaPoint = self.getMetaPoint(x, y);
			const dataPoint = self.getDataPoint(x, y);
			let hex = '#ffffff';

			if(point) {
				if(dataPoint.depth === 0) {
					hex = '#ff7799';
				}
				if(dataPoint.depth > 0) {
					if(dataPoint.depth % 2 === 0) {
						if(dataPoint.depth > 7) {
							hex = '#cc7733';
						} else {
							hex = '#cccccc';
						}
					} else {
						if(dataPoint.depth > 7) {
							hex = '#55cccc';
						} else {
							hex = '#333333';
						}
					}
				}
				/*
				hex = '#a0d070';

				if(metaPoint.edge) {
					hex = '#f09030'
				}
				if(dataPoint.temperature.value === 0) {
					hex = '#ddffdd';
				}
				*/
			} else {
				const dataPoint = self.getDataPoint(x, y);

				switch(dataPoint.elevation) {
					case -1:
						hex = '#3354a9';
						break;
					case -2:
						hex = '#234494';
						break;
					case -3:
						hex = '#183688';
						break;
					case -4:
						hex = '#122d81';
						break;
					case -5:
						hex = '#082071';
						break;
					case -6:
						hex = '#041766';
						break;
					case -7:
						hex = '#001057';
						break;
					case -8:
						hex = '#000d46';
						break;
					case -9:
						hex = '#000a39';
						break;
					default:
						break;
				}
			}
			let biomeHex;
			let elevationHex;
			let moistureHex;
			let temperatureHex;
			let specialHex;

			if(dataPoint.land) {
				biomeHex = this.getBiomeHex(dataPoint);
				elevationHex = elevationColorKey[dataPoint.elevation];
				moistureHex = moistureColorKey[dataPoint.moisture];
				temperatureHex = temperatureColorKey[dataPoint.temperature];
			}
			if(dataPoint.special) {
				specialHex = '#77ff99';
			}
			if(dataPoint.special2) {
				specialHex = '#db230f';
			}
			if(dataPoint.special3) {
				specialHex = '#ffae00';
			}
			if(dataPoint.special4) {
				specialHex = '#9988ff';
			}
			if(dataPoint.special5) {
				specialHex = '#f591ff';
			}
			if(dataPoint.special6) {
				specialHex = '#66e8ff';
			}

			varData += `{land: ${dataPoint.land}, color: {default: '${hex}', special: '${specialHex}', biome: '${biomeHex}', elevation: '${elevationHex}', moisture: '${moistureHex}', temperature: '${temperatureHex}'}, x: ${x}, y: ${y}},`;
			//varData += `{color: '${hex}', x: ${x}, y: ${y}},`;
		});

		fs.writeSync(htmlMap, `var data = [${varData}];`);
		fs.writeSync(htmlMap, `var tileSize = [${VIS_TILE_SIZE}];`);
		fs.writeSync(htmlMap, `var hexType = 'elevation';`);
		fs.writeSync(htmlMap, "function drawCanvas() { console.log('calling drawCanvas');");
		fs.writeSync(htmlMap, "var canvasElem = document.getElementById('canvas');");
		fs.writeSync(htmlMap, "var context = canvasElem.getContext('2d');");
		fs.writeSync(htmlMap, `
			context.fillStyle = "#000000";
			context.fillRect(0, 0, ${CALC_DOC_WIDTH}, ${CALC_DOC_HEIGHT});
		`);
		fs.writeSync(htmlMap, `
			var halfTizeSize = tileSize / 2;
			var thirdTileSize = tileSize / 3;
			var quarterTileSize = tileSize / 4;
			var writeHex = function(datum) {
				var corner = {
					x: datum.x * tileSize,
					y: datum.y * tileSize + datum.y
				};

				corner.y += halfTizeSize;

				if(datum.x % 2 == 1) {
					corner.y -= halfTizeSize;
				}

				corner.x -= quarterTileSize * datum.x;

				context.fillStyle = datum.land ? datum.color[hexType] : datum.color.default;
				context.fillStyle = datum.color.special || context.fillStyle;
				context.save();
				context.translate(corner.x, corner.y)
				context.beginPath();
				context.moveTo(0, halfTizeSize);
				context.lineTo(thirdTileSize, 0);
				context.lineTo(2 * thirdTileSize, 0);
				context.lineTo(tileSize, halfTizeSize);
				context.lineTo(2 * thirdTileSize, tileSize);
				context.lineTo(thirdTileSize, tileSize);
				context.lineTo(0, halfTizeSize);
				context.fill();
				context.restore();
			};
		`);

		fs.writeSync(htmlMap, `data.forEach(function(datum) { writeHex(datum); });`);
		fs.writeSync(htmlMap, "}; drawCanvas();");
		fs.writeSync(htmlMap, '</script>');
		fs.writeSync(htmlMap, '</body></html>');
		fs.closeSync(htmlMap);

		/*
		const writeHex = `
			var corner = {
				x: datum.x * tileSize,
				y: datum.y * tileSize + datum.y
			};
			var halfTizeSize = tileSize / 2;
			var thirdTileSize = tileSize / 3;
			var quarterTileSize = tileSize / 4;

			corner.y += halfTizeSize;
			if(datum.x % 2 == 1) {
				corner.y -= halfTizeSize;
			}

			corner.x -= quarterTileSize * datum.x;

			context.save();
			context.translate(corner.x, corner.y)
			context.beginPath();
			context.moveTo(0, halfTizeSize);
			context.lineTo(thirdTileSize, 0);
			context.lineTo(2 * thirdTileSize, 0);
			context.lineTo(tileSize, halfTizeSize);
			context.lineTo(2 * thirdTileSize, tileSize);
			context.lineTo(thirdTileSize, tileSize);
			context.lineTo(0, halfTizeSize);
			context.fill();
			context.restore();
		`;
		*/
	}
};

module.exports = new MapGenerator();
