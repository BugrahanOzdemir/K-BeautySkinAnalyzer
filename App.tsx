import React, { useState, useCallback } from 'react';
import { analyzeSkin } from './services/geminiService';
import { AnalysisResult } from './types';
import Loader from './components/Loader';
import { tr } from './locales/tr';
import { en } from './locales/en';

type Language = 'tr' | 'en';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('tr');

  const t = language === 'tr' ? tr : en;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      setError(t.errorImage);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await analyzeSkin(imageFile, language);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnexpected);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, language, t]);
  
  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  const renderInitialState = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-pink-800 mb-4">{t.initialTitle}</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {t.initialDescription}
      </p>
      <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 bg-pink-50/50">
        <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-pink-500 hover:bg-pink-600 transition-colors">
          <CameraIcon className="w-6 h-6 mr-2" />
          {t.uploadButton}
        </label>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
        <p className="mt-4 text-sm text-gray-500">{t.uploadNote}</p>
      </div>
    </div>
  );

  const renderImagePreview = () => (
    previewUrl && (
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <img src={previewUrl} alt="Skin analysis preview" className="rounded-lg shadow-lg mb-6 w-full object-cover aspect-square" />
        <div className="flex space-x-4">
            <button onClick={handleAnalyzeClick} disabled={isLoading} className="bg-pink-500 text-white font-bold py-3 px-8 rounded-full hover:bg-pink-600 transition-transform hover:scale-105 disabled:bg-pink-300 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading ? t.analyzingButton : <> <SparklesIcon className="w-5 h-5 mr-2"/> {t.analyzeButton} </>}
            </button>
             <button onClick={() => document.getElementById('file-upload')?.click()} className="bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transition-transform hover:scale-105">
                {t.changePhotoButton}
            </button>
        </div>
      </div>
    )
  );

  const renderResult = () => (
    result && (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-pink-100 pb-4">
            <h2 className="text-3xl font-bold text-pink-800">{t.resultTitle}</h2>
             <button onClick={handleReset} className="mt-4 md:mt-0 bg-pink-100 text-pink-700 font-semibold py-2 px-4 rounded-full hover:bg-pink-200 transition-colors">
                {t.startOverButton}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <ResultCard title={t.skinTypeTitle}>
                    <p className="text-2xl font-semibold text-pink-600">{result.skinType}</p>
                </ResultCard>
                 <ResultCard title={t.analysisTitle}>
                    <p className="text-gray-600 leading-relaxed">{result.analysis}</p>
                </ResultCard>
                <ResultCard title={t.concernsTitle}>
                    <ul className="space-y-4">
                        {result.concerns.map((concern, index) => (
                        <li key={index} className="p-3 bg-pink-50 rounded-lg">
                            <h4 className="font-bold text-pink-800">{concern.name}</h4>
                            <p className="text-gray-600 text-sm">{concern.description}</p>
                        </li>
                        ))}
                    </ul>
                </ResultCard>
            </div>
            <div className="space-y-6">
                 <ResultCard title={t.productSuggestionsTitle}>
                    <ul className="space-y-4">
                        {result.recommendations.productSuggestions.map((product, index) => (
                        <li key={index} className="p-3 bg-pink-50 rounded-lg">
                            <h4 className="font-bold text-pink-800">{product.type}</h4>
                            <p className="text-gray-600 text-sm">{product.reason}</p>
                        </li>
                        ))}
                    </ul>
                </ResultCard>
                <RoutineCard title={t.morningRoutineTitle} routine={result.recommendations.morningRoutine} />
                <RoutineCard title={t.eveningRoutineTitle} routine={result.recommendations.eveningRoutine} />
            </div>
        </div>
      </div>
    )
  );
  
  return (
    <div className="min-h-screen bg-pink-50 text-gray-800">
      <main className="container mx-auto px-4 pt-16 pb-8 md:pt-24 md:pb-16 flex flex-col items-center justify-center relative">
        <div className="absolute top-4 right-4 flex space-x-2">
            <button 
                onClick={() => setLanguage('en')} 
                className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'en' ? 'bg-pink-500 text-white font-semibold' : 'bg-pink-100 text-pink-700'}`}>
                EN
            </button>
            <button 
                onClick={() => setLanguage('tr')} 
                className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'tr' ? 'bg-pink-500 text-white font-semibold' : 'bg-pink-100 text-pink-700'}`}>
                TR
            </button>
        </div>
        
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-pink-500 mb-2 tracking-tight">{t.headerTitle}</h1>
          <p className="text-lg text-gray-500">{t.headerSubtitle}</p>
        </header>

        <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
          {!previewUrl && renderInitialState()}
          {previewUrl && !result && !isLoading && !error && renderImagePreview()}
          {isLoading && <Loader text={t.loaderText} />}
          {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg text-center">
            <p className="font-bold">{t.errorTitle}</p> 
            <p>{error}</p>
            <button onClick={handleReset} className="mt-4 bg-red-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-red-600 transition-colors">
                {t.tryAgainButton}
            </button>
            </div>}
          {result && renderResult()}
        </div>
        
        <footer className="text-center mt-16 text-gray-400 text-sm">
            <p>{t.footerText}</p>
        </footer>
      </main>
    </div>
  );
};


// Helper components defined outside the main component to prevent re-renders
const ResultCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-bold text-pink-700 mb-3">{title}</h3>
        {children}
    </div>
);

const RoutineCard: React.FC<{ title: string; routine: string[] }> = ({ title, routine }) => (
    <ResultCard title={title}>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
            {routine.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
    </ResultCard>
);

const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);


export default App;