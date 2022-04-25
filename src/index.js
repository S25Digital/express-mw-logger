const pino = require("pino");

let logger;

const {
  createLoggerMiddleware,
  createLogReqMiddleware,
  createErrorHandlerMiddleware,
} = require("./middleware");

function getOpts(config) {
  const opts = {};
  opts.name = config.name || "mw-logger";
  opts.recordIp = config.recordIp || false;
  opts.recordHeaders = config.recordHeaders || false;

  return {
    loggerOpts: {
      name: opts.name,
    },
    mwOpts: {
      recordIp: opts.recordIp,
      recordHeaders: opts.recordHeaders,
    },
  };
}

function getMw(config = {}) {
  const { loggerOpts, mwOpts } = getOpts(config);
  logger = pino(loggerOpts);

  return createLoggerMiddleware(logger, mwOpts);
}

module.exports = {
  Logger: logger || pino(),
  getLoggerMiddleware: getMw,
  getLogReqMiddleware: createLogReqMiddleware,
  getErrorHandlerMiddleware: createErrorHandlerMiddleware,
};
