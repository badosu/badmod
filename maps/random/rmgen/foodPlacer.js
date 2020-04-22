const debugFood = true;

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

function placeFoodBiome(biome, clPlayers, constraints, stragglerConstraints) {
  placeFoodBiomes[biome](clPlayers, constraints, stragglerConstraints)
}

function placeFood(type, min, max, foodAmount, playerClass, constraints, minTileBound = 17, maxTileBound = 25) {
  max = max < (foodAmount / 100.0) ? max : Math.floor(foodAmount / 100.0);

  let amountPlaced = randIntInclusive(min, max);

  if (type != oFruitBush) {
    minTileBound += 8;
    maxTileBound += 8;
  }

  let group = new SimpleGroup([new SimpleObject(type, amountPlaced, amountPlaced, 0, 4)], true, clFood);

  createObjectGroups(group, 0,
    new AndConstraint([
      new BorderTileClassConstraint(playerClass, 0, maxTileBound),
      avoidClasses(playerClass, minTileBound),
      constraints,
    ]),
    1, 400
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

function placeFoodTemperate(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)
        const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 1000) {
        const placedAmount = placeFood(oMainHuntableAnimal, 5, 5, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.75)) {
          const placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 8, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodAutumn(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 50.0)
        const placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oMainHuntableAnimal, 5, 5, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.75)) {
          const placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 5, 8, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodDesert(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)
        const placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 1000) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 7, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.75)) {
          const placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 5, 8, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodTropic(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = randBool(0.75) ? randIntInclusive(0, 15) : randIntInclusive(16, 30);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 350) {
        const foodQty = Math.floor(remainingFood / 50.0)
        const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oFruitBush, 4, 4, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        if (randBool(0.7)) {
          const placedAmount = placeFood(oFruitBush, 5, 6, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 10, 12, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodSnowy(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = randIntInclusive(0, 15) * 2; // make initial amount even cause fauna
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 200.0)
        const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 2, 2, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.65)) {
          const placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 4, 5, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodSavanna(clPlayers, constraints, stragglerConstraints) {
  if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
    placeFoodEles(clPlayers, constraints, stragglerConstraints);

    return;
  }
  else if (oMainHuntableAnimal == 'gaia/fauna_giraffe') {
    placeFoodGiraffes(clPlayers, constraints, stragglerConstraints);

    return;
  }

  let initialFoodAmount = randIntInclusive(10, 30);
  initialFoodAmount *= 100;

  if (initialFoodAmount <= 600 && randBool(0.5)) {
    return;
  }

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)
        const placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 5, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.5)) {
          const placedAmount = placeFood(oFruitBush, 6, 6, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const foodQty = randIntInclusive(1, 3) * 2;
          const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodEles(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = randIntInclusive(17, 50);

  initialFoodAmount *= 100;

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 400) {
        const foodQty = Math.floor(remainingFood / 100.0)
        const placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 800) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 5, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.5)) {
          const placedAmount = placeFood(oFruitBush, 5, 7, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const placedAmount = placeFood(oMainHuntableAnimal, 1, 1, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}

function placeFoodGiraffes(clPlayers, constraints, stragglerConstraints) {
  let initialFoodAmount = 7 * randIntInclusive(2, 6);

  initialFoodAmount *= 100;

  for (let i = 0; i < clPlayers.length; ++i)
  {
    let playerClass = clPlayers[i];
    let remainingFood = initialFoodAmount;

    dWarn("Assigning " + remainingFood + " food for player " + i);
    while (remainingFood > 0) {
      if (remainingFood <= 500) {
        const foodQty = Math.floor(remainingFood / 100.0)
        const placedAmount = placeFood(oSecondaryHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, stragglerConstraints, 0, 2);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else if (remainingFood <= 1400) {
        const placedAmount = placeFood(oSecondaryHuntableAnimal, 5, 6, remainingFood, playerClass, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + i + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
      else {
        if (randBool(0.5)) {
          const placedAmount = placeFood(oFruitBush, 5, 7, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oFruitBush + ": " + placedAmount);
        }
        else {
          const foodQty = randIntInclusive(1, 2) * 2;
          const placedAmount = placeFood(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerClass, constraints);
          remainingFood -= placedAmount;
          dWarn("Player " + i + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
        }
      }
      dWarn("Remaining " + remainingFood);
    }
  }
}
