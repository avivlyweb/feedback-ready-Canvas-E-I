import React, { useState, useEffect, useRef } from 'react';
import { Project, Pin, Comment as CommentType, CommentStatus } from '../types';
import { generateV2EvaluationSummary, runAIPrescan } from '../services/geminiService';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  LockClosedIcon, 
  LockOpenIcon, 
  SparklesIcon, 
  PaperClipIcon 
} from './icons';

interface CommentSidebarV2Props {
  project: Project;
  onAddComment: (pinId: string, text: string, attachment?: { data: string; name: string; type: string; }) => void;
  onDeleteComment: (pinId: string, commentId: string) => void;
  onResolvePin: (pinId: string) => void;
  activePinId: string | null;
  onSelectPin: (pinId: string | null) => void;
  onGoBack: () => void;
  onUpdateProject: (project: Project) => void;
  onTriggerImageScreenshot: (callback: (attachment: NonNullable<CommentType['attachment']>) => void) => void;
  onTriggerUrlScreenshot: (callback: (attachment: NonNullable<CommentType['attachment']>) => void) => void;
  isReadOnly?: boolean;
  reviewer?: { email: string; name: string };
}

export const CommentSidebarV2: React.FC<CommentSidebarV2Props> = ({
  project,
  onAddComment,
  onDeleteComment,
  onResolvePin,
  activePinId,
  onSelectPin,
  onGoBack,
  onUpdateProject,
  onTriggerImageScreenshot,
  onTriggerUrlScreenshot,
  isReadOnly = false,
  reviewer,
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'checklist' | 'preflight' | 'ai'>('findings');
  const [commentText, setCommentText] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // V2 composer states for active pin creation / update
  const [selectedSeverity, setSelectedSeverity] = useState<string>('must_fix');
  const [selectedCategory, setSelectedCategory] = useState<string>('styling');
  const [suggestedFix, setSuggestedFix] = useState<string>('');
  const [linkedChecklistId, setLinkedChecklistId] = useState<string>('');

  // AI Hint State
  const [aiHint, setAiHint] = useState<string | null>(null);

  // File Upload State
  const [commentAttachment, setCommentAttachment] = useState<CommentType['attachment'] | null>(null);

  // Parse checklists
  const checklistItems = project.checklist ? JSON.parse(project.checklist) : [];
  const preflightChecks = project.preflight ? JSON.parse(project.preflight) : [];
  const selfChecks = project.selfCheck ? JSON.parse(project.selfCheck) : null;

  // AI Summary local text state
  const [editableSummary, setEditableSummary] = useState(project.aiSummary || '');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // AI Pre-scan states
  const [aiPrescanResult, setAiPrescanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleRunAIPrescan = async () => {
    setIsScanning(true);
    try {
      const result = await runAIPrescan(project.name, project.content, project.notes || 'No student notes supplied.');
      setAiPrescanResult(result);
    } catch (e) {
      console.error(e);
      alert("Failed to perform AI pre-scan. Please ensure API_KEY is set.");
    } finally {
      setIsScanning(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('###')) {
        return <h3 key={index} className="text-sm font-bold text-indigo-400 mt-3 mb-1.5">{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('####')) {
        return <h4 key={index} className="text-xs font-bold text-slate-200 mt-2.5 mb-1.5">{line.replace('####', '').trim()}</h4>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h5 key={index} className="text-xs font-bold text-slate-300 mt-2 mb-1">{line.replace(/\*\*/g, '').trim()}</h5>;
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const cleanLine = line.trim().replace(/^[-*]\s*/, '');
        const parsed = cleanLine.split('`').map((part, pidx) => {
          if (pidx % 2 === 1) {
            return <code key={pidx} className="bg-slate-900 text-pink-400 px-1 py-0.5 rounded text-[10px] font-mono">{part}</code>;
          }
          return part;
        });
        return <li key={index} className="ml-3.5 list-disc text-[11px] text-slate-400 mb-1 leading-relaxed font-semibold">{parsed}</li>;
      }
      if (line.trim().length === 0) return <div key={index} className="h-1.5" />;
      
      const parsedLine = line.split('`').map((part, pidx) => {
        if (pidx % 2 === 1) {
          return <code key={pidx} className="bg-slate-900 text-pink-400 px-1 py-0.5 rounded text-[10px] font-mono">{part}</code>;
        }
        return part;
      });
      return <p key={index} className="text-[11px] text-slate-400 mb-1 leading-relaxed font-semibold">{parsedLine}</p>;
    });
  };

  // Sync AI Summary with project value if updated
  useEffect(() => {
    if (project.aiSummary) {
      setEditableSummary(project.aiSummary);
    }
  }, [project.aiSummary]);

  // Command + Enter event handler
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveComment();
    }
  };

  // Typing keywords listener for dynamic Category mapping suggestions!
  useEffect(() => {
    const text = commentText.toLowerCase();
    if (!text) {
      setAiHint(null);
      return;
    }

    if (text.includes('color') || text.includes('contrast') || text.includes('font') || text.includes('padding') || text.includes('style')) {
      setAiHint("💡 Tip: Set Rubric Category to 'Styling' & Severity to 'Should fix'");
    } else if (text.includes('broken') || text.includes('link') || text.includes('form') || text.includes('submit') || text.includes('click')) {
      setAiHint("💡 Tip: Set Rubric Category to 'Interactivity' & Severity to 'Must fix'");
    } else if (text.includes('aim') || text.includes('purpose') || text.includes('outcome') || text.includes('explain')) {
      setAiHint("💡 Tip: Set Rubric Category to 'Aim' & Severity to 'Nice to improve'");
    } else if (text.includes('privacy') || text.includes('cookie') || text.includes('compliance')) {
      setAiHint("💡 Tip: Set Rubric Category to 'Legal / Privacy' & Severity to 'Must fix'");
    } else if (text.includes('credit') || text.includes('source') || text.includes('ai')) {
      setAiHint("💡 Tip: Set Rubric Category to 'AI Use' or 'Legal / Privacy'");
    } else {
      setAiHint(null);
    }
  }, [commentText]);

  // Load reusable comment tag
  const loadReusableComment = (text: string) => {
    setCommentText(text);
    // Auto map values based on selected tag
    if (text.includes('contrast')) {
      setSelectedCategory('styling');
      setSelectedSeverity('must_fix');
    } else if (text.includes('anchor')) {
      setSelectedCategory('styling');
      setSelectedSeverity('should_fix');
    } else if (text.includes('privacy') || text.includes('cookie')) {
      setSelectedCategory('legal_privacy');
      setSelectedSeverity('must_fix');
    } else if (text.includes('label') || text.includes('form')) {
      setSelectedCategory('interactivity');
      setSelectedSeverity('must_fix');
    }
  };

  const handleSaveComment = () => {
    if (!activePinId || !commentText.trim()) return;

    // Call base comment action
    onAddComment(activePinId, commentText.trim(), commentAttachment || undefined);

    // Save extra V2 metadata fields directly on the pin!
    const updatedPins = project.pins.map(pin => {
      if (pin.id === activePinId) {
        return {
          ...pin,
          severity: selectedSeverity,
          rubricCategory: selectedCategory,
          suggestedFix: suggestedFix.trim() || undefined,
          linkedChecklistId: linkedChecklistId || undefined,
          findingStatus: 'open' as const, // Always sets to open on revision
        };
      }
      return pin;
    });

    onUpdateProject({
      ...project,
      pins: updatedPins,
    });

    // Reset local composer states
    setCommentText('');
    setCommentAttachment(null);
    setSuggestedFix('');
    setLinkedChecklistId('');
    setShowMoreOptions(false);
  };

  // Fast cycle checklist status: not_checked -> passed -> failed
  const toggleChecklistItem = (itemId: string) => {
    if (isReadOnly || project.isLocked) return;
    const updated = checklistItems.map((item: any) => {
      if (item.id === itemId) {
        let nextStatus = 'not_checked';
        if (item.status === 'not_checked') nextStatus = 'passed';
        else if (item.status === 'passed') nextStatus = 'failed';
        return { ...item, status: nextStatus };
      }
      return item;
    });

    onUpdateProject({
      ...project,
      checklist: JSON.stringify(updated),
    });
  };

  // Count open issues and check progress
  const openPins = project.pins.filter(p => p.status === CommentStatus.OPEN);
  const openMustFixCount = project.pins.filter(p => p.status === CommentStatus.OPEN && p.severity === 'must_fix').length;
  
  const passedChecksCount = checklistItems.filter((i: any) => i.status === 'passed').length;
  const failedChecksCount = checklistItems.filter((i: any) => i.status === 'failed').length;
  const checklistProgressPercentage = checklistItems.length > 0 
    ? Math.round((passedChecksCount / checklistItems.length) * 100)
    : 0;

  // Compile Dynamic Evaluation Markdown
  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summaryMarkdown = await generateV2EvaluationSummary(
        project.name,
        project.content,
        project.notes || 'No student notes supplied.',
        project.pins,
        checklistItems,
        preflightChecks
      );
      setEditableSummary(summaryMarkdown);
      
      // Save to server
      onUpdateProject({
        ...project,
        aiSummary: summaryMarkdown,
      });
    } catch (e) {
      console.error(e);
      alert("An error occurred while compiling the AI evaluation summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveEditableSummary = () => {
    onUpdateProject({
      ...project,
      aiSummary: editableSummary,
    });
    alert("AI summary evaluation saved successfully!");
  };

  const handleExportReview = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `esp_review_${project.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Publish processes
  const handlePublishReview = (readiness: 'changes_required' | 'submit_ready') => {
    onUpdateProject({
      ...project,
      submissionStatus: 'published',
      readinessStatus: readiness,
      isLocked: true, // Lock project upon publish
    });
    setIsPublishModalOpen(false);
    alert(`Success: Review published as ${readiness === 'submit_ready' ? '🚀 SUBMIT READY' : '⚠️ CHANGES REQUIRED'}!`);
  };

  // Selected active pin
  const activePin = project.pins.find(p => p.id === activePinId);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white font-sans border-l border-slate-800">
      {/* Header controls */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950">
        <button
          onClick={onGoBack}
          className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-3 h-3 mr-1.5" />
          Dashboard
        </button>

        <div className="flex items-center space-x-2">
          {project.isLocked ? (
            <span className="inline-flex items-center bg-red-950/60 text-red-400 border border-red-900/60 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
              <LockClosedIcon className="w-3 h-3 mr-1" /> Locked / Published
            </span>
          ) : (
            <span className="inline-flex items-center bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 px-2.5 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
              <LockOpenIcon className="w-3 h-3 mr-1" /> Open Review
            </span>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-xs font-bold flex-shrink-0 select-none">
        <button
          onClick={() => setActiveTab('findings')}
          className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'findings' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          Findings ({project.pins.length})
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'checklist' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          Checklist ({passedChecksCount}/10)
        </button>
        <button
          onClick={() => setActiveTab('preflight')}
          className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'preflight' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          Preflight
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'ai' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          Critique Markdown
        </button>
      </div>

      {/* Main tab scroll context */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-36">
        
        {/* TAB 1: FINDINGS / COMMENTS */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            {activePin ? (
              // Individual Pin Review details
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs">
                      {activePin.number}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Pin Details ({activePin.viewport?.toUpperCase()} viewport)
                    </span>
                  </div>
                  <button 
                    onClick={() => onSelectPin(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Close Pin
                  </button>
                </div>

                {/* Status and revision info */}
                <div className="flex items-center justify-between text-xs font-semibold bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      activePin.status === CommentStatus.RESOLVED 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' 
                        : 'bg-amber-950 text-amber-400 border border-amber-900/30'
                    }`}>
                      {activePin.status === CommentStatus.RESOLVED ? 'Verified / Resolved' : 'Open Finding'}
                    </span>
                  </div>
                  {!isReadOnly && !project.isLocked && (
                    <button
                      onClick={() => onResolvePin(activePin.id)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      {activePin.status === CommentStatus.RESOLVED ? 'Reopen Issue' : 'Mark Fixed'}
                    </button>
                  )}
                </div>

                {/* Comments list inside active pin */}
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                  {activePin.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No comments placed yet. Write a comment below to register this finding.</p>
                  ) : (
                    activePin.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 space-y-2 relative group">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-300">{comment.author}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">{comment.text}</p>
                        
                        {/* Render comment attachment */}
                        {comment.attachment && (
                          <div className="mt-2 border border-slate-800 rounded-lg overflow-hidden bg-slate-950 max-w-xs">
                            <img src={comment.attachment.data} alt="Screenshot attachment" className="w-full object-contain max-h-32" />
                            <span className="block text-[9px] text-slate-400 p-1 font-semibold truncate bg-slate-900 border-t border-slate-800">
                              📷 {comment.attachment.name}
                            </span>
                          </div>
                        )}

                        {!isReadOnly && !project.isLocked && (
                          <button
                            onClick={() => onDeleteComment(activePin.id, comment.id)}
                            className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                            title="Delete comment"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Pin Revision Status if student fixed */}
                {activePin.findingStatus === 'student_fixed' ? (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold flex items-center space-x-2">
                    <span>✨</span>
                    <span>Student marked this issue as "I fixed this"! Please recheck and Verify.</span>
                  </div>
                ) : (
                  isReadOnly && activePin.status === CommentStatus.OPEN && (
                    <button
                      onClick={() => {
                        const updatedPins = project.pins.map(pin => {
                          if (pin.id === activePin.id) {
                            return { ...pin, findingStatus: 'student_fixed' as const };
                          }
                          return pin;
                        });
                        onUpdateProject({ ...project, pins: updatedPins });
                        alert("You have marked this finding as fixed. The reviewer will re-evaluate upon re-review!");
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm focus:outline-none"
                    >
                      <span>🛠</span>
                      <span>I have fixed this on my code</span>
                    </button>
                  )
                )}

                {/* Composer area */}
                {!isReadOnly && !project.isLocked && (
                  <div className="space-y-3.5 pt-2 border-t border-slate-800">
                    <div className="relative">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={handleTextAreaKeyDown}
                        placeholder="Write dynamic feedback... (Cmd + Enter to save)"
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
                      />
                      {aiHint && (
                        <div className="absolute left-2 -bottom-2 text-[10px] text-indigo-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded shadow font-semibold">
                          {aiHint}
                        </div>
                      )}
                    </div>

                    {/* Quick reusable remarks pills */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Speed Reminders:</span>
                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                        {(project.reusableComments || []).map((remark, idx) => (
                          <button
                            key={idx}
                            onClick={() => loadReusableComment(remark)}
                            className="text-[10px] bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 font-semibold py-0.5 px-2 rounded-md transition-colors truncate max-w-full"
                            title={remark}
                          >
                            + {remark}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expand composer option details */}
                    <div className="border border-slate-800 rounded-lg bg-slate-900/30">
                      <button
                        type="button"
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center justify-between"
                      >
                        <span>⚙ Rubric, Severity & Checklists options</span>
                        <span className="text-[10px]">{showMoreOptions ? 'Hide' : 'Configure'}</span>
                      </button>

                      {showMoreOptions && (
                        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-3">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rubric category</label>
                              <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                              >
                                <option value="aim">Aim</option>
                                <option value="platform">Platform</option>
                                <option value="styling">Styling</option>
                                <option value="content">Content</option>
                                <option value="interactivity">Interactivity</option>
                                <option value="ai_use">AI Use</option>
                                <option value="legal_privacy">Legal / Privacy</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Severity Level</label>
                              <select
                                value={selectedSeverity}
                                onChange={(e) => setSelectedSeverity(e.target.value)}
                                className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                              >
                                <option value="must_fix">🔴 Must fix (Blocker)</option>
                                <option value="should_fix">🟡 Should fix</option>
                                <option value="nice_to_improve">🟢 Nice to improve</option>
                                <option value="note_praise">⭐ Note / Praise</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Suggested Fix (Optional)</label>
                            <input
                              type="text"
                              value={suggestedFix}
                              onChange={(e) => setSuggestedFix(e.target.value)}
                              placeholder="e.g. Add aria-label to submit slider"
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link to Checklist requirement</label>
                            <select
                              value={linkedChecklistId}
                              onChange={(e) => setLinkedChecklistId(e.target.value)}
                              className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                            >
                              <option value="">-- No checklist item --</option>
                              {checklistItems.map((item: any) => (
                                <option key={item.id} value={item.id}>
                                  Item #{item.id.replace('check_', '')}: {item.text.slice(0, 32)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Screenshot action bar */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => onTriggerUrlScreenshot((attach) => setCommentAttachment(attach))}
                          className="inline-flex items-center text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors focus:outline-none"
                        >
                          <PaperClipIcon className="w-3.5 h-3.5 mr-1" />
                          Crop Viewport
                        </button>
                        {commentAttachment && (
                          <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded max-w-[80px] truncate">
                            📎 Added
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleSaveComment}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg text-xs font-bold shadow-sm transition-all text-white focus:outline-none"
                      >
                        Save Comment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // List of all placing pins on project
              <div className="space-y-3.5">
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-semibold leading-normal">
                  💡 Click anywhere on the responsive iframe canvas to drop a review pin and write comments.
                </div>

                <div className="space-y-2.5">
                  {project.pins.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-bold text-xs italic">
                      No annotations placed yet.
                    </div>
                  ) : (
                    project.pins.map((p) => {
                      const latestComment = p.comments[p.comments.length - 1]?.text || 'No annotation registered.';
                      const isMustFix = p.severity === 'must_fix';

                      return (
                        <div
                          key={p.id}
                          onClick={() => onSelectPin(p.id)}
                          className={`bg-slate-950 border rounded-xl p-3.5 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all duration-200 flex items-start space-x-3 ${
                            activePinId === p.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-slate-900/50' : 'border-slate-800'
                          }`}
                        >
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full font-extrabold text-xs flex-shrink-0 text-white ${
                            p.status === CommentStatus.RESOLVED ? 'bg-green-500' : 'bg-indigo-600'
                          }`}>
                            {p.number}
                          </span>
                          <div className="space-y-1.5 flex-grow min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs bg-slate-800 text-slate-300 font-extrabold px-1.5 py-0.5 rounded">
                                {p.viewport?.toUpperCase()} View
                              </span>
                              
                              <div className="flex items-center space-x-1.5 text-[10px] font-extrabold uppercase">
                                <span className={`px-1.5 py-0.5 rounded ${
                                  p.severity === 'must_fix' ? 'bg-red-950 text-red-400 border border-red-900/20' :
                                  p.severity === 'should_fix' ? 'bg-amber-950 text-amber-400 border border-amber-900/20' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {p.severity?.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-normal font-semibold truncate">
                              {latestComment}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANDATORY CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>Checklist Completion Progress</span>
                <span>{passedChecksCount} / 10 Checked</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${checklistProgressPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Cycle through checklist states: 🟩 Pass 🟥 Blocker ⬛ Not Evaluated. Ensure all items are approved for Submit Ready status.
              </p>
            </div>

            <div className="space-y-2">
              {checklistItems.map((item: any) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-start justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                      item.status === 'passed' 
                        ? 'bg-emerald-950/30 border-emerald-900 text-emerald-300' 
                        : item.status === 'failed'
                        ? 'bg-red-950/30 border-red-900 text-red-300'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <span className="block text-xs font-bold leading-normal">{item.text}</span>
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      {item.status === 'passed' ? (
                        <span className="bg-emerald-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">PASS</span>
                      ) : item.status === 'failed' ? (
                        <span className="bg-red-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">BLOCK</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-1.5 py-0.5 rounded">PEND</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PREFLIGHT SIGNALS */}
        {activeTab === 'preflight' && (
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <h4 className="text-xs font-bold text-slate-300 mb-1">💡 Preflight Diagnostics</h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Review automated signals detected upon student submission. These identify compliance and configuration items.
              </p>
            </div>

            {/* AI Automated Audit Scan section */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-950/30 to-slate-950 border border-indigo-900/40 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-indigo-200">AI-Powered Compliance Audit</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Let Gemini perform a predictive pre-scan based on the submission URL, project metadata, and potential layout risks.
              </p>
              
              {!aiPrescanResult ? (
                <button
                  onClick={handleRunAIPrescan}
                  disabled={isScanning}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 focus:outline-none"
                >
                  <span>{isScanning ? 'Auditing website...' : 'Run Automated AI Pre-Scan'}</span>
                </button>
              ) : (
                <div className="space-y-3 pt-1 border-t border-indigo-900/30">
                  <div className="max-h-60 overflow-y-auto pr-1 text-slate-300 text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    {renderMarkdown(aiPrescanResult)}
                  </div>
                  <button
                    onClick={handleRunAIPrescan}
                    disabled={isScanning}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md transition-all focus:outline-none"
                  >
                    {isScanning ? 'Re-scanning...' : 'Re-run AI Pre-Scan'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {preflightChecks.map((check: any) => {
                return (
                  <div key={check.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{check.name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        check.status === 'pass_signal' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' :
                        check.status === 'warning' ? 'bg-amber-950 text-amber-400 border border-amber-900/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {check.status === 'pass_signal' ? 'Passed' : check.status === 'warning' ? 'Warning' : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                      {check.details}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AI RUBRIC SUMMARY */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                <SparklesIcon className="w-4 h-4 text-indigo-400" />
                <span>AI evaluation & Critique Draft</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Compile dynamic statistics and annotations from the live review into structured evaluation markdown.
              </p>
              {!isReadOnly && !project.isLocked && (
                <button
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingSummary}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>{isGeneratingSummary ? 'Processing summary...' : 'Compile summary evaluation'}</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <textarea
                value={editableSummary}
                onChange={(e) => setEditableSummary(e.target.value)}
                rows={14}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none resize-none leading-relaxed"
                placeholder="# Markdown evaluation summary..."
              />
              {!isReadOnly && !project.isLocked && editableSummary && (
                <button
                  onClick={handleSaveEditableSummary}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all"
                >
                  Save Edited Markdown
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Card Footer for Submitting/Publishing review */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col space-y-2.5 z-20 shadow-2xl">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 px-1">
          <span>Failed requirements: <strong className="text-red-400 font-bold">{failedChecksCount}</strong></span>
          <span>Must-fix Blockers: <strong className="text-red-400 font-bold">{openMustFixCount}</strong></span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleExportReview}
            className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold shadow border border-slate-700/80 transition-all"
          >
            Export JSON
          </button>

          {!isReadOnly && !project.isLocked ? (
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 transition-all"
            >
              Publish Review
            </button>
          ) : (
            <button
              disabled
              className="py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold border border-slate-850 cursor-not-allowed"
            >
              Published
            </button>
          )}
        </div>
      </div>

      {/* Publish modal overlays */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl space-y-5 animate-scale-in">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Publish Feedback & Status</span>
            </h3>

            <div className="space-y-3 text-sm leading-relaxed">
              <p className="text-slate-400 font-semibold text-xs">
                Before finalizing review status, confirm following conditions:
              </p>

              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Mandatory checklist (100%):</span>
                  <span className={checklistProgressPercentage === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                    {passedChecksCount} / 10 Passed
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Open Blocker issues (0):</span>
                  <span className={openMustFixCount === 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {openMustFixCount} unresolved must-fix
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Button 1: Changes Required (Always allowed) */}
              <button
                onClick={() => handlePublishReview('changes_required')}
                className="w-full py-3 bg-red-950/40 border border-red-900/60 hover:bg-red-900/20 text-red-400 rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                Publish Feedback (Changes Required)
              </button>

              {/* Button 2: Mark Submit Ready (Only if criteria met) */}
              <button
                disabled={passedChecksCount < 10 || openMustFixCount > 0}
                onClick={() => handlePublishReview('submit_ready')}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                  passedChecksCount === 10 && openMustFixCount === 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                }`}
              >
                Publish & Mark Submit Ready
              </button>

              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel / Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CommentSidebarV2;
