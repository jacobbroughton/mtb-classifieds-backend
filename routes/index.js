const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const { promisePool } = require("../config/database");
const isAuth = require("../lib/auth").isAuth;
const isAdmin = require("../lib/auth").isAdmin;

router.get("/", isAuth, (req, res) => {
  res.send({ message: "You're logged in", user: req.user });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "login-failure",
  })
);

router.post("/register", async (req, res) => {
  try {
    let sql = `CALL LocalBikeMarket.SP_GET_USER(?)`;
    let values = [req.body.username];

    const [getUserResults] = await promisePool.query(sql, values);

    if (getUserResults[0].length) {
      res.send({
        code: 2,
        message: "User already exists",
        user: null,
      });
      res.statusMessage = "User already exists";
      res.status(409).end();
      return;
    }

    const saltHash = genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    sql = `
        INSERT INTO LocalBikeMarket.TBL_USER (
            USERNAME,
            HASH,
            SALT,
            CREATED_DTTM,
            MODIFIED_DTTM
        ) VALUES (
            ?,
            ?,
            ?,
            SYSDATE(), 
            null
        )
      `;
    values = [req.body.username, hash, salt];

    // Save the user to the database
    const [registerUserResults] = await promisePool.query(sql, values);
    console.log(registerUserResults);

    res.send({ message: "Successfully registered" });
  } catch (error) {
    console.log(error);
  }
});

router.get("/protected-route", isAuth, (req, res) => {
  res.send({ message: "You made it to the protected route", user: req.user });
});

router.get("/admin-route", isAdmin, (req, res) => {
  res.send({ message: "You made it to the admin route", user: req.user });
});

// Removes req.session.passport.user property from session
router.get("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      res.statusMessage = "There was an error logging out";
      res.status(409).end();
      return;
    }
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.send({ message: "Logged out successfully" });
  });
});

module.exports = router;
