Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("balancedHelpers");

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

const mapSize = g_Map.getSize();
const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clWater = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

var playerPlacements = playerPlacementCircle(fractionToTiles(0.26 + (numPlayers - 2) * 0.008));
const mapCenter = g_Map.getCenter();

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

for (let i = 0; i < numPlayers; ++i)
{
  const playerPosition = playerPositions[i];
  const angle = playerAngles[i];
  const lakeRadius = 40;
  const lakePosition = Vector2D.add(playerPosition, new Vector2D(lakeRadius, 0).rotate(-angle)).round();
  const lakeSize = Math.round(scaleByMapSize(40, 60) - (numPlayers - 2) * 5.4);

  createArea(
    new ChainPlacer(
      3,
      6,
      Math.floor(scaleByMapSize(20, 45)),
      Infinity,
      lakePosition,
      lakeRadius - 5,
      [lakeSize]),
    [
      new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 4),
      new TileClassPainter(clWater)
    ],
    avoidClasses(clPlayer, 25));

  let lakeArea = new Area(new ODiskPlacer(30, lakePosition).place(new NullConstraint()));
  let fish = new SimpleGroup(
    [new SimpleObject(oFish, 2, 2, 0, 2)],
    true,
    clFood
  );

  createObjectGroupsByAreas(fish, 0,
    new AndConstraint([avoidClasses(clFood, 10), stayClasses(clWater, 8)]),
    5, 400, [lakeArea]
  );

  const offsetAngle = Math.PI / numPlayers;
  const sideLakeRadius = fractionToTiles(0.5) - 2;
  const sideLakePosition = Vector2D.add(mapCenter, new Vector2D(sideLakeRadius, 0).rotate(-angle - offsetAngle)).round();

  if (mapSize > 128) {
    const sideMinesRadius = 48 - (numPlayers - 2);
    const sideStonePosition = Vector2D.add(sideLakePosition, new Vector2D(sideMinesRadius, 0).rotate(-angle + -offsetAngle + Math.PI - Math.PI/5)).round();
    const sideMetalPosition = Vector2D.add(sideLakePosition, new Vector2D(sideMinesRadius, 0).rotate(-angle + -offsetAngle + Math.PI + Math.PI/5)).round();

    createObjectGroupsByAreas(
      new SimpleGroup([new SimpleObject(oStoneLarge, 1, 1, 0, 4)], true, clRock),
      0,
      avoidClasses(clForest, 10, clWater, 3),
      1, 400,
      [new Area(new ODiskPlacer(2, sideStonePosition).place())]
    );

    createObjectGroupsByAreas(
      new SimpleGroup([new SimpleObject(oMetalLarge, 1, 1, 0, 4)], true, clMetal),
      0,
      avoidClasses(clForest, 10, clWater, 3, clRock, 4),
      1, 400,
      [new Area(new ODiskPlacer(3, sideMetalPosition).place())]
    );
  }

  createArea(
    new ChainPlacer(
      3,
      6,
      Math.round(20 + (numPlayers - 2) * 9),
      Infinity,
      sideLakePosition,
      lakeRadius - 5,
      [lakeSize]),
    [
      new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 4),
      new TileClassPainter(clWater)
    ],
    avoidClasses(clPlayer, 25, clRock, 5, clMetal, 5));

  const sideLakeArea = new Area(new ODiskPlacer(35, sideLakePosition).place(stayClasses(clWater, 1)));
  createObjectGroupsByAreas(fish, 0,
    new AndConstraint([avoidClasses(clFood, 10), stayClasses(clWater, 8)]),
    randIntInclusive(7, 10), 400, [sideLakeArea]
  );

  Engine.SetProgress(20 + 2 * i);
}

const constraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clFood, 10, clWater, 2);
const stragglerConstraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clBaseResource, 10, clFood, 10, clWater, 2);
const foodMultiplier = 0.5; // Fishing is map dynamic
placeBalancedFood(playerPlacements, constraints, stragglerConstraints, foodMultiplier);

Engine.SetProgress(35);

if (numPlayers <= 2 && mapSize > 192) {
  placeBalancedMinerals(playerPositions, avoidClasses(clWater, 6, clMetal, 40, clRock, 40));
}

Engine.SetProgress(40);

paintTerrainBasedOnHeight(2.4, 3.4, 3, tMainTerrain);
paintTerrainBasedOnHeight(1, 2.4, 0, tShore);
paintTerrainBasedOnHeight(-8, 1, 2, tWater);
paintTileClassBasedOnHeight(-6, 0, 1, clWater);

createBumps(avoidClasses(clPlayer, 20, clWater, 1));

Engine.SetProgress(45);

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 35, clHill, 15, clWater, 6, clFood, 4, clMetal, 6, clRock, 6), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 35, clHill, 15, clWater, 6, clFood, 4, clMetal, 6, clRock, 6), clHill, scaleByMapSize(2, 11));

Engine.SetProgress(50);

if (currentBiome() != "generic/savanna") {
  createBalancedPlayerForests(
    playerPositions,
    [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
    avoidClasses(clForest, 18, clHill, 0, clMetal, 4, clRock, 4, clFood, 4, clWater, 4),
    clForest);
}

Engine.SetProgress(55);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
  [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
  avoidClasses(clPlayer, 18, clForest, 15, clHill, 0, clMetal, 4, clRock, 4, clWater, 4),
  clForest,
  forestTrees);

Engine.SetProgress(60);

g_Map.log("Creating dirt patches");
createLayeredPatches(
  [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
  [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
  [1, 1],
  avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWater, 1),
  scaleByMapSize(15, 45),
  clDirt);

Engine.SetProgress(63);

g_Map.log("Creating grass patches");
createPatches(
  [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
  tTier4Terrain,
  avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWater, 1),
  scaleByMapSize(15, 45),
  clDirt);
Engine.SetProgress(65);

const mineralAvoidance = numPlayers > 2 ? 10 : 30;
const playerMineralAvoidance = numPlayers > 2 ? 50 : 65;

g_Map.log("Creating stone mines");
createMines(
  [
    [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)]
  ],
  avoidClasses(clForest, 1, clPlayer, playerMineralAvoidance, clMetal, mineralAvoidance, clRock, mineralAvoidance, clHill, 1, clWater, 6),
  clRock,
  scaleByMapSize(4, 16) - 1
);
Engine.SetProgress(68);

g_Map.log("Creating metal mines");
createMines(
  [
    [new SimpleObject(oMetalLarge, 1, 1, 0, 4)]
  ],
  avoidClasses(clForest, 1, clPlayer, playerMineralAvoidance, clMetal, mineralAvoidance, clRock, mineralAvoidance, clHill, 1, clWater, 6),
  clMetal,
  scaleByMapSize(4, 16) - 1
);

Engine.SetProgress(70);

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

Engine.SetProgress(73);

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
    currentBiome() === "generic/savanna" ? 12 : 30,
    clMetal, 6, clRock, 6, clFood, 1, clWater, 4
  ),
  clForest,
  stragglerTrees);

Engine.SetProgress(95);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2, clWater, 6));

g_Map.ExportMap();
