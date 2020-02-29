Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

setSelectedBiome();

const heightSeaGround = -3;

const tMainTerrain = g_Terrains.mainTerrain;
const tForestFloor1 = g_Terrains.forestFloor1;
const tForestFloor2 = g_Terrains.forestFloor2;
const tCliff = g_Terrains.cliff;
const tShore = g_Terrains.shore;
const tTier1Terrain = g_Terrains.tier1Terrain;
const tTier2Terrain = g_Terrains.tier2Terrain;
const tTier3Terrain = g_Terrains.tier3Terrain;
const tHill = g_Terrains.hill;
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;
const tTier4Terrain = g_Terrains.tier4Terrain;
const tWater = g_Terrains.water;

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFish = g_Gaia.fish;
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
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clExtraBush = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clWater = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

var playerPlacements = playerPlacementCircle(fractionToTiles(0.26));
const mapCenter = g_Map.getCenter();

function arcVariation(angle, percent) {
  const variation = 2 * Math.PI * percent / 100;

  return randFloat(angle - variation, angle + variation);
}

function arcPlacing(center, angle, objects, tileClass, constraints, radius, radiusVariation, angleVariation, retries = 30) {
  const placeFunc = function() {
    const calculatedRadius = randIntInclusive(radius - radiusVariation, radius + radiusVariation);
    const calculatedAngle = arcVariation(angle, angleVariation);
    const position = Vector2D.add(center, new Vector2D(calculatedRadius, 0).rotate(-calculatedAngle)).round();
    const group = new SimpleGroup(objects, true, tileClass, position);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, 100000, 1, true);
}

function nearPlacing(object, tileClass, constraints, position, variance) {
  const placeFunc = function() {
    const tryPosition = Vector2D.add(position, new Vector2D(randIntInclusive(-variance, variance), randIntInclusive(-variance, variance))).round();
    const group = new SimpleGroup([object], true, tileClass, tryPosition);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, 500, 1, true);
}

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

const [playersOrder, playerPositions, playerAngles, startingAngle] = playerPlacements;
const stoneDistance = 42;
const metalDistance = 42;
const huntDistance = 48;
const bushDistance = 30;

for (let i = 0; i < numPlayers; ++i)
{
  const playerPosition = playerPositions[i];
  const angle = playerAngles[i];
  const lakeRadius = 40;
  const lakePosition = Vector2D.add(playerPosition, new Vector2D(lakeRadius, 0).rotate(-angle)).round();
  const lakeSize = Math.round(scaleByMapSize(35, 70) * 2 / numPlayers - 2);

  createArea(
    new ChainPlacer(
    	2,
    	Math.floor(scaleByMapSize(5, 16)),
    	Math.floor(scaleByMapSize(20, 50)),
    	Infinity,
    	lakePosition,
    	0,
    	[lakeSize]),
    [
    	new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 4),
    	new TileClassPainter(clWater)
    ],
    avoidClasses(clPlayer, 25));

  arcPlacing(
    playerPosition, angle, [new SimpleObject(oFish, 3, 3, 0, 2)],
    clFood, [avoidClasses(clFood, 6), stayClasses(clWater, 4)],
    lakeRadius - 2, 2, 2, 1000
  );

  for (let fishIndex = 0; fishIndex < 2; ++fishIndex) {
    arcPlacing(
      playerPosition, angle - Math.PI / 9, [new SimpleObject(oFish, 2, 2, 0, 2)],
      clFood, [avoidClasses(clFood, 6), stayClasses(clWater, 4)],
      lakeRadius + 7 + fishIndex * 7, 6, 5, 1000
    );

    arcPlacing(
      playerPosition, angle + Math.PI / 10, [new SimpleObject(oFish, 2, 2, 0, 2)],
      clFood, [avoidClasses(clFood, 6), stayClasses(clWater, 4)],
      lakeRadius + 7 + fishIndex * 7, 6, 5, 1000
    );
  }

  const offsetAngle = Math.PI / numPlayers;
  const sideLakeRadius = fractionToTiles(0.5) - 2;
  const sideLakePosition = Vector2D.add(mapCenter, new Vector2D(sideLakeRadius, 0).rotate(-angle - offsetAngle)).round();

  const sideMinesRadius = Math.round((sideLakeRadius - 40) * 2 / numPlayers + scaleByMapSize(0, 30));
  const sideMetalPosition = Vector2D.add(mapCenter, new Vector2D(sideMinesRadius, 0).rotate(-angle - offsetAngle - offsetAngle / 4)).round();
  const sideStonePosition = Vector2D.add(mapCenter, new Vector2D(sideMinesRadius, 0).rotate(-angle - offsetAngle + offsetAngle / 4)).round();

  nearPlacing(
    new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4),
    clRock, [avoidClasses(clForest, 10, clWater, 3)],
    sideMetalPosition, 2
  );

  nearPlacing(
    new SimpleObject(oMetalLarge, 1, 1, 0, 4),
    clMetal, [avoidClasses(clForest, 10, clWater, 3, clRock, 4)],
    sideStonePosition, 2
  );

  createArea(
    new ChainPlacer(
    	2,
    	Math.floor(scaleByMapSize(5, 16)),
    	Math.round(scaleByMapSize(6, 30) * 2 /numPlayers),
    	Infinity,
    	sideLakePosition,
    	0,
    	[lakeSize]),
    [
    	new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 4),
    	new TileClassPainter(clWater)
    ],
    avoidClasses(clPlayer, 25, clRock, 4, clMetal, 4));

  for (let fishIndex = 0; fishIndex < 10; ++fishIndex) {
    const sideFishPosition = Vector2D.add(mapCenter, new Vector2D(sideLakeRadius - 35 + fishIndex, 0).rotate(-angle - offsetAngle)).round();

    nearPlacing(
      new SimpleObject(oFish, 2, 3, 0, 2),
      clFood,
      [avoidClasses(clFood, 6), stayClasses(clWater, 6)],
      sideFishPosition, 20
    )
  }

  arcPlacing(
    playerPosition, angle - Math.PI, [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)],
    clRock, avoidClasses(clForest, 10, clWater, 6),
    stoneDistance, 2, isNomad() ? 100 : 10, 100
  );

  arcPlacing(
    playerPosition, angle - Math.PI, [new SimpleObject(oMetalLarge, 1, 1, 0, 4)],
    clMetal, avoidClasses(clForest, 10, clRock, 5, clWater, 6),
    metalDistance, 2, isNomad() ? 100 : 7, 100
  );

  arcPlacing(
    playerPosition, angle - Math.PI, [new SimpleObject(oMainHuntableAnimal, 5, 5, 0, 4)],
    clFood, avoidClasses(clForest, 4, clMetal, 4, clRock, 4, clFood, 20, clWater, 6),
    huntDistance, 2, isNomad() ? 100 : 15, 50
  );

  arcPlacing(
    playerPosition, angle - Math.PI, [new SimpleObject(oFruitBush, 5, 5, 0, 4)],
    clExtraBush, avoidClasses(clForest, 10, clMetal, 4, clRock, 4, clFood, 10, clWater, 6),
    bushDistance, 2, isNomad() ? 100 : 10, 50
  );
}

paintTerrainBasedOnHeight(2.4, 3.4, 3, tMainTerrain);
paintTerrainBasedOnHeight(1, 2.4, 0, tShore);
paintTerrainBasedOnHeight(-8, 1, 2, tWater);
paintTileClassBasedOnHeight(-6, 0, 1, clWater);

createBumps(avoidClasses(clPlayer, 20, clWater, 1));

Engine.SetProgress(25);

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 35, clHill, 15, clWater, 6, clFood, 4, clMetal, 6, clRock, 6), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 35, clHill, 15, clWater, 6, clFood, 4, clMetal, 6, clRock, 6), clHill, scaleByMapSize(2, 11));

Engine.SetProgress(40);

const forestMultiplier = g_Map.getSize() > 256 ? 1 : 1.4;
var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(forestMultiplier));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clPlayer, 18, clForest, 15, clHill, 0, clMetal, 4, clRock, 4, clExtraBush, 6, clWater, 4),
 clForest,
 forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWater, 1),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWater, 1),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating stone mines");
createMines(
	[
		[new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)]
	],
	avoidClasses(clForest, 1, clPlayer, 65, clMetal, 30, clRock, 30, clHill, 1, clWater, 10),
	clRock,
  scaleByMapSize(4, 16) - 1
);
Engine.SetProgress(60);

g_Map.log("Creating metal mines");
createMines(
 [
  [new SimpleObject(oMetalLarge, 1, 1, 0, 4)]
 ],
 avoidClasses(clForest, 1, clPlayer, 65, clMetal, 30, clRock, 30, clHill, 1, clWater, 10),
 clMetal,
 scaleByMapSize(4, 16) - 1
);

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
	avoidClasses(clForest, 0, clPlayer, 0, clHill, 0, clWater, 0));

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
	avoidClasses(clForest, 0, clPlayer, 50, clHill, 1, clMetal, 4, clRock, 4, clFood, 20, clWater, 1),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		2 * numPlayers
	],
	avoidClasses(clForest, 0, clPlayer, 45, clHill, 1, clMetal, 4, clRock, 4, clFood, 10, clWater, 4),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(
    clForest, 8, clHill, 1, clPlayer,
    currentBiome() === "generic/savanna" ? 12 : 35,
    clMetal, 6, clRock, 6, clFood, 1, clWater, 4
  ),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2, clWater, 6));

g_Map.ExportMap();
