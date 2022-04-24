const Express = require("express");

const {
  getLoggerMiddleware,
  getLogReqMiddleware,
  getErrorHandlerMiddleware,
} = require("../src");

const app = new Express();

app.use(getLoggerMiddleware());

app.get("/", (req, res, next) => {
  req.logger.info({
    "message": "From Route"
  });
  req.addCustomLogCtx({
    "custom": "data"
  });

  res.status(200).send({"status": "done"});
  next();
});

app.use(getLogReqMiddleware());

app.use(getErrorHandlerMiddleware());

app.listen(8080);
