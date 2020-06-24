Engine.LoadLibrary("rmgen-common");

function getTeams() {
  const playerIDs = [];
  for (let i = 0; i < getNumPlayers(); ++i)
    playerIDs.push(i + 1);

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
  const teamCount = teamIDs.length;

  if (teamCount === 1)
    warn('This map is optimized for at least 2 teams');

  const [teamPositions, teamAngles] = distributePointsOnCircle(teamIDs.length, startAngle, radius, center)

  let playerPositions = [];
  let ids = [];
  for (let i = 0; i < teamCount; i++) {
    const team = teams[teamIDs[i]];
    ids = ids.concat(team);
    playerPositions = playerPositions.concat(placeTeam(
      team,
      teamCount === 1 ? center : teamPositions[i],
      teamAngles[i]
    ));
  }

  return [ids, playerPositions];
}

// Places a team in a circle formation at a certain position
function placeTeam(team, pos, startAngle = 0) {
  const teamSize = team.length;
  if (teamSize === 1)
    return [pos];

  // Make uneven sizes point to center, and even to face center
  const orientationAngle = Math.min(teamSize - 2, 1) * Math.PI / Math.pow(2, teamSize - 2);

  return distributePointsOnCircle(
    teamSize,
    orientationAngle + startAngle + Math.PI/2,
    22 + teamSize * 6,
    pos
  )[0];
}
