let annulusAreas = {};

// Memoize areas
function getAnnulusArea(minTileBound, maxTileBound, position) {
  const key = [minTileBound, maxTileBound, position.x, position.y];

  if (key in annulusAreas) {
    return annulusAreas[key];
  } else {
    const area = new Area(new AnnulusPlacer(minTileBound, maxTileBound, position).place());
    annulusAreas[key] = area;
    return area;
  }
}

