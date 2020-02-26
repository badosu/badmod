Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

setSelectedBiome();

const tMainTerrain = g_Terrains.mainTerrain;
const tForestFloor1 = g_Terrains.forestFloor1;
const tForestFloor2 = g_Terrains.forestFloor2;
const tCliff = g_Terrains.cliff;
const tTier1Terrain = g_Terrains.tier1Terrain;
const tTier2Terrain = g_Terrains.tier2Terrain;
const tTier3Terrain = g_Terrains.tier3Terrain;
const tHill = g_Terrains.hill;
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;
const tTier4Terrain = g_Terrains.tier4Terrain;

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
const oStoneLarge = g_Gaia.stoneLarge;
const oStoneSmall = g_Gaia.stoneSmall;
const oMetalLarge = g_Gaia.metalLarge;

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const heightLand = 3;

var g_Map = new RandomMap(heightLand, tMainTerrain);

const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clWrenchHead = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

const wrenchScaling = 8 * (numPlayers - 2);
const playersCircleRadius = 28 + wrenchScaling;
const playerPlacements = playerPlacementCircle(playersCircleRadius);

placePlayerBases({
	"PlayerPlacement": playerPlacements,
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"Chicken": {
	},
	"Berries": {
		"template": oFruitBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge }
		]
	},
	"Trees": {
		"template": oTree1,
		"count": 5
	},
	"Decoratives": {
		"template": aGrassShort
	}
});
Engine.SetProgress(20);

var [playersOrder, playerPositions, playerAngles, startingAngle] = playerPlacements;
const mapCenter = g_Map.getCenter();

function nearPlacing(object, tileClass, constraints, position, variance) {
  const placeFunc = function() {
    const tryPosition = Vector2D.add(position, new Vector2D(randIntInclusive(-variance, variance), randIntInclusive(-variance, variance))).round();
    const group = new SimpleGroup([object], true, tileClass, tryPosition);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, 500, 1, true);
}

const minesVariation = randIntInclusive(2, 12);

for (let i = 0; i < numPlayers; ++i) {
  const playerAngle = playerAngles[i];
  const offsetAngle = Math.PI / numPlayers;
  const minesRadius = playersCircleRadius + numPlayers * 3.5 + minesVariation;
  const minesPoint = new Vector2D(minesRadius).rotate(- playerAngle - offsetAngle);
  const minesPosition = Vector2D.add(mapCenter, minesPoint).round();

  nearPlacing(
    new SimpleObject(oMetalLarge, 1, 1, 0, 4),
    clMetal, 
    avoidClasses(clForest, 6, clHill, 7),
    minesPosition,
    3
  );

  nearPlacing(
    new SimpleObject(oStoneLarge, 1, 1, 0, 4),
    clRock, 
    avoidClasses(clForest, 6, clHill, 7, clMetal, 4),
    minesPosition,
    3
  );

  const minesClumpPosition = new Vector2D(minesRadius - 15).rotate(- playerAngle - offsetAngle);
  createArea(
  	new ClumpPlacer(1100, 0.97, 0.8, Infinity, Vector2D.add(mapCenter, minesClumpPosition).round()),
    [
  			new LayeredPainter([tCliff, [tForestFloor1, tForestFloor1, tCliff]], [2]),
  			new SmoothElevationPainter(ELEVATION_SET, 24, 1),
  			new TileClassPainter(clWrenchHead)
    ],
  	avoidClasses(clPlayer, 18, clMetal, 9, clRock, 9)
  );


  nearPlacing(
    new SimpleObject(oStoneLarge, 1, 1, 0, 4),
    clRock,
    avoidClasses(clForest, 6, clHill, 7),
    Vector2D.add(mapCenter, new Vector2D(fractionToTiles(0.42), 0).rotate(- playerAngle + offsetAngle / 3)).round(),
    5
  );

  nearPlacing(
    new SimpleObject(oMetalLarge, 1, 1, 0, 4),
    clMetal,
    avoidClasses(clForest, 6, clHill, 7),
    Vector2D.add(mapCenter, new Vector2D(fractionToTiles(0.42), 0).rotate(- playerAngle - offsetAngle / 3)).round(),
    5
  );
}

Engine.SetProgress(25);
createArea(
	new ClumpPlacer(2800 + (numPlayers - 2) * 4000, 0.97, 0.8, Infinity, mapCenter),
  [
			new LayeredPainter([tCliff, [tForestFloor1, tForestFloor1, tCliff]], [2]),
			new SmoothElevationPainter(ELEVATION_SET, 24, 1),
			new TileClassPainter(clHill)
  ],
	avoidClasses(clPlayer, Math.floor(17 + numPlayers / 2), clMetal, 10, clRock, 10)
);

createBumps(avoidClasses(clPlayer, 20, clMetal, 6, clRock, 6));


function arcVariation(angle, percent) {
  const variation = 2 * Math.PI * percent / 100;

  return randFloat(angle - variation, angle + variation);
}

function arcPlacing(playerIndex, objects, tileClass, constraints, radius, radiusVariation, angleVariation, retries = 30) {
  const placeFunc = function() {
    const playerPosition = playerPositions[playerIndex];
    const angle = playerAngles[playerIndex];

    const calculatedRadius = randIntInclusive(radius - radiusVariation, radius + radiusVariation);
    const calculatedAngle = arcVariation(angle, angleVariation);

    const position = Vector2D.add(playerPosition, new Vector2D(calculatedRadius, 0).rotate(-calculatedAngle)).round();

    const group = new SimpleGroup(objects, true, tileClass, position);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, retries, 1, true);
}

const stoneDistance = 42;
const metalDistance = 42;
const huntDistance = 48;
const bushDistance = 30;

for (let i = 0; i < numPlayers; ++i)
{
  arcPlacing(
    i,
    [
      new SimpleObject(oMainHuntableAnimal, 5, 5, 0, 4),
      new SimpleObject(oSecondaryHuntableAnimal, 3, 3, 0, 4),
    ],
    clFood, avoidClasses(clForest, 4, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
    huntDistance, 2, isNomad() ? 100 : 20, 50
  );

  arcPlacing(
    i, [new SimpleObject(oSecondaryHuntableAnimal, 3, 3, 0, 4)],
    clFood, avoidClasses(clForest, 4, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
    huntDistance, 2, isNomad() ? 100 : 30, 50
  );

  arcPlacing(
    i, [new SimpleObject(oFruitBush, 5, 5, 0, 4)],
    clFood, avoidClasses(clForest, 10, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
    bushDistance, 2, isNomad() ? 100 : 10, 50
  );
}

Engine.SetProgress(40);

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 35, clHill, 15, clMetal, 10, clRock, 10, clWrenchHead, 20), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 35, clHill, 15, clMetal, 10, clRock, 10, clWrenchHead, 20), clHill, scaleByMapSize(2, 11));

const forestMultiplier = g_Map.getSize() > 192 ? 1 : 1.4;
const [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(forestMultiplier));

createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clPlayer, 20, clForest, 15, clHill, 0, clMetal, 6, clRock, 6, clFood, 6, clWrenchHead, 10),
 clForest,
 forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

Engine.SetProgress(55);

Engine.SetProgress(60);

Engine.SetProgress(65);

var planetm = 1;

if (currentBiome() == "generic/tropic")
	planetm = 8;

createDecoration(
	[
		[new SimpleObject(aRockMedium, 1, 3, 0, 1)],
		[new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
		[new SimpleObject(aGrassShort, 1, 2, 0, 1)],
		[new SimpleObject(aGrass, 2, 4, 0, 1.8), new SimpleObject(aGrassShort, 3,6, 1.2, 2.5)],
		[new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
	],
	[
		scaleByMapSize(16, 262),
		scaleByMapSize(8, 131),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200)
	],
	avoidClasses(clForest, 0, clPlayer, 0, clHill, 0));

Engine.SetProgress(70);

createFood(
	[
		[new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)],
		[new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)]
	],
	[
		2 * numPlayers,
		2 * numPlayers
	],
	avoidClasses(clForest, 0, clPlayer, 45, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		2 * numPlayers
	],
	avoidClasses(clForest, 0, clPlayer, 50, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(
    clForest, 8, clHill, 1, clPlayer,
    currentBiome() === "generic/savanna" ? 12 : 38,
    clMetal, 6, clRock, 6, clFood, 1
  ),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

g_Map.ExportMap();
