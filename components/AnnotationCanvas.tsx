import React, { useRef, MouseEvent as ReactMouseEvent, useState, useEffect } from 'react';
import { Project, ContentType, CommentStatus, Comment } from '../types';
import { ChatBubbleOvalLeftEllipsisIcon, CursorArrowRaysIcon, DevicePhoneMobileIcon, DeviceTabletIcon, ComputerDesktopIcon, ArrowsPointingOutIcon, LockClosedIcon, XMarkIcon, LassoIcon, RectangleIcon } from './icons';
import PinPopover from './PinPopover';

interface ScreenshotToolProps {
  imageElement: HTMLImageElement;
  containerRef: React.RefObject<HTMLDivElement>;
  onScreenshot: (dataUrl: string) => void;
  onCancel: () => void;
}

const ScreenshotTool: React.FC<ScreenshotToolProps> = ({ imageElement, containerRef, onScreenshot, onCancel }) => {
  const [selection, setSelection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [mode, setMode] = useState<'rectangle' | 'freehand'>('rectangle');
  const [path, setPath] = useState<{x: number; y: number}[]>([]);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const scale = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    if (canvas.width !== width * scale || canvas.height !== height * scale) {
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);
    }
    
    ctx.clearRect(0, 0, width, height);
    
    if (isSelecting) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;

      if (mode === 'rectangle' && selection) {
        ctx.setLineDash([4, 4]);
        const rectWidth = selection.endX - selection.startX;
        const rectHeight = selection.endY - selection.startY;
        ctx.strokeRect(selection.startX, selection.startY, rectWidth, rectHeight);
      } else if (mode === 'freehand' && path.length > 1) {
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    }
  }, [selection, path, mode, isSelecting]);

  const getCoordsInContainer = (e: ReactMouseEvent | MouseEvent): {x: number, y: number} | null => {
    if (!containerRef.current) return null;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + container.scrollLeft,
      y: e.clientY - rect.top + container.scrollTop,
    };
  }

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    const coords = getCoordsInContainer(e);
    if (!coords) return;
    
    e.preventDefault();
    setIsSelecting(true);
    if (mode === 'rectangle') {
        setSelection({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
    } else {
        setPath([coords]);
    }
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isSelecting) return;
    const coords = getCoordsInContainer(e);
    if (!coords) return;

    if (mode === 'rectangle' && selection) {
        setSelection({ ...selection, endX: coords.x, endY: coords.y });
    } else {
        setPath(p => [...p, coords]);
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting || !imageElement) {
      if(isSelecting) onCancel();
      setIsSelecting(false);
      return;
    };

    if (mode === 'rectangle' && selection) {
        const rect = {
            left: Math.min(selection.startX, selection.endX),
            top: Math.min(selection.startY, selection.endY),
            width: Math.abs(selection.startX - selection.endX),
            height: Math.abs(selection.startY - selection.endY),
        };
        if (rect.width < 5 || rect.height < 5) {
            onCancel();
        } else {
            captureFromRect(rect);
        }
    } else if (mode === 'freehand' && path.length > 2) {
        const minX = Math.min(...path.map(p => p.x));
        const minY = Math.min(...path.map(p => p.y));
        const maxX = Math.max(...path.map(p => p.x));
        const maxY = Math.max(...path.map(p => p.y));
        const rect = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
        if (rect.width < 5 || rect.height < 5) {
            onCancel();
        } else {
            captureFromPath(path, rect);
        }
    } else {
        onCancel();
    }
    
    setIsSelecting(false);
    setSelection(null);
    setPath([]);
  };

  const captureFromRect = (rect: {left: number, top: number, width: number, height: number}) => {
    if (!imageElement.naturalWidth || !imageElement.naturalHeight || !imageElement.offsetWidth || !imageElement.offsetHeight) return onCancel();
    
    const scaleX = imageElement.naturalWidth / imageElement.offsetWidth;
    const scaleY = imageElement.naturalHeight / imageElement.offsetHeight;

    const sx = (rect.left - imageElement.offsetLeft) * scaleX;
    const sy = (rect.top - imageElement.offsetTop) * scaleY;
    const sWidth = rect.width * scaleX;
    const sHeight = rect.height * scaleY;
    
    const clampedSx = Math.max(0, sx);
    const clampedSy = Math.max(0, sy);
    const clampedSWidth = Math.min(sWidth, imageElement.naturalWidth - clampedSx);
    const clampedSHeight = Math.min(sHeight, imageElement.naturalHeight - clampedSy);

    const canvas = document.createElement('canvas');
    canvas.width = clampedSWidth;
    canvas.height = clampedSHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx && clampedSWidth > 0 && clampedSHeight > 0) {
      ctx.drawImage(imageElement, clampedSx, clampedSy, clampedSWidth, clampedSHeight, 0, 0, clampedSWidth, clampedSHeight);
      onScreenshot(canvas.toDataURL('image/png'));
    } else {
      onCancel();
    }
  }
  
  const captureFromPath = (capturePath: {x: number, y: number}[], rect: {left: number, top: number, width: number, height: number}) => {
    if (!imageElement.naturalWidth || !imageElement.naturalHeight || !imageElement.offsetWidth || !imageElement.offsetHeight) return onCancel();

    const scaleX = imageElement.naturalWidth / imageElement.offsetWidth;
    const scaleY = imageElement.naturalHeight / imageElement.offsetHeight;

    const sx = (rect.left - imageElement.offsetLeft) * scaleX;
    const sy = (rect.top - imageElement.offsetTop) * scaleY;
    const sWidth = rect.width * scaleX;
    const sHeight = rect.height * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = sWidth;
    canvas.height = sHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx && sWidth > 0 && sHeight > 0) {
      ctx.save();
      ctx.beginPath();
      capturePath.forEach((p, index) => {
        const canvasX = ((p.x - imageElement.offsetLeft) * scaleX) - sx;
        const canvasY = ((p.y - imageElement.offsetTop) * scaleY) - sy;
        if (index === 0) {
          ctx.moveTo(canvasX, canvasY);
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      });
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
      ctx.restore();
      onScreenshot(canvas.toDataURL('image/png'));
    } else {
      onCancel();
    }
  }

  const getToolButtonClass = (buttonMode: typeof mode) => 
    `p-2 rounded-md transition-colors ${mode === buttonMode ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-800 hover:bg-slate-200'}`;
  
  return (
    <div 
      className="absolute inset-0 z-30 bg-black bg-opacity-50 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={isSelecting ? handleMouseUp : undefined}
    >
      <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="sticky top-4 left-1/2 -translate-x-1/2 bg-white/90 text-slate-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg animate-fade-in-fast pointer-events-none">
        Click and drag to capture an area
      </div>
      
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className="flex items-center bg-white/90 rounded-full p-1 shadow-lg">
          <button onClick={() => setMode('rectangle')} className={getToolButtonClass('rectangle')} title="Rectangle select">
            <RectangleIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setMode('freehand')} className={getToolButtonClass('freehand')} title="Freehand select (Lasso)">
            <LassoIcon className="w-5 h-5" />
          </button>
        </div>
        <button onClick={onCancel} className="bg-white/90 rounded-full p-2 text-slate-800 hover:bg-slate-200 shadow-lg" title="Cancel screenshot">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

interface AnnotationCanvasProps {
  project: Project;
  onAddPin: (x: number, y: number) => void;
  activePinId: string | null;
  onSelectPin: (pinId: string | null) => void;
  mode: 'comment' | 'browse';
  onSetMode: (mode: 'comment' | 'browse') => void;
  onAddComment: (pinId: string, text: string, attachment?: NonNullable<Comment['attachment']>) => void;
  onDeleteComment: (pinId: string, commentId: string) => void;
  onResolvePin: (pinId: string) => void;
  isImageScreenshotMode: boolean;
  fullPageScreenshotForCrop: string | null;
  onScreenshot: (dataUrl: string) => void;
  onScreenshotCancel: () => void;
  onTriggerImageScreenshot: (callback: (attachment: NonNullable<Comment['attachment']>) => void) => void;
  onTriggerUrlScreenshot: (callback: (attachment: NonNullable<Comment['attachment']>) => void) => void;
  isReadOnly?: boolean;
}

const viewports = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1280px',
  full: null,
};

const ResponsiveToolbar: React.FC<{ onResize: (width: string | null) => void; activeWidth: string | null }> = ({ onResize, activeWidth }) => {
  const getButtonClass = (width: string | null) => 
    `p-2 rounded-md transition-colors ${activeWidth === width ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-300'}`;

  return (
    <div className="flex-shrink-0 bg-slate-200 p-1 flex justify-center items-center space-x-2 border-b border-slate-300">
      <button onClick={() => onResize(viewports.mobile)} title="Mobile (375px)" className={getButtonClass(viewports.mobile)}>
        <DevicePhoneMobileIcon className="w-5 h-5" />
      </button>
      <button onClick={() => onResize(viewports.tablet)} title="Tablet (768px)" className={getButtonClass(viewports.tablet)}>
        <DeviceTabletIcon className="w-5 h-5" />
      </button>
      <button onClick={() => onResize(viewports.desktop)} title="Desktop (1280px)" className={getButtonClass(viewports.desktop)}>
        <ComputerDesktopIcon className="w-5 h-5" />
      </button>
      <div className="h-5 w-px bg-slate-300 mx-1"></div>
      <button onClick={() => onResize(viewports.full)} title="Full width" className={getButtonClass(viewports.full)}>
        <ArrowsPointingOutIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ 
  project, 
  onAddPin, 
  activePinId, 
  onSelectPin, 
  mode, 
  onSetMode,
  onAddComment,
  onDeleteComment,
  onResolvePin,
  isImageScreenshotMode,
  fullPageScreenshotForCrop,
  onScreenshot,
  onScreenshotCancel,
  onTriggerImageScreenshot,
  onTriggerUrlScreenshot,
  isReadOnly = false
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperContainerRef = useRef<HTMLDivElement>(null);
  const [cropperImageElement, setCropperImageElement] = useState<HTMLImageElement | null>(null);
  const [iframeWidth, setIframeWidth] = useState<string | null>(viewports.full);

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if(isImageScreenshotMode || fullPageScreenshotForCrop) return;
    
    if ((e.target as HTMLElement).closest('.pin-element') || (e.target as HTMLElement).closest('.pin-popover')) {
      return;
    }
      
    if (mode === 'comment' && !project.isLocked && !isReadOnly) {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left + canvasRef.current.scrollLeft) / canvasRef.current.scrollWidth) * 100;
        const y = ((e.clientY - rect.top + canvasRef.current.scrollTop) / canvasRef.current.scrollHeight) * 100;
        onAddPin(x, y);
      }
    } else {
      onSelectPin(null);
    }
  };

  const activePin = project.pins.find(p => p.id === activePinId);
  const showPins = project.type === ContentType.URL ? mode === 'comment' : true;


  return (
    <div className="w-full h-full flex flex-col">
       {project.type === ContentType.URL && <ResponsiveToolbar onResize={setIframeWidth} activeWidth={iframeWidth} />}
      
      {fullPageScreenshotForCrop && (
        <div 
          ref={cropperContainerRef}
          className="absolute inset-0 z-40 bg-slate-800/90 flex flex-col items-center justify-center p-8 animate-fade-in"
        >
          <div className="text-white text-lg font-bold mb-4 bg-black/40 py-2 px-5 rounded-full shadow-lg">
            Crop your selection
          </div>
          <img
            src={fullPageScreenshotForCrop}
            alt="Full page screenshot for cropping"
            className="max-w-full max-h-[calc(100vh-18rem)] object-contain shadow-2xl"
            onLoad={(e) => setCropperImageElement(e.currentTarget)}
            style={{ userSelect: 'none' }}
          />
          {cropperImageElement && (
            <ScreenshotTool
              imageElement={cropperImageElement}
              containerRef={cropperContainerRef}
              onScreenshot={onScreenshot}
              onCancel={onScreenshotCancel}
            />
          )}
        </div>
      )}

      <div
        ref={canvasRef}
        className={`w-full h-full relative overflow-auto flex-grow ${project.type === ContentType.URL && mode === 'comment' && !project.isLocked && !isImageScreenshotMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleCanvasClick}
      >
        {isImageScreenshotMode && project.type === ContentType.IMAGE && imageRef.current && (
          <ScreenshotTool
            imageElement={imageRef.current}
            containerRef={canvasRef}
            onScreenshot={onScreenshot}
            onCancel={onScreenshotCancel}
          />
        )}
        
        {project.type === ContentType.IMAGE ? (
          <img ref={imageRef} src={project.content} alt={project.name} className="max-w-full max-h-full m-auto" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
              <div
                className="relative h-full shadow-lg bg-white"
                style={{width: iframeWidth || '100%', transition: 'width 0.3s ease-in-out'}}
              >
                  <iframe
                      src={project.content}
                      title={project.name}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                  />
                  <div className={`absolute top-0 left-0 w-full h-full bg-transparent ${mode === 'browse' || project.isLocked ? 'pointer-events-none' : ''}`}></div>
              </div>
          </div>
        )}

        {showPins && project.pins.map(pin => (
          <div
            key={pin.id}
            className="pin-element absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(pin.id);
            }}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg cursor-pointer transition-all duration-200 ${
                pin.status === CommentStatus.RESOLVED 
                  ? 'bg-green-500' 
                  : 'bg-indigo-600'
              } ${
                activePinId === pin.id ? 'ring-4 ring-offset-2 ring-indigo-400 scale-110' : ''
              }`}
            >
              <span className="text-white font-bold text-sm">{pin.number}</span>
            </div>
          </div>
        ))}
        
        {showPins && activePin && (
            <PinPopover 
              pin={activePin}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              onResolvePin={onResolvePin}
              onClose={() => onSelectPin(null)}
              isLocked={!!project.isLocked || isReadOnly}
              projectType={project.type}
              onTriggerImageScreenshot={onTriggerImageScreenshot}
              onTriggerUrlScreenshot={onTriggerUrlScreenshot}
            />
        )}
        
        {project.isLocked && !isReadOnly && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center z-20 shadow-md animate-fade-in-fast">
            <LockClosedIcon className="w-4 h-4 mr-2" />
            Commenting is disabled
          </div>
        )}

        {isReadOnly && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center z-20 shadow-md animate-fade-in-fast">
            <LockClosedIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Student View: Read-Only Feedback
          </div>
        )}

        {project.type === ContentType.URL && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1 flex items-center space-x-1 z-20 border border-slate-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'browse') onSelectPin(null);
                onSetMode('comment');
              }}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium transition-colors ${
                mode === 'comment' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              aria-pressed={mode === 'comment'}
              title="Comment Mode"
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
              <span>Comment</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'comment') onSelectPin(null);
                onSetMode('browse');
              }}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium transition-colors ${
                mode === 'browse' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
               aria-pressed={mode === 'browse'}
               title="Browse Mode"
            >
              <CursorArrowRaysIcon className="w-5 h-5" />
              <span>Browse</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationCanvas;