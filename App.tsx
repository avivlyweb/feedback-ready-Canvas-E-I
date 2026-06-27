import React, { useState, useCallback } from 'react';
import { Project, ContentType, CommentStatus } from './types';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import { LogoIcon, LockClosedIcon, GlobeAltIcon, ArrowLeftIcon } from './components/icons';
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { LoginGate } from './components/LoginGate';
import { StudentSubmission } from './components/StudentSubmission';

const App: React.FC = () => {
  const dbProjects = useQuery(api.projects.getProjects);
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // Platform Routing: 'landing' | 'reviewer' | 'student' | 'student-canvas'
  const [role, setRole] = useState<'landing' | 'reviewer' | 'student' | 'student-canvas'>('landing');

  const [reviewer, setReviewer] = useState<{ email: string; name: string } | null>(() => {
    const saved = localStorage.getItem('esp_reviewer');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleLoginSuccess = useCallback((email: string, name: string) => {
    const user = { email, name };
    localStorage.setItem('esp_reviewer', JSON.stringify(user));
    setReviewer(user);
    setRole('reviewer');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('esp_reviewer');
    setReviewer(null);
    setRole('landing');
  }, []);

  const projects: Project[] = React.useMemo(() => {
    if (!dbProjects) return [];
    return dbProjects.map((dbProj: any) => ({
      id: dbProj.id,
      name: dbProj.name,
      type: dbProj.type as ContentType,
      content: dbProj.content,
      isLocked: dbProj.isLocked,
      studentEmail: dbProj.studentEmail,
      studentName: dbProj.studentName,
      notes: dbProj.notes,
      screenshots: dbProj.screenshots,
      createdAt: new Date(dbProj.createdAt),
      pins: (dbProj.pins || []).map((pin: any) => ({
        id: pin.id,
        number: pin.number,
        x: pin.x,
        y: pin.y,
        status: pin.status as CommentStatus,
        comments: (pin.comments || []).map((c: any) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          timestamp: new Date(c.timestamp),
          attachment: c.attachment,
        })),
      })),
    }));
  }, [dbProjects]);

  const handleCreateProject = useCallback(async (name: string, type: ContentType, content: string) => {
    const projectId = `proj-${Date.now()}`;
    await createProjectMutation({
      id: projectId,
      name,
      type,
      content,
      pins: [],
      createdAt: new Date().toISOString(),
      isLocked: false,
    });
    setSelectedProjectId(projectId);
  }, [createProjectMutation]);

  const handleStudentSubmitProject = useCallback(async (data: {
    name: string;
    url: string;
    studentName: string;
    studentEmail: string;
    notes?: string;
    screenshots?: string[];
  }) => {
    const projectId = `proj-${Date.now()}`;
    await createProjectMutation({
      id: projectId,
      name: data.name,
      type: ContentType.URL,
      content: data.url,
      pins: [],
      createdAt: new Date().toISOString(),
      isLocked: false,
      studentEmail: data.studentEmail,
      studentName: data.studentName,
      notes: data.notes,
      screenshots: data.screenshots,
    });
  }, [createProjectMutation]);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleGoBackToDashboard = useCallback(() => {
    setSelectedProjectId(null);
    if (role === 'student-canvas') {
      setRole('student');
    }
  }, [role]);

  const handleUpdateProject = useCallback(async (updatedProject: Project) => {
    await updateProjectMutation({
      id: updatedProject.id,
      name: updatedProject.name,
      type: updatedProject.type,
      content: updatedProject.content,
      isLocked: updatedProject.isLocked || false,
      createdAt: updatedProject.createdAt.toISOString(),
      studentEmail: updatedProject.studentEmail,
      studentName: updatedProject.studentName,
      notes: updatedProject.notes,
      screenshots: updatedProject.screenshots,
      pins: updatedProject.pins.map((pin) => ({
        id: pin.id,
        number: pin.number,
        x: pin.x,
        y: pin.y,
        status: pin.status,
        comments: pin.comments.map((c) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString() : new Date(c.timestamp).toISOString(),
          attachment: c.attachment,
        })),
      })),
    });
  }, [updateProjectMutation]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await deleteProjectMutation({ id: projectId });
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
    }
  }, [selectedProjectId, deleteProjectMutation]);

  const handleViewProjectFeedback = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setRole('student-canvas');
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // 1. Show loading if database is not ready
  if (dbProjects === undefined) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <LogoIcon className="h-8 w-8 text-indigo-600 animate-pulse" />
                <h1 className="text-2xl font-bold text-slate-900">CanvasFeedback</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Connecting to live database...</p>
          </div>
        </main>
      </div>
    );
  }

  // 2. Render Landing Page
  if (role === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 py-4 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <LogoIcon className="h-7 w-7 text-indigo-600" />
              <span className="font-extrabold text-slate-950 text-xl tracking-tight">ESP Canvas Feedback</span>
            </div>
            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Educational Platform
            </span>
          </div>
        </header>

        <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Continuous Web Review & Interactive Feedback
            </h1>
            <p className="text-slate-500 mt-4 text-base sm:text-lg leading-relaxed">
              Design critique and responsive viewport inspections for student clinical web applications, unified on a real-time annotation canvas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            {/* Reviewer Workspace Gate */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 flex flex-col hover:border-indigo-400 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100">
                <LockClosedIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-950">Reviewer Workspace</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed flex-grow">
                Review submitted student URLs. Annotate responsive mobile, tablet, and desktop viewports, and generate AI-powered rubric summary evaluations.
              </p>
              <button
                onClick={() => {
                  if (reviewer) {
                    setRole('reviewer');
                  } else {
                    setRole('reviewer'); // Redirect to reviewer gate
                  }
                }}
                className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Enter Workspace</span>
              </button>
            </div>

            {/* Student Submission Gate */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 flex flex-col hover:border-indigo-400 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100">
                <GlobeAltIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-950">Student Center</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed flex-grow">
                Submit your active website project URL along with custom design notes or PDF/image attachments. Track real-time feedback comments on your canvas.
              </p>
              <button
                onClick={() => setRole('student')}
                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Submit Your Project</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="py-6 border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400 font-semibold tracking-wide">
            ESP Amsterdam Web Design critique tool. Powered by React, Convex, and Google Gemini API.
          </div>
        </footer>
      </div>
    );
  }

  // 3. Render Reviewer Security Gate (if they chose Reviewer role but are not logged in)
  if (role === 'reviewer' && !reviewer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="absolute top-6 left-6">
          <button
            onClick={() => setRole('landing')}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        </div>
        <LoginGate onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 4. Render Student Portal (Submit URL form)
  if (role === 'student') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <StudentSubmission
          projects={projects}
          onSubmitProject={handleStudentSubmitProject}
          onGoBack={() => setRole('landing')}
          onViewProjectFeedback={handleViewProjectFeedback}
        />
      </div>
    );
  }

  // 5. Render Student Canvas feedback (Read-Only canvas feedback mode)
  if (role === 'student-canvas' && selectedProject) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-slate-50">
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoBackToDashboard}>
                <LogoIcon className="h-8 w-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-900">ESP Critique Canvas</h1>
              </div>
              <div className="flex items-center space-x-3 bg-indigo-50 border border-indigo-100/40 rounded-full px-3 py-1 text-indigo-700 text-xs font-bold">
                <span>View-Only Feedback Mode</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)]">
          <ProjectView
            key={selectedProject.id}
            project={selectedProject}
            onUpdateProject={handleUpdateProject}
            onGoBack={handleGoBackToDashboard}
            isReadOnly={true}
          />
        </main>
      </div>
    );
  }

  // 6. Main Reviewer Dashboard & Admin View
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoBackToDashboard}>
              <LogoIcon className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">Critique Workspace</h1>
            </div>
            {reviewer && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-800">{reviewer.name}</span>
                  <span className="text-xs text-slate-500">{reviewer.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-3.5 py-1.5 border border-slate-300 hover:border-red-200 rounded-lg text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50/50 transition-colors focus:outline-none"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-full">
          {selectedProject ? (
            <ProjectView
              key={selectedProject.id}
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onGoBack={handleGoBackToDashboard}
              reviewer={reviewer || undefined}
            />
          ) : (
            <Dashboard
              projects={projects}
              onCreateProject={handleCreateProject}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
