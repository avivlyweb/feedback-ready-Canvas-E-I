import React, { useState, useCallback, useMemo } from 'react';
import { analyzeImages } from '../services/geminiService';
import { XMarkIcon, EyeIcon, SparklesIcon, ArrowUpTrayIcon, ArrowPathIcon } from './icons';
import { Project, ContentType } from '../types';

interface VisualAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

type ImageFile = {
  data: string; // base64
  name: string;
  type: string;
}

const MAX_IMAGES = 4;

const VisualAnalysisModal: React.FC<VisualAnalysisModalProps> = ({ isOpen, onClose, project }) => {
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

  const submissionAssets = useMemo(() => {
    if (!project) return [];
    const assets: ImageFile[] = [];
    
    // Add main content if it's an image project
    if (project.type === ContentType.IMAGE && project.content.startsWith('data:image')) {
      assets.push({
        data: project.content,
        name: `${project.name} Main View`,
        type: 'image/png'
      });
    }
    
    // Add captured screenshots
    if (project.screenshots && project.screenshots.length > 0) {
      project.screenshots.forEach((sc, idx) => {
        assets.push({
          data: sc,
          name: `Viewport Screenshot ${idx + 1}`,
          type: 'image/png'
        });
      });
    }
    
    return assets;
  }, [project]);

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

  const handleGenerateWithAssets = async (assetsToAnalyze: ImageFile[]) => {
    if (assetsToAnalyze.length === 0) {
      setError("Please select or upload at least one image.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const imageData = assetsToAnalyze.map(img => {
        const parts = img.data.split(',');
        const base64Data = parts.length > 1 ? parts[1] : '';
        return { base64Data, mimeType: img.type || 'image/png' };
      });

      const validImageData = imageData.filter(d => d.base64Data);
      if (validImageData.length !== assetsToAnalyze.length) {
          setError("Could not read image data for one or more files.");
          setIsLoading(false);
          return;
      }

      const result = await analyzeImages(validImageData);
      
      if (result && result.trim()) {
        setAnalysisResult(result);
      } else {
        setError("The AI returned an empty response. Please try again with different images.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate analysis: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    await handleGenerateWithAssets(images);
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
        return <h3 key={index} className="font-bold text-slate-800 mt-4 mb-2 text-base border-b border-slate-100 pb-1">{line.replace(/\*\*/g,'').replace(/^\d+\. /,'')}</h3>
      }
      if (line.match(/^- /)) {
        // Render inline code / CSS tags cleanly
        const parsed = line.substring(2).split('`').map((part, pidx) => {
          if (pidx % 2 === 1) {
            return <code key={pidx} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">{part}</code>;
          }
          return part;
        });
        return <li key={index} className="ml-5 list-disc text-slate-600 mb-1 leading-relaxed">{parsed}</li>;
      }
      if(line.trim().length === 0) return <div key={index} className="h-2" />;
      
      // Inline backticks highlighting for regular lines
      const parsedLine = line.split('`').map((part, pidx) => {
        if (pidx % 2 === 1) {
          return <code key={pidx} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">{part}</code>;
        }
        return part;
      });
      return <p key={index} className="text-slate-600 mb-2 leading-relaxed">{parsedLine}</p>;
    });
  }, [analysisResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all animate-fade-in flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <EyeIcon className="w-6 h-6 mr-2 text-purple-600" />
            AI Visual & Responsive Audit
          </h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        
        <div className="overflow-y-auto pr-2 flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative">
                <SparklesIcon className="w-16 h-16 text-purple-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-purple-800 font-bold">AI</span>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mt-6 text-lg">Scanning layout...</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-2 leading-relaxed">
                Gemini is auditing active viewports to locate responsive bugs, alignment flaws, and suggest precise CSS fixes.
              </p>
            </div>
          ) : analysisResult !== null ? (
            <div>
              <div className="prose prose-sm max-w-none text-slate-600 bg-slate-50 rounded-xl p-5 border border-slate-200">
                {formattedContent}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleReset} className="flex items-center bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg hover:bg-indigo-200 transition-all text-sm font-semibold">
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Run Another Audit
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Submission Assets quick audit section */}
              {submissionAssets.length > 0 && (
                <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-4 shadow-sm">
                  <h3 className="font-extrabold text-purple-950 text-sm mb-1.5 flex items-center">
                    <SparklesIcon className="w-4.5 h-4.5 mr-1.5 text-purple-600" />
                    Audit Current Submission ({submissionAssets.length} asset{submissionAssets.length > 1 ? 's' : ''})
                  </h3>
                  <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                    Instantly analyze the submission viewports and breakpoints captured below to locate text wrapping, layout bugs, and CSS defects.
                  </p>
                  <div className="flex items-center space-x-2.5 overflow-x-auto pb-2.5">
                    {submissionAssets.map((asset, idx) => (
                      <div key={idx} className="relative w-14 h-14 flex-shrink-0 rounded-lg border border-purple-200 overflow-hidden bg-white shadow-sm hover:scale-105 transition-transform" title={asset.name}>
                        <img src={asset.data} alt={asset.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[8px] text-white text-center py-0.5 truncate px-1">
                          {idx === 0 && project?.type === ContentType.IMAGE ? 'Main' : `BP ${idx}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleGenerateWithAssets(submissionAssets)}
                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-md transition-all flex items-center justify-center hover:scale-[1.01]"
                  >
                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                    Analyze Breakpoints & Recommend CSS Fixes
                  </button>
                </div>
              )}

              {/* Manual Drag & Drop Fallback */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center relative">
                <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-slate-400" />
                <p className="mt-2 text-sm text-slate-600 font-bold">
                  Drag & drop external files, or click to upload
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Analyze layout snapshots (up to {MAX_IMAGES} files, PNG, JPG, WEBP)
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
                  <h3 className="font-semibold text-sm text-slate-700 mb-2">Selected Snapshot Files ({images.length}/{MAX_IMAGES})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={image.data} alt={image.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors flex items-center justify-center">
                           <button onClick={() => handleRemoveImage(index)} className="absolute top-1.5 right-1.5 bg-white rounded-full p-1 text-slate-800 shadow-md hover:bg-slate-100" title="Remove image">
                              <XMarkIcon className="w-3.5 h-3.5" />
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
                  className="flex items-center bg-indigo-600 text-white py-2 px-5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 shadow-md transition-all font-semibold disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Custom Analysis
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