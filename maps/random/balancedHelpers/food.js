Engine.LoadLibrary("rmbiome");

const debugFood = false;

function dWarn(message) {
  if (debugFood) {
    warn(message);
  }
}

const temperateInitialFood = () => randBool(0.05) ? randIntInclusive(23, 30) : randIntInclusive(0, 22);

const balancedFoodConfig = {
  'generic/alpine': {
    placer: placeFoodTemperate,
    initialFood: temperateInitialFood,
  },
  'generic/mediterranean': {
    placer: placeFoodTemperate,
    initialFood: temperateInitialFood,
  },
  'generic/temperate': {
    placer: placeFoodTemperate,
    initialFood: temperateInitialFood,
  },
  'generic/autumn': {
    placer: placeFoodAutumn,
    initialFood: temperateInitialFood,
  },
  'generic/tropic': {
    placer: placeFoodTropic,
    initialFood: temperateInitialFood,
  },
  'generic/desert': {
    placer: placeFoodDesert,
    initialFood: () => randIntInclusive(4, 30),
  },
  'generic/snowy': {
    placer: placeFoodSnowy,
    initialFood: () => randIntInclusive(3, 30),
    evenInitialFood: true,
  },
  'generic/savanna': {
    placer: function() {
      if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
        placeFoodEles.apply(null, arguments);
      } else if (oMainHuntableAnimal == 'gaia/fauna_giraffe') {
        placeFoodGiraffes.apply(null, arguments);
      } else {
        placeFoodSavanna.apply(null, arguments);
      }
    },
    initialFood: function() {
      if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
        return randIntInclusive(17, 50);
      } else if (oMainHuntableAnimal == 'gaia/fauna_giraffe') {
        return 7 * randIntInclusive(2, 6);
      } else {
        return randIntInclusive(10, 30);
      }
    },
  },
};

function placeInitialFoodAmount(type, min, max, foodAmount, playerPosition, constraints, minTileBound = 24, maxTileBound = 29) {
  max = max < (foodAmount / foodValues[type]) ? max : Math.floor(foodAmount / foodValues[type]);

  if (type != oFruitBush) {
    minTileBound += 8;
    maxTileBound += 8;
  }

  return placeFoodAmount(type, min, max, playerPosition, constraints, minTileBound, maxTileBound) * foodValues[type];
}

function placeFoodAmount(type, min, max, position, constraints, minTileBound = 17, maxTileBound = 25) {
  const amountPlaced = randIntInclusive(min, max);
  const group = new SimpleGroup(
    [new SimpleObject(type, amountPlaced, amountPlaced, 0, 4)],
    true,
    clFood
  );

  createObjectGroupsByAreas(group, 0,
    constraints,
    1, 400, [getAnnulusArea(minTileBound, maxTileBound, position)]
  );

  return amountPlaced;
}

function placeStragglerFauna(type, foodAmount, playerId, playerPosition, constraints) {
  const foodQty = Math.floor(foodAmount / foodValues[type]);

  const [minTile, maxTile] = getCivCode(playerId) == 'iber' ? [25, 27] : [12, 16];
  const placedAmount = placeInitialFoodAmount(type, foodQty, foodQty, foodAmount, playerPosition, constraints, minTile, maxTile);

  dWarn("Player " + playerId + " - placed " + type + ": " + placedAmount);

  return placedAmount;
}

function placeBalancedFood(playerPlacements, constraints, multiplier = 1) {
  const biome = currentBiome() || 'generic/temperate';
  const biomeConfig = balancedFoodConfig[biome];

  dWarn('Placing food for biome: ' + biome);

  const [playerIDs, playerPositions] = playerPlacements;
  const foodPlacer = biomeConfig.placer;
  const foodAmount = getFoodAmount(multiplier, biomeConfig);

  for (let i = 0; i < playerPositions.length; ++i)
    foodPlacer(foodAmount, playerIDs[i], playerPositions[i], constraints);
}

function getFoodAmount(multiplier = 1, biomeConfig) {
  let initialFoodAmount = Math.floor(multiplier * biomeConfig.initialFood());

  if (biomeConfig['evenInitialFood']) {
    if (initialFoodAmount % 2 == 1) initialFoodAmount++;
  }

  return initialFoodAmount * 100;
}

function placeFoodTemperate(initialFoodAmount, playerId, playerPosition, constraints, maxBerries = 2) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = maxBerries;

  const playerCiv = getCivCode(playerId);

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 400) {
      remainingFood -= placeStragglerFauna(oMainHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 1000) {
      const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.75)) {
        let placedAmount = 0;

        if (playerCiv == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 6, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 6, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerCiv + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const placedAmount = placeInitialFoodAmount(oSecondaryHuntableAnimal, 5, 8, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerCiv + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + playerCiv + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodAutumn(initialFoodAmount, playerId, playerPosition, constraints, maxBerries = 2) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = maxBerries;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 400) {
      remainingFood -= placeStragglerFauna(oSecondaryHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 800) {
      const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.75)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 6, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 6, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 5, 8, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + playerId + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodDesert(initialFoodAmount, playerId, playerPosition, constraints, maxBerries = 2) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = maxBerries;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 400) {
      remainingFood -= placeStragglerFauna(oSecondaryHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 1000) {
      const placedAmount = placeInitialFoodAmount(oSecondaryHuntableAnimal, 5, 7, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.75)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 6, 6, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 6, 6, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 5, 8, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + playerId + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodTropic(initialFoodAmount, playerId, playerPosition, constraints, maxBerries = 2) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = maxBerries;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 350) {
      remainingFood -= placeStragglerFauna(oMainHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 800) {
      let placedAmount = 0
      if (getCivCode(playerId) == 'iber') {
        placedAmount = placeInitialFoodAmount(oFruitBush, 4, 4, remainingFood, playerPosition, constraints, 27, 30);
      } else {
        placedAmount = placeInitialFoodAmount(oFruitBush, 4, 4, remainingFood, playerPosition, constraints);
      }
      remainingFood -= placedAmount;

      dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.7)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 6, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 6, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 10, 12, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + playerId + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodSnowy(initialFoodAmount, playerId, playerPosition, constraints, maxBerries = 2) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = maxBerries;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 400) {
      remainingFood -= placeStragglerFauna(oMainHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 800) {
      const placedAmount = placeInitialFoodAmount(oSecondaryHuntableAnimal, 2, 2, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.65)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 6, 6, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 6, 6, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 4, 5, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + playerId + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodSavanna(initialFoodAmount, playerId, playerPosition, constraints) {
  if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
    placeFoodEles(initialFoodAmount, playerId, playerPosition, constraints);

    return;
  }
  else if (oMainHuntableAnimal == 'gaia/fauna_giraffe') {
    placeFoodGiraffes(initialFoodAmount, playerId, playerPosition);

    return;
  }

  let remainingFood = initialFoodAmount;
  let remainingBerries = 2;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 400) {
      remainingFood -= placeStragglerFauna(oSecondaryHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 800) {
      const placedAmount = placeInitialFoodAmount(oSecondaryHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.5)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 6, 6, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 6, 6, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const foodQty = randIntInclusive(2, 3) * 2;
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + i + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodEles(initialFoodAmount, playerId, playerPosition, constraints) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = 2;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 400) {
      remainingFood -= placeStragglerFauna(oSecondaryHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 800) {
      const placedAmount = placeInitialFoodAmount(oSecondaryHuntableAnimal, 5, 5, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.5)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 7, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 7, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, 1, 1, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0) {
    warn('Player ' + playerId + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
  }
}

function placeFoodGiraffes(initialFoodAmount, playerId, playerPosition, constraints) {
  let remainingFood = initialFoodAmount;
  let remainingBerries = 2;

  dWarn("Assigning " + remainingFood + " food for player " + playerId);
  while (remainingFood > 0) {
    if (remainingFood <= 500) {
      remainingFood -= placeStragglerFauna(oSecondaryHuntableAnimal, remainingFood, playerId, playerPosition, constraints);
    }
    else if (remainingFood <= 1400) {
      const placedAmount = placeInitialFoodAmount(oSecondaryHuntableAnimal, 5, 6, remainingFood, playerPosition, constraints);
      remainingFood -= placedAmount;
      dWarn("Player " + playerId + " - placed " + oSecondaryHuntableAnimal + ": " + placedAmount);
    }
    else {
      if (remainingBerries > 0 && randBool(0.5)) {
        let placedAmount = 0
        if (getCivCode(playerId) == 'iber') {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 7, remainingFood, playerPosition, constraints, 27, 30);
        } else {
          placedAmount = placeInitialFoodAmount(oFruitBush, 5, 7, remainingFood, playerPosition, constraints);
        }
        remainingFood -= placedAmount;
        remainingBerries -= 1;
        dWarn("Player " + playerId + " - placed " + oFruitBush + ": " + placedAmount);
      }
      else {
        const foodQty = 4; // must be fixed at the moment
        const placedAmount = placeInitialFoodAmount(oMainHuntableAnimal, foodQty, foodQty, remainingFood, playerPosition, constraints);
        remainingFood -= placedAmount;
        dWarn("Player " + playerId + " - placed " + oMainHuntableAnimal + ": " + placedAmount);
      }
    }
    dWarn("Remaining " + remainingFood);
  }

  if (remainingFood < 0)
    warn('Player ' + playerId + ' ended up with additional ' + Math.abs(remainingFood) + ' food');
}

function createBadFood(constraints) {
  // Separate for eles generation farther
  let huntGenDistance = oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush' ? 80 : 50;

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
