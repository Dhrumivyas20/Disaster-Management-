import { Router, type IRouter } from "express";
import pixelalchemyRouter from "./pixelalchemy";

const router: IRouter = Router();

router.use(pixelalchemyRouter);

export default router;
