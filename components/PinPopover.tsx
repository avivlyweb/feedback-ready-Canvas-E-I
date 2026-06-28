import React, { useState, useRef } from 'react';
import { Pin, CommentStatus, Comment, ContentType } from '../types';
import { CheckCircleIcon, XMarkIcon, PaperClipIcon, CameraIcon, TrashIcon } from './icons';

interface PinPopoverProps {
  pin: Pin;
  onAddComment: (pinId: string, text: string, attachment?: NonNullable<Comment['attachment']>) => void;
  onDeleteComment: (pinId: string, commentId: string) => void;
  onResolvePin: (pinId: string) => void;
  onClose: () => void;
  isLocked: boolean;
  projectType: ContentType;
  onTriggerImageScreenshot: (callback: (attachment: NonNullable<Comment['attachment']>) => void) => void;
  onTriggerUrlScreenshot: (callback: (attachment: NonNullable<Comment['attachment']>) => void) => void;
}

const formatRelativeTime = (timestamp: Date): string => {
  const now = new Date();
  const secondsPast = (now.getTime() - new Date(timestamp).getTime()) / 1000;

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
  return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PinPopover: React.FC<PinPopoverProps> = ({ pin, onAddComment, onDeleteComment, onResolvePin, onClose, isLocked, projectType, onTriggerImageScreenshot, onTriggerUrlScreenshot }) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [attachment, setAttachment] = useState<NonNullable<Comment['attachment']> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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


  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommentText.trim() || attachment) {
      onAddComment(pin.id, newCommentText, attachment ?? undefined);
      setNewCommentText('');
      setAttachment(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const handleScreenshotClick = () => {
    if (projectType === ContentType.URL) {
      onTriggerUrlScreenshot(setAttachment);
    } else {
      onTriggerImageScreenshot(setAttachment);
    }
  };

  const popoverPositionClasses = () => {
    let classes = 'transform ';
    if (pin.y > 70) { // If pin is in bottom 30% of screen
        classes += ' -translate-y-full ';
    } else {
        classes += ' translate-y-4 ';
    }
    if (pin.x > 70) { // If pin is in right 30% of screen
        classes += ' -translate-x-full ';
    } else {
        classes += ' translate-x-4 ';
    }
    return classes;
  }

  return (
    <div
      className={`pin-popover absolute z-20 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col transition-opacity animate-fade-in-fast ${popoverPositionClasses()}`}
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${pin.status === CommentStatus.RESOLVED ? 'bg-green-500' : 'bg-indigo-600'} text-white font-bold text-xs flex-shrink-0 mr-2`}>
            {pin.number}
          </div>
          <h3 className="font-bold text-slate-800">
            {pin.status === CommentStatus.RESOLVED ? 'Resolved' : 'Feedback'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={() => onResolvePin(pin.id)} className={`${pin.status === CommentStatus.RESOLVED ? 'text-amber-600 hover:text-amber-700' : 'text-slate-400 hover:text-green-600'}`} title={pin.status === CommentStatus.RESOLVED ? 'Re-open' : 'Mark as resolved'}>
                <CheckCircleIcon className="w-5 h-5"/>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700" title="Close">
                <XMarkIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>

      {/* Comments */}
      <div className="flex-grow p-3 space-y-3 overflow-y-auto max-h-60">
        {pin.comments.length > 0 ? (
          pin.comments.map((comment) => (
            <div key={comment.id} className="text-sm group relative">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{comment.author}</span>
                <span title={new Date(comment.timestamp).toLocaleString()}>{formatRelativeTime(comment.timestamp)}</span>
              </div>
              <div className="bg-slate-100 rounded-md p-2">
                {comment.text && <p className="text-slate-800 break-words">{comment.text}</p>}
                {comment.attachment && (
                  <div className="mt-2">
                    <img src={comment.attachment.data} alt={comment.attachment.name} className="max-w-full rounded-md object-cover" />
                  </div>
                )}
              </div>
              {!isLocked && (
                <button
                  onClick={() => onDeleteComment(pin.id, comment.id)}
                  className="absolute top-1 right-1 p-1 bg-white/50 rounded-full text-slate-400 hover:text-red-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete comment"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4">No comments yet.</p>
        )}
      </div>

      {/* Reply Form */}
      {pin.status === CommentStatus.OPEN && !isLocked && (
        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-lg">
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a reply..."
              className="w-full p-2 border border-slate-300 bg-white text-slate-800 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={2}
            />
            {attachment && (
              <div className="mt-2 flex items-center justify-between bg-slate-200 p-1 rounded-md text-xs">
                <span className="truncate max-w-[200px]">{attachment.name}</span>
                <button type="button" onClick={() => setAttachment(null)}><XMarkIcon className="w-4 h-4" /></button>
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
              <button type="submit" className="bg-indigo-600 text-white py-1.5 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:bg-indigo-300" disabled={!newCommentText.trim() && !attachment}>
                Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PinPopover;