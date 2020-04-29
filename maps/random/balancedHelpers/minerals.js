function placeBalancedMinerals(playerPositions, constraints = new NullConstraint()) {
  for (let i = 0; i < playerPositions.length; ++i)
  {
    const playerPosition = playerPositions[i];

    let placer = new AnnulusPlacer(40, 44, playerPosition).place(
      new AndConstraint([avoidClasses(clForest, 10, clHill, 2, clFood, 4, clPlayer, 34), constraints])
    );
    let surroundingArea = new Area(placer);

    let stone = new SimpleGroup(
      [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)],
      true,
      clRock
    );

    let metal = new SimpleGroup(
      [new SimpleObject(oMetalLarge, 1, 1, 0, 4)],
      true,
      clRock
    );

    createObjectGroupsByAreas(stone, 0,
      new NullConstraint(),
      1, 400, [surroundingArea]
    );

    createObjectGroupsByAreas(metal, 0,
      avoidClasses(clRock, 6),
      1, 400, [surroundingArea]
    );
  }
}
