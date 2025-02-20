import { Request, Response, NextFunction } from "express";

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(
    `${colors.cyan}${colors.bold}[REQUEST]${colors.reset} ${colors.magenta}${req.method}${colors.reset} ${colors.white}${req.originalUrl}${colors.reset}`
  );
  const oldJson = res.json;

  res.json = function (data) {
    const statusColor = res.statusCode >= 400 ? colors.red : colors.yellow;

    console.log(
      `${colors.green}${colors.bold}[RESPONSE]${colors.reset} ${colors.white}Status:${colors.reset} ${statusColor}${res.statusCode}${colors.reset} ${colors.white}Message:${colors.reset} ${colors.green}${data.message}${colors.reset}`
    );

    return oldJson.call(this, data);
  };

  next();
};