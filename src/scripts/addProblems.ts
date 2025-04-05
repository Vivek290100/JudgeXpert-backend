// import ProblemService from "../services/ProblemService"; 
// import { Dependencies } from "../utils/dependencies"; 
// import connectDB from "../database/connectDb";
// import { generateBoilerplateForProblem } from "./generateBoilerplate";

// async function main(problemDir: string): Promise<void> {
//   try {
//     await connectDB();

//     // Initialize the problem repository and service
//     const problemRepository = Dependencies.problemRepository;
//     const problemService = new ProblemService(problemRepository);

//     // Generate boilerplate for the specific problem
//     await generateBoilerplateForProblem(problemDir);
//     console.log(`Boilerplate generated for ${problemDir}`);

//     // Process and add the specific problem to the database
//     const problem = await problemService.processSpecificProblem(problemDir);
//     if (!problem) {
//       throw new Error(`Failed to process problem: ${problemDir}`);
//     }

//     console.log(`Problem "${problemDir}" has been added to the database successfully!`);
//   } catch (error) {
//     console.error("Error processing problem:", error);
//     process.exit(1);
//   }
// }

// // Execute the script with a problemDir provided
// const problemDir = process.argv[2]; // Example: node addProblems.ts "two-sum"
// if (!problemDir) {
//   console.error("Please provide a problem directory (slug) as an argument.");
//   process.exit(1);
// }

// main(problemDir);