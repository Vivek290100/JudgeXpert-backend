// src/scripts/addProblems.ts
import ProblemService from "../services/ProblemService"; 
import { Dependencies } from "../utils/dependencies"; 
import connectDB from "../database/connectDb";

async function main(): Promise<void> {
  try {

    await connectDB();

    const problemRepository = Dependencies.problemRepository;
    const problemService = new ProblemService(problemRepository);

    await problemService.processAllProblems();
    console.log("All problems have been added to the database successfully!");
  } catch (error) {
    console.error("Error adding problems to the database:", error);
    process.exit(1);
  }
}

main();