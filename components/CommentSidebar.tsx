import React, { useState, useEffect, useRef } from 'react';
import { Project, Pin, CommentStatus, ContentType, Comment } from '../types';
import { summarizeFeedback } from '../services/geminiService';
import { exportProjectAsPDF } from '../services/pdfExportService';
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, EyeIcon, LockClosedIcon, LockOpenIcon, PaperClipIcon, CameraIcon, TrashIcon, DocumentArrowDownIcon } from './icons';
import VisualAnalysisModal from './VisualAnalysisModal';

interface CommentSidebarProps {
  project: Project;
  onAddComment: (pinId: string, text: string, attachment?: NonNullable<Comment['attachment']>) => void;
  onDeleteComment: (pinId: string, commentId: string) => void;
  onResolvePin: (pinId: string) => void;
  activePinId: string | null;
  onSelectPin: (pinId: string | null) => void;
  onGoBack: () => void;
  onUpdateProject: (project: Project) => void;
  onTriggerImageScreenshot: (callback: (attachment: NonNullable<Comment['attachment']>) => void) => void;
  onTriggerUrlScreenshot: (callback: (attachment: NonNullable<Comment['attachment']>) => void) => void;
  isReadOnly?: boolean;
}

const formatRelativeTime = (timestamp: Date): string => {
  const now = new Date();
  const secondsPast = (now.getTime() - timestamp.getTime()) / 1000;

  if (secondsPast < 60) return 'Just now';
  if (secondsPast < 3600) {
    const minutes = Math.floor(secondsPast / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (secondsPast < 86400) {
    const hours = Math.floor(secondsPast / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const commentDate = new Date(timestamp);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  const startOfCommentDate = new Date(commentDate);
  startOfCommentDate.setHours(0, 0, 0, 0);

  const daysDiff = (startOfToday.getTime() - startOfCommentDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff === 1) {
    return `Yesterday at ${commentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  if (daysDiff < 7) {
    return `${daysDiff} days ago`;
  }

  return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


const AIResultModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  content: string;
  isLoading: boolean;
}> = ({ isOpen, onClose, title, content, isLoading }) => {
  if (!isOpen) return null;

  const formattedContent = content.split('\n').map((line, index) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h3 key={index} className="font-bold text-slate-800 mt-4 mb-1 text-base">{line.replace(/\*\*/g,'').replace(/^\d+\. /,'')}</h3>
    }
    if (line.match(/^- /)) {
      return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    }
    if(line.trim().length === 0) return <br key={index} />;
    return <p key={index} className="text-slate-600">{line}</p>;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48">
                    <SparklesIcon className="w-12 h-12 text-indigo-500 animate-pulse"/>
                    <p className="mt-4 text-slate-600">Generating analysis, please wait...</p>
                </div>
            ) : (
                <div className="prose prose-sm max-w-none text-slate-600">
                    {formattedContent}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

const ImageViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  attachment: NonNullable<Comment['attachment']>;
}> = ({ isOpen, onClose, attachment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={attachment.data} alt={attachment.name} className="object-contain w-full h-full rounded-lg shadow-2xl"/>
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-1 text-slate-800 hover:bg-slate-200 shadow-lg">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};


const CommentSidebar: React.FC<CommentSidebarProps> = ({ project, onAddComment, onDeleteComment, onResolvePin, activePinId, onSelectPin, onGoBack, onUpdateProject, onTriggerImageScreenshot, onTriggerUrlScreenshot, isReadOnly = false }) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [attachment, setAttachment] = useState<NonNullable<Comment['attachment']> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<NonNullable<Comment['attachment']> | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const activePinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePinId && activePinRef.current) {
      activePinRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePinId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          data: reader.result as string,
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleScreenshotClick = () => {
    if (project.type === ContentType.URL) {
      onTriggerUrlScreenshot(setAttachment);
    } else {
      onTriggerImageScreenshot(setAttachment);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((newCommentText.trim() || attachment) && activePinId) {
      onAddComment(activePinId, newCommentText, attachment ?? undefined);
      setNewCommentText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const handleGenerateSummary = async () => {
    setIsSummaryModalOpen(true);
    setIsSummarizing(true);
    const allComments = project.pins.flatMap(p => p.comments);
    const summary = await summarizeFeedback(allComments);
    setAiSummary(summary);
    setIsSummarizing(false);
  }

  const handleToggleLock = () => {
    onUpdateProject({ ...project, isLocked: !project.isLocked });
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportProjectAsPDF(project);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("An error occurred while exporting the PDF. Please check the console for details.");
    } finally {
      setIsExportingPdf(false);
    }
  };


  const openPins = project.pins.filter(p => p.status === CommentStatus.OPEN);
  const resolvedPins = project.pins.filter(p => p.status === CommentStatus.RESOLVED);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
            <button onClick={onGoBack} className="flex items-center text-sm text-slate-600 hover:text-indigo-600 font-semibold">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Projects
            </button>
            <div className="flex items-center space-x-2">
              {!isReadOnly && (
                <button onClick={handleToggleLock} className="p-2 rounded-full hover:bg-slate-100 transition-colors" title={project.isLocked ? "Enable commenting" : "Disable commenting"}>
                  {project.isLocked ? <LockClosedIcon className="w-5 h-5 text-amber-600" /> : <LockOpenIcon className="w-5 h-5 text-slate-500" />}
                </button>
              )}
              <button onClick={handleExportPdf} disabled={isExportingPdf} className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-wait" title="Export feedback to PDF">
                {isExportingPdf ? <SparklesIcon className="w-5 h-5 text-indigo-500 animate-pulse" /> : <DocumentArrowDownIcon className="w-5 h-5 text-slate-500" />}
              </button>
            </div>
        </div>
        <h2 className="text-xl font-bold mt-3 truncate">{project.name}</h2>
         {project.studentEmail && (
          <div className="mt-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px]">🎓 Submission Details</span>
              <span className="text-[10px] text-indigo-600 font-semibold">{project.studentEmail}</span>
            </div>
            <div className="text-slate-700 leading-relaxed font-bold">
              Student Name: <span className="font-medium text-slate-900">{project.studentName}</span>
            </div>
            {project.notes && (
              <div className="mt-2 text-slate-600 bg-white border border-indigo-100/30 rounded-lg p-2 italic leading-relaxed">
                "{project.notes}"
              </div>
            )}
            {project.screenshots && project.screenshots.length > 0 && (
              <div className="mt-2.5">
                <p className="font-bold text-indigo-950 mb-1">Uploaded Screenshots / Files:</p>
                <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                  {project.screenshots.map((dataUrl, idx) => (
                    <img
                      key={idx}
                      src={dataUrl}
                      alt={`Attachment ${idx + 1}`}
                      onClick={() => setViewingAttachment({ data: dataUrl, name: `Attachment ${idx + 1}.png`, type: 'image/png' })}
                      className="w-10 h-10 object-cover rounded border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
         )}
         {!isReadOnly && (
           <div className="flex items-center space-x-2 mt-2">
              <button onClick={() => setIsAnalysisModalOpen(true)} className="flex items-center text-sm font-semibold bg-purple-100 text-purple-700 py-1 px-3 rounded-full hover:bg-purple-200 transition">
                <EyeIcon className="w-4 h-4 mr-2"/>
                Visual Analysis
              </button>
              <button onClick={handleGenerateSummary} className="flex items-center text-sm font-semibold bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full hover:bg-indigo-200 transition">
                  <SparklesIcon className="w-4 h-4 mr-2"/>
                  AI Summary
              </button>
            </div>
         )}
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {project.pins.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-slate-300" />
            <p className="mt-2 font-semibold">No feedback yet</p>
            {!project.isLocked && <p className="text-sm">Click on the canvas to add a comment.</p>}
          </div>
        )}
        
        {openPins.length > 0 && 
            <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Open</h3>
                {openPins.map(pin => (
                    <div key={pin.id} ref={pin.id === activePinId ? activePinRef : null} className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${activePinId === pin.id ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100'}`} onClick={() => onSelectPin(pin.id)}>
                        <div className="flex justify-between items-start">
                           <div className="flex items-start w-full">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex-shrink-0 mr-3 mt-1">{pin.number}</div>
                                <div className="flex-grow">
                                    {pin.comments.length > 0 ? (
                                        pin.comments.map((comment, index) => (
                                          <div key={comment.id} className="text-sm mb-3 last:mb-0 relative group">
                                            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                                                <span className="font-semibold text-slate-700">{comment.author}</span>
                                                <span title={comment.timestamp.toLocaleString()}>{formatRelativeTime(comment.timestamp)}</span>
                                            </div>
                                            {comment.text && <p className={`text-slate-800 break-words ${index === 0 ? 'font-bold' : ''}`}>{comment.text}</p>}
                                            {comment.attachment && (
                                              <div className="mt-2" onClick={(e) => { e.stopPropagation(); setViewingAttachment(comment.attachment); }}>
                                                <img src={comment.attachment.data} alt={comment.attachment.name} className="max-w-[100px] max-h-[100px] rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                                              </div>
                                            )}
                                            {!project.isLocked && !isReadOnly && (
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteComment(pin.id, comment.id); }}
                                                className="absolute -top-1 -right-1 p-1 text-slate-400 bg-slate-50 rounded-full hover:text-red-600 hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete comment"
                                              >
                                                <TrashIcon className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No comments yet.</p>
                                    )}
                                </div>
                            </div>
                            {!isReadOnly && (
                              <button onClick={(e) => { e.stopPropagation(); onResolvePin(pin.id)}} className="text-slate-400 hover:text-green-600 ml-2" title="Mark as resolved">
                                  <CheckCircleIcon className="w-5 h-5"/>
                              </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        }
        
        {resolvedPins.length > 0 &&
             <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 my-2">Resolved</h3>
                {resolvedPins.map(pin => (
                     <div key={pin.id} className="p-3 rounded-lg bg-slate-50 opacity-60 mb-2" onClick={() => onSelectPin(pin.id)}>
                         <div className="flex items-center">
                             <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-bold text-xs flex-shrink-0 mr-3"><CheckCircleIcon className="w-4 h-4"/></div>
                             <p className="text-sm text-slate-600 line-through truncate">{pin.comments[0]?.text || 'Resolved issue'}</p>
                         </div>
                     </div>
                ))}
            </div>
        }
      </div>

      {activePinId && !project.isLocked && !isReadOnly && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={`Replying to comment #${project.pins.find(p=>p.id === activePinId)?.number}...`}
              className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={3}
            />
             {attachment && (
              <div className="mt-2 flex items-center justify-between bg-slate-200 p-2 rounded-md text-sm">
                <span className="truncate max-w-[200px]">{attachment.name}</span>
                <button type="button" onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ""}}><XMarkIcon className="w-4 h-4 text-slate-600 hover:text-slate-900" /></button>
              </div>
            )}
             <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                    <button type="button" title="Attach image" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-indigo-600 p-2 rounded-full -ml-2">
                        <PaperClipIcon className="w-5 h-5" />
                    </button>
                    <button 
                        type="button" 
                        title="Take screenshot" 
                        onClick={handleScreenshotClick}
                        className="text-slate-500 hover:text-indigo-600 p-2 rounded-full"
                    >
                        <CameraIcon className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>

              <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:bg-indigo-300 disabled:cursor-not-allowed" disabled={!newCommentText.trim() && !attachment}>
                Add Reply
              </button>
            </div>
          </form>
        </div>
      )}
      
      <AIResultModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title={<><SparklesIcon className="w-6 h-6 mr-2 text-indigo-500"/> AI Feedback Summary</>}
        content={aiSummary}
        isLoading={isSummarizing}
       />
       
       <VisualAnalysisModal 
         isOpen={isAnalysisModalOpen}
         onClose={() => setIsAnalysisModalOpen(false)}
         project={project}
       />

       {viewingAttachment && (
        <ImageViewerModal
          isOpen={!!viewingAttachment}
          onClose={() => setViewingAttachment(null)}
          attachment={viewingAttachment}
        />
       )}
    </div>
  );
};

export default CommentSidebar;