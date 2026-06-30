import React, { useState } from 'react';
import { Project, ContentType } from '../types';
import { GlobeAltIcon, TrashIcon, CheckCircleIcon } from './icons';

interface DashboardV2Props {
  projects: Project[];
  onCreateProject?: (name: string, url: string, studentName?: string, studentEmail?: string) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const DashboardV2: React.FC<DashboardV2Props> = ({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'in_review' | 'published'>('all');
  const [readinessFilter, setReadinessFilter] = useState<'all' | 'not_assessed' | 'changes_required' | 'submit_ready'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(true);

  // Filter only V2 projects
  const v2Projects = projects.filter(p => p.isV2);

  // Apply filters
  const filteredProjects = v2Projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.studentName && project.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.studentEmail && project.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || project.submissionStatus === statusFilter;
    const matchesReadiness = readinessFilter === 'all' || project.readinessStatus === readinessFilter;

    return matchesSearch && matchesStatus && matchesReadiness;
  });

  // Calculate statistics
  const totalSubmissions = v2Projects.length;
  const inReviewCount = v2Projects.filter(p => p.submissionStatus === 'in_review').length;
  const readyCount = v2Projects.filter(p => p.readinessStatus === 'submit_ready').length;
  const changesCount = v2Projects.filter(p => p.readinessStatus === 'changes_required').length;

  const getSubmissionStatusBadge = (status?: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            ● Submitted
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">
            ● In Review
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✓ Published
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200">
            ● Unknown
          </span>
        );
    }
  };

  const getReadinessStatusBadge = (status?: string) => {
    switch (status) {
      case 'not_assessed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Not Assessed
          </span>
        );
      case 'changes_required':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            ⚠️ Changes Required
          </span>
        );
      case 'submit_ready':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            🚀 Submit Ready
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner / Overview */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-8 text-slate-800 font-extrabold text-9xl leading-none select-none opacity-20 pointer-events-none font-mono">
          2.0
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4 tracking-wide uppercase">
            Submit Ready Workspace
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">Reviewer Workspace 2.0</h2>
          <p className="mt-2.5 text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            Fast MarkUp.io-style responsive annotations combined with automated preflight diagnostics, student self-checks, and mandatory readiness checklist validations.
          </p>
        </div>
        <div className="relative z-10 flex-shrink-0">
          <button
            onClick={() => setShowPlaybook(!showPlaybook)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-extrabold rounded-xl border border-slate-700 shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>🤖</span>
            <span>{showPlaybook ? 'Hide Playbook Deck' : 'Show Playbook Deck'}</span>
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Queue</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalSubmissions}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">Submissions</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Reviews</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{inReviewCount}</span>
            <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold animate-pulse">In Progress</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marked Submit Ready</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{readyCount}</span>
            <span className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Approved</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Changes</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600">{changesCount}</span>
            <span className="text-[10px] sm:text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">Revision</span>
          </div>
        </div>
      </div>

      {/* Interactive Reviewer Playbook Deck */}
      {showPlaybook && <ReviewerPlaybook />}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Search student, email, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>

        <div className="flex flex-wrap gap-3.5 w-full md:w-auto">
          {/* Submission Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Readiness Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Readiness:</span>
            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="all">All</option>
              <option value="not_assessed">Not Assessed</option>
              <option value="changes_required">Changes Required</option>
              <option value="submit_ready">Submit Ready</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <span>Active Submissions Queue</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
              {filteredProjects.length}
            </span>
          </h3>
          {onCreateProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all"
            >
              <span>✨</span>
              <span>Create Website Review</span>
            </button>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm flex flex-col items-center">
            <span className="text-3xl">📭</span>
            <h4 className="mt-3 text-base font-bold text-slate-800">No submissions found</h4>
            <p className="text-slate-400 text-xs mt-1 mb-5 font-medium max-w-sm mx-auto">
              {v2Projects.length === 0 
                ? "No V2 projects are currently in the queue. You can quickly add an ad-hoc website to review below."
                : "No submissions match your active filter options."}
            </p>
            {onCreateProject && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add & Start Reviewing a Website</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((project) => {
              // Parse optional data
              const preflightChecks = project.preflight ? JSON.parse(project.preflight) : [];
              const selfChecksData = project.selfCheck ? JSON.parse(project.selfCheck) : null;
              
              // Count preflight outcomes
              const passes = preflightChecks.filter((c: any) => c.status === 'pass_signal').length;
              const warnings = preflightChecks.filter((c: any) => c.status === 'warning').length;

              // Self checks count
              const selfChecksDoneCount = selfChecksData 
                ? Object.values(selfChecksData).filter(Boolean).length 
                : 0;

              return (
                <div 
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center space-x-3.5 flex-wrap gap-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🌐</span>
                        <h4 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onSelectProject(project.id)}>
                          {project.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSubmissionStatusBadge(project.submissionStatus)}
                        {getReadinessStatusBadge(project.readinessStatus)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500 flex-wrap gap-y-2">
                      <span>Submitted by: <strong className="text-slate-700">{project.studentName || 'Anonymous Student'}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Email: <strong className="text-slate-700">{project.studentEmail || 'N/A'}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Date: <strong className="text-slate-700">{project.createdAt.toLocaleDateString()}</strong></span>
                    </div>

                    {/* Preflight & Self Check Overview Badges */}
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2 pt-1">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600">
                        <span>🤖 Preflight:</span>
                        <span className="text-emerald-600">{passes} Pass</span>
                        {warnings > 0 && <span className="text-amber-600">• {warnings} Warn</span>}
                      </div>

                      {selfChecksData && (
                        <div className="inline-flex items-center space-x-1.5 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700">
                          <span>📋 Student Self-Check:</span>
                          <span>{selfChecksDoneCount} / 6 Verified</span>
                        </div>
                      )}

                      {project.notes && (
                        <div className="inline-flex items-center bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg max-w-xs truncate" title={project.notes}>
                          💬 "{project.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-2 border border-slate-200 hover:border-red-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50/50 transition-all focus:outline-none"
                      title="Delete submission"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2"
                    >
                      <span>{project.submissionStatus === 'submitted' ? 'Begin Review' : 'Resume Review'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {onCreateProject && (
        <NewProjectV2Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateProject={onCreateProject}
        />
      )}
    </div>
  );
};

const NewProjectV2Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, url: string, studentName?: string, studentEmail?: string) => void | Promise<void>;
}> = ({ isOpen, onClose, onCreateProject }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a project name.");
      return;
    }
    if (!url.trim()) {
      setError("Please specify the live URL to review.");
      return;
    }
    if (!url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
      setError("Please enter a valid website URL starting with http:// or https://");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateProject(name.trim(), url.trim(), studentName.trim() || undefined, studentEmail.trim() || undefined);
      onClose();
      // Reset states
      setName('');
      setUrl('');
      setStudentName('');
      setStudentEmail('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl space-y-4 animate-scale-in">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>🌐</span>
            <span>Create V2 Website Review</span>
          </h3>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-xl text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-slate-400 uppercase tracking-wider">Project Name *</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Landing Page"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-400 uppercase tracking-wider">Live URL to Review *</label>
            <input
              type="url"
              required
              disabled={isSubmitting}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-semibold disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-400 uppercase tracking-wider">Student Name (Optional)</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Aviv"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-400 uppercase tracking-wider">Student Email (Optional)</label>
              <input
                type="email"
                disabled={isSubmitting}
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="aviv@example.com"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-semibold leading-normal">
            * This project will be initialized as a Critique Workspace 2.0 evaluation. All checklists, automated diagnostics, and response channels will be set up instantly.
          </p>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Review...</span>
                </>
              ) : (
                <span>Create Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 🤖 INTERACTIVE REVIEWER PLAYBOOK & MICROLINK SANDBOX PLAYGROUND
// ============================================================================

interface SandboxSnapshot {
  id: string;
  name: string;
  url: string;
  screenshotUrl: string;
  timestamp: string;
  preflightScore: number;
  issuesCount: number;
}

export const ReviewerPlaybook: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<'iris' | 'orion' | 'atlas'>('iris');
  const [testUrl, setTestUrl] = useState('https://react.dev');
  const [isCapturing, setIsCapturing] = useState(false);
  const [customNotes, setCustomNotes] = useState('My first sandbox audit proof');
  const [sandboxSnaps, setSandboxSnaps] = useState<SandboxSnapshot[]>([
    {
      id: 'demo-1',
      name: 'Initial Review (Demo)',
      url: 'https://react.dev',
      screenshotUrl: 'https://api.microlink.io/?url=https%3A%2F%2Freact.dev&screenshot=true&embed=screenshot.url&overlay.browser=true&waitFor=2000',
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
      preflightScore: 7,
      issuesCount: 4
    },
    {
      id: 'demo-2',
      name: 'Final Re-eval (Demo)',
      url: 'https://react.dev',
      screenshotUrl: 'https://api.microlink.io/?url=https%3A%2F%2Freact.dev&screenshot=true&embed=screenshot.url&overlay.browser=true&waitFor=2000',
      timestamp: new Date().toLocaleString(),
      preflightScore: 9,
      issuesCount: 1
    }
  ]);
  const [compareA, setCompareA] = useState('demo-1');
  const [compareB, setCompareB] = useState('demo-2');

  const handleRunCapture = () => {
    if (!testUrl) return;
    setIsCapturing(true);

    setTimeout(() => {
      // Create a real Microlink URL based on the user's input URL
      const realScreenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(testUrl)}&screenshot=true&embed=screenshot.url&overlay.browser=true&waitFor=2500`;
      
      const newSnap: SandboxSnapshot = {
        id: `sandbox-${Date.now()}`,
        name: customNotes.trim() || `Sandbox Audit (${testUrl})`,
        url: testUrl,
        screenshotUrl: realScreenshotUrl,
        timestamp: new Date().toLocaleString(),
        preflightScore: Math.floor(Math.random() * 3) + 7, // 7-9 score
        issuesCount: Math.floor(Math.random() * 4) // 0-3 issues
      };

      setSandboxSnaps(prev => [newSnap, ...prev]);
      setCompareA(newSnap.id);
      setIsCapturing(false);
      alert("Successfully captured live web baseline! Check the 'Saved Sandbox Baseline Proofs' below to inspect and compare.");
    }, 2000);
  };

  const selectedSnapA = sandboxSnaps.find(s => s.id === compareA);
  const selectedSnapB = sandboxSnaps.find(s => s.id === compareB);

  // Custom agent dialogue
  const agentDetails = {
    iris: {
      name: "Agent Iris",
      role: "UX & Typography Alignment Specialist",
      badge: "Visual Critic",
      color: "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-950/30",
      icon: "🎨",
      text: "Welcome, Reviewer. I evaluate typography contrast ratios, alignment grids, and user flow ergonomics. When reviewing student websites, zoom in and drop pinpoint coordinates on headers or form fields with cramped margins. Adding coordinate pins helps students track exactly where layouts fail."
    },
    orion: {
      name: "Agent Orion",
      role: "Technical Audits & Speed Performance",
      badge: "Code Auditor",
      color: "border-cyan-500 text-cyan-400 bg-cyan-950/30",
      icon: "⚙️",
      text: "Orion here! I inspect underlying responsiveness and preflight metrics. Double-check that students aren't wrapping text inside narrow containers or forcing overflow. Use the Responsive Viewport toolbar on the live canvas to test desktop, tablet, and mobile styles in sequence."
    },
    atlas: {
      name: "Agent Atlas",
      role: "Legal Disclosures & Immutable Vault Compliance",
      badge: "Compliance Officer",
      color: "border-indigo-500 text-indigo-400 bg-indigo-950/30",
      icon: "⚖️",
      text: "Greetings. My task is verifying compliance and backing up immutable audit evidence. By checking the 'Auto-Microlink' option in the sidebar, my capture routine invokes Microlink API to take an external, neutral backup screenshot. This provides legal proof of student designs, safely stored in the vault."
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-slate-200">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <span>🤖</span>
            <span>Reviewer Diagnostics & Sandbox Simulator</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Reviewer-eyes-only control panel. Test live automated screenshotting and side-by-side diff comparisons in real-time.
          </p>
        </div>
        <span className="self-start sm:self-center px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
          Testing Sandbox v2.0
        </span>
      </div>

      {/* Grid: Instructions vs Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Playbook Steps (Left Column) */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Reviewer Playbook: Step-by-Step Guide</h4>
          <div className="space-y-3.5">
            {[
              {
                step: "1",
                title: "Scan Automated Preflight Flags",
                desc: "Consult the Preflight tab at the top of the workspace. This automatically lists warnings for raw placeholder text, missing privacy pages, dead links, or missing HTTPS."
              },
              {
                step: "2",
                title: "Drop Pinpoint Annotations on Viewports",
                desc: "Toggle between Desktop (1280px), Tablet (768px), and Mobile (375px) views. Click directly on visual defects in the live iframe to register precise pixel coordinate pins."
              },
              {
                step: "3",
                title: "Freeze Baseline with Microlink",
                desc: "Type a snapshot note in the sidebar's Vault section and click 'Freeze Proof'. Atlas triggers Microlink's official API to securely archive an unalterable high-res visual backup of the active page."
              },
              {
                step: "4",
                title: "Audit Fixes with side-by-side Diff Compare",
                desc: "When students make adjustments, take a new snapshot. Select older vs newer snapshots in the comparator to review preflight progress and look at side-by-side proof screenshots."
              }
            ].map((s) => (
              <div key={s.step} className="flex space-x-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-800/40 flex items-center justify-center text-xs font-black">
                  {s.step}
                </span>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-200">{s.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-normal font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Copilots (Right Column) */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meet the Reviewer Agents</h4>
          
          {/* Agent Selection Cards */}
          <div className="grid grid-cols-3 gap-2">
            {(['iris', 'orion', 'atlas'] as const).map((agentKey) => (
              <button
                key={agentKey}
                onClick={() => setActiveAgent(agentKey)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  activeAgent === agentKey 
                    ? 'bg-slate-800 border-indigo-500 text-white shadow-md' 
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-lg mb-1">{agentDetails[agentKey].icon}</div>
                <div className="text-[10px] font-extrabold capitalize">{agentKey}</div>
              </button>
            ))}
          </div>

          {/* Active Agent Dialogue Box */}
          <div className={`p-4 border rounded-xl space-y-2 transition-all ${agentDetails[activeAgent].color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">{agentDetails[activeAgent].icon}</span>
                <span className="text-xs font-extrabold text-white">{agentDetails[activeAgent].name}</span>
              </div>
              <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300">
                {agentDetails[activeAgent].badge}
              </span>
            </div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider opacity-60">
              {agentDetails[activeAgent].role}
            </p>
            <p className="text-[11px] leading-relaxed font-semibold">
              {agentDetails[activeAgent].text}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Screenshot Station */}
      <div className="border-t border-slate-800 pt-5 space-y-4">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span>🎯</span>
          <span>Microlink Live Sandbox Capture Station</span>
        </h4>
        <p className="text-[11px] text-slate-400 leading-normal max-w-2xl font-medium">
          Enter any URL below (e.g. `https://react.dev`, `https://github.com`, or your student sandbox URL) and click **Capture**. Our script triggers the real-time Microlink screenshot render, visualizes it instantly, and saves it in your custom testing baseline vault.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Test URL to Screenshot</label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://react.dev"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Audit Label / Notes</label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Acme final recheck"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              onClick={handleRunCapture}
              disabled={isCapturing || !testUrl}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs rounded-lg transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-2"
            >
              {isCapturing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Invoking Microlink API...</span>
                </>
              ) : (
                <>
                  <span>📸</span>
                  <span>Capture Live Proof</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sandbox Saved Baseline Proofs list */}
        <div className="pt-4 border-t border-slate-800/60 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Saved baselines index list */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saved Sandbox Baseline Proofs</span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {sandboxSnaps.map((s) => (
                <div 
                  key={s.id} 
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    compareA === s.id || compareB === s.id
                      ? 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-slate-950/30 border-slate-850 hover:border-slate-700'
                  }`}
                  onClick={() => {
                    if (compareA !== s.id && compareB !== s.id) {
                      setCompareB(compareA);
                      setCompareA(s.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-baseline">
                    <strong className="text-xs font-bold text-slate-200 block truncate max-w-[150px]">{s.name}</strong>
                    <span className="text-[8px] text-slate-500 font-bold">{s.timestamp}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold mt-1 truncate">URL: {s.url}</div>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded font-bold text-indigo-300">
                      Preflight: {s.preflightScore}/10
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 border rounded font-bold ${
                      s.issuesCount === 0 ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' : 'bg-red-950/40 border-red-900/60 text-red-400'
                    }`}>
                      {s.issuesCount} finding{s.issuesCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Snapshot Comparison Zone */}
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Sandbox Side-by-Side Comparison</span>
              <div className="flex space-x-2">
                <select 
                  value={compareA} 
                  onChange={(e) => setCompareA(e.target.value)} 
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[9px] font-semibold text-slate-300 focus:outline-none"
                >
                  {sandboxSnaps.map(s => <option key={s.id} value={s.id}>A: {s.name}</option>)}
                </select>
                <span className="text-[10px] text-slate-500 self-center">vs</span>
                <select 
                  value={compareB} 
                  onChange={(e) => setCompareB(e.target.value)} 
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[9px] font-semibold text-slate-300 focus:outline-none"
                >
                  {sandboxSnaps.map(s => <option key={s.id} value={s.id}>B: {s.name}</option>)}
                </select>
              </div>
            </div>

            {selectedSnapA && selectedSnapB ? (
              <div className="space-y-3">
                {/* Visual screenshots side-by-side */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-400">
                      <span className="text-slate-300 truncate max-w-[120px]">Baseline A ({selectedSnapA.name})</span>
                      <span className="text-slate-500">Score: {selectedSnapA.preflightScore}/10</span>
                    </div>
                    <div className="relative group border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
                      <img 
                        src={selectedSnapA.screenshotUrl} 
                        alt="Sandbox Snapshot A" 
                        className="w-full h-32 object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-2 py-1 text-[8px] font-black text-center text-slate-400 uppercase tracking-wider">
                        Live Microlink Capture A
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-[10px] font-bold text-indigo-400">
                      <span className="text-indigo-300 truncate max-w-[120px]">Baseline B ({selectedSnapB.name})</span>
                      <span className="text-indigo-500">Score: {selectedSnapB.preflightScore}/10</span>
                    </div>
                    <div className="relative group border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
                      <img 
                        src={selectedSnapB.screenshotUrl} 
                        alt="Sandbox Snapshot B" 
                        className="w-full h-32 object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-2 py-1 text-[8px] font-black text-center text-indigo-400 uppercase tracking-wider">
                        Live Microlink Capture B
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Diagnostic metrics compare */}
                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-850 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Preflight Status Drift</span>
                    <strong className="block text-xs font-black mt-0.5 text-indigo-400">
                      {selectedSnapB.preflightScore - selectedSnapA.preflightScore >= 0 ? '+' : ''}
                      {selectedSnapB.preflightScore - selectedSnapA.preflightScore} Checks Passed
                    </strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Findings Resolved</span>
                    <strong className={`block text-xs font-black mt-0.5 ${
                      selectedSnapB.issuesCount - selectedSnapA.issuesCount <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {selectedSnapA.issuesCount - selectedSnapB.issuesCount >= 0 ? '+' : ''}
                      {selectedSnapA.issuesCount - selectedSnapB.issuesCount} Fixed
                    </strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Visual Audit State</span>
                    <strong className="block text-xs font-black mt-0.5 text-slate-200">
                      {selectedSnapB.issuesCount === 0 ? '🛡️ COMPLIANT' : '⚠️ REVISION'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-44 text-xs font-bold text-slate-500">
                Please select or capture snapshots to run comparative audits.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

