import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { Header } from './components/Header';
import { TextInputSection } from './components/TextInputSection';
import { ResultsSection } from './components/ResultsSection';
import { Footer } from './components/Footer';
import { analyzeContent } from './services/geminiService';
import { extractTextFromFile, FileProcessingError } from './components/fileExtractor';
import type { AnalysisResult } from './types';

// --- Localization ---
const translations = {
  en: {
    appTitle: "AI Content Analyzer",
    appDescription: "Instantly summarize articles, papers, or any text to grasp key insights.",
    language: "العربية",
    textInputTab: "Enter Text",
    fileUploadTab: "Upload File",
    textInputPlaceholder: "Paste your article, report, or any text here...",
    fileUploadPrompt: "Click to browse or drag & drop a file",
    fileUploadSupported: "Supports .txt, .md, .pdf, .pptx",
    analyzeButton: "Analyze Content",
    analyzingButton: "Analyzing...",
    fileSelected: "File Selected",
    fileSize: "KB",
    changeFile: "Choose a different file",
    resultsTitle: "Analysis Results",
    initialStateTitle: "Awaiting Analysis",
    initialStateDescription: "Your summary and keywords will appear here once the analysis is complete.",
    summaryTitle: "Summary",
    keywordsTitle: "Keywords",
    errorGeneric: "An error occurred during analysis. Please try again.",
    errorNoText: "Please enter some text to analyze.",
    errorNoFile: "Please select a file to analyze.",
    errorFileRead: "Failed to read or parse the file. Please ensure it's not corrupted.",
    errorNoTextExtracted: "Could not extract any text from the file. It might be empty or image-based.",
    footerText: "Powered by Google Gemini. Built with React & Tailwind CSS."
  },
  ar: {
    appTitle: "محلل المحتوى بالذكاء الاصطناعي",
    appDescription: "لخص المقالات والأبحاث وأي نص على الفور لفهم الأفكار الرئيسية.",
    language: "English",
    textInputTab: "إدخال النص",
    fileUploadTab: "رفع ملف",
    textInputPlaceholder: "الصق مقالك أو تقريرك أو أي نص هنا...",
    fileUploadPrompt: "انقر للتصفح أو اسحب وأفلت ملفًا",
    fileUploadSupported: "يدعم ملفات .txt, .md, .pdf, .pptx",
    analyzeButton: "تحليل المحتوى",
    analyzingButton: "جاري التحليل...",
    fileSelected: "الملف المحدد",
    fileSize: "كيلوبايت",
    changeFile: "اختيار ملف مختلف",
    resultsTitle: "نتائج التحليل",
    initialStateTitle: "في انتظار التحليل",
    initialStateDescription: "سيظهر ملخصك وكلماتك الرئيسية هنا بمجرد اكتمال التحليل.",
    summaryTitle: "الملخص",
    keywordsTitle: "الكلمات الرئيسية",
    errorGeneric: "حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.",
    errorNoText: "الرجاء إدخال بعض النص لتحليله.",
    errorNoFile: "الرجاء اختيار ملف لتحليله.",
    errorFileRead: "فشل في قراءة الملف أو تحليله. يرجى التأكد من أنه غير تالف.",
    errorNoTextExtracted: "تعذر استخلاص أي نص من الملف. قد يكون فارغًا أو يحتوي على صور فقط.",
    footerText: "مدعوم بواسطة Google Gemini. تم إنشاؤه باستخدام React و Tailwind CSS."
  }
};

type Language = 'en' | 'ar';
type TranslationKey = keyof typeof translations.en;

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used within a LocalizationProvider');
  return context;
};
// --- End Localization ---

const AppContent: React.FC = () => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocalization();

  const getTextToAnalyze = async (): Promise<string> => {
    if (inputMode === 'text') {
      if (!inputText.trim()) throw new Error(t('errorNoText'));
      return inputText;
    }

    if (!selectedFile) throw new Error(t('errorNoFile'));

    try {
      const extractedText = await extractTextFromFile(selectedFile);
      if (!extractedText.trim()) throw new Error(t('errorNoTextExtracted'));
      return extractedText;
    } catch (err) {
      if (err instanceof FileProcessingError) {
        console.error("File processing error:", err);
        throw new Error(t('errorFileRead'));
      }
      // Re-throw other errors
      throw err;
    }
  };

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const textToAnalyze = await getTextToAnalyze();
      const result = await analyzeContent({ text: textToAnalyze });
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis failed:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('errorGeneric'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedFile, inputMode, t, getTextToAnalyze]);

  return (
    <div className="min-h-screen text-slate-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <TextInputSection
            inputMode={inputMode}
            setInputMode={setInputMode}
            inputText={inputText}
            setInputText={setInputText}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          <ResultsSection
            isLoading={isLoading}
            error={error}
            analysisResult={analysisResult}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: TranslationKey) => {
    return translations[language][key] || translations['en'][key];
  }, [language]);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      <AppContent />
    </LocalizationContext.Provider>
  );
};

export default App;