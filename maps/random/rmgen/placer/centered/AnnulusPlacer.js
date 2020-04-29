function AnnulusPlacer(minRadius, maxRadius, centerPosition = undefined)
{
  this.minRadiusSquared = Math.square(minRadius);
  this.maxRadiusSquared = Math.square(maxRadius);
  this.maxRadius = maxRadius;
  this.centerPosition = undefined;

  if (centerPosition)
    this.setCenterPosition(centerPosition);
}

AnnulusPlacer.prototype.setCenterPosition = function(position)
{
  this.centerPosition = deepfreeze(position.clone().round());
};

AnnulusPlacer.prototype.place = function(constraint = new NullConstraint())
{
  let points = [];

  const xMin = Math.floor(Math.max(0, this.centerPosition.x - this.maxRadius));
  const yMin = Math.floor(Math.max(0, this.centerPosition.y - this.maxRadius));
  const xMax = Math.ceil(Math.min(g_Map.getSize() - 1, this.centerPosition.x + this.maxRadius));
  const yMax = Math.ceil(Math.min(g_Map.getSize() - 1, this.centerPosition.y + this.maxRadius));

  let it = new Vector2D();
  for (it.x = xMin; it.x <= xMax; ++it.x)
    for (it.y = yMin; it.y <= yMax; ++it.y)
    {
      const distance = this.centerPosition.distanceToSquared(it);

      if (this.minRadiusSquared <= distance && this.maxRadiusSquared >= distance && constraint.allows(it))
        points.push(it.clone());
    }

  warn('AAA ' + points.length);
  return points;
};
