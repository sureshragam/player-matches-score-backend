const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());
let db = null;

app.get("/", (request, response) => {
  response.send("im working");
});

// get /players/

app.get("/players", async (request, response) => {
  try {
    const playersListQuery = `
        SELECT * 
        FROM player_details
        ORDER BY player_id
        `;
    const playersList = await db.all(playersListQuery);
    let modifiedStatesList = [];
    for (let obj of playersList) {
      modifiedStatesList.push(convertSnakeCaseToCamelCase(obj));
    }

    response.send(modifiedStatesList);
  } catch (e) {
    console.log(e.message);
  }
});

// get /players/:playerId/ api

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  try {
    const playerDetailQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};
        `;
    const singlePlayerDetail = await db.get(playerDetailQuery);

    response.send(convertSnakeCaseToCamelCase(singlePlayerDetail));
  } catch (e) {
    console.log(e.message);
  }
});

// /players/:playerId/ api

app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const { playerName } = request.body;
    const playerDetailUpdateQuery = `
            UPDATE player_details
            SET 
                player_name = '${playerName}'
            WHERE player_id = ${playerId};
            `;
    await db.run(playerDetailUpdateQuery);
    response.send("Player Details Updated");
  } catch (e) {
    console.log(e.message);
  }
});

// get /matches/:matchId/

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  try {
    const playerDetailQuery = `
        SELECT match_id AS matchId,
        match,year
        FROM match_details
        WHERE match_id = ${matchId};
        `;
    const singlePlayerDetail = await db.get(playerDetailQuery);
    response.send(singlePlayerDetail);
  } catch (e) {
    console.log(e.message);
  }
});

// get /players/:playerId/matches

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  try {
    const singlePlayerMatchDetailsQuery = `
        SELECT match_details.match_id AS matchId,
        match,year
        FROM match_details
        NATURAL JOIN player_match_score
        WHERE player_id = ${playerId};
        `;
    const singlePlayerMatchDetailsResponse = await db.all(
      singlePlayerMatchDetailsQuery
    );

    response.send(singlePlayerMatchDetailsResponse);
  } catch (e) {
    console.log(e.message);
  }
});

// get /matches/:matchId/players

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  console.log(matchId);
  try {
    const singleMatchPlayerDetailsQuery = `
        SELECT player_details.player_id AS playerId,
        player_name AS playerName
        FROM player_details
        NATURAL JOIN player_match_score
        WHERE match_id = ${matchId};
        `;
    const singleMatchPlayerDetailsResponse = await db.all(
      singleMatchPlayerDetailsQuery
    );
    console.log(singleMatchPlayerDetailsResponse);

    response.send(singleMatchPlayerDetailsResponse);
  } catch (e) {
    console.log(e.message);
  }
});

// get /players/:playerId/playerScores

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  try {
    const singlePlayerScoreDetailsQuery = `
        SELECT player_details.player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
        FROM player_details
        left JOIN player_match_score 
        ON player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};
        `;
    const singlePlayerScoreDetailsResponse = await db.get(
      singlePlayerScoreDetailsQuery
    );

    response.send(singlePlayerScoreDetailsResponse);
  } catch (e) {
    console.log(e.message);
  }
});

// function for conversion
function convertSnakeCaseToCamelCase(object) {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
    jerseyNumber: object.jersey_number,
    role: object.role,
  };
}

// initialize Server And Connecting Database

const initializeServerAndConnectDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Starting at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializeServerAndConnectDatabase();

module.exports = app;
