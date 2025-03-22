// Backend\src\config\Languages.ts
// Backend\src\config\Languages.ts
export interface LanguageConfig {
  name: string;           // Canonical name (e.g., "javascript")
  aliases?: string[];     // Alternative names (e.g., ["js"])
  id: number;             // Piston language ID
  ext: string;            // File extension
  wrapper: (code: string, input: string) => string; // Function to wrap user code
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    name: "javascript",
    aliases: ["js"], // Add alias
    id: 63, // Node.js 12.14.0
    ext: "js",
    wrapper: (code, input) => {
      const functionNameMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!functionNameMatch) return code;
      const functionName = functionNameMatch[1];
      const args = input.split(" ").map((arg) => isNaN(+arg) ? `"${arg}"` : arg).join(", ");
      return `${code}\nconsole.log(${functionName}(${args}));`;
    },
  },
  {
    name: "rust",
    id: 73, // Rust 1.40.0
    ext: "rs",
    wrapper: (code, input) => {
      const functionNameMatch = code.match(/fn\s+(\w+)\s*\(/);
      if (!functionNameMatch) return code;
      const functionName = functionNameMatch[1];
      const args = input.split(" ").join(", ");
      return `
fn main() {
    println!("{}", ${functionName}(${args}));
}
${code}`;
    },
  },
  {
    name: "cpp",
    id: 54, // C++ (GCC 9.2.0)
    ext: "cpp",
    wrapper: (code, input) => {
      const functionNameMatch = code.match(/(int|void|string)\s+(\w+)\s*\(/);
      if (!functionNameMatch) return code;
      const functionName = functionNameMatch[2];
      const args = input.split(" ").join(", ");
      return `
#include <iostream>
#include <string>
using namespace std;
${code}
int main() {
    cout << ${functionName}(${args}) << endl;
    return 0;
}`;
    },
  },
];

export const getLanguageId = (languageName: string): number | null => {
  const lang = SUPPORTED_LANGUAGES.find(
    (l) => l.name === languageName.toLowerCase() || (l.aliases && l.aliases.includes(languageName.toLowerCase()))
  );
  return lang ? lang.id : null;
};

export const getLanguageConfig = (languageName: string): LanguageConfig | null => {
  return SUPPORTED_LANGUAGES.find(
    (l) => l.name === languageName.toLowerCase() || (l.aliases && l.aliases.includes(languageName.toLowerCase()))
  ) || null;
};

export const validateLanguage = (languageName: string): boolean => {
  return !!getLanguageId(languageName);
};