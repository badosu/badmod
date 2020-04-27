Engine.LoadLibrary("rmbiome");

const debugFood = true

function placeBalancedMinerals(playerPositions, constraints = new NullConstraint()) {
  for (let i = 0; i < playerPositions.length; ++i)
  {
    const playerPosition = playerPositions[i];

    let surroundingArea = new Area(new AnnulusPlacer(40, 44, playerPosition).place(new NullConstraint()));

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
      new AndConstraint([avoidClasses(clForest, 10, clHill, 2), constraints]),
      1, 400, [surroundingArea]
    );

    createObjectGroupsByAreas(metal, 0,
      new AndConstraint([avoidClasses(clForest, 10, clHill, 2, clRock, 6), constraints]),
      1, 400, [surroundingArea]
    );
  }
}

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

// TODO: Remove after fine tuning
function dWarn(message) {
  if (debugFood) {
    warn(message);
  }
}

let placeFoodBiomes = {
  'generic/alpine': placeFoodTemperate,
  'generic/autumn': placeFoodAutumn,
  'generic/desert': placeFoodDesert,
  'generic/mediterranean': placeFoodTemperate,
  'generic/savanna': placeFoodSavanna,
  'generic/snowy': placeFoodSnowy,
  'generic/temperate': placeFoodTemperate,
  'generic/tropic': placeFoodTropic
}

const foodValues = {
  'gaia/fauna_wildebeest': 150, // m random savanna
  'gaia/fauna_zebra': 150,      // m random savanna
  'gaia/fauna_giraffe': 350,    // m random savanna
  'gaia/fauna_elephant_african_bush': 800, // m random savanna
  'gaia/fauna_gazelle': 100,    // s savanna, s desert
  'gaia/fauna_camel': 200,      // m desert
  'gaia/fauna_peacock': 50,     // m tropical
  'gaia/fauna_goat': 100,       // m alpine
  'gaia/fauna_deer': 100,       // m alpine, m autumn, m mediterranean, m temperate
  'gaia/fauna_sheep': 100,      // s alpine, s mediterranean, s temperate
  'gaia/fauna_rabbit': 50,      // s autumn
  'gaia/fauna_muskox': 200,     // m snowy
  'gaia/fauna_walrus': 300,     // s snowy
  'gaia/fauna_tiger': 0,        // s tropic
  'gaia/flora_bush_berry': 100,
  'gaia/flora_bush_berry_desert': 100,
};

function placeFood(type, min, max, foodAmount, playerPosition, constraints, minTileBound = 17, maxTileBound = 25) {
  max = max < (foodAmount / foodValues[type]) ? max : Math.floor(foodAmount / foodValues[type]);

  let amountPlaced = randIntInclusive(min, max);

  if (type != oFruitBush) {
    minTileBound += 8;
    maxTileBound += 8;
  }

  let points = new AnnulusPlacer(minTileBound, maxTileBound, playerPosition).place(new NullConstraint());

  let group = new SimpleGroup(
    [new SimpleObject(type, amountPlaced, amountPlaced, 0, 4)],
    true,
    clFood
  );

  createObjectGroupsByAreas(group, 0,
    new AndConstraint([constraints]),
    1, 400, [new Area(points)]
  );

  return amountPlaced * foodValues[type];
}

function nearPlacing(object, tileClass, constraints, position, variance) {
  const placeFunc = function() {
    const tryPosition = Vector2D.add(position, new Vector2D(randIntInclusive(-variance, variance), randIntInclusive(-variance, variance))).round();
    const group = new SimpleGroup([object], true, tileClass, tryPosition);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, 500, 1, true);
}

function placeBalancedFood(playerPlacements, constraints, stragglerConstraints, multiplier = 1) {
  const biome = currentBiome() || 'generic/temperate';
  dWarn('Placing food for biome: ' + biome);
  placeFoodBiomes[biome](playerPlacements, constraints, stragglerConstraints, multiplier);
}

function placeFoodTemperate(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let remainingFood = initialFoodAmount;
    let playerPosition = playerPositions[i];
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)

        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }

        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 1000) {
        const placedAmount = placeFood(oMainHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.75)) {
          let placedAmount = 0;
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 8, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodAutumn(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let remainingFood = initialFoodAmount;
    let playerPosition = playerPositions[i];
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 50.0)
        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }

        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oMainHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.75)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 5, 8, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodDesert(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let playerPosition = playerPositions[i];
    let remainingFood = initialFoodAmount;
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)

        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }

        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 1000) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 7, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.75)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 5, 8, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodTropic(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let playerPosition = playerPositions[i];
    let remainingFood = initialFoodAmount;
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 350) {
        const foodQty = Math.floor(remainingFood / 50.0)
 
        let placedAmount = 0
        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }
        remainingFood -= placedAmount;

        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        let placedAmount = 0
        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oFruitBush, 4, 4, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeFood(oFruitBush, 4, 4, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;

        dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.7)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 10, 12, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodSnowy(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randIntInclusive(0, 30);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  if (initialFoodAmount % 2 == 1) initialFoodAmount++;// make initial amount even cause fauna
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let playerPosition = playerPositions[i];
    let remainingFood = initialFoodAmount;
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 200.0)
        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 2, 2, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.65)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 4, 5, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodSavanna(playerPlacements, constraints, stragglerConstraints, multiplier) {
  if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
    placeFoodEles(playerPlacements, constraints, stragglerConstraints, multiplier);

    return;
  }
  else if (oMainHuntableAnimal == 'gaia/fauna_giraffe') {
    placeFoodGiraffes(playerPlacements, constraints, stragglerConstraints, multiplier);

    return;
  }

  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randIntInclusive(10, 30);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let playerPosition = playerPositions[i];
    let remainingFood = initialFoodAmount;
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)
        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.5)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const foodQty = randIntInclusive(2, 3) * 2;
          const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodEles(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randIntInclusive(17, 50);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let playerPosition = playerPositions[i];
    let remainingFood = initialFoodAmount;
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)
        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.5)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 5, 7, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 5, 7, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 1, 1, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodGiraffes(playerPlacements, constraints, stragglerConstraints, multiplier) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = 7 * randIntInclusive(2, 6);
  initialFoodAmount = Math.floor(multiplier * initialFoodAmount);
  initialFoodAmount *= 100;

  for (let i = 0; i < playerPositions.length; ++i)
  {
    let playerPosition = playerPositions[i];
    let remainingFood = initialFoodAmount;
    let remainingBerries = 3;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 500) {
        const foodQty = Math.floor(remainingFood / 100.0)
        let placedAmount = 0;

        if (getCivCode(playerIDs[i]) == 'iber') {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints, 19, 22);
        } else {
          placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, stragglerConstraints, 7, 10);
        }
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 1400) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 6, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (remainingBerries > 0 && randBool(0.5)) {
          let placedAmount = 0
          if (getCivCode(playerIDs[i]) == 'iber') {
            placedAmount = placeFood(oFruitBush, 5, 7, remainingFood, playerPosition, constraints, 27, 30);
          } else {
            placedAmount = placeFood(oFruitBush, 5, 7, remainingFood, playerPosition, constraints);
          }
          remainingFood -= placedAmount;
          remainingBerries -= 1;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const foodQty = 4; // must be fixed at the moment
          const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}
function createBadFood(constraints) {
  let huntGenDistance = 50;

  if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
    huntGenDistance = 80;
  }

  // Separate for eles generation being farther
  createFood(
    [ [new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)] ],
    [ 2 * numPlayers ],
    new AndConstraint([avoidClasses(clPlayer, huntGenDistance), constraints]),
    clFood);

  createFood(
    [ [new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)] ],
    [ 2 * numPlayers ],
    new AndConstraint([avoidClasses(clPlayer, huntGenDistance), constraints]),
    clFood);
}
