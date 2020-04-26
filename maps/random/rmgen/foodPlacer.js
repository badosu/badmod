const debugFood = true

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

function placeFood(type, min, max, foodAmount, playerPosition, constraints, minTileBound = 23, maxTileBound = 30) {
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

function placePlayerBasesCustom(playerBaseArgs, clPlayer, clPlayers)
{
  g_Map.log("Creating playerbases");

  let [playerIDs, playerPosition] = playerBaseArgs.PlayerPlacement;

  for (let i = 0; i < clPlayers.length; ++i)
  {
    playerBaseArgs.playerID = playerIDs[i];
    playerBaseArgs.playerPosition = playerPosition[i];
    playerBaseArgs.CityPatch.painters = [new TileClassPainter(clPlayer), new TileClassPainter(clPlayers[i])];
    placePlayerBase(playerBaseArgs);
  }
}

function arcVariation(angle, percent, canOffset = true) {
  const isMediumOrLarger = g_Map.getSize() > 192;
  const variation = 2 * Math.PI * percent / 100;
  var offset = -Math.PI;

  if (canOffset && numPlayers > 2 && isMediumOrLarger && randBool()) {
    offset = 0;
  }

  return offset + randFloat(angle - variation, angle + variation);
}

function arcPlacing(playerIndex, object, tileClass, constraints, radius, radiusVariation, angleVariation, retries = 30, canOffset = true) {
  const placeFunc = function() {
    const playerPosition = playerPositions[playerIndex];
    const angle = playerAngles[playerIndex];

    const calculatedRadius = randIntInclusive(radius - radiusVariation, radius + radiusVariation);
    const calculatedAngle = arcVariation(angle, angleVariation, canOffset);

    const position = Vector2D.add(playerPosition, new Vector2D(calculatedRadius, 0).rotate(-calculatedAngle)).round();

    const group = new SimpleGroup([object], true, tileClass, position);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, retries, 1, true);
}

function placeFoodTemperate(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
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

function placeFoodAutumn(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
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

function placeFoodDesert(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
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

function placeFoodTropic(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
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

function placeFoodSnowy(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randIntInclusive(0, 15) * 2; // make initial amount even cause fauna
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

function placeFoodSavanna(playerPlacements, constraints, stragglerConstraints) {
  if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
    placeFoodEles(playerPlacements, constraints, stragglerConstraints);

    return;
  }
  else if (oMainHuntableAnimal == 'gaia/fauna_giraffe') {
    placeFoodGiraffes(playerPlacements, constraints, stragglerConstraints);

    return;
  }

  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randIntInclusive(10, 30);
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

function placeFoodEles(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = randIntInclusive(17, 50);

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

function placeFoodGiraffes(playerPlacements, constraints, stragglerConstraints) {
  const [playerIDs, playerPositions] = playerPlacements;

  let initialFoodAmount = 7 * randIntInclusive(2, 6);

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
