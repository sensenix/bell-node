const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
      "/api/v1/expand",
      [authJwt.verifyToken],
      controller.expand
  );

  app.post(
      "/api/v1/getContent",
      [authJwt.verifyToken],
      controller.getContent
  );

  app.get("/api/v1/all", controller.allAccess);

};
