const fruitFlora = [
  "gaia/flora_tree_banana",
  "gaia/flora_tree_date_palm_fruit",
  "gaia/flora_tree_fig",
  "gaia/flora_tree_apple",
  "gaia/flora_tree_olive"
];

function pickRandomCollection(collection, amount) {
  let newCollection = [];
  let dup = collection.slice();

  for (let i = 0; i < amount; ++i) {
    const index = Math.floor(dup.length * Math.random());
    const item = dup.splice(index, 1)[0];
    newCollection.push(item);
  }

  return newCollection;
}

function createBalancedPlayerStragglerTrees(playerPositions, templateNames, constraint, treeCount, tileClass) {
  templateNames = templateNames.filter((templateName) => fruitFlora.indexOf(templateName) < 0);

  for (let playerPosition of playerPositions) {
    const playerArea = new Area(new ODiskPlacer(38, playerPosition).place(avoidClasses(clPlayer, 12)));

    for (let templateName of templateNames) {
      createObjectGroupsByAreas(
        new SimpleGroup([new SimpleObject(templateName, 1, 1, 0, 3)], true, tileClass),
        0,
        constraint,
        Math.floor(treeCount / templateNames.length), 400,
        [playerArea]
      );
    }
  }
}

function createBalancedPlayerForests(playerPositions, constraint, tileClass)
{
  let treeCount = randIntInclusive(25, 35);
  let forestAmount = randIntInclusive(3, 4);

  for (let i = 0; i < playerPositions.length; ++i)
  {
    const playerPosition = playerPositions[i];

    let forestArea = new Area(new AnnulusPlacer(26, 40, playerPosition).place(new NullConstraint()));

    createForestsInArea(forestArea, constraint, tileClass, treeCount, 3, Math.floor(scaleByMapSize(3, 5)), 1, forestAmount, 0);
  }
}
/**
 * Places uniformly sized forests at random locations.
 * Generates two variants of forests from the given terrain textures and tree templates.
 * The forest border has less trees than the inside.
 */
function createForestsInArea(area, constraint, tileClass, treeCount,
  minRadius = 1,
  maxRadius = Math.floor(scaleByMapSize(3, 5)),
  forestVariantNumber = 2,
  numberOfForests = Math.floor(treeCount / (scaleByMapSize(3, 6) * getNumPlayers() * forestVariantNumber)),
  failurePercentage = 0.5,
  retryFactor = 400)
{
  if (!treeCount)
    return;

  const terrainSet = [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2];

  // Construct different forest types from the terrain textures and template names.
  const [mainTerrain, terrainForestFloor1, terrainForestFloor2, terrainForestTree1, terrainForestTree2] = terrainSet;

  // The painter will pick a random Terrain for each part of the forest.
  let forestVariants = pickRandomCollection([
    {
      "borderTerrains": [terrainForestFloor2, mainTerrain, terrainForestTree1],
      "interiorTerrains": [terrainForestFloor2, terrainForestTree1]
    },
    {
      "borderTerrains": [terrainForestFloor1, mainTerrain, terrainForestTree2],
      "interiorTerrains": [terrainForestFloor1, terrainForestTree2]
    }
  ], forestVariantNumber);

  g_Map.log("Creating forests");
  for (let forestVariant of forestVariants) {
    createAreasInAreas(
      new ChainPlacer(minRadius, maxRadius, treeCount / numberOfForests, failurePercentage),
      [
        new LayeredPainter([forestVariant.borderTerrains, forestVariant.interiorTerrains], [2]),
        new TileClassPainter(tileClass)
      ],
      constraint,
      numberOfForests,
      retryFactor,
      [area]);
  }
}
