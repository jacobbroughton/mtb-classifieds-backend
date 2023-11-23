const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { promisePool } = require("../config/database");
const isAuth = require("../lib/auth").isAuth;

const storage = multer.diskStorage({
  destination: "bike_photos/", // upload dir
  filename: (req, file, cb) => {
    const now = new Date();
    const timestamp = now.getTime();

    cb(null, `${timestamp}_${file.originalname}`); // use original file name
  },
});

const upload = multer({ storage }).array("photos", 2);

router.post("/", isAuth, upload, async (req, res) => {
  try {
    const {
      condition,
      frameSize,
      frontTravel,
      location,
      price,
      category,
      make,
      model,
      modifications,
      rearTravel,
      shipping,
      trades,
      wheelSize,
      year,
      negotiableStatus,
    } = JSON.parse(req.body.bikeInfo);

    let sql = `CALL LocalBikeMarket.SP_ADD_BIKE (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    let values = [
      year,
      make,
      model,
      price,
      category,
      condition,
      frameSize,
      wheelSize,
      frontTravel,
      rearTravel,
      modifications,
      shipping,
      trades,
      "Available",
      location,
      req.user.ID,
      negotiableStatus,
    ];

    const [addBikeResults] = await promisePool.query(sql, values);
    const insertedBikeId = addBikeResults[0][0].INSERTED_ID;

    let promises = [];

    req.files.forEach((file) => {
      const photoSql = `
        CALL LocalBikeMarket.SP_ADD_BIKE_PHOTO
        (?, ?, ?);
        `;
      const photoValues = [
        insertedBikeId,
        file.destination + "/" + file.filename,
        req.user.ID,
      ];
      promises.push(promisePool.query(photoSql, photoValues));
    });

    const promiseAllResults = await Promise.all(promises);

    const photos = promiseAllResults.map(result => result[0][0][0]) // why does each result need to be drilled down?

    res.json({ success: true, listedBikeID: insertedBikeId, body: req.body, files: req.files, photos });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
