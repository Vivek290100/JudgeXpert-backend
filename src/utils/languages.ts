export interface LanguageConfig {
  name: string;
  ext: string;
  version: string;
  wrapper: (code: string, input: string, functionName?: string, inputStructure?: { name: string; type: string }[]) => string;
}

const parseInput = (input: string, language: string, inputStructure: { name: string; type: string }[]) => {
  const lines = input.split('\n').filter(line => line.trim());
  if (lines.length !== inputStructure.length) {
    throw new Error(`Expected ${inputStructure.length} inputs, got ${lines.length}`);
  }
  return lines.map((line, idx) => {
    const type = inputStructure[idx].type;
    try {
      const parsed = JSON.parse(line.trim());
      if (type.startsWith('array<')) {
        const innerType = type.replace('array<', '').replace('>', '');
        if (!Array.isArray(parsed)) throw new Error('Invalid array format');
        return `[${parsed.map(v => formatValueForInnerType(v, innerType)).join(',')}]`;
      }
      return formatValueForInnerType(parsed, type);
    } catch {
      return `"${line.trim()}"`; 
    }
  });
};

const formatValueForInnerType = (value: any, type: string): string => {
  if (type === 'integer' || type === 'int') return Number(value).toString();
  if (type === 'boolean') return value.toString();
  if (type === 'string') return `"${value}"`;
  return value.toString();
};

const javascriptWrapper = (code: string, input: string, functionName: string = 'solution', inputStructure: { name: string; type: string }[] = []) => {
  const inputs = parseInput(input, 'javascript', inputStructure).join(', ');
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

const pythonWrapper = (code: string, input: string, functionName: string = 'solution', inputStructure: { name: string; type: string }[] = []) => {
  const inputs = parseInput(input, 'python', inputStructure).join(', ');
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

const defaultWrapper = (code: string) => code;

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { name: "javascript", ext: "js", version: "18.15.0", wrapper: javascriptWrapper },
  { name: "python", ext: "py", version: "3.10.0", wrapper: pythonWrapper },
  { name: "cpp", ext: "cpp", version: "10.2.0", wrapper: defaultWrapper },
  { name: "kotlin", ext: "kt", version: "1.8.20", wrapper: defaultWrapper },
  { name: "ruby", ext: "rb", version: "3.0.1", wrapper: defaultWrapper },
  { name: "go", ext: "go", version: "1.16.2", wrapper: defaultWrapper },
];

export const getLanguageConfig = (language: string): LanguageConfig | undefined => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.name.toLowerCase() === language.toLowerCase());
};

export function formatValueForExecution(value: any, type: string): string {
  if (type.startsWith('array<')) {
    const innerType = type.replace('array<', '').replace('>', '');
    if (!Array.isArray(value)) throw new Error('Expected array');
    return `[${value.map(v => formatValueForInnerType(v, innerType)).join(',')}]`;
  }
  if (type === 'integer' || type === 'int') return Number(value).toString();
  if (type === 'boolean') return value.toString();
  if (type === 'string') return `"${value}"`;
  return value.toString();
}


export function parseValue(value: string, type: string): any {
  try {
    value = value.trim();
    if (type === 'int' || type === 'integer') return parseInt(value);
    if (type === 'boolean') return value.toLowerCase() === 'true';
    if (type === 'string') return value;

    if (type.startsWith('array<')) {
      const innerType = type.replace('array<', '').replace('>', '');
      const arrayValues = JSON.parse(value);
      if (!Array.isArray(arrayValues)) throw new Error('Invalid array format');
      return arrayValues.map((item) => {
        if (innerType === 'integer' || innerType === 'int') return parseInt(item);
        if (innerType === 'boolean') return item.toString().toLowerCase() === 'true';
        if (innerType === 'string') return item.toString();
        throw new Error(`Unsupported array inner type: ${innerType}`);
      });
    }

    return value;
  } catch (error) {
    console.error("Error parsing value:", { value, type, error });
    throw new Error(`Failed to parse value: ${value} as type ${type}`);
  }
}