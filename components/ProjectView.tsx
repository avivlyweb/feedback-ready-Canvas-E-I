import React, { useState, useCallback } from 'react';
import { Project, Pin, Comment as CommentType, CommentStatus, ContentType } from '../types';
import AnnotationCanvas from './AnnotationCanvas';
import CommentSidebar from './CommentSidebar';
import { GripVerticalIcon } from './icons';

interface ProjectViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onGoBack: () => void;
  reviewer?: { email: string; name: string };
  isReadOnly?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, onUpdateProject, onGoBack, reviewer, isReadOnly = false }) => {
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [mode, setMode] = useState<'comment' | 'browse'>('comment');
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default width (24rem)
  
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
          displaySurface: "browser" // Prioritize capturing browser tabs
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

  const handleAddPin = useCallback((x: number, y: number) => {
    if (isReadOnly || project.isLocked) return;
    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      number: project.pins.length + 1,
      x,
      y,
      status: CommentStatus.OPEN,
      comments: [],
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
      author: reviewer?.name || 'Student', // Logged-in reviewer name
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
        return { ...pin, status: pin.status === CommentStatus.OPEN ? CommentStatus.RESOLVED : CommentStatus.OPEN };
      }
      return pin;
    });
    onUpdateProject({ ...project, pins: updatedPins });
  }, [project, onUpdateProject]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startSize = sidebarWidth;
    const startPosition = mouseDownEvent.clientX;

    function onMouseMove(mouseMoveEvent: MouseEvent) {
      const newWidth = startSize - (mouseMoveEvent.clientX - startPosition);
      const minWidth = 320; // 20rem
      const maxWidth = 640; // 40rem

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

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      <div className="flex-grow relative bg-slate-100 min-w-0"> {/* min-w-0 prevents flexbox overflow */}
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
        <CommentSidebar
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
        />
      </div>
    </div>
  );
};

export default ProjectView;