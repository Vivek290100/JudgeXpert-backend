import fs from "fs/promises";
import path from "path";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";

export class ProblemFolderService {
  constructor(
    private problemRepository: IProblemRepository,
      private problemsBasePath: string = path.join(__dirname, ".././problems")
  ) { }

  async checkForNewProblemFolders(): Promise<string[]> {
    try {
      const folders = await fs.readdir(this.problemsBasePath, { withFileTypes: true });
      const problemFolders = folders
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);


      const existingProblems = await this.problemRepository.find({});
      const existingSlugs = new Set(existingProblems.map((problem) => problem.slug));

      const newFolders = problemFolders.filter((folder) => !existingSlugs.has(folder));

      return newFolders;
    } catch (error) {
      console.error("Error checking problem folders:", error);
      return [];
    }
  }
}