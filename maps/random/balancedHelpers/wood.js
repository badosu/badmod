function createBalancedPlayerForests(playerPositions, terrainSet, constraint, tileClass)
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
	let treeCount = randIntInclusive(20, 30);
  let forestAmount = randIntInclusive(3, 4);
		
  for (let i = 0; i < playerPositions.length; ++i)
  {
    const playerPosition = playerPositions[i];

    let forestArea = new Area(new AnnulusPlacer(30, 40, playerPosition).place(new NullConstraint()));

	  createAreasInAreas(
	  	new ChainPlacer(1, 3, treeCount, 0), 
	  	[
	  		new LayeredPainter([forestVariant.borderTerrains, forestVariant.interiorTerrains], [2]),
	  		new TileClassPainter(tileClass)
	  	], 
	  	constraint, 
	  	forestAmount, 
	  	400, 
	  	[forestArea]);
  }
}

