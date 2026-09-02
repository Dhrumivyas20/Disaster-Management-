import express, { type Express } from "express";
import cors from "cors";
import type { IncomingMessage, ServerResponse } from "node:http";

import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
(req: IncomingMessage, res: ServerResponse, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
}
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;