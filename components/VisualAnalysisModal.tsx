import React, { useState, useCallback, useMemo } from 'react';
import { analyzeImages } from '../services/geminiService';
import { XMarkIcon, EyeIcon, SparklesIcon, ArrowUpTrayIcon, ArrowPathIcon } from './icons';

interface VisualAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImageFile = {
  data: string; // base64
  name: string;
  type: string;
}

const MAX_IMAGES = 4;

const VisualAnalysisModal: React.FC<VisualAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    // Reset state only when closing, not on re-renders
    if (isOpen) {
      setImages([]);
      setIsLoading(false);
      setAnalysisResult(null);
      setError(null);
      onClose();
    }
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files) return;

    if (files.length + images.length > MAX_IMAGES) {
      setError(`You can only upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          data: reader.result as string,
          name: file.name,
          type: file.type,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleGenerate = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const imageData = images.map(img => {
        const parts = img.data.split(',');
        const base64Data = parts.length > 1 ? parts[1] : '';
        return { base64Data, mimeType: img.type };
      });

      const validImageData = imageData.filter(d => d.base64Data);
      if (validImageData.length !== images.length) {
          setError("Could not read image data for one or more files. Please try re-uploading.");
          setIsLoading(false);
          return;
      }

      const result = await analyzeImages(validImageData);
      
      if (result && result.trim()) {
        setAnalysisResult(result);
      } else {
        setError("The AI returned an empty response. This may be due to a content safety filter. Please try again with different images.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate analysis: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
  };
  
  const formattedContent = useMemo(() => {
    if (!analysisResult) return null;
    return analysisResult.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="font-bold text-slate-800 mt-4 mb-1 text-base">{line.replace(/\*\*/g,'').replace(/^\d+\. /,'')}</h3>
      }
      if (line.match(/^- /)) {
        return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
      }
      if(line.trim().length === 0) return <br key={index} />;
      return <p key={index} className="text-slate-600">{line}</p>;
    });
  }, [analysisResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <EyeIcon className="w-6 h-6 mr-2 text-purple-500" />
            AI Visual Analysis
          </h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {analysisResult !== null ? (
            <div>
              <div className="prose prose-sm max-w-none text-slate-600">
                {formattedContent}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleReset} className="flex items-center bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg hover:bg-indigo-200 transition-all text-sm font-semibold">
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Analyze New Images
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center relative">
                <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">
                  Drag and drop images here, or click to select files.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload up to {MAX_IMAGES} images (PNG, JPG, WEBP).
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>

              {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm">{error}</div>}

              {images.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-sm text-slate-700 mb-2">Selected Images ({images.length}/{MAX_IMAGES})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img src={image.data} alt={image.name} className="w-full h-full object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors flex items-center justify-center">
                           <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-white/70 rounded-full p-0.5 text-slate-800 opacity-0 group-hover:opacity-100 hover:bg-white" title="Remove image">
                              <XMarkIcon className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleGenerate} 
                  disabled={images.length === 0 || isLoading}
                  className="flex items-center bg-purple-600 text-white py-2 px-5 rounded-lg hover:bg-purple-700 transition-all font-semibold disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                     <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualAnalysisModal;