// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\config\Languages.ts
export interface LanguageConfig {
    name: string; 
    id: number;   // Judge0 language ID
  }
  
  export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    { name: "cpp", id: 54 },  
    { name: "js", id: 63 },  
    { name: "rust", id: 73 }, 
    // {name: "python", id: 71}
  ];
  
  export const getLanguageId = (languageName: string): number | null => {
    const lang = SUPPORTED_LANGUAGES.find(lang => lang.name === languageName.toLowerCase());
    return lang ? lang.id : null;
  };
  
  export const validateLanguage = (languageName: string): boolean => {
    return SUPPORTED_LANGUAGES.some(lang => lang.name === languageName.toLowerCase());
  };