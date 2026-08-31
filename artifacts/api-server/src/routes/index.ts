import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pixelalchemyRouter from "./pixelalchemy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pixelalchemyRouter);

export default router;
