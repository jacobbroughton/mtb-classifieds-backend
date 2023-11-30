const router = require("express").Router();
const { promisePool } = require("../config/database");
const isAuth = require("../lib/auth").isAuth;

router.get("/all", async (req, res) => {
  const sql = `CALL LocalBikeMarket.SP_GET_BIKES()`;

  const [results] = await promisePool.query(sql);

  res.json({
    success: true,
    bikes: results[0],
    message: "Successfully fetched bikes",
  });
});

router.get("/:bikeID", async (req, res) => {
  let sql = `CALL LocalBikeMarket.SP_GET_BIKE (?);`;
  let values = [req.params.bikeID];

  const [bikeResults] = await promisePool.query(sql, values);

  res.json({
    success: true,
    bike: {
      info: bikeResults[0][0],
      photos: bikeResults[1],
    },
    message: `Successfully fetched bike ${req.params.bikeID}`,
  });
});

module.exports = router;
