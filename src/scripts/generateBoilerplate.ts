// src/scripts/generateBoilerplate.ts
import { ProblemDefinitionParser, FullProblemDefinitionParser } from "../utils/problemParsers";
import fs from "fs";
import path from "path";
import { SUPPORTED_LANGUAGES, validateLanguage } from "../config/Languages";

export async function generateBoilerplateForProblem(problemDir: string): Promise<void> {
  const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
  const fullProblemDir = path.join(basePath, problemDir);

  const structurePath = path.join(fullProblemDir, "Structure.md");
  const boilerplateDir = path.join(fullProblemDir, "boilerplate");
  const boilerplateFullDir = path.join(fullProblemDir, "boilerplate-full");

  // Read Structure.md
  const structure = fs.readFileSync(structurePath, "utf-8");

  // Parse with ProblemDefinitionParser for partial boilerplate
  const parser = new ProblemDefinitionParser();
  parser.parse(structure);

  // Generate partial boilerplate for each supported language
  const partialBoilerplate: { [key: string]: string } = {};
  for (const lang of SUPPORTED_LANGUAGES.map(lang => lang.name)) {
    if (validateLanguage(lang)) {
      partialBoilerplate[lang] = parser.generateCode(lang);
    } else {
      console.warn(`Skipping unsupported language: ${lang}`);
    }
  }

  // Parse with FullProblemDefinitionParser for full boilerplate
  const fullParser = new FullProblemDefinitionParser();
  fullParser.parse(structure);

  // Generate full boilerplate for each supported language
  const fullBoilerplate: { [key: string]: string } = {};
  for (const lang of SUPPORTED_LANGUAGES.map(lang => lang.name)) {
    if (validateLanguage(lang)) {
      fullBoilerplate[lang] = fullParser.generateCode(lang);
    } else {
      console.warn(`Skipping unsupported language: ${lang}`);
    }
  }

  // Ensure boilerplate directories exist
  if (!fs.existsSync(boilerplateDir)) fs.mkdirSync(boilerplateDir, { recursive: true });
  if (!fs.existsSync(boilerplateFullDir)) fs.mkdirSync(boilerplateFullDir, { recursive: true });

  // Write partial boilerplate files
  for (const [lang, code] of Object.entries(partialBoilerplate)) {
    fs.writeFileSync(path.join(boilerplateDir, `function.${lang}`), code);
  }

  // Write full boilerplate files
  for (const [lang, code] of Object.entries(fullBoilerplate)) {
    fs.writeFileSync(path.join(boilerplateFullDir, `function.${lang}`), code);
  }

  console.log(`Boilerplate generated successfully for ${problemDir}`);
}

async function main(): Promise<void> {
  const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
  try {
    const problemDirs = fs.readdirSync(basePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const problemDir of problemDirs) {
      await generateBoilerplateForProblem(problemDir);
    }
    console.log("All boilerplates generated successfully!");
  } catch (error) {
    console.error("Error generating boilerplates:", error);
    process.exit(1);
  }
}

// Keep main() commented out for manual execution only
// main();