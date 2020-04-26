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

AnnulusPlacer.prototype.place = function(constraint)
{
  let points = [];

  const minX = this.centerPosition.x - this.maxRadius;
  const maxX = this.centerPosition.x + this.maxRadius;
  const minY = this.centerPosition.y - this.maxRadius;
  const maxY = this.centerPosition.y + this.maxRadius;

  for (let x = minX; x <= maxX; ++x)
    for (let y = minY; y <= maxY; ++y)
    {
      const point = new Vector2D(x, y);
      const distance = this.centerPosition.distanceToSquared(point);
      if (this.minRadiusSquared <= distance && this.maxRadiusSquared >= distance && constraint.allows(point))
        points.push(point);
    }

  return points;
};

