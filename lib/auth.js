module.exports.isAuth = function (req, res, next) {
  if (!req.user) {
    res.status(401).json({
      message: "You are not authorized",
      user: req.user,
      session: req.session,
    });
    return;
  }
  next();
};

module.exports.isAdmin = function (req, res, next) {
  if (!req.isAuthenticated() && req.user.ADMIN) {
    res.status(401).json({ message: "You are not an admin" });
    return;
  }
  next();
};
