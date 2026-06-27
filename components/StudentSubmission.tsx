import React, { useState, useRef, useEffect } from 'react';
import { Project, ContentType, CommentStatus } from '../types';
import { LogoIcon, LockClosedIcon, GlobeAltIcon, ArrowLeftIcon, TrashIcon, CheckCircleIcon, EyeIcon } from './icons';

// Inline icons for completeness
const CloudArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

interface StudentSubmissionProps {
  projects: Project[];
  onSubmitProject: (data: {
    name: string;
    url: string;
    studentName: string;
    studentEmail: string;
    notes?: string;
    screenshots?: string[];
  }) => Promise<void>;
  onGoBack: () => void;
  onViewProjectFeedback: (projectId: string) => void;
}

interface StudentUser {
  email: string;
  name: string;
  picture?: string;
}

export const StudentSubmission: React.FC<StudentSubmissionProps> = ({
  projects,
  onSubmitProject,
  onGoBack,
  onViewProjectFeedback,
}) => {
  const [student, setStudent] = useState<StudentUser | null>(() => {
    const saved = localStorage.getItem('esp_student');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshots, setScreenshots] = useState<{ name: string; size: string; dataUrl: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter projects submitted by this specific student
  const studentProjects = projects.filter(
    (p) => p.studentEmail && p.studentEmail.toLowerCase() === student?.email.toLowerCase()
  );

  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError(null);

    const emailTrimmed = googleEmail.trim().toLowerCase();
    const nameTrimmed = googleName.trim();

    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setGoogleError('Please enter a valid student email address.');
      return;
    }
    if (!nameTrimmed) {
      setGoogleError('Please enter your full name.');
      return;
    }

    const mockProfileUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameTrimmed)}`;
    const user: StudentUser = {
      email: emailTrimmed,
      name: nameTrimmed,
      picture: mockProfileUrl,
    };

    localStorage.setItem('esp_student', JSON.stringify(user));
    setStudent(user);
    setGoogleModalOpen(false);
    setGoogleEmail('');
    setGoogleName('');
  };

  const handleLogout = () => {
    localStorage.removeItem('esp_student');
    setStudent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (screenshots.length >= 6) {
      setFormError('You can upload up to 6 screenshots/files.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError(`File "${file.name}" exceeds the 10MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setScreenshots((prev) => [
        ...prev,
        {
          name: file.name,
          size: sizeStr,
          dataUrl: reader.result as string,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFormError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          processFile(file);
        } else {
          setFormError('Only images (PNG, JPG, WebP) and PDFs are supported.');
        }
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        processFile(file);
      });
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!student) {
      setFormError('Please sign in first to submit your project.');
      return;
    }

    if (!projectName.trim()) {
      setFormError('Project Name is required.');
      return;
    }

    const trimmedUrl = projectUrl.trim();
    if (!trimmedUrl) {
      setFormError('Project URL is required.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setFormError('Please enter a complete live URL starting with http:// or https://');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitProject({
        name: projectName.trim(),
        url: trimmedUrl,
        studentName: student.name,
        studentEmail: student.email,
        notes: notes.trim() || undefined,
        screenshots: screenshots.length > 0 ? screenshots.map((s) => s.dataUrl) : undefined,
      });

      setFormSuccess(true);
      setProjectName('');
      setProjectUrl('');
      setNotes('');
      setScreenshots([]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 font-sans">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <button
          onClick={onGoBack}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors group"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Cancel
        </button>
        <div className="flex items-center space-x-2">
          <LogoIcon className="h-6 w-6 text-indigo-600" />
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">ESP Student Center</span>
        </div>
      </div>

      {!student ? (
        /* Sign-in Promotion screen */
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center max-w-md mx-auto my-12 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <LockClosedIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Student Portal</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Please sign in with your ESP Amsterdam or Google Account to submit your website project for review.
          </p>

          <button
            onClick={() => setGoogleModalOpen(true)}
            className="mt-8 w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl py-3 px-4 shadow-sm font-semibold text-slate-800 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {/* Google Logo SVG */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.6c-.29 1.5-.14 3.01-3.01 4.01v3.33h4.86c2.84-2.62 4.49-6.49 4.49-11.19z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.86-3.33c-1.4.94-3.17 1.51-5.1 1.51-3.92 0-7.24-2.64-8.43-6.2H1.47v3.46C3.47 20.44 7.42 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M3.57 13.07a8.03 8.03 0 010-4.14V5.47H1.47a11.96 11.96 0 000 11.06l2.1-3.46z"
              />
              <path
                fill="#EA4335"
                d="M12 4.74c1.76 0 3.34.6 4.59 1.79l3.43-3.43C17.96 1.14 15.24 0 12 0 7.42 0 3.47 3.56 1.47 7.54l3.57 3.47c1.19-3.56 4.51-6.2 8.43-6.2z"
              />
            </svg>
            <span>Sign In with Google</span>
          </button>
        </div>
      ) : (
        /* Authenticated Student view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Submission Form (7 columns) */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200/85 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">Student Submission</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Submit your project</h2>
              </div>
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5">
                <img
                  src={student.picture}
                  alt={student.name}
                  className="w-6 h-6 rounded-full ring-1 ring-indigo-500/10"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 leading-none">{student.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-[10px] text-slate-400 hover:text-red-500 underline font-semibold text-left mt-0.5 leading-none transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Paste your live website URL below. Reviewers will analyze your layouts automatically across Desktop, Tablet, and Mobile.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-semibold flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Project Submitted Successfully!</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      Your project is now in queue. You can check the real-time review status on the right panel.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={student.name}
                    disabled
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm font-semibold cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={student.email}
                    disabled
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm font-semibold cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Physiotherapist Portfolio Landing Page"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                  Project URL *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GlobeAltIcon className="h-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                  Notes for the Reviewer (Optional)
                </label>
                <textarea
                  placeholder="Is there anything specific you would like us to look at? (e.g., color contrast, tablet responsive layout on contact page)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Upload drag-and-drop box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                  Screenshots / PDF (Optional, Up to 6 • 10MB each)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                  />
                  <CloudArrowUpIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">Click or drop files here</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP, or PDF up to 10MB</p>
                </div>

                {/* Uploaded Files List */}
                {screenshots.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {screenshots.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group transition-all"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <DocumentIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400">{file.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(i)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2 animate-pulse">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Submitting for Review...</span>
                    </div>
                  ) : (
                    'Submit for Review'
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center">
                <span className="text-[10px] text-slate-400">
                  Educational Prototype Only. Don't submit projects containing real patient data.
                </span>
              </div>
            </form>
          </div>

          {/* Submission Tracker Panel (5 columns) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col h-full">
            <h3 className="font-extrabold text-slate-900 text-lg leading-tight">Your Submissions</h3>
            <p className="text-xs text-slate-500 mt-1">Real-time status of your reviews</p>

            {studentProjects.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
                <GlobeAltIcon className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No submissions yet</p>
                <p className="text-xs text-slate-400 max-w-[200px] mt-1 leading-normal">
                  Submit a URL on the left to see progress here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {studentProjects
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map((proj) => {
                    const pinCount = proj.pins.length;
                    const openPins = proj.pins.filter((p) => p.status === CommentStatus.OPEN).length;
                    const isReviewed = pinCount > 0;

                    return (
                      <div
                        key={proj.id}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="truncate">
                            <h4 className="font-bold text-sm text-slate-900 truncate">{proj.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{proj.content}</p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                              isReviewed
                                ? openPins > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {isReviewed ? (openPins > 0 ? 'Feedback Open' : 'Reviewed') : 'Awaiting Review'}
                          </span>
                        </div>

                        {proj.notes && (
                          <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-2 italic line-clamp-2">
                            "{proj.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400">
                            {proj.createdAt.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>

                          <div className="flex items-center space-x-2">
                            {pinCount > 0 && (
                              <span className="text-[10px] font-bold text-slate-500">
                                {pinCount} pin{pinCount > 1 ? 's' : ''}
                              </span>
                            )}
                            <button
                              onClick={() => onViewProjectFeedback(proj.id)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              <span>View Canvas</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real Google SSO Modal Simulator */}
      {googleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-200/80 transform transition-all animate-fade-in">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                {/* Google Logo SVG */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.6c-.29 1.5-.14 3.01-3.01 4.01v3.33h4.86c2.84-2.62 4.49-6.49 4.49-11.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.86-3.33c-1.4.94-3.17 1.51-5.1 1.51-3.92 0-7.24-2.64-8.43-6.2H1.47v3.46C3.47 20.44 7.42 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.57 13.07a8.03 8.03 0 010-4.14V5.47H1.47a11.96 11.96 0 000 11.06l2.1-3.46z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.74c1.76 0 3.34.6 4.59 1.79l3.43-3.43C17.96 1.14 15.24 0 12 0 7.42 0 3.47 3.56 1.47 7.54l3.57 3.47c1.19-3.56 4.51-6.2 8.43-6.2z"
                  />
                </svg>
                <span className="font-extrabold text-slate-800 tracking-tight text-sm">Sign in with Google</span>
              </div>
              <button
                onClick={() => setGoogleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGoogleLogin} className="space-y-4">
              {googleError && <p className="text-xs text-red-500 font-medium">{googleError}</p>}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Charles Thompson"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Your Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@espamsterdam.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors shadow-sm"
              >
                Agree & Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
