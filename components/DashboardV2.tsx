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
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
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
