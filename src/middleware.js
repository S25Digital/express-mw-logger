const { v4: uuid } = require("uuid");

const headersToObfuscate = [
  "authorization",
  "x-apigateway-context",
  "x-apigateway-event",
  "x-forwarded-for",
];

function getReqId(req) {
  return (
    req.header("x-request-id") ||
    req.header("x-amzn-RequestId") ||
    req.header("requestId") ||
    uuid()
  );
}

function wrapObj(reqId, data = {}) {
  if (Array.isArray(data) || typeof data !== "object") {
    return {
      message: "the data must be an object",
    };
  }
  return Object.assign({}, { reqId }, data);
}

function getLogger(logger, reqId) {
  const info = (obj) => logger.info(wrapObj(reqId, obj));
  const debug = (obj) => logger.debug(wrapObj(reqId, obj));
  const error = (obj) => logger.error(wrapObj(reqId, obj));

  return {
    info,
    debug,
    error,
  };
}

function logCompletion(logger, reqInfo, isError = false) {
  const endTime = new Date().toUTCString();
  const obj = {
    start: reqInfo.start,
    end: endTime,
    taken: new Date(endTime) - new Date(reqInfo.start),
    reqId: reqInfo.reqId,
    request: reqInfo.request,
    response: reqInfo.response,
    error: reqInfo.error || {},
    customCtx: reqInfo.customCtx,
  };

  isError === true ? logger.error(obj) : logger.info(obj);
}

function obfuscateHeaders(headers = {}) {
  const obfuscateObj = {};

  headersToObfuscate.forEach((key) => {
    if (headers[key]) obfuscateObj[key] = "OBFUSCATE";
  });

  return Object.assign({}, headers, obfuscateObj);
}

function getReqLog(req, mwOpts) {
  return {
    url: req.originalUrl,
    method: req.method,
    query: req.query || {},
    ip: mwOpts.recordIp === true ? req.ip : "Ip recording is not enabled",
    headers:
      mwOpts.recordHeaders === true
        ? obfuscateHeaders(req.headers)
        : "Header Recording is not enabled",
  };
}

function getResLog(res) {
  return {
    status: res.status,
    message: res.message,
  };
}

function addCustomLogCtx(req, obj) {
  if (Array.isArray(obj) || typeof obj !== "object") {
    req.reqInfo.customreq = {
      ...req.reqInfo.customCtx,
      message:
        "cannot append custom context from one of the calls as it is not an object",
    };
    return;
  }

  req.reqInfo.customCtx = {
    ...req.reqInfo.customCtx,
    ...obj,
  };
}

function createMiddleware(logger, mwOpts = {}) {
  return (req, res, next) => {
    const reqId = getReqId(req);
    const loggerObj = getLogger(logger, reqId);

    req.logger = loggerObj;
    req.reqInfo = {
      start: new Date().toUTCString(),
      reqId: reqId,
      request: getReqLog(req, mwOpts),
      customCtx: {},
    };
    req.addCustomLogCtx = (obj) => addCustomLogCtx(req, obj);
    next();
  };
}

function createLogReqMiddleware() {
  return (req, res, next) => {
    const logger = req.logger;

    if (!logger) {
      throw new error(
        "This middleware can only be used if Logger Middleare is attached to request first"
      );
    }

    logCompletion(logger, req.reqInfo);
    next();
  };
}

function createErrorHandlerMiddleware() {
  return (err, req, res, next) => {
    const logger = req.logger;
    const reqInfo = req.reqInfo;
    reqInfo.error = err;

    if (!logger) {
      throw new error(
        "This middleware can only be used if Logger Middleare is attached to request first"
      );
    }

    logCompletion(logger, req.reqInfo);
    res.status(500).send({
      error: "Something went wrong",
    });
  };
}

module.exports = {
  createLoggerMiddleware,
  createLogReqMiddleware,
  createErrorHandlerMiddleware,
};
