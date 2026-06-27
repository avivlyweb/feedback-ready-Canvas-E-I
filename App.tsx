import React, { useState, useCallback } from 'react';
import { Project, ContentType, CommentStatus } from './types';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import { LogoIcon } from './components/icons';
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { LoginGate } from './components/LoginGate';

const App: React.FC = () => {
  const dbProjects = useQuery(api.projects.getProjects);
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

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
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('esp_reviewer');
    setReviewer(null);
  }, []);

  const projects: Project[] = React.useMemo(() => {
    if (!dbProjects) return [];
    return dbProjects.map((dbProj: any) => ({
      id: dbProj.id,
      name: dbProj.name,
      type: dbProj.type as ContentType,
      content: dbProj.content,
      isLocked: dbProj.isLocked,
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

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleGoBackToDashboard = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  const handleUpdateProject = useCallback(async (updatedProject: Project) => {
    await updateProjectMutation({
      id: updatedProject.id,
      name: updatedProject.name,
      type: updatedProject.type,
      content: updatedProject.content,
      isLocked: updatedProject.isLocked || false,
      createdAt: updatedProject.createdAt.toISOString(),
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

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // 1. Force authentication first
  if (!reviewer) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Show loading if database is not ready
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

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoBackToDashboard}>
              <LogoIcon className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">CanvasFeedback</h1>
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
              reviewer={reviewer}
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
