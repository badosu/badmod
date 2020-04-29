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

function nearPlacing(object, tileClass, constraints, position, variance) {
  const placeFunc = function() {
    const tryPosition = Vector2D.add(position, new Vector2D(randIntInclusive(-variance, variance), randIntInclusive(-variance, variance))).round();
    const group = new SimpleGroup([object], true, tileClass, tryPosition);

    return group.place(0, new AndConstraint(constraints));
  };

  retryPlacing(placeFunc, 500, 1, true);
}
