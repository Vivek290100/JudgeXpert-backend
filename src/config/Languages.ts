export interface LanguageConfig {
    name: string; 
    id: number;
  }
  
  export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    { name: "cpp", id: 54 },  
    { name: "js", id: 63 },  
    { name: "rust", id: 73 }, 
  ];
  
  export const getLanguageId = (languageName: string): number | null => {
    const lang = SUPPORTED_LANGUAGES.find(lang => lang.name === languageName.toLowerCase());
    return lang ? lang.id : null;
  };
  
  export const validateLanguage = (languageName: string): boolean => {
    return SUPPORTED_LANGUAGES.some(lang => lang.name === languageName.toLowerCase());
  };