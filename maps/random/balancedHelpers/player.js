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
