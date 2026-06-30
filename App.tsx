import React, { useState, useCallback } from 'react';
import { Project, ContentType, CommentStatus } from './types';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import { DashboardV2 } from './components/DashboardV2';
import { ProjectViewV2 } from './components/ProjectViewV2';
import { LogoIcon, LockClosedIcon, GlobeAltIcon, ArrowLeftIcon } from './components/icons';
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { LoginGate } from './components/LoginGate';
import { StudentSubmission } from './components/StudentSubmission';
import { LandingPage } from './components/LandingPage';

const App: React.FC = () => {
  const dbProjects = useQuery(api.projects.getProjects);
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // Platform Routing: 'landing' | 'reviewer' | 'reviewer_v2' | 'student' | 'student-canvas'
  const [role, setRole] = useState<'landing' | 'reviewer' | 'reviewer_v2' | 'student' | 'student-canvas'>('landing');

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
    return dbProjects.map((dbProj: any) => {
      let isV2 = dbProj.isV2;
      let submissionStatus = dbProj.submissionStatus;
      let readinessStatus = dbProj.readinessStatus;
      let preflight = dbProj.preflight;
      let checklist = dbProj.checklist;
      let selfCheck = dbProj.selfCheck;
      let reusableComments = dbProj.reusableComments;
      let aiSummary = dbProj.aiSummary;
      let deadline = undefined;
      let snapshots = undefined;
      let notes = dbProj.notes;
      let pinMetadata: Record<string, any> = {};

      if (dbProj.notes && dbProj.notes.startsWith('__V2_DATA__:\'')) {
        try {
          const parsed = JSON.parse(dbProj.notes.substring('__V2_DATA__:'.length));
          isV2 = parsed.isV2 ?? true;
          submissionStatus = parsed.submissionStatus;
          readinessStatus = parsed.readinessStatus;
          preflight = parsed.preflight;
          checklist = parsed.checklist;
          selfCheck = parsed.selfCheck;
          reusableComments = parsed.reusableComments;
          aiSummary = parsed.aiSummary;
          deadline = parsed.deadline;
          snapshots = parsed.snapshots;
          notes = parsed.notes;
          pinMetadata = parsed.pinMetadata || {};
        } catch (e) {
          // fallback if parsing failed
        }
      } else if (dbProj.notes && dbProj.notes.startsWith('__V2_DATA__:')) {
        try {
          const parsed = JSON.parse(dbProj.notes.substring('__V2_DATA__:'.length));
          isV2 = parsed.isV2 ?? true;
          submissionStatus = parsed.submissionStatus;
          readinessStatus = parsed.readinessStatus;
          preflight = parsed.preflight;
          checklist = parsed.checklist;
          selfCheck = parsed.selfCheck;
          reusableComments = parsed.reusableComments;
          aiSummary = parsed.aiSummary;
          deadline = parsed.deadline;
          snapshots = parsed.snapshots;
          notes = parsed.notes;
          pinMetadata = parsed.pinMetadata || {};
        } catch (e) {
          // fallback if parsing failed
        }
      }

      return {
        id: dbProj.id,
        name: dbProj.name,
        type: dbProj.type as ContentType,
        content: dbProj.content,
        isLocked: dbProj.isLocked,
        studentEmail: dbProj.studentEmail,
        studentName: dbProj.studentName,
        notes: notes,
        screenshots: dbProj.screenshots,
        createdAt: new Date(dbProj.createdAt),
        isV2,
        submissionStatus,
        readinessStatus,
        preflight,
        checklist,
        selfCheck,
        reusableComments,
        aiSummary,
        deadline,
        snapshots,
        pins: (dbProj.pins || []).map((pin: any) => {
          const meta = pinMetadata[pin.id] || {};
          return {
            id: pin.id,
            number: pin.number,
            x: pin.x,
            y: pin.y,
            status: pin.status as CommentStatus,
            viewport: pin.viewport || meta.viewport,
            suggestedFix: pin.suggestedFix || meta.suggestedFix,
            rubricCategory: pin.rubricCategory || meta.rubricCategory,
            severity: pin.severity || meta.severity,
            linkedChecklistId: pin.linkedChecklistId || meta.linkedChecklistId,
            findingStatus: pin.findingStatus || meta.findingStatus,
            comments: (pin.comments || []).map((c: any) => ({
              id: c.id,
              author: c.author,
              text: c.text,
              timestamp: new Date(c.timestamp),
              attachment: c.attachment,
            })),
          };
        }),
      };
    });
  }, [dbProjects]);

  const prepareProjectForDb = useCallback((projArgs: any) => {
    const pinMetadata: Record<string, any> = {};
    const sanitizedPins = (projArgs.pins || []).map((pin: any) => {
      if (pin.viewport || pin.suggestedFix || pin.rubricCategory || pin.severity || pin.linkedChecklistId || pin.findingStatus) {
        pinMetadata[pin.id] = {
          viewport: pin.viewport,
          suggestedFix: pin.suggestedFix,
          rubricCategory: pin.rubricCategory,
          severity: pin.severity,
          linkedChecklistId: pin.linkedChecklistId,
          findingStatus: pin.findingStatus,
        };
      }
      return {
        id: pin.id,
        number: pin.number,
        x: pin.x,
        y: pin.y,
        status: pin.status,
        comments: (pin.comments || []).map((c: any) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString() : new Date(c.timestamp).toISOString(),
          attachment: c.attachment,
        })),
      };
    });

    const v2Data = {
      isV2: projArgs.isV2 || false,
      submissionStatus: projArgs.submissionStatus,
      readinessStatus: projArgs.readinessStatus,
      preflight: projArgs.preflight,
      checklist: projArgs.checklist,
      selfCheck: projArgs.selfCheck,
      reusableComments: projArgs.reusableComments,
      aiSummary: projArgs.aiSummary,
      deadline: projArgs.deadline,
      snapshots: projArgs.snapshots,
      notes: projArgs.notes,
      pinMetadata,
    };

    const serializedNotes = `__V2_DATA__:${JSON.stringify(v2Data)}`;

    const dbPayload: any = {
      id: projArgs.id,
      name: projArgs.name,
      type: projArgs.type,
      content: projArgs.content,
      pins: sanitizedPins,
      createdAt: projArgs.createdAt,
      isLocked: projArgs.isLocked || false,
    };

    if (projArgs.studentEmail) dbPayload.studentEmail = projArgs.studentEmail;
    if (projArgs.studentName) dbPayload.studentName = projArgs.studentName;
    if (projArgs.screenshots) dbPayload.screenshots = projArgs.screenshots;
    dbPayload.notes = serializedNotes;

    return dbPayload;
  }, []);

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

  const handleCreateProjectV2 = useCallback(async (name: string, url: string, studentName?: string, studentEmail?: string) => {
    const projectId = `proj-${Date.now()}`;
    
    // Simulate automated preflight check signals
    const simulatedPreflight = JSON.stringify([
      { id: "https", name: "URL Availability & HTTPS", status: "pass_signal", details: "HTTPS connection is secure and available." },
      { id: "screenshots", name: "Screenshot Capture", status: "pass_signal", details: "Captured responsive desktop and mobile views." },
      { id: "broken_links", name: "Broken-link Signals", status: "pass_signal", details: "No broken local links detected." },
      { id: "placeholder_text", name: "Placeholder Text Detection", status: "warning", details: "Possible placeholder elements detected. Double check pages." },
      { id: "privacy_policy", name: "Privacy Policy Discoverability", status: "pass_signal", details: "Likely privacy link found in footer." },
      { id: "attribution", name: "Credits / Attribution Check", status: "warning", details: "No explicit Credits page in main navigation." },
      { id: "ai_disclosure", name: "AI Material Disclosure", status: "unknown", details: "Manual verification required for AI usage." },
      { id: "embedded_form", name: "Form / Video Embedding", status: "pass_signal", details: "Embedded form element detected on homepage." },
      { id: "accessibility", name: "Basic Accessibility Signals", status: "warning", details: "A few minor color contrast issues detected." }
    ]);

    const initialChecklist = JSON.stringify([
      { id: "check_1", text: "The live URL is public, correct, and reviewable.", status: "not_checked" },
      { id: "check_2", text: "The aim, target user, problem, and intended outcome are clear.", status: "not_checked" },
      { id: "check_3", text: "Navigation and important content work on desktop and mobile.", status: "not_checked" },
      { id: "check_4", text: "No important broken links, unfinished pages, or placeholder content remain.", status: "not_checked" },
      { id: "check_5", text: "Required form or quiz is embedded and functional.", status: "not_checked" },
      { id: "check_6", text: "The form gives meaningful feedback or a user-specific result.", status: "not_checked" },
      { id: "check_7", text: "Required video is embedded, usable fullscreen, and technically understandable.", status: "not_checked" },
      { id: "check_8", text: "Privacy information matches the data, platforms, and tools actually used.", status: "not_checked" },
      { id: "check_9", text: "Cookie consent is present and functional where required.", status: "not_checked" },
      { id: "check_10", text: "Media, sources, tools, and AI-generated material are appropriately disclosed and credited.", status: "not_checked" }
    ]);

    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default deadline is 7 days from now
    const initialSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      capturedBy: 'reviewer',
      content: url,
      preflight: simulatedPreflight,
      checklist: initialChecklist,
      pinsJson: '[]',
      notes: 'Initial Review Setup Snapshot'
    };

    const projectPayload = {
      id: projectId,
      name,
      type: ContentType.URL,
      content: url,
      pins: [],
      createdAt: new Date().toISOString(),
      isLocked: false,
      studentEmail: studentEmail || "adhoc_review@example.com",
      studentName: studentName || "Ad-hoc Review",
      notes: "Ad-hoc reviewer-initiated website review.",
      screenshots: [],
      isV2: true,
      submissionStatus: "submitted",
      readinessStatus: "not_assessed",
      preflight: simulatedPreflight,
      checklist: initialChecklist,
      deadline: defaultDeadline,
      snapshots: JSON.stringify([initialSnapshot]),
      reusableComments: [
        "Please check your text contrast ratios using the WebAIM tool.",
        "Ensure all links have meaningful descriptive anchor text rather than just 'click here'.",
        "The privacy policy page does not list all third party platforms actually used.",
        "Form input elements are missing proper <label> associations.",
        "Your embedded video lacks captions or a text transcript for accessibility."
      ]
    };

    const dbPayload = prepareProjectForDb(projectPayload);
    await createProjectMutation(dbPayload);
    setSelectedProjectId(projectId);
  }, [createProjectMutation, prepareProjectForDb]);

  const handleStudentSubmitProject = useCallback(async (data: {
    name: string;
    url: string;
    studentName: string;
    studentEmail: string;
    notes?: string;
    screenshots?: string[];
    selfCheck?: string;
  }) => {
    const projectId = `proj-${Date.now()}`;
    
    // Simulate automated preflight check signals
    const simulatedPreflight = JSON.stringify([
      { id: "https", name: "URL Availability & HTTPS", status: "pass_signal", details: "HTTPS connection is secure and available." },
      { id: "screenshots", name: "Screenshot Capture", status: "pass_signal", details: "Captured responsive desktop and mobile views." },
      { id: "broken_links", name: "Broken-link Signals", status: "pass_signal", details: "No broken local links detected." },
      { id: "placeholder_text", name: "Placeholder Text Detection", status: "warning", details: "Possible placeholder elements detected. Double check pages." },
      { id: "privacy_policy", name: "Privacy Policy Discoverability", status: "pass_signal", details: "Likely privacy link found in footer." },
      { id: "attribution", name: "Credits / Attribution Check", status: "warning", details: "No explicit Credits page in main navigation." },
      { id: "ai_disclosure", name: "AI Material Disclosure", status: "unknown", details: "Manual verification required for AI usage." },
      { id: "embedded_form", name: "Form / Video Embedding", status: "pass_signal", details: "Embedded form element detected on homepage." },
      { id: "accessibility", name: "Basic Accessibility Signals", status: "warning", details: "A few minor color contrast issues detected." }
    ]);

    const initialChecklist = JSON.stringify([
      { id: "check_1", text: "The live URL is public, correct, and reviewable.", status: "not_checked" },
      { id: "check_2", text: "The aim, target user, problem, and intended outcome are clear.", status: "not_checked" },
      { id: "check_3", text: "Navigation and important content work on desktop and mobile.", status: "not_checked" },
      { id: "check_4", text: "No important broken links, unfinished pages, or placeholder content remain.", status: "not_checked" },
      { id: "check_5", text: "Required form or quiz is embedded and functional.", status: "not_checked" },
      { id: "check_6", text: "The form gives meaningful feedback or a user-specific result.", status: "not_checked" },
      { id: "check_7", text: "Required video is embedded, usable fullscreen, and technically understandable.", status: "not_checked" },
      { id: "check_8", text: "Privacy information matches the data, platforms, and tools actually used.", status: "not_checked" },
      { id: "check_9", text: "Cookie consent is present and functional where required.", status: "not_checked" },
      { id: "check_10", text: "Media, sources, tools, and AI-generated material are appropriately disclosed and credited.", status: "not_checked" }
    ]);

    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default deadline is 7 days from now
    const initialSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      capturedBy: 'student',
      content: data.url,
      preflight: simulatedPreflight,
      checklist: initialChecklist,
      pinsJson: '[]',
      notes: 'Initial Submission Snapshot'
    };

    const projectPayload = {
      id: projectId,
      name: data.name,
      type: ContentType.URL,
      content: data.url,
      pins: [],
      createdAt: new Date().toISOString(),
      isLocked: false,
      studentEmail: data.studentEmail,
      studentName: data.studentName,
      notes: data.notes || "Student project submission.",
      screenshots: data.screenshots,
      isV2: true,
      submissionStatus: "submitted",
      readinessStatus: "not_assessed",
      preflight: simulatedPreflight,
      checklist: initialChecklist,
      selfCheck: data.selfCheck,
      deadline: defaultDeadline,
      snapshots: JSON.stringify([initialSnapshot]),
      reusableComments: [
        "Please check your text contrast ratios using the WebAIM tool.",
        "Ensure all links have meaningful descriptive anchor text rather than just 'click here'.",
        "The privacy policy page does not list all third party platforms actually used.",
        "Form input elements are missing proper <label> associations.",
        "Your embedded video lacks captions or a text transcript for accessibility."
      ]
    };

    const dbPayload = prepareProjectForDb(projectPayload);
    await createProjectMutation(dbPayload);
  }, [createProjectMutation, prepareProjectForDb]);

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
    if (updatedProject.isV2) {
      const dbPayload = prepareProjectForDb({
        ...updatedProject,
        createdAt: updatedProject.createdAt.toISOString()
      });
      await updateProjectMutation(dbPayload);
    } else {
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
    }
  }, [updateProjectMutation, prepareProjectForDb]);

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
      <LandingPage onSelectRole={(selectedRole) => setRole(selectedRole)} />
    );
  }

  // 3. Render Reviewer Security Gate (if they chose Reviewer role but are not logged in)
  if ((role === 'reviewer' || role === 'reviewer_v2') && !reviewer) {
    const handleLoginV2Success = (email: string, name: string) => {
      const user = { email, name };
      localStorage.setItem('esp_reviewer', JSON.stringify(user));
      setReviewer(user);
    };

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
        <LoginGate onLoginSuccess={(email, name) => {
          handleLoginV2Success(email, name);
        }} />
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
                <span>View-Only Feedback Mode {selectedProject.isV2 && "(Workspace 2.0)"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)]">
          {selectedProject.isV2 ? (
            <ProjectViewV2
              key={selectedProject.id}
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onGoBack={handleGoBackToDashboard}
              isReadOnly={true}
            />
          ) : (
            <ProjectView
              key={selectedProject.id}
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onGoBack={handleGoBackToDashboard}
              isReadOnly={true}
            />
          )}
        </main>
      </div>
    );
  }

  // 6. Reviewer Workspace 2.0 (Enhanced "Submit Ready" workflow)
  if (role === 'reviewer_v2') {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-white">
        <header className="bg-slate-900 border-b border-slate-850 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoBackToDashboard}>
                <LogoIcon className="h-8 w-8 text-indigo-400" />
                <h1 className="text-xl font-bold text-white flex items-center space-x-1.5">
                  <span>Critique Workspace 2.0</span>
                  <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Submit Ready</span>
                </h1>
              </div>
              {reviewer && (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-200">{reviewer.name}</span>
                    <span className="text-xs text-slate-400">{reviewer.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center px-3.5 py-1.5 border border-slate-800 hover:border-red-800 rounded-lg text-sm font-semibold text-slate-300 hover:text-red-400 hover:bg-red-950/20 transition-colors focus:outline-none"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow bg-slate-950">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-full">
            {selectedProject ? (
              <ProjectViewV2
                key={selectedProject.id}
                project={selectedProject}
                onUpdateProject={handleUpdateProject}
                onGoBack={handleGoBackToDashboard}
                reviewer={reviewer || undefined}
              />
            ) : selectedProjectId ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                <h3 className="text-lg font-bold text-slate-200">Initializing Critique Workspace 2.0...</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm">
                  We are generating checklists, preflight diagnostics, and setting up the live annotation canvas.
                </p>
              </div>
            ) : (
              <DashboardV2
                projects={projects}
                onCreateProject={handleCreateProjectV2}
                onSelectProject={handleSelectProject}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  // 7. Main Reviewer Dashboard 1.0 & Admin View
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
          ) : selectedProjectId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <h3 className="text-lg font-bold text-slate-800">Initializing Critique Workspace...</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm">
                Connecting to database and setting up canvas viewer.
              </p>
            </div>
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
