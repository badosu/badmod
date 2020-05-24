Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

setSelectedBiome();

Engine.LoadLibrary("balancedHelpers");

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
const tWater = g_Terrains.water;
const tShore = g_Terrains.shore;

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

const heightLand = 0;

var g_Map = new RandomMap(heightLand, tMainTerrain);
const mapSize = g_Map.getSize();
const halfMapSize = g_Map.getSize() / 2;

const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clRamp = g_Map.createTileClass();
var clWater = g_Map.createTileClass();

const playerDistance = fractionToTiles(0.6);
const playerEdgeDistance = Math.round((mapSize - playerDistance) / 2);

const firstPlayerGroupSize = Math.floor(numPlayers / 2);
const secondPlayerGroupSize = numPlayers - firstPlayerGroupSize;
const playerIDs = sortAllPlayers();

let playerPositions = [];

if (firstPlayerGroupSize == 1) {
  playerPositions.push(new Vector2D(halfMapSize, playerEdgeDistance))
} else if (firstPlayerGroupSize > 1) {
  const offset = (firstPlayerGroupSize - 2) * 6;
  const startAngle = Math.min(firstPlayerGroupSize - 2, 1) * Math.PI / Math.pow(2, firstPlayerGroupSize - 2);

  playerPositions = playerPositions.concat(distributePointsOnCircle(
    firstPlayerGroupSize,
    startAngle,
    20 + firstPlayerGroupSize * 5,
    new Vector2D(halfMapSize, playerEdgeDistance + offset)
  )[0]);
}

if (secondPlayerGroupSize == 1) {
  playerPositions.push(new Vector2D(halfMapSize, playerEdgeDistance + playerDistance));
} else if (secondPlayerGroupSize > 1) {
  const offset = (secondPlayerGroupSize - 2) * 6;
  const startAngle = Math.min(secondPlayerGroupSize - 2, 1) * Math.PI / Math.pow(2, secondPlayerGroupSize - 2);

  playerPositions = playerPositions.concat(distributePointsOnCircle(
    secondPlayerGroupSize,
    -startAngle,
    20 + secondPlayerGroupSize * 5,
    new Vector2D(halfMapSize, playerEdgeDistance + playerDistance - offset)
  )[0]);
}

const playerPlacements = [playerIDs, playerPositions];

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

Engine.SetProgress(10);

const heightTop = heightLand + 5;
const lowlandsWidth = fractionToTiles(0.36);
const rampWidth = fractionToTiles(0.05);
const elevationPainter = new ElevationPainter(heightTop);

const rightRampStartX = halfMapSize + lowlandsWidth / 2;
const rightRampEndX = rightRampStartX + rampWidth;
const leftRampStartX = halfMapSize - lowlandsWidth / 2;
const leftRampEndX = leftRampStartX - rampWidth;

const rightPlateauPlacer = new RectPlacer(new Vector2D(rightRampEndX, mapSize), new Vector2D(mapSize, 0));
const leftPlateauPlacer = new RectPlacer(new Vector2D(0, mapSize), new Vector2D(leftRampEndX, 0));

createArea(rightPlateauPlacer, elevationPainter);
Engine.SetProgress(12);
createArea(leftPlateauPlacer, elevationPainter);
Engine.SetProgress(14);

createPassage({
  "start": new Vector2D(rightRampStartX, halfMapSize),
  "end": new Vector2D(rightRampEndX, halfMapSize),
  "startWidth": mapSize,
  "endWidth": mapSize,
  "smoothWidth": 2,
  "tileClass": clRamp,
  "terrain": tCliff,
  "edgeTerrain": tHill
});
Engine.SetProgress(16);

createPassage({
  "start": new Vector2D(leftRampStartX, halfMapSize),
  "end": new Vector2D(leftRampEndX, halfMapSize),
  "startWidth": mapSize,
  "endWidth": mapSize,
  "smoothWidth": 2,
  "tileClass": clRamp,
  "terrain": tCliff,
  "edgeTerrain": tHill
});
Engine.SetProgress(18);

const heightWaterLevel = heightTop - 7;

const fish = new SimpleGroup([new SimpleObject(oFish, 2, 2, 0, 2)], true, clFood);
const stone = new SimpleGroup(
  [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)],
  true,
  clRock
);
const metal = new SimpleGroup(
  [new SimpleObject(oMetalLarge, 1, 1, 0, 4)],
  true,
  clMetal
);


function createSideLakes(xDistance, yDistance) {
  const stoneRight = randBool();
  let mineralDistribution = [stoneRight, !stoneRight];

  for (let x of [halfMapSize + xDistance, halfMapSize - xDistance]) {
    const position = new Vector2D(x, halfMapSize + yDistance);
    const lakeSize = scaleByMapSize(14, 38);
    const placer = new ChainPlacer(
      2,
      Math.floor(scaleByMapSize(3, 8)),
      Math.floor(scaleByMapSize(8, 20)),
      Infinity,
      position,
      0,
      [lakeSize]
    );

    createArea(
      placer,
      [
        new SmoothElevationPainter(ELEVATION_SET, heightWaterLevel - 3, 4),
        new TileClassPainter(clWater),
      ],
      new NullConstraint()
    );

    createObjectGroupsByAreas(fish, 0,
      avoidClasses(clFood, 6),
      scaleByMapSize(3, 9), 1000,
      [new Area(placer.place(stayClasses(clWater, 1)))]
    );

    const lowerRadius = lakeSize + 2;
    const maxRadius = lakeSize + 4;

    createObjectGroupsByAreas(mineralDistribution.pop() ? stone : metal, 0,
      avoidClasses(clWater, 4),
      1, 400, [getAnnulusArea(lowerRadius, maxRadius, position)]
    );

    placeFoodAmount(oMainHuntableAnimal, 4, 4, position, avoidClasses(clWater, 2, clFood, 20, clRock, 4, clMetal, 4), lowerRadius, maxRadius);
    placeFoodAmount(oMainHuntableAnimal, 4, 4, position, avoidClasses(clWater, 2, clFood, 20, clRock, 4, clMetal, 4), lowerRadius, maxRadius);
  }
}

const lakeDistance = rampWidth + lowlandsWidth / 2 + fractionToTiles(0.11);

createSideLakes(lakeDistance, fractionToTiles(0.31));
Engine.SetProgress(22);
createSideLakes(lakeDistance, -fractionToTiles(0.31));
Engine.SetProgress(24);

createArea(
  leftPlateauPlacer,
  new TerrainPainter(tWater),
  new HeightConstraint(-Infinity, heightTop - 1.5));
Engine.SetProgress(26);
createArea(
  leftPlateauPlacer,
  new TerrainPainter(tShore),
  new HeightConstraint(heightTop - 1, heightTop - 2));
Engine.SetProgress(27);

createArea(
  rightPlateauPlacer,
  new TerrainPainter(tWater),
  new HeightConstraint(-Infinity, heightTop - 1.5));
Engine.SetProgress(28);
createArea(
  rightPlateauPlacer,
  new TerrainPainter(tShore),
  new HeightConstraint(heightTop - 1, heightTop - 2));
Engine.SetProgress(29);

createBumps(avoidClasses(clPlayer, 20));

Engine.SetProgress(30);

const mineralPlacer = new DiskPlacer(4, new Vector2D(mapSize / 2, mapSize / 2));
const centerMineralsArea = new Area(mineralPlacer.place(new NullConstraint()));

createObjectGroupsByAreas(stone, 0,
  new NullConstraint(),
  1, 400, [centerMineralsArea]
);

createObjectGroupsByAreas(metal, 0,
  avoidClasses(clRock, 6),
  1, 400, [centerMineralsArea]
);

Engine.SetProgress(32);

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 35, clHill, 15, clMetal, 4, clRock, 4, clWater, 8), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 35, clHill, 15, clMetal, 4, clRock, 4, clWater, 8), clHill, scaleByMapSize(2, 11));

Engine.SetProgress(34);

let constraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clFood, 10, clWater, 4);
let stragglerConstraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clBaseResource, 10, clFood, 10, clWater, 4);

placeBalancedFood(playerPlacements, constraints, stragglerConstraints, 0.5);

Engine.SetProgress(40);

if (currentBiome() != "generic/savanna") {
  createBalancedPlayerForests(
    playerPositions,
    avoidClasses(clForest, 18, clHill, 1, clMetal, 4, clRock, 4, clFood, 4, clWater, 4, clBaseResource, 8),
    clForest);
}

Engine.SetProgress(44);

const [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(0.7));
const leftPlateauArea = new Area(leftPlateauPlacer.place(avoidClasses(clWater, 4, clPlayer, 40)));
const rightPlateauArea = new Area(rightPlateauPlacer.place(avoidClasses(clWater, 4, clPlayer, 40)));

createForestsInArea(
  leftPlateauArea,
  avoidClasses(clForest, 16, clHill, 1, clMetal, 4, clRock, 4, clFood, 4, clWater, 3, clPlayer, 40),
  clForest,
  forestTrees,
  2);

Engine.SetProgress(48);

createForestsInArea(
  rightPlateauArea,
  avoidClasses(clForest, 16, clHill, 1, clMetal, 4, clRock, 4, clFood, 4, clWater, 3, clPlayer, 40),
  clForest,
  forestTrees,
  2);

Engine.SetProgress(52);

const lowlandsPlacer = new RectPlacer(new Vector2D(leftRampStartX, 0), new Vector2D(rightRampStartX, mapSize));
const lowlandsArea = new Area(lowlandsPlacer.place(avoidClasses(clPlayer, 40)));

createForestsInArea(
  lowlandsArea,
  avoidClasses(clForest, 14, clHill, 1, clMetal, 4, clRock, 4, clFood, 4, clPlayer, 40),
  clForest,
  Math.round(forestTrees / 2),
  1,
  2
);
Engine.SetProgress(55);

g_Map.log("Creating dirt patches");
createLayeredPatches(
  [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
  [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
  [1, 1],
  avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWater, 3),
  scaleByMapSize(15, 45),
  clDirt);

Engine.SetProgress(57);

g_Map.log("Creating grass patches");
createPatches(
  [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
  tTier4Terrain,
  avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWater, 3, clRamp, 0),
  scaleByMapSize(15, 45),
  clDirt);
Engine.SetProgress(59);

g_Map.log("Creating stone mines");
createMines(
  [
    [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)]
  ],
  avoidClasses(clForest, 1, clPlayer, 60, clRock, 22, clHill, 1, clWater, 30),
  clRock,
  scaleByMapSize(4, 16) - 2
);
Engine.SetProgress(62);

g_Map.log("Creating metal mines");
createMines(
  [
    [new SimpleObject(oMetalLarge, 1, 1, 0, 4)]
  ],
  avoidClasses(clForest, 1, clPlayer, 60, clMetal, 22, clRock, 5, clHill, 1, clWater, 30),
  clMetal,
  scaleByMapSize(4, 16) - 2
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

createBadFood(avoidClasses(clForest, 0, clHill, 1, clMetal, 4, clRock, 4, clFood, 20, clWater, 20));

Engine.SetProgress(75);

createFood(
  [
    [new SimpleObject(oFruitBush, 5, 7, 0, 4)]
  ],
  [
    2 * numPlayers
  ],
  avoidClasses(clForest, 0, clPlayer, 45, clHill, 1, clMetal, 4, clRock, 4, clFood, 10, clWater, 14),
  clFood);

Engine.SetProgress(80);

createStragglerTrees(
  [oTree1, oTree2, oTree4, oTree3],
  avoidClasses(
    clForest, 8, clHill, 1, clPlayer,
    (currentBiome() == "generic/savanna") ? 12 : 30,
    clMetal, 6, clRock, 6, clFood, 1, clWater, 4
  ),
  clForest,
  stragglerTrees);

Engine.SetProgress(85);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2, clWater, 6));

g_Map.ExportMap();
