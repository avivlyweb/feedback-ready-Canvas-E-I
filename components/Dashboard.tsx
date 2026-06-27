import React, { useState, useCallback } from 'react';
import { Project, ContentType, CommentStatus } from '../types';
import { PlusIcon, GlobeAltIcon, PhotoIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, DocumentDuplicateIcon, TrashIcon } from './icons';

interface DashboardProps {
  projects: Project[];
  onCreateProject: (name: string, type: ContentType, content: string) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const NewProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, type: ContentType, content: string) => void;
}> = ({ isOpen, onClose, onCreateProject }) => {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!contentType) {
      setError("Please select a content type.");
      return;
    }

    if (contentType === ContentType.URL) {
      if (!url.trim() || !url.startsWith('http')) {
        setError("Please enter a valid URL (e.g., https://example.com).");
        return;
      }
      onCreateProject(projectName, contentType, url);
    } else if (contentType === ContentType.IMAGE) {
      if (!imageFile) {
        setError("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onCreateProject(projectName, contentType, reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
    resetAndClose();
  };
  
  const resetAndClose = () => {
    setStep(1);
    setProjectName('');
    setContentType(null);
    setUrl('');
    setImageFile(null);
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={resetAndClose}>
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
          <button onClick={resetAndClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        {step === 1 && (
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-2">Project Name</label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Homepage Redesign"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                if(projectName.trim()){
                  setError(null);
                  setStep(2);
                } else {
                  setError("Project name cannot be empty.")
                }
              }}
              className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm text-slate-600 mb-4">Select content type for "{projectName}"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => {setContentType(ContentType.URL); setStep(3);}} className="flex flex-col items-center justify-center p-6 border-2 border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                <GlobeAltIcon className="w-12 h-12 text-indigo-500 mb-2"/>
                <span className="font-semibold">From URL</span>
              </button>
              <button onClick={() => {setContentType(ContentType.IMAGE); setStep(3);}} className="flex flex-col items-center justify-center p-6 border-2 border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                <PhotoIcon className="w-12 h-12 text-indigo-500 mb-2"/>
                <span className="font-semibold">Upload Image</span>
              </button>
            </div>
             <button onClick={() => setStep(1)} className="mt-6 w-full text-slate-600 hover:text-slate-900">Back</button>
          </div>
        )}
        
        {step === 3 && contentType === ContentType.URL && (
           <div>
            <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-2">Website URL</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
        
        {step === 3 && contentType === ContentType.IMAGE && (
           <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-slate-700 mb-2">Image File</label>
            <input
              type="file"
              id="imageUpload"
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        )}

        {step === 3 && (
            <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(2)} className="text-slate-600 hover:text-slate-900">Back</button>
                <button onClick={handleCreate} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">Create Project</button>
            </div>
        )}
      </div>
    </div>
  );
}

const OpenCommentsModal: React.FC<{
  project: Project | null;
  onClose: () => void;
}> = ({ project, onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  if (!project) return null;

  const openPins = project.pins.filter(pin => pin.status === CommentStatus.OPEN && pin.comments.length > 0);
  
  const commentsText = openPins.map(pin => 
    `• Comment #${pin.number}: ${pin.comments.map(c => c.text).join(' | ')}`
  ).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(commentsText).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
    }, (err) => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('Failed to copy');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 truncate">Open Feedback for "{project.name}"</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 flex-shrink-0 ml-4"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="bg-slate-50 rounded-md p-3">
          <textarea
            readOnly
            className="w-full h-64 bg-transparent border-0 resize-none text-slate-700 text-sm focus:ring-0"
            value={commentsText || "No open comments with text."}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg hover:bg-indigo-200 transition-all text-sm font-semibold"
            disabled={!commentsText}
          >
            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
            {copyButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ projects, onCreateProject, onSelectProject, onDeleteProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCommentsFor, setViewingCommentsFor] = useState<Project | null>(null);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-700">No projects yet</h2>
          <p className="text-slate-500 mt-2">Get started by creating your first project.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 flex items-center mx-auto bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg hover:bg-indigo-200 transition-all"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()).map(project => {
            const openPinsCount = project.pins.filter(pin => pin.status === CommentStatus.OPEN).length;
            
            return (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group flex flex-col"
              >
                <div 
                  onClick={() => onSelectProject(project.id)}
                  className="h-40 bg-slate-200 flex items-center justify-center flex-shrink-0 cursor-pointer"
                >
                  {project.type === ContentType.IMAGE ? 
                      <img src={project.content} alt={project.name} className="w-full h-full object-cover"/> : 
                      <GlobeAltIcon className="w-16 h-16 text-slate-400"/>
                  }
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 onClick={() => onSelectProject(project.id)} className="font-bold text-lg truncate group-hover:text-indigo-600 cursor-pointer">{project.name}</h3>
                  <p className="text-sm text-slate-500 capitalize">{project.type.toLowerCase()}</p>
                  
                  {project.studentName && (
                    <div className="mt-1.5 flex flex-col">
                      <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md inline-block w-fit">
                        🎓 Student submission
                      </span>
                      <span className="text-xs text-slate-600 font-semibold mt-1 truncate" title={`${project.studentName} (${project.studentEmail})`}>
                        {project.studentName}
                      </span>
                    </div>
                  )}

                   <time className="text-xs text-slate-400 mt-1 block">
                      {project.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </time>
                  <div className="flex-grow"></div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                     <div className="flex items-center space-x-2">
                      {project.pins.length > 0 && <p className="text-xs text-slate-400">{project.pins.length} pins</p>}
                      {openPinsCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingCommentsFor(project);
                          }}
                          className="flex items-center text-xs font-semibold bg-amber-100 text-amber-800 py-1 px-2 rounded-full hover:bg-amber-200 transition-colors"
                          title={`${openPinsCount} open feedback items`}
                        >
                          <ChatBubbleOvalLeftEllipsisIcon className="w-3 h-3 mr-1.5" />
                          {openPinsCount}
                        </button>
                      )}
                    </div>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete project"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreateProject={onCreateProject} />
      <OpenCommentsModal project={viewingCommentsFor} onClose={() => setViewingCommentsFor(null)} />
    </div>
  );
};

export default Dashboard;
