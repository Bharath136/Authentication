const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(8000, () => {
      console.log("Server Running at http://localhost:8000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
        SELECT 
            *
        FROM 
            user
        WHERE 
            username = '${username}'; 
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //create user
    const createUserQuery = `
            INSERT INTO 
                user(username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            )
        `;
    const a = await db.run(createUserQuery);
    console.log(password);
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.send("User created successfully");
    }
  } else {
    //user already exist
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
        SELECT * FROM user WHERE username = '${username}';
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatching = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatching === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
        SELECT * FROM user WHERE username = '${username}' AND password = '${oldPassword}';
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `
                UPDATE FROM user SET password = '${hashedPassword}'; 
            `;
      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  }
});
