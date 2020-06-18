Engine.LoadLibrary("rmgen-common");

function getTeams() {
  const playerIDs = [];
  for (let i = 0; i < getNumPlayers(); ++i)
    playerIDs.push(i+1);

  return playerIDs.reduce((obj, playerID) => {
    const teamID = g_MapSettings.PlayerData[playerID].Team;

    if (!obj.hasOwnProperty(teamID))
      obj[teamID] = [];

    obj[teamID].push(playerID);

    return obj;
  }, {});
}

function placeOpposingTeams(radius, startingAngle = undefined, center = undefined) {
  let startAngle = startingAngle !== undefined ? startingAngle : randomAngle();
  center = center || g_Map.getCenter();

  const teams = getTeams();
  const teamIDs = shuffleArray(Object.keys(teams));

  if (teamIDs.length > 2) {
    warn('This map is optimized for 2 teams only');
  }

  let playerPositions = [];

  playerPositions = playerPositions.concat(
    placeTeam(teams[teamIDs[0]], -1, Vector2D.add(center, new Vector2D(radius - (teamIDs[0].length - 2) * 8, 0).rotate(-startAngle).round()), startAngle)
  );
  playerPositions = playerPositions.concat(
    placeTeam(teams[teamIDs[1]], 1, Vector2D.add(center, new Vector2D(radius - (teamIDs[1].length - 2) * 8, 0).rotate(-startAngle + Math.PI).round()), startAngle)
  );

  return [teams[teamIDs[0]].concat(teams[teamIDs[1]]), playerPositions];
}

function placeTeam(team, orientation, pos, mapAngle) {
  const teamSize = team.length;

  if (teamSize === 1) {
    return [pos];
  }

  const startAngle = Math.min(teamSize - 2, 1) * Math.PI / Math.pow(2, teamSize - 2);

  return distributePointsOnCircle(
    teamSize,
    orientation * startAngle + mapAngle - Math.PI/2,
    22 + teamSize * 6,
    pos
  )[0];
}
