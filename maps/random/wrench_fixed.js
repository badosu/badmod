Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("balancedHelpers");

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

const mapSize = g_Map.getSize();
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

const wrenchScaling = 10 * (numPlayers - 2);
const playersCircleRadius = 28 + wrenchScaling;
let playerPlacements = playerPlacementCircle(playersCircleRadius);
let [playersOrder, playerPositions, playerAngles, startingAngle] = playerPlacements;

let playerIDs = [];
for (let i = 0; i < numPlayers; ++i)
  playerIDs.push(i+1);

playerPlacements[0] = playerIDs;

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

const mapCenter = g_Map.getCenter();

const minesVariation = randIntInclusive(2, 12);

for (let i = 0; i < numPlayers; ++i) {
  const playerAngle = playerAngles[i];
  const offsetAngle = Math.PI / numPlayers;
  const minesRadius = playersCircleRadius + numPlayers * 3 + minesVariation;
  const minesPoint = new Vector2D(minesRadius).rotate(- playerAngle - offsetAngle);
  const minesArea = new Area(
    new ODiskPlacer(2.2, Vector2D.add(mapCenter, minesPoint).round()).place()
  );

  createObjectGroupsByAreas(
    new SimpleGroup([new SimpleObject(oMetalLarge, 1, 1, 0, 4)], true, clMetal),
    0,
    avoidClasses(clForest, 6, clHill, 7),
    1, 400,
    [minesArea]
  );

  createObjectGroupsByAreas(
    new SimpleGroup([new SimpleObject(oStoneLarge, 1, 1, 0, 4)], true, clRock),
    0,
    avoidClasses(clForest, 6, clHill, 7, clMetal, 6),
    1, 400,
    [minesArea]
  );

  const minesClumpPosition = new Vector2D(minesRadius - 15).rotate(- playerAngle - offsetAngle);
  const wrenchHeadSize = 20;
  createArea(
    new ODiskPlacer(wrenchHeadSize, Vector2D.add(mapCenter, minesClumpPosition).round()),
    [
      new TerrainPainter(tCliff),
      new SmoothElevationPainter(ELEVATION_SET, 24, 1),
      new TileClassPainter(clWrenchHead)
    ],
    avoidClasses(clPlayer, 18, clMetal, 9, clRock, 9)
  );

  // If map is not tiny, create metal and stone far from each player near edges
  if (mapSize > 128) {
    createObjectGroupsByAreas(
      new SimpleGroup([new SimpleObject(oStoneLarge, 1, 1, 0, 4)], true, clRock),
      0,
      avoidClasses(clForest, 6, clHill, 7),
      1, 400,
      [new Area(new ODiskPlacer(3, Vector2D.add(mapCenter, new Vector2D(fractionToTiles(0.42), 0).rotate(- playerAngle + offsetAngle / 3)).round()).place())]
    );

    createObjectGroupsByAreas(
      new SimpleGroup([new SimpleObject(oMetalLarge, 1, 1, 0, 4)], true, clMetal),
      0,
      avoidClasses(clForest, 6, clHill, 7),
      1, 400,
      [new Area(new ODiskPlacer(3, Vector2D.add(mapCenter, new Vector2D(fractionToTiles(0.42), 0).rotate(- playerAngle - offsetAngle / 3)).round()).place())]
    );
  }

  Engine.SetProgress(20 + i);
}

const handleSize = 30 + 11.5 * (numPlayers - 2);
createArea(
  new ODiskPlacer(handleSize, mapCenter),
  [
    new TerrainPainter(tCliff),
    new SmoothElevationPainter(ELEVATION_SET, 24, 1),
    new TileClassPainter(clHill)
  ],
  avoidClasses(clPlayer, 18, clMetal, 10, clRock, 10)
);

Engine.SetProgress(35);

createBumps(avoidClasses(clPlayer, 20, clMetal, 6, clRock, 6));

Engine.SetProgress(40);

let constraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clFood, 10, clWrenchHead, 1);
let stragglerConstraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clBaseResource, 10, clFood, 10, clWrenchHead, 1);
placeBalancedFood(playerPlacements, constraints, stragglerConstraints);

Engine.SetProgress(45);

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 42, clHill, 15, clMetal, 10, clRock, 10, clWrenchHead, 20, clFood, 4), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 42, clHill, 15, clMetal, 10, clRock, 10, clWrenchHead, 20, clFood, 4), clHill, scaleByMapSize(2, 11));

Engine.SetProgress(48);

if (currentBiome() != "generic/savanna") {
  createBalancedPlayerForests(
    playerPositions,
    avoidClasses(clForest, 6, clHill, 2, clMetal, 4, clRock, 4, clFood, 4, clWrenchHead, 4),
    clForest);
}

Engine.SetProgress(50);

const [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));

createForests(
  [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
  avoidClasses(clPlayer, 18, clForest, 15, clHill, 1, clMetal, 6, clRock, 6, clFood, 6, clWrenchHead, 9),
  clForest,
  forestTrees);

Engine.SetProgress(60);

g_Map.log("Creating dirt patches");
createLayeredPatches(
  [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
  [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
  [1, 1],
  avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWrenchHead, 2),
  scaleByMapSize(15, 45),
  clDirt);

Engine.SetProgress(63);

g_Map.log("Creating grass patches");
createPatches(
  [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
  tTier4Terrain,
  avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWrenchHead, 2),
  scaleByMapSize(15, 45),
  clDirt);

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
  avoidClasses(clForest, 0, clPlayer, 0, clHill, 0, clWrenchHead, 0));

Engine.SetProgress(70);

createBadFood(avoidClasses(clForest, 0, clHill, 1, clMetal, 4, clRock, 4, clFood, 20, clWrenchHead, 5));

Engine.SetProgress(85);

createStragglerTrees(
  [oTree1, oTree2, oTree4, oTree3],
  avoidClasses(
    clForest, 8, clHill, 1, clPlayer,
    currentBiome() === "generic/savanna" ? 12 : 30,
    clMetal, 6, clRock, 6, clFood, 1, clWrenchHead, 10
  ),
  clForest,
  stragglerTrees);

Engine.SetProgress(90);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2, clWrenchHead, 10));

Engine.SetProgress(95);

g_Map.ExportMap();
