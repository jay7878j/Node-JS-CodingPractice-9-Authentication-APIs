const express = require("express");
const { open } = require("sqlite");
const sqlite = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (error) {
    console.log(`DB error: ${error.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

// API 1 Register New User In Database in user table

app.post("/register/", async (request, response) => {
  const { name, gender, location, username, password } = request.body;

  // Query for username already exist or not
  const dbUserQuery = `SELECT * FROM user where username="${username}"`;
  const dbUser = await db.get(dbUserQuery);
  if (dbUser === undefined) {
    //   Password length check
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    }
    // If user not in database & provided sufficient password length
    else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createUserQuery = `
            INSERT INTO 
              user (name, gender, location, username, password)
            VALUES
              ("${name}","${gender}","${location}","${username}","${hashedPassword}")
            `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
  //   If username already exists
  else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2 User Login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  // Query for username already exist or not
  const dbUserQuery = `SELECT * FROM user where username="${username}"`;
  const dbUser = await db.get(dbUserQuery);

  if (dbUser !== undefined) {
    const passwordCheck = await bcrypt.compare(password, dbUser.password);

    // If the user provides correct password
    if (passwordCheck) {
      response.status(200);
      response.send("Login success!");
    }
    // If the user provides incorrect password
    else {
      response.status(400);
      response.send("Invalid password");
    }
  }
  //   If an Unregistered user tries to login
  else {
    response.status(400);
    response.send("Invalid user");
  }
});

// API 3 Update User Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  // Query for username already exist or not
  const dbUserQuery = `SELECT * FROM user where username="${username}"`;
  const dbUser = await db.get(dbUserQuery);

  if (dbUser !== undefined) {
    const passwordCheck = await bcrypt.compare(oldPassword, dbUser.password);

    // If the user provides correct password
    if (passwordCheck) {
      //  If the user provides new password with less than 5 characters
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      }
      //    If the user provides new password with at least 5 characters
      else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePaswdQuery = `
            UPDATE
                user
            SET
                password = "${hashedNewPassword}"    
            `;
        await db.run(updatePaswdQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
    // If the user provides incorrect current password
    else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
