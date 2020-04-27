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
  const minX = this.centerPosition.x - this.maxRadius;
  const maxX = this.centerPosition.x + this.maxRadius;
  const minY = this.centerPosition.y - this.maxRadius;
  const maxY = this.centerPosition.y + this.maxRadius;

  let points = [];
  let point = new Vector2D();
  for (let x = minX; x <= maxX; ++x)
    for (let y = minY; y <= maxY; ++y)
    {
      point.set(x, y);

      if (!g_Map.validTile(point)) { continue; }

      const distance = this.centerPosition.distanceToSquared(point);

      if (this.minRadiusSquared <= distance && this.maxRadiusSquared >= distance && constraint.allows(point))
        points.push(point.clone());
    }

  return points;
};

