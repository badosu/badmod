const foodValues = {
  'gaia/fauna_wildebeest': 150, // m random savanna
  'gaia/fauna_zebra': 150,      // m random savanna
  'gaia/fauna_giraffe': 350,    // m random savanna
  'gaia/fauna_elephant_african_bush': 800, // m random savanna
  'gaia/fauna_gazelle': 100,    // s savanna, s desert
  'gaia/fauna_camel': 200,      // m desert
  'gaia/fauna_peacock': 50,     // m tropical
  'gaia/fauna_goat': 70,       // m alpine
  'gaia/fauna_deer': 100,       // m alpine, m autumn, m mediterranean, m temperate
  'gaia/fauna_sheep': 100,      // s alpine, s mediterranean, s temperate
  'gaia/fauna_rabbit': 50,      // s autumn
  'gaia/fauna_muskox': 200,     // m snowy
  'gaia/fauna_walrus': 300,     // s snowy
  'gaia/fauna_tiger': 0,        // s tropic
  'gaia/fruit/berry_': 200,     // all regular biomes
};

function getFoodValue(template) {
  let foodValue = foodValues[template];
  dWarn('get: ' + template);

  if (foodValue)
    return foodValue;

  for (let foodtemp in foodValues)
    if (template.startsWith(foodtemp))
      return foodValues[foodtemp];

  dWarn('miss: ' + template);

  return null;
}
