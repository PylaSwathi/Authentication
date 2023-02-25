const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let app = express();
app.use(express.json());
let dataBase = null;

let initializeDbAndServer = async () => {
  try {
    dataBase = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    console.log(dataBase);
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register/", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    let selectUserQuery = `select * from user where username = '${username}';`;
    if (selectUserQuery === undefined) {
      let hashedPassword = bcrypt.hash(password, 10);
      let createUserQuery = `insert into user 
        values('${username}','${name}','${hashedPassword}','${gender}','${location}';)`;
      let dbResponse = await dataBase.run(createUserQuery);
      response.status(200);
      response.send("user created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

app.post("/login/", async (request, response) => {
  let { username, password } = request.body;
  let userExistOrNotQuery = `select * from user where username = '${username}'`;
  let userExistOrNotResponse = await dataBase.get(userExistOrNotQuery);
  if (userExistOrNotResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPasswordCorrect = await bcrypt.compare(
      password,
      userExistOrNotResponse.password
    );
    if (isPasswordCorrect === true) {
      response.send("Login successful");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});



app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let user = dataBase.get(`select * from user where username = '${username}'`);
  let verify = bcrypt.compare(oldPassword, user.password);
  if (verify !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let query = `update user set password = '${bcrypt.hash(
        newPassword,
        10
      )}' where username = '${username}'`;
      await dataBase.run(query);
      response.send("Password updated");
    }
  }
});

module.exports = app;
