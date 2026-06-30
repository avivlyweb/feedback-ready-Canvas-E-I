import React, { useState, useCallback } from 'react';
import { Project, Pin, Comment as CommentType, CommentStatus, ContentType } from '../types';
import AnnotationCanvas from './AnnotationCanvas';
import { CommentSidebarV2 } from './CommentSidebarV2';
import { GripVerticalIcon } from './icons';

interface ProjectViewV2Props {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onGoBack: () => void;
  reviewer?: { email: string; name: string };
  isReadOnly?: boolean;
}

export const ProjectViewV2: React.FC<ProjectViewV2Props> = ({
  project,
  onUpdateProject,
  onGoBack,
  reviewer,
  isReadOnly = false,
}) => {
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [mode, setMode] = useState<'comment' | 'browse'>('comment');
  const [sidebarWidth, setSidebarWidth] = useState(416); // Slightly wider default for v2 rich tabs (26rem)
  
  const [screenshotState, setScreenshotState] = useState<{
    mode: 'idle' | 'image_select' | 'url_crop';
    callback: ((attachment: NonNullable<CommentType['attachment']>) => void) | null;
    cropDataUrl?: string;
  }>({
    mode: 'idle',
    callback: null,
  });

  const handleTriggerImageScreenshot = useCallback((callback: (attachment: NonNullable<CommentType['attachment']>) => void) => {
    setScreenshotState({ mode: 'image_select', callback, cropDataUrl: undefined });
  }, []);
  
  const handleTriggerUrlScreenshot = useCallback(async (callback: (attachment: NonNullable<CommentType['attachment']>) => void) => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Your browser does not support screen capturing.");
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          displaySurface: "browser"
        } as any,
        audio: false,
      });
      
      const video = document.createElement('video');
      
      const videoReady = new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().catch(reject);
        };
        video.onplaying = () => resolve();
        video.onerror = (err) => reject(err);
      });

      video.srcObject = stream;
      await videoReady;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshotState({ mode: 'url_crop', callback, cropDataUrl: dataUrl });
      } else {
        console.error("Could not get canvas context.");
        setScreenshotState({ mode: 'idle', callback: null });
      }
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn("Screenshot capture was cancelled or failed.", err);
      setScreenshotState({ mode: 'idle', callback: null });
    }
  }, []);

  const handleScreenshotComplete = useCallback((dataUrl: string) => {
    if (screenshotState.callback) {
      const attachment = {
        data: dataUrl,
        name: `screenshot-${Date.now()}.png`,
        type: 'image/png'
      };
      screenshotState.callback(attachment);
    }
    setScreenshotState({ mode: 'idle', callback: null });
  }, [screenshotState.callback]);

  const handleScreenshotCancel = useCallback(() => {
    setScreenshotState({ mode: 'idle', callback: null });
  }, []);

  const handleAddPin = useCallback((x: number, y: number, viewport?: string) => {
    if (isReadOnly || project.isLocked) return;
    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      number: project.pins.length + 1,
      x,
      y,
      status: CommentStatus.OPEN,
      comments: [],
      // V2 attributes
      viewport: viewport || 'desktop',
      findingStatus: 'open',
      severity: 'must_fix', // Default as per "severity checklist blocking" rule
      rubricCategory: 'interactivity', // Default category
    };
    const updatedProject = { ...project, pins: [...project.pins, newPin] };
    onUpdateProject(updatedProject);
    setActivePinId(newPin.id);
  }, [project, onUpdateProject, isReadOnly]);

  const handleSelectPin = useCallback((pinId: string | null) => {
    if (activePinId && activePinId !== pinId) {
      const activePin = project.pins.find(p => p.id === activePinId);
      if (activePin && activePin.comments.length === 0) {
        const updatedPins = project.pins.filter(p => p.id !== activePinId)
          .map((p, index) => ({ ...p, number: index + 1 }));
        onUpdateProject({ ...project, pins: updatedPins });
      }
    }
    setActivePinId(pinId);
  }, [activePinId, project, onUpdateProject]);

  const handleGoBack = useCallback(() => {
    if (activePinId) {
      const activePin = project.pins.find(p => p.id === activePinId);
      if (activePin && activePin.comments.length === 0) {
        const updatedPins = project.pins.filter(p => p.id !== activePinId)
          .map((p, index) => ({ ...p, number: index + 1 }));
        onUpdateProject({ ...project, pins: updatedPins });
      }
    }
    onGoBack();
  }, [activePinId, project, onUpdateProject, onGoBack]);

  const handleAddComment = useCallback((pinId: string, text: string, attachment?: { data: string; name: string; type: string; }) => {
    if (isReadOnly || project.isLocked) return;
    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      author: reviewer?.name || 'Reviewer',
      text,
      timestamp: new Date(),
      attachment,
    };

    const updatedPins = project.pins.map(pin => {
      if (pin.id === pinId) {
        return { ...pin, comments: [...pin.comments, newComment] };
      }
      return pin;
    });

    onUpdateProject({ ...project, pins: updatedPins });
  }, [project, onUpdateProject, reviewer, isReadOnly]);
  
  const handleDeleteComment = useCallback((pinId: string, commentId: string) => {
    if (isReadOnly || project.isLocked) return;

    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    const updatedPins = project.pins.map(pin => {
      if (pin.id === pinId) {
        const updatedComments = pin.comments.filter(comment => comment.id !== commentId);
        return { ...pin, comments: updatedComments };
      }
      return pin;
    });

    onUpdateProject({ ...project, pins: updatedPins });
  }, [project, onUpdateProject, isReadOnly]);

  const handleResolvePin = useCallback((pinId: string) => {
    if (isReadOnly || project.isLocked) return;
    const updatedPins = project.pins.map(pin => {
      if (pin.id === pinId) {
        const nextStatus = pin.status === CommentStatus.OPEN ? CommentStatus.RESOLVED : CommentStatus.OPEN;
        const nextFindingStatus = nextStatus === CommentStatus.RESOLVED ? 'verified' : 'open';
        return { 
          ...pin, 
          status: nextStatus,
          findingStatus: nextFindingStatus as any
        };
      }
      return pin;
    });
    onUpdateProject({ ...project, pins: updatedPins });
  }, [project, onUpdateProject, isReadOnly]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startSize = sidebarWidth;
    const startPosition = mouseDownEvent.clientX;

    function onMouseMove(mouseMoveEvent: MouseEvent) {
      const newWidth = startSize - (mouseMoveEvent.clientX - startPosition);
      const minWidth = 360;
      const maxWidth = 720;

      if (newWidth > minWidth && newWidth < maxWidth) {
        setSidebarWidth(newWidth);
      }
    }

    function onMouseUp() {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp, { once: true });
  }, [sidebarWidth]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDFReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const margin = 20;
      let y = 20;
      const pageHeight = 297;
      
      const checkPageOverflow = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          
          // Header line on every page
          doc.setFont("Helvetica", "oblique");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // light slate gray
          doc.text(`ESP Amsterdam Critique Report - ${project.name}`, margin, 12);
          doc.line(margin, 14, 210 - margin, 14);
          y = 22;
        }
      };

      // --- Draw Primary Header block ---
      doc.setFillColor(30, 41, 59); // Slate Blue
      doc.rect(0, 0, 210, 40, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("ESP AMSTERDAM", margin, 18);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(199, 210, 254); // light indigo
      doc.text("Critique & Quality Assurance Audit Report V2", margin, 28);

      y = 55;

      // --- Subtitle / Metadata ---
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("AUDIT METADATA", margin, y);
      doc.line(margin, y + 2, 210 - margin, y + 2);
      y += 10;

      // Draw metadata grid
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);

      const metadata = [
        ["Project Name:", project.name],
        ["Submission Type:", project.type],
        ["Content Target:", project.content.length > 55 ? project.content.slice(0, 52) + '...' : project.content],
        ["Assessed By:", reviewer ? `${reviewer.name} (${reviewer.email})` : "ESP Amsterdam Reviewer"],
        ["Review Date:", new Date().toLocaleDateString()],
        ["Audit Status:", project.isLocked ? "Published & Finalized" : "Under Active Review"]
      ];

      metadata.forEach(([label, value]) => {
        doc.setFont("Helvetica", "bold");
        doc.text(label, margin, y);
        doc.setFont("Helvetica", "normal");
        doc.text(value, margin + 45, y);
        y += 7;
      });

      y += 5;

      // --- Metrics Panel (Bento style) ---
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("EVALUATION METRICS SUMMARY", margin, y);
      doc.line(margin, y + 2, 210 - margin, y + 2);
      y += 10;

      // Parse checklists
      const checklistItems = project.checklist ? JSON.parse(project.checklist) : [];
      const passedChecksCount = checklistItems.filter((item: any) => item.checked).length;
      const unresolvedCount = project.pins.filter(p => p.status === CommentStatus.OPEN).length;

      // Shaded summary box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, 170, 32, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, 170, 32, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("Passed Checklist Rules:", margin + 8, y + 10);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text(`${passedChecksCount} of ${checklistItems.length || 10} Rules Verified`, margin + 65, y + 10);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Total Pin Annotations:", margin + 8, y + 18);
      doc.setFont("Helvetica", "normal");
      doc.text(`${project.pins.length} coordinates placed`, margin + 65, y + 18);

      doc.setFont("Helvetica", "bold");
      doc.text("Unresolved Findings:", margin + 8, y + 26);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(unresolvedCount > 0 ? 225 : 79, unresolvedCount > 0 ? 29 : 70, unresolvedCount > 0 ? 72 : 229); // Red if > 0
      doc.text(`${unresolvedCount} critical items remaining`, margin + 65, y + 26);

      y += 42;

      // --- Original Submission Snapshot ---
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("ORIGINAL SUBMISSION PROOF", margin, y);
      doc.line(margin, y + 2, 210 - margin, y + 2);
      y += 10;

      let hasEmbeddedImage = false;
      if (project.type === ContentType.IMAGE && project.content && project.content.startsWith('data:image')) {
        try {
          const format = project.content.includes('jpeg') || project.content.includes('jpg') ? 'JPEG' : 'PNG';
          doc.addImage(project.content, format, margin, y, 170, 85);
          hasEmbeddedImage = true;
          y += 90;
        } catch (err) {
          console.error("Failed to add base64 project image to PDF", err);
        }
      } else {
        const snapshotsArray = project.snapshots ? JSON.parse(project.snapshots) : [];
        const firstSnap = snapshotsArray.find((s: any) => s.screenshotUrl);
        if (firstSnap && firstSnap.screenshotUrl && firstSnap.screenshotUrl.startsWith('data:image')) {
          try {
            const format = firstSnap.screenshotUrl.includes('jpeg') || firstSnap.screenshotUrl.includes('jpg') ? 'JPEG' : 'PNG';
            doc.addImage(firstSnap.screenshotUrl, format, margin, y, 170, 85);
            hasEmbeddedImage = true;
            y += 90;
          } catch (err) {
            console.error("Failed to add base64 snapshot image to PDF", err);
          }
        }
      }

      if (!hasEmbeddedImage) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, 170, 40, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, 170, 40, "S");
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Live Web Viewport Active: Original snapshot captured inside", margin + 15, y + 16);
        doc.text(`the Vault. URL Target: ${project.content}`, margin + 15, y + 24);
        y += 50;
      }

      // --- PAGE 2: Critique & Summary ---
      doc.addPage();
      y = margin;

      doc.setFillColor(30, 41, 59); // Slate Blue
      doc.rect(0, 0, 210, 25, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("ESP AMSTERDAM CRITIQUE REPORT", margin, 16);

      y = 40;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("ANNOTATED CRITIQUE SUMMARY", margin, y);
      doc.line(margin, y + 2, 210 - margin, y + 2);
      y += 12;

      const feedbackSummary = project.aiSummary || "No detailed evaluation summary written yet for this review.";
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      const summaryLines = doc.splitTextToSize(feedbackSummary, 170);
      summaryLines.forEach((line: string) => {
        checkPageOverflow(7);
        doc.text(line, margin, y);
        y += 6;
      });

      y += 10;

      // --- PAGE 3: Unresolved Findings ---
      checkPageOverflow(25);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("UNRESOLVED FINDINGS & COMPLIANCE GAP", margin, y);
      doc.line(margin, y + 2, 210 - margin, y + 2);
      y += 12;

      const unresolvedPins = project.pins.filter(p => p.status === CommentStatus.OPEN);

      if (unresolvedPins.length === 0) {
        checkPageOverflow(20);
        doc.setFillColor(240, 253, 250); // Light green bg
        doc.rect(margin, y, 170, 18, "F");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(13, 148, 136); // Teal
        doc.text("✓ ALL FINDINGS SECURELY RESOLVED", margin + 8, y + 11);
        y += 25;
      } else {
        unresolvedPins.forEach((pin) => {
          let neededHeight = 35;
          const commentsList = pin.comments || [];
          neededHeight += commentsList.length * 12;

          checkPageOverflow(neededHeight);

          doc.setFillColor(254, 242, 242); // Light red background
          doc.rect(margin, y, 170, neededHeight - 5, "F");
          doc.setDrawColor(254, 202, 202);
          doc.rect(margin, y, 170, neededHeight - 5, "S");

          // Title
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(185, 28, 28);
          doc.text(`Finding #${pin.number} - [Viewport: ${pin.viewport?.toUpperCase() || 'DESKTOP'}]`, margin + 6, y + 9);

          // Details
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Category: ${pin.rubricCategory?.toUpperCase() || 'UNCLASSIFIED'}`, margin + 6, y + 16);
          
          const sev = pin.severity || 'must_fix';
          if (sev === 'must_fix') {
            doc.setTextColor(225, 29, 72);
            doc.text("Severity: MUST FIX (BLOCKING)", margin + 85, y + 16);
          } else if (sev === 'should_fix') {
            doc.setTextColor(249, 115, 22);
            doc.text("Severity: SHOULD FIX", margin + 85, y + 16);
          } else {
            doc.setTextColor(79, 70, 229);
            doc.text("Severity: NICE TO IMPROVE", margin + 85, y + 16);
          }

          y += 23;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text("Suggested Fix:", margin + 6, y);
          doc.setFont("Helvetica", "normal");
          const fixText = pin.suggestedFix || "No automated/written fix suggested yet.";
          const wrappedFix = doc.splitTextToSize(fixText, 150);
          doc.text(wrappedFix, margin + 6, y + 4);
          
          y += (wrappedFix.length * 5) + 3;

          // Comments list
          if (commentsList.length > 0) {
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text("Audit Log:", margin + 6, y);
            y += 4;

            commentsList.forEach((comment) => {
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(8);
              doc.setTextColor(71, 85, 105);
              doc.text(`${comment.author}:`, margin + 12, y);

              doc.setFont("Helvetica", "normal");
              const commentLines = doc.splitTextToSize(comment.text, 125);
              doc.text(commentLines, margin + 38, y);
              y += (commentLines.length * 4.5) + 1.5;
            });
          }

          y += 10; // gap
        });
      }

      doc.save(`ESP-Critique-Report-${project.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF Report. Error details logged to console.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-10rem)] flex flex-col">
      {/* Premium Top Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 px-6 py-4 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-750 transition-all focus:outline-none"
            title="Return to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-white tracking-tight truncate max-w-[280px]">
                {project.name}
              </h2>
              <span className={`px-2 py-0.5 text-[8.5px] font-black rounded uppercase tracking-wider ${
                project.type === ContentType.URL 
                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-900/50' 
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-900/50'
              }`}>
                {project.type}
              </span>
              {project.isLocked && (
                <span className="bg-red-950/80 text-red-400 border border-red-900/50 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">
                  Locked
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[340px] mt-0.5 font-mono">
              {project.content}
            </p>
          </div>
        </div>

        {/* Action Button: Download Report */}
        <button
          onClick={handleDownloadPDFReport}
          disabled={isGeneratingPdf}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400/40 transition-all flex items-center space-x-2 shrink-0"
        >
          {isGeneratingPdf ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Compiling Report...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Download Report</span>
            </>
          )}
        </button>
      </div>

      {/* Main split canvas container */}
      <div className="flex-grow flex bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-0">
        <div className="flex-grow relative bg-slate-100 min-w-0">
          <AnnotationCanvas
            project={project}
            onAddPin={handleAddPin}
            activePinId={activePinId}
            onSelectPin={handleSelectPin}
            mode={mode}
            onSetMode={setMode}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onResolvePin={handleResolvePin}
            isImageScreenshotMode={screenshotState.mode === 'image_select'}
            fullPageScreenshotForCrop={screenshotState.mode === 'url_crop' ? screenshotState.cropDataUrl! : null}
            onScreenshot={handleScreenshotComplete}
            onScreenshotCancel={handleScreenshotCancel}
            onTriggerImageScreenshot={handleTriggerImageScreenshot}
            onTriggerUrlScreenshot={handleTriggerUrlScreenshot}
            isReadOnly={isReadOnly}
          />
        </div>
        
        {/* Resizer Handle */}
        <div
          className="w-2 flex-shrink-0 cursor-col-resize bg-slate-100 hover:bg-indigo-100 transition-colors flex items-center justify-center group"
          onMouseDown={startResizing}
          title="Resize sidebar"
        >
          <GripVerticalIcon className="h-6 w-auto text-slate-400 group-hover:text-indigo-500" />
        </div>

        <div 
          className="flex-shrink-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          <CommentSidebarV2
            project={project}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onResolvePin={handleResolvePin}
            activePinId={activePinId}
            onSelectPin={handleSelectPin}
            onGoBack={handleGoBack}
            onUpdateProject={onUpdateProject}
            onTriggerImageScreenshot={handleTriggerImageScreenshot}
            onTriggerUrlScreenshot={handleTriggerUrlScreenshot}
            isReadOnly={isReadOnly}
            reviewer={reviewer}
          />
        </div>
      </div>
    </div>
  );
};
export default ProjectViewV2;
