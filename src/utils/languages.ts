// Backend/src/utils/languages.ts
export interface LanguageConfig {
  name: string;
  ext: string;
  version: string;
  wrapper: (code: string, input: string, functionName?: string) => string;
}


const javascriptWrapper = (code: string, input: string, functionName: string = 'solution') => {
  const inputs = input.split('\n').map(val => {
    try {
      return JSON.parse(val);
    } catch {
      return isNaN(Number(val)) ? `"${val}"` : Number(val);
    }
  }).join(', ');
  return `
${code}
try {
  const result = ${functionName}(${inputs});
  console.log(JSON.stringify(result));
} catch (e) {
  console.error(JSON.stringify({ error: e.message }));
}
  `;
};

const pythonWrapper = (code: string, input: string, functionName: string = 'solution') => {
  const inputs = input.split('\n').map(val => {
    try {
      return JSON.parse(val);
    } catch {
      return isNaN(Number(val)) ? `"${val}"` : val;
    }
  }).map(val => JSON.stringify(val)).join(', ');
  return `
import json
${code}
try:
    result = ${functionName}(${inputs})
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
  `;
};


const defaultWrapper = (code: string, input: string) => code;

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { name: "javascript", ext: "js", version: "18.15.0", wrapper: javascriptWrapper },
  { name: "python", ext: "py", version: "3.10.0", wrapper: pythonWrapper },
  { name: "cpp", ext: "cpp", version: "10.2.0", wrapper: defaultWrapper }, 
  { name: "kotlin", ext: "kt", version: "1.8.20", wrapper: defaultWrapper },
  { name: "ruby", ext: "rb", version: "3.0.1", wrapper: defaultWrapper },
  { name: "go", ext: "go", version: "1.16.2", wrapper: defaultWrapper },
];

export const getLanguageConfig = (language: string): LanguageConfig | undefined => {
  return SUPPORTED_LANGUAGES.find(
    (lang) => lang.name.toLowerCase() === language.toLowerCase()
  );
};

export function formatValueForExecution(value: any, type: string): string {
  if (type.startsWith('array') || type === 'object') return JSON.stringify(value);
  if (type === 'number') return Number(value).toString();
  if (type === 'boolean') return value.toString();
  return value.toString();
}