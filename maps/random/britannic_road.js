Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");

const tPrimary = "alpine_grass_a";
const tGrass = ["temp_forestfloor_aut", "temp_forestfloor_aut", "temp_forestfloor_aut"];
const tGrassPForest = "temp_forestfloor_aut";
const tGrassDForest = "temp_forestfloor_aut";
const tGrassA = "temp_forestfloor_aut";
const tGrassB = "temp_forestfloor_aut";
const tGrassC = "temp_mud_a";
const tRoad = "temp_road";
const tRoadCenter = "temp_road_broken";
const tRoadWild = "temp_road_overgrown_aut";
const tGrassPatchBlend = "temp_forestfloor_aut";
const tGrassPatchA = ["alpine_grass_c", "alpine_grass_c"];
const tGrassPatchB = ["alpine_grass_d", "alpine_grass_d"];
const tGrassPatchTypes = [tGrassPatchA, tGrassPatchB];
const tShore = "temp_forestfloor_aut";
const tWater = "temp_mud_a";

const oBeech = "gaia/flora_tree_euro_beech_aut";
const oOak = "gaia/flora_tree_oak_aut";
const oOakBig = "gaia/flora_tree_oak_aut_new"
const oBerryBush = "gaia/flora_bush_berry";
const oDeer = "gaia/fauna_deer";
const oRabbit = "gaia/fauna_rabbit";
const oSheep = "gaia/fauna_sheep";
const oStoneLarge = "gaia/geology_stonemine_temperate_quarry";
const oStoneSmall = "gaia/geology_stone_temperate";
const oMetalLarge = "gaia/geology_metal_temperate_slabs";

const aDryGrass = "actor|props/flora/grass_field_dry_tall.xml";
const aGrassFlower = "actor|props/flora/grass_field_flowering_tall.xml";
const aGrassSoft = "actor|props/flora/grass_soft_large";
const aGrassSoftTall = "actor|props/flora/grass_soft_large_tall";
const aRockLarge = "actor|geology/stone_granite_med.xml";
const aRockMedium = "actor|geology/stone_granite_med.xml";
const aBushMedium = "actor|props/flora/bush_desert_dry_a.xml";
const aBushSmall = "actor|props/flora/bush_desert_dry_a.xml";

const pForestB = [tGrassDForest + TERRAIN_SEPARATOR + oBeech, tGrassDForest];
const pForestO = [tGrassPForest + TERRAIN_SEPARATOR + oOak, tGrassPForest];
const pForestN = [tGrassPForest + TERRAIN_SEPARATOR + oOakBig, tGrassPForest];
const pForestR = [tGrassDForest + TERRAIN_SEPARATOR + oBeech, tGrassDForest, tGrassDForest + TERRAIN_SEPARATOR + oOak, tGrassDForest, tGrassDForest, tGrassDForest];

const heightSeaGround = -4;
const heightShallows = -2;
const heightLand = 3;
const heightOffsetBump = 2;

const surroundingPlayerAreaMin = 20;
const surroundingPlayerAreaMax = 50;

var g_Map = new RandomMap(heightLand, tPrimary);

const numPlayers = getNumPlayers();
const mapSize = g_Map.getSize();
const mapCenter = g_Map.getCenter();
const mapBounds = g_Map.getBounds();

const neighbouringPlayerTiles = 50;

var clPlayers = [];
var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clDryGrass = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clRoad = g_Map.createTileClass();
var clBorder = g_Map.createTileClass();

var surroundingPlayersAreas = [];

var startAngle = randomAngle();

for (let i = 0; i < numPlayers; ++i) {
	clPlayers[i] = g_Map.createTileClass();
}

var playerPositions = playerPlacementRiver(startAngle + Math.PI / 2, fractionToTiles(0.5));
placePlayerBasesCustom({
	"PlayerPlacement": playerPositions,
	// PlayerTileClass marked below
	"BaseResourceClass": clBaseResource,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad//,
		//"painters": [
		//	new TileClassPainter(clPlayer)
		//]
	},
	"Chicken": {
	},
	"Berries": {
		"template": oBerryBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge }
		]
	},
	"Trees": {
		"template": oOak,
		"count": 3
	},
});
Engine.SetProgress(20);

for (let i = 0; i < numPlayers; ++i) {
	let playerClass = clPlayers[i];
	surroundingPlayersAreas[i] = createArea(new DiskPlacer(surroundingPlayerAreaMax, playerPositions[1][i]), null, avoidClasses(playerClass, surroundingPlayerAreaMin));
}
Engine.SetProgress(30);

var roadPositions = [
	new Vector2D(mapBounds.left + 1, mapCenter.y),
	new Vector2D(mapBounds.right - 1, mapCenter.y)
].map(v => v.rotateAround(startAngle, mapCenter));

g_Map.log("Creating the central road");
createArea(
	new PathPlacer(roadPositions[0], roadPositions[1], scaleByMapSize(2, 4), 0.2, 3 * scaleByMapSize(1, 4), 0.1, 0.01),
	[new TerrainPainter(tRoadCenter), new TileClassPainter(clRoad)],
	avoidClasses(clPlayer, 4));
Engine.SetProgress(35);

g_Map.log("Creating bumps");
createAreas(
	new ClumpPlacer(scaleByMapSize(20, 50), 0.3, 0.06, Infinity),
	new SmoothElevationPainter(ELEVATION_MODIFY, heightOffsetBump, 2),
	avoidClasses(clRoad, 2, clPlayer, 15),
	scaleByMapSize(100, 200)
);
Engine.SetProgress(55);

g_Map.log("Creating primary grass patches");
for (let size of [scaleByMapSize(8, 20), scaleByMapSize(13, 35), scaleByMapSize(25, 70)])
	createAreas(
		new ChainPlacer(1, Math.floor(scaleByMapSize(3, 5)), size, 0.5),
		[new LayeredPainter([tGrassPatchA, tGrassPatchA], [1]), new TileClassPainter(clDryGrass)],
		avoidClasses(clRoad, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 6),
		scaleByMapSize(15, 45)
	);
Engine.SetProgress(58);

g_Map.log("Creating secondary grass patches");
//for (let size of [scaleByMapSize(3, 8), scaleByMapSize(5, 15), scaleByMapSize(8, 20)])
for (let size of [scaleByMapSize(8, 20), scaleByMapSize(13, 35), scaleByMapSize(25, 60)])
	createAreas(
		new ChainPlacer(1, Math.floor(scaleByMapSize(3, 4)), size, 0.5),
		[new LayeredPainter([tGrassPatchB, tGrassPatchB], [1]), new TileClassPainter(clDryGrass)],
		avoidClasses(clRoad, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 6),
		scaleByMapSize(10, 30)
	);
Engine.SetProgress(61);

g_Map.log("Creating the bordering trees");
var [borderForests, borderStragglers] = getTreeCounts(500, 2500, 0.7);
/*createForestsCustom(
	[tGrass, tGrassDForest, tGrassPForest, pForestN, pForestN],
	new AndConstraint([avoidClasses(clPlayer, 15, clBorder, 2, clHill, 1, clRoad, 5), new BorderTileClassConstraint(clRoad, 0, 20)]),
	clBorder,
	borderForests);
Engine.SetProgress(60);*/

g_Map.log("Creating player owned forest");
for (let i = 0; i < numPlayers; ++i)
	createPlayerForests(
		[tGrass, tGrassDForest, tGrassPForest, pForestB, pForestO],
		new AndConstraint([avoidClasses(clPlayer, 12, clRoad, 30, clForest, 16, clHill, 1), borderClasses(clPlayer, 0, 30)]),
		clForest,
		surroundingPlayersAreas[i]);
Engine.SetProgress(65);
		
g_Map.log("Creating the regular trees");
var [forestTrees, stragglerTrees] = getTreeCounts(300, 1600, 0.7);
createThickerForests(
	[tGrass, tGrassDForest, tGrassPForest, pForestB, pForestO],
	avoidClasses(clPlayer, 15, clRoad, 30, clForest, 16, clHill, 1),
	clForest,
	forestTrees);
Engine.SetProgress(70);

/*g_Map.log("Creating dirt patches");
for (let size of [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)])
	createAreas(
		new ChainPlacer(1, Math.floor(scaleByMapSize(3, 5)), size, 0.5),
		[
			new LayeredPainter([[tGrass,tGrassA], tGrassB, [tGrassB,tGrassC]], [1, 1]),
			new TileClassPainter(clDirt)
		],
		avoidClasses(clRoad, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 6),
		scaleByMapSize(15, 45)
	);*/

g_Map.log("Creating additionnal mines for players (balance)");
var minesAmountDistribution = [];

if (numPlayers <= 2)
	minesAmountDistribution = [0.2, 0.5, 0.2, 0.1];
else
	minesAmountDistribution = [0.1, 0.6, 0.3];

var incrementedProbability = 0;
var minesAmount = 0;
var random = Math.random();
for (let i = 0; i < minesAmountDistribution.length; ++i) {
	incrementedProbability += minesAmountDistribution[i];
	if (random < incrementedProbability) {
		minesAmount = i;
		break;
	}
}

// For now, equal probability for both mine types.
// In 1v1, both players will have exactly the same mine types nearby. In games with more player the type can vary.
var objects = [new SimpleObject(oStoneLarge, 1, 1, 0,4), new SimpleObject(oMetalLarge, 1, 1, 0,4)];
var groups = [];
for (let i = 0; i < minesAmount; i++)
	groups[i] = new RandomGroup(objects, true, clRock);

for (let i = 0; i < numPlayers; ++i) {
	for (let j = 0; j < minesAmount; j++) {
		if (numPlayers <= 2) {
			createObjectGroupsByAreas(
				groups[j], 
				0, 
				[avoidClasses(clRoad, 20, clForest, 3, clPlayer, 15, clRock, 10, clHill, 1)], 
				1, 
				50, 
				[surroundingPlayersAreas[i]]);
		}
		else {
			createObjectGroupsByAreas(
				new SimpleGroup([pickRandom(objects)], true, clRock), 
				0, 
				[avoidClasses(clRoad, 20, clForest, 3, clPlayer, 15, clRock, 10, clHill, 1)], 
				1, 
				50, 
				[surroundingPlayersAreas[i]]);
		}
	}
}
			
Engine.SetProgress(80);
	

g_Map.log("Creating stone mines");
var group = new SimpleGroup([new SimpleObject(oStoneSmall, 0, 2, 0, 4, 0, 2 * Math.PI, 1), new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)], true, clRock);
createObjectGroupsDeprecated(group, 0,
	[avoidClasses(clRoad, 20, clForest, 1, clPlayer, surroundingPlayerAreaMax + 5, clRock, 10, clHill, 1)],
	scaleByMapSize(5,18), 100
);

g_Map.log("Creating small stone quarries");
group = new SimpleGroup([new SimpleObject(oStoneSmall, 2,5, 1,3)], true, clRock);
createObjectGroupsDeprecated(group, 0,
	[avoidClasses(clRoad, 20, clForest, 1, clPlayer, surroundingPlayerAreaMax + 5, clRock, 10, clHill, 1)],
	scaleByMapSize(5,18), 100
);

g_Map.log("Creating metal mines");
group = new SimpleGroup([new SimpleObject(oMetalLarge, 1,1, 0,4)], true, clMetal);
createObjectGroupsDeprecated(group, 0,
	[avoidClasses(clRoad, 20, clForest, 1, clPlayer, surroundingPlayerAreaMax + 5, clMetal, 10, clRock, 5, clHill, 1)],
	scaleByMapSize(5,18), 100
);

Engine.SetProgress(86);

g_Map.log("Creating small decorative rocks");
group = new SimpleGroup(
	[new SimpleObject(aRockMedium, 1,3, 0,1)],
	true
);
createObjectGroupsDeprecated(
	group, 0,
	avoidClasses(clRoad, 0, clForest, 0, clPlayer, 0, clHill, 0),
	scaleByMapSize(16, 262), 50
);

g_Map.log("Creating large decorative rocks");
group = new SimpleGroup(
	[new SimpleObject(aRockLarge, 1,2, 0,1), new SimpleObject(aRockMedium, 1,3, 0,2)],
	true
);
createObjectGroupsDeprecated(
	group, 0,
	avoidClasses(clRoad, 0, clForest, 0, clPlayer, 0, clHill, 0),
	scaleByMapSize(8, 131), 50
);

g_Map.log("Creating additionnal food for players (balance)");
// Player ressource balance calculation
var initialFoodAmount = randIntInclusive(0, 35)// * 100  // 1 unit = 100 food

// I want it likely that there is no additionnal food for the player.
if (initialFoodAmount < 6)
	initialFoodAmount = 0;

for (let i = 0; i < numPlayers; ++i) {
	let playerClass = clPlayers[i];
	let remainingFood = initialFoodAmount;
	while (remainingFood > 0) {
		// Not sure if i should remove groups of 1 / 2 sheep or not.
		if (remainingFood <= 2) {
			remainingFood = 0;
		}
		else if (remainingFood <= 4) {
			placeFood(oSheep, remainingFood, remainingFood, remainingFood, playerClass, i);
			remainingFood = 0;
		}
		else if (remainingFood <= 10) {
			remainingFood -= placeFood(oDeer, 5, 8, remainingFood, playerClass, i);
		}
		else {
			// There I want it more likely to pick berries since hunt will always be chosen for the lower remaining food amounts
			if (randBool(0.68)) {
				remainingFood -= 2 * placeFood(oBerryBush, 5, 7, Math.floor(remainingFood/2), playerClass, i);
			}
			else {
				remainingFood -= placeFood(oDeer, 5, 8, remainingFood, playerClass, i);
			}
		}
	}
}

g_Map.log("Creating deer");
group = new SimpleGroup(
	[new SimpleObject(oDeer, 5,7, 0,4)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clRoad, 0, clForest, 0, clPlayer, neighbouringPlayerTiles, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	3 * numPlayers, 50
);

g_Map.log("Creating rabbits");
group = new SimpleGroup(
	[new SimpleObject(oRabbit, 2,3, 0,2)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clRoad, 0, clForest, 0, clPlayer, neighbouringPlayerTiles, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	3 * numPlayers, 50
);

g_Map.log("Creating berry bush");
group = new SimpleGroup(
	[new SimpleObject(oBerryBush, 5,7, 0,4)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clRoad, 20, clForest, 0, clPlayer, neighbouringPlayerTiles, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	randIntInclusive(1, 4) * numPlayers + 2, 50
);

createStragglerTrees(
	[oOak, oBeech],
	avoidClasses(clRoad, 30, clForest, 7, clHill, 1, clPlayer, 5, clMetal, 6, clRock, 6),
	clForest,
	stragglerTrees);

createAutomnalStragglerTrees(tGrassDForest, 
	oOakBig, 
	clForest, 
	borderStragglers,
	new AndConstraint([avoidClasses(clForest, 7, clBorder, 4, clHill, 1, clPlayer, 5, clMetal, 6, clRock, 6, clRoad, 2), borderClasses(clRoad, 0, 20)]), 
	10);


g_Map.log("Creating dry grass");
group = new SimpleGroup(
	[new SimpleObject(aDryGrass, 4,6, 0,0.8, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroupsDeprecated(group, 0,
	new AndConstraint([avoidClasses(clRoad, 2, clHill, 2, clPlayer, 2, clDirt, 0), stayClasses(clDryGrass, 0)]),
	scaleByMapSize(125, 800)
);

g_Map.log("Creating flowering grass");
group = new SimpleGroup(
	[new SimpleObject(aGrassFlower, 4,6, 0,1, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clRoad, 3, clHill, 2, clPlayer, 2, clDirt, 1, clForest, 0, clDryGrass, 2),
	scaleByMapSize(125, 1000)
);

g_Map.log("Creating soft grass");
group = new SimpleGroup(
	[new SimpleObject(aGrassSoft, 1,2, 0,1.8, -Math.PI / 8, Math.PI / 8), new SimpleObject(aGrassSoftTall, 1,1, 1.2,2.5, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clRoad, 3, clHill, 2, clPlayer, 2, clDirt, 1, clForest, 0, clDryGrass, 2),
	scaleByMapSize(18, 150)
);

g_Map.log("Creating bushes");
group = new SimpleGroup(
	[new SimpleObject(aBushMedium, 1,2, 0,2), new SimpleObject(aBushSmall, 2,4, 0,2)]
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clRoad, 1, clHill, 1, clPlayer, 1, clDirt, 1),
	scaleByMapSize(13, 200), 50
);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setSkySet("sunset");
setSunColor(1.17359, 1.01251, 0.478641);
setSunElevation(0.297592);
setSunRotation(3.14159);
setTerrainAmbientColor(0.266667, 0.337255, 0.419608);
setUnitsAmbientColor(0.392157, 0.427451, 0.529412);
setFogFactor(0.00298828);
setFogThickness(0.00195313);
setFogColor(0.886275, 0.811765, 0.576471);

g_Map.ExportMap();

function createAutomnalStragglerTrees(groundTexture, treeType, tileClass, count, constraints, retryFactor)
{
	let placeFunc = function() {
		let center = g_Map.randomCoordinate(false);
		let centeredPlacer = new ClumpPlacer(randIntInclusive(2, 6), 0, 0.25);
		centeredPlacer.setCenterPosition(center);
		let area = createArea(centeredPlacer, new TerrainPainter(groundTexture), constraints);
		if (area)
			g_Map.placeEntityAnywhere(treeType, 0, center, randomAngle())
		return area;
	};

	return retryPlacing(placeFunc, retryFactor, count, false);
}

// Places a bounded amount of corresponding type food to the specified player and returns the amount placed.
function placeFood(type, min, max, remainingFood, playerClass, areaId) {
	// Since the placing function doesn't specify (i think ?) the number of objects placed, randomization is done there.
	max = max < remainingFood ? max : remainingFood;
	let amountPlaced = randIntInclusive(min, max);
	
	// Hunt should spawn farther from the CC in general.
	let minTileBound = 15;
	let maxTileBound = 25;
	if (type != oBerryBush) {
		minTileBound += 10;
		maxTileBound += 10;
	}
	
	let group = new SimpleGroup(
		[new SimpleObject(type, amountPlaced, amountPlaced, 0,4)],
		true, clFood
	);
	createObjectGroupsByAreas(group, 0,
		new AndConstraint([avoidClasses(clRoad, 0, clForest, 0, clPlayer, minTileBound, clHill, 1, clMetal, 4, clRock, 4, clFood, 10), borderClasses(playerClass, 0, maxTileBound)]),
		1, 400, [surroundingPlayersAreas[areaId]]
	);
	
	return amountPlaced;
}

// If we move this function, add tileClass ids for each player in argument
function placePlayerBasesCustom(playerBaseArgs)
{
	g_Map.log("Creating playerbases");

	let [playerIDs, playerPosition] = playerBaseArgs.PlayerPlacement;

	for (let i = 0; i < getNumPlayers(); ++i)
	{
		playerBaseArgs.playerID = playerIDs[i];
		playerBaseArgs.playerPosition = playerPosition[i];
		playerBaseArgs.CityPatch.painters = [new TileClassPainter(clPlayer), new TileClassPainter(clPlayers[i])];
		placePlayerBase(playerBaseArgs);
	}
}

function createForestsCustom(terrainSet, constraint, tileClass, treeCount, retryFactor)
{
	if (!treeCount)
		return;

	// Construct different forest types from the terrain textures and template names.
	let [mainTerrain, terrainForestFloor1, terrainForestFloor2, terrainForestTree1, terrainForestTree2] = terrainSet;

	// The painter will pick a random Terrain for each part of the forest.
	let forestVariants = [
		{
			"borderTerrains": [terrainForestFloor2, mainTerrain, terrainForestTree1],
			"interiorTerrains": [terrainForestFloor2, terrainForestTree1]
		},
		{
			"borderTerrains": [terrainForestFloor1, mainTerrain, terrainForestTree2],
			"interiorTerrains": [terrainForestFloor1, terrainForestTree2]
		}
	];
	
	let groundVariants = [
		{
			"borderTerrains": [terrainForestFloor2, mainTerrain],
			"interiorTerrains": [terrainForestFloor2]
		},
		{
			"borderTerrains": [terrainForestFloor1, mainTerrain],
			"interiorTerrains": [terrainForestFloor1]
		}
	];

	g_Map.log("Creating forests");
	let numberOfForests = Math.floor(treeCount / (scaleByMapSize(3, 6) * getNumPlayers() * forestVariants.length));
	for (let forestVariant of forestVariants)
		createAreas(
			new ChainPlacer(1, Math.floor(scaleByMapSize(3, 5)), treeCount / numberOfForests, 0.5),
			[
				//new LayeredPainter([groundVariants.borderTerrains, groundVariants.interiorTerrains], [2]),
				new TerrainPainter(terrainForestFloor1),
				new CustomLayeredPainter([forestVariant.borderTerrains, forestVariant.interiorTerrains], [2]),
				new TileClassPainter(tileClass)
			],
			constraint,
			numberOfForests,
			retryFactor);
}

function createThickerForests(terrainSet, constraint, tileClass, treeCount, retryFactor)
{
	if (!treeCount)
		return;

	// Construct different forest types from the terrain textures and template names.
	let [mainTerrain, terrainForestFloor1, terrainForestFloor2, terrainForestTree1, terrainForestTree2] = terrainSet;

	// The painter will pick a random Terrain for each part of the forest.
	let forestVariants = [
		{
			"borderTerrains": [terrainForestFloor2, mainTerrain, terrainForestTree1],
			"interiorTerrains": [terrainForestFloor2, terrainForestTree1]
		},
		{
			"borderTerrains": [terrainForestFloor1, mainTerrain, terrainForestTree2],
			"interiorTerrains": [terrainForestFloor1, terrainForestTree2]
		}
	];
	
	//treeCount /= Math.floor(getNumPlayers() / 2);

	g_Map.log("Creating forests");
	let numberOfForests = Math.floor(treeCount / (scaleByMapSize(24, 40) * forestVariants.length));
	for (let forestVariant of forestVariants)
		createAreas(
			new ChainPlacer(1, Math.floor(scaleByMapSize(3, 5)), treeCount / numberOfForests, 0.5),
			[
				new LayeredPainter([forestVariant.borderTerrains, forestVariant.interiorTerrains], [2]),
				new TileClassPainter(tileClass)
			],
			constraint,
			numberOfForests,
			retryFactor);
}

function createPlayerForests(terrainSet, constraint, tileClass, playerArea)
{
	// Construct different forest types from the terrain textures and template names.
	let [mainTerrain, terrainForestFloor1, terrainForestFloor2, terrainForestTree1, terrainForestTree2] = terrainSet;

	// The painter will pick a random Terrain for each part of the forest.
	let forestVariants = [
		{
			"borderTerrains": [terrainForestFloor2, mainTerrain, terrainForestTree1],
			"interiorTerrains": [terrainForestFloor2, terrainForestTree1]
		},
		{
			"borderTerrains": [terrainForestFloor1, mainTerrain, terrainForestTree2],
			"interiorTerrains": [terrainForestFloor1, terrainForestTree2]
		}
	];
	
	let forestVariant = pickRandom(forestVariants);
	let treeCount = 28;
		
	createAreasInAreas(
		new ChainPlacer(1, /*Math.floor(scaleByMapSize(3, 5))*/3, treeCount, 0), 
		[
			new LayeredPainter([forestVariant.borderTerrains, forestVariant.interiorTerrains], [2]),
			new TileClassPainter(tileClass)
		], 
		constraint, 
		1, 
		100, 
		[playerArea]);
}
