import fs from "fs/promises";
import path from "path";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";

export class ProblemFolderService {
  constructor(
    private _problemRepository: IProblemRepository,
      private _problemsBasePath: string = path.join(__dirname, ".././problems")
  ) { }

  async checkForNewProblemFolders(): Promise<string[]> {
    try {
      const folders = await fs.readdir(this._problemsBasePath, { withFileTypes: true });
      const problemFolders = folders
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);


      const existingProblems = await this._problemRepository.find({});
      const existingSlugs = new Set(existingProblems.map((problem) => problem.slug));

      const newFolders = problemFolders.filter((folder) => !existingSlugs.has(folder));

      return newFolders;
    } catch (error) {
      console.error("Error checking problem folders:", error);
      return [];
    }
  }
}