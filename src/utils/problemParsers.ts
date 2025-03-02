import { SUPPORTED_LANGUAGES, validateLanguage } from "../config/Languages";

export class ProblemDefinitionParser {
  problemName: string = "";
  functionName: string = "";
  inputFields: { type: string; name: string }[] = [];
  outputFields: { type: string; name: string }[] = [];

  parse(input: string): void {
    const lines = input.split("\n").map((line) => line.trim());
    let currentSection: string | null = null;

    lines.forEach((line) => {
      if (line.startsWith("Problem Name:")) {
        this.problemName = this.extractQuotedValue(line);
      } else if (line.startsWith("Function Name:")) {
        this.functionName = this.extractValue(line);
      } else if (line.startsWith("Input Structure:")) {
        currentSection = "input";
      } else if (line.startsWith("Output Structure:")) {
        currentSection = "output";
      } else if (line.startsWith("Input Field:")) {
        if (currentSection === "input") {
          const field = this.extractField(line);
          if (field) this.inputFields.push(field);
        }
      } else if (line.startsWith("Output Field:")) {
        if (currentSection === "output") {
          const field = this.extractField(line);
          if (field) this.outputFields.push(field);
        }
      }
    });
  }

  extractQuotedValue(line: string): string {
    const match = line.match(/: "(.*)"$/);
    return match ? match[1] : "";
  }

  extractValue(line: string): string {
    const match = line.match(/: (\w+)$/);
    return match ? match[1] : "";
  }

  extractField(line: string): { type: string; name: string } | null {
    const match = line.match(/Field: (\w+(?:<\w+>)?) (\w+)$/);
    return match ? { type: match[1], name: match[2] } : null;
  }

  generateCode(language: string): string {
    if (!validateLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const inputs = this.inputFields.map((field) => `${field.type} ${field.name}`).join(", ");
    switch (language.toLowerCase()) {
      case "cpp":
        return `${this.outputFields[0].type} ${this.functionName}(${inputs}) {\n    // Implementation goes here\n    return result;\n}`;
      case "js":
        return `function ${this.functionName}(${inputs}) {\n    // Implementation goes here\n    return result;\n}`;
      case "rust":
        const outputType = this.mapTypeToRust(this.outputFields[0].type);
        return `fn ${this.functionName}(${inputs}) -> ${outputType} {\n    // Implementation goes here\n    result\n}`;
      default:
        throw new Error(`No boilerplate generator for language: ${language}`);
    }
  }

  mapTypeToRust(type: string): string {
    switch (type) {
      case "int": return "i32";
      case "float": return "f64";
      case "string": return "String";
      case "bool": return "bool";
      case "list<int>": return "Vec<i32>";
      case "list<float>": return "Vec<f64>";
      case "list<string>": return "Vec<String>";
      case "list<bool>": return "Vec<bool>";
      default: return "unknown";
    }
  }
}

export class FullProblemDefinitionParser extends ProblemDefinitionParser {
  generateCode(language: string): string {
    if (!validateLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const inputs = this.inputFields.map((field) => `${this.mapTypeToLanguage(field.type, language)} ${field.name}`).join(", ");
    const inputReads = this.inputFields.map((field) => {
      if (field.type.startsWith("list<")) {
        switch (language.toLowerCase()) {
          case "cpp":
            return `int size_${field.name};\n  std::cin >> size_${field.name};\n  ${this.mapTypeToLanguage(field.type, language)} ${field.name}(size_${field.name});\n  for(int i = 0; i < size_${field.name}; ++i) std::cin >> ${field.name}[i];`;
          case "js":
            return `const size_${field.name} = parseInt(input.shift());\nconst ${field.name} = input.splice(0, size_${field.name}).map(Number);`;
          case "rust":
            return `let size_${field.name}: usize = input.next().unwrap().parse().unwrap();\nlet ${field.name}: ${this.mapTypeToLanguage(field.type, language)} = input.take(size_${field.name}).map(|s| s.parse().unwrap()).collect();`;
          default:
            throw new Error(`No input reading implementation for language: ${language}`);
        }
      } else {
        switch (language.toLowerCase()) {
          case "cpp":
            return `std::cin >> ${field.name};`;
          case "js":
            return `const ${field.name} = parseInt(input.shift());`;
          case "rust":
            return `let ${field.name}: ${this.mapTypeToLanguage(field.type, language)} = input.next().unwrap().parse().unwrap();`;
          default:
            throw new Error(`No input reading implementation for language: ${language}`);
        }
      }
    }).join("\n  ");
    const outputType = this.outputFields[0].type;
    const functionCall = `${this.mapTypeToLanguage(outputType, language)} result = ${this.functionName}(${this.inputFields.map((field) => field.name).join(", ")});`;
    const outputWrite = `console.log(result);`; // Default for JS; adjust for other languages

    switch (language.toLowerCase()) {
      case "cpp":
        return `
#include <iostream>
#include <vector>
#include <string>

##USER_CODE_HERE##

int main() {
${inputReads}
${functionCall}
std::cout << result << std::endl;
return 0;
}
        `;
      case "js":
        return `
##USER_CODE_HERE##

const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n').join(' ').split(' ');
${inputReads}
${functionCall}
${outputWrite}
        `;
      case "rust":
        return `
use std::io::{self, BufRead};

##USER_CODE_HERE##

fn main() {
let stdin = io::stdin();
let mut input = stdin.lock().lines().map(|l| l.unwrap());
${inputReads}
${functionCall}
println!("{}", result);
}
        `;
      default:
        throw new Error(`No full boilerplate generator for language: ${language}`);
    }
  }

  mapTypeToLanguage(type: string, language: string): string {
    switch (language.toLowerCase()) {
      case "cpp":
        switch (type) {
          case "int": return "int";
          case "float": return "float";
          case "string": return "std::string";
          case "bool": return "bool";
          case "list<int>": return "std::vector<int>";
          case "list<float>": return "std::vector<float>";
          case "list<string>": return "std::vector<std::string>";
          case "list<bool>": return "std::vector<bool>";
          default: return "unknown";
        }
      case "js":
        switch (type) {
          case "int": return "number";
          case "float": return "number";
          case "string": return "string";
          case "bool": return "boolean";
          case "list<int>": return "number[]";
          case "list<float>": return "number[]";
          case "list<string>": return "string[]";
          case "list<bool>": return "boolean[]";
          default: return "unknown";
        }
      case "rust":
        return this.mapTypeToRust(type); // Reuse the existing Rust mapping
      default:
        throw new Error(`No type mapping for language: ${language}`);
    }
  }

  mapTypeToRust(type: string): string {
    switch (type) {
      case "int": return "i32";
      case "float": return "f64";
      case "string": return "String";
      case "bool": return "bool";
      case "list<int>": return "Vec<i32>";
      case "list<float>": return "Vec<f64>";
      case "list<string>": return "Vec<String>";
      case "list<bool>": return "Vec<bool>";
      default: return "unknown";
    }
  }
}