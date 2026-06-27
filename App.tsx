import React, { useState, useCallback } from 'react';
import { Project, ContentType } from './types';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleCreateProject = useCallback((name: string, type: ContentType, content: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      type,
      content,
      pins: [],
      createdAt: new Date(),
      isLocked: false,
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    setSelectedProjectId(newProject.id);
  }, []);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleGoBackToDashboard = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
    }
  }, [selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoBackToDashboard}>
              <LogoIcon className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">CanvasFeedback</h1>
            </div>
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
