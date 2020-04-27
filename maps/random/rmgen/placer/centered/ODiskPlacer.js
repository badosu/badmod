/**
 * Returns all points on a disk at the given location that meet the constraint.
 */
function ODiskPlacer(radius, centerPosition = undefined)
{
	this.radiusSquared = Math.square(radius);
	this.radius = radius;
	this.centerPosition = undefined;

	if (centerPosition)
		this.setCenterPosition(centerPosition);
}

ODiskPlacer.prototype.setCenterPosition = function(position)
{
	this.centerPosition = deepfreeze(position.clone().round());
};

ODiskPlacer.prototype.place = function(constraint)
{
	let points = [];

	const xMin = this.centerPosition.x - this.radius;
	const xMax = this.centerPosition.x + this.radius;
	const yMin = this.centerPosition.y - this.radius;
	const yMax = this.centerPosition.y + this.radius;

	let point = new Vector2D();
	for (let x = xMin; x <= xMax; ++x)
		for (let y = yMin; y <= yMax; ++y)
		{
			point.set(x, y);

			if (g_Map.validTile(point) && this.centerPosition.distanceToSquared(point) <= this.radiusSquared && constraint.allows(point))
				points.push(point.clone());
		}

	return points;
};
