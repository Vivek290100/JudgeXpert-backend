// src/routes/ProblemRoutes.ts
import { Router } from "express";
import { Dependencies } from "../utils/dependencies";
import adminMiddleware from "../middlewares/adminMiddleware";

const problemRouter = Router();
const problemController = Dependencies.problemController;

problemRouter.get("/problems/:id", problemController.getProblemById.bind(problemController));
problemRouter.get("/problems/slug/:slug", problemController.getProblemBySlug.bind(problemController));
problemRouter.post("/problems", adminMiddleware, problemController.createProblem.bind(problemController));
problemRouter.get("/problems", adminMiddleware, problemController.getProblems.bind(problemController));
problemRouter.patch("/problems/:id/status", adminMiddleware, problemController.updateProblemStatus.bind(problemController)); // Add this route
problemRouter.post("/single", adminMiddleware, problemController.processSpecificProblem.bind(problemController));

export default problemRouter;