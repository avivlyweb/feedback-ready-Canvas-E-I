import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoIcon } from './icons';

interface LandingPageProps {
  onSelectRole: (role: 'reviewer' | 'reviewer_v2' | 'student') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Modal states
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is the core purpose of the ESP Critique Canvas?",
      a: "This workspace is built to connect students and reviewers through live visual annotation. Instead of trading screenshots or generic feedback links, reviewers drop pinpoint coordinates directly onto live viewports. It is how we ensure every student project is rigorously evaluated and polished before staging."
    },
    {
      q: "How does the Automated Preflight Diagnostics system operate?",
      a: "Our background preflight pipeline scans submitted student links to check for active SSL certificates, dead link redirects, and font-wrapping responsiveness. This immediate feedback helps students fix elementary code bugs before a human reviewer sits down to evaluate the design layout."
    },
    {
      q: "How does the Google Gemini integration assist the feedback loop?",
      a: "Gemini serves as a dual-role assistant. It runs predictive layout pre-scans to detect accessibility issues, form label anomalies, and contrast warnings. Then, it compiles active checklists, review comments, and diagnostics findings into structured draft reports for fast revision tracking."
    },
    {
      q: "Is submitted student work stored securely on this platform?",
      a: "Absolutely. We are serious about database integrity and security. All submission entries, site logs, and visual remarks are stored securely. No cookie trackers or third-party marketing services are ever run on this educational software."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Custom Embedded CSS animations to replace emojis with pristine vector graphics */}
      <style>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(24px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-scan-line {
          animation: scan-line 3s ease-in-out infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
        .animate-subtle-bounce {
          animation: subtle-bounce 2s ease-in-out infinite;
        }
      `}</style>

      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/30 group-hover:bg-indigo-600/20 transition-all duration-300">
                <LogoIcon className="h-7 w-7 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-lg tracking-tight leading-tight">ESP Critique</span>
                <span className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">Canvas Feedback</span>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#workflow" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">How It Works</a>
              <button 
                onClick={() => setIsRubricOpen(true)} 
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors focus:outline-none"
              >
                Course Rubric
              </button>
              <a href="#faqs" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">FAQs</a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => onSelectRole('student')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-800 hover:border-slate-750 transition-all shadow-sm focus:outline-none"
              >
                Student Submission Portal
              </button>
              <button
                onClick={() => onSelectRole('reviewer_v2')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:translate-y-[-1px] focus:outline-none"
              >
                Launch Workspace 2.0
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-3 text-slate-400 hover:text-white focus:outline-none rounded-lg hover:bg-slate-900/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-900 bg-slate-950 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-3">
                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-300 hover:text-white px-4 py-3 rounded-lg hover:bg-slate-900 min-h-[44px]"
                >
                  Features
                </a>
                <a
                  href="#workflow"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-300 hover:text-white px-4 py-3 rounded-lg hover:bg-slate-900 min-h-[44px]"
                >
                  How It Works
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRubricOpen(true);
                  }}
                  className="w-full text-left block text-base font-bold text-slate-300 hover:text-white px-4 py-3 rounded-lg hover:bg-slate-900 min-h-[44px]"
                >
                  Course Rubric
                </button>
                <a
                  href="#faqs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-300 hover:text-white px-4 py-3 rounded-lg hover:bg-slate-900 min-h-[44px]"
                >
                  FAQs
                </a>

                <div className="pt-4 border-t border-slate-900 flex flex-col space-y-3">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectRole('student');
                    }}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl border border-slate-800 transition-all text-center min-h-[44px]"
                  >
                    Student Submission Portal
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectRole('reviewer_v2');
                    }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all text-center shadow-lg shadow-indigo-500/25 min-h-[44px]"
                  >
                    Launch Workspace 2.0
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectRole('reviewer');
                    }}
                    className="w-full py-3 text-slate-500 hover:text-slate-300 text-xs font-bold text-center transition-all min-h-[44px]"
                  >
                    Access Legacy Workspace 1.0
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-indigo-400 text-xs font-black uppercase tracking-wider">
                <span>Version 2.0 Submit Ready Active</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                Interactive Website Reviews, <span className="text-indigo-400 bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">Perfected.</span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-semibold leading-relaxed">
                Design critique, responsive viewport testing, and compliance checklist evaluations for student web applications—unified into a real-time collaborative canvas. We build tools that make learning interactive and keep our foundations solid.
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 py-4 max-w-md mx-auto lg:mx-0 text-left">
                <div className="border-l-2 border-indigo-500 pl-3">
                  <div className="text-xl font-extrabold text-white">100%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Live Annotation</div>
                </div>
                <div className="border-l-2 border-indigo-500 pl-3">
                  <div className="text-xl font-extrabold text-white">10-Point</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rubric Check</div>
                </div>
                <div className="border-l-2 border-indigo-500 pl-3">
                  <div className="text-xl font-extrabold text-white">Gemini</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Automated AI</div>
                </div>
              </div>

              {/* Hero CTA Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onSelectRole('reviewer_v2')}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:translate-y-[-1.5px] transition-all flex items-center justify-center space-x-2"
                >
                  <span>Launch Workspace 2.0</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  onClick={() => onSelectRole('student')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-center"
                >
                  Submit Your URL
                </button>
              </div>

              {/* Tiny Legacy Link */}
              <div className="text-center lg:text-left">
                <button 
                  onClick={() => onSelectRole('reviewer')}
                  className="text-xs text-slate-500 hover:text-indigo-400 font-semibold underline decoration-dotted transition-colors"
                >
                  Need legacy workspace 1.0? Click here.
                </button>
              </div>
            </div>

            {/* Visual Canvas Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/60 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  </div>
                  <div className="bg-slate-950 px-3 py-1 rounded-md text-[10px] font-mono text-indigo-400 border border-slate-800">
                    critique-canvas.esp.amsterdam
                  </div>
                  <div className="w-4 h-4"></div>
                </div>

                {/* Submissions viewport visualization with pins */}
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px]">
                    <span className="text-slate-400 font-bold">Viewport:</span>
                    <div className="flex space-x-1.5 font-bold">
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">Desktop</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">Mobile</span>
                    </div>
                  </div>

                  <div className="aspect-video bg-slate-900 rounded-lg relative overflow-hidden border border-slate-800 flex items-center justify-center">
                    {/* Simulated live page */}
                    <div className="w-full h-full p-4 space-y-3 opacity-80">
                      <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                      <div className="h-8 bg-slate-800 rounded w-full"></div>
                      <div className="h-12 bg-slate-800 rounded w-4/5"></div>
                    </div>

                    {/* Annotation visual pins */}
                    <div className="absolute top-1/4 left-1/3 w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center animate-subtle-bounce shadow-lg shadow-rose-500/30 cursor-pointer">
                      1
                    </div>
                    <div className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer">
                      2
                    </div>

                    {/* Live tooltip */}
                    <div className="absolute bottom-2 left-2 bg-slate-950 border border-slate-800 p-2 rounded-md shadow-xl text-[9px] max-w-[140px] leading-tight text-left">
                      <div className="font-extrabold text-indigo-400 flex items-center space-x-1">
                        <span>Check: Must Fix</span>
                      </div>
                      <p className="text-slate-300 font-semibold mt-0.5">Forms have no accessible labels.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold">Diagnostics preflight:</span>
                    <span className="text-indigo-400 font-bold flex items-center space-x-1">
                      <span>✓ SSL Secured</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES (EMOJIS COMPLETELY REMOVED & REPLACED WITH INTERACTIVE VECTOR SVGS) */}
      <section id="features" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Rigorous Standards, Automated Signals
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base font-semibold leading-relaxed">
              We translate standard assessment criteria into automated digital signals, helping students publish robust, accessible, and high-performance frontend code. Here is how we build rock-solid foundations together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 - Vector SVG */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M4 4h16v16H4V4z" />
                </svg>
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse-ring"></span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Critique Canvas</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Click directly on student layouts inside mobile, tablet, or desktop iFrames. Pin pinpoint coordinate comments exactly where changes must happen. No guesswork, just clear visual reviews.
              </p>
            </div>

            {/* Feature 2 - Vector SVG */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096M9 21h8M5 3h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <div className="absolute inset-x-0 top-3 h-0.5 bg-indigo-400 animate-scan-line"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Pre-Scan Audit</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Trigger predictive audits with Google Gemini model APIs before starting manual reviews. Spot potential layout shifts, forms validation issues, and contrast conflicts instantly.
              </p>
            </div>

            {/* Feature 3 - Vector SVG */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">10-Point Checklist</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                The embedded syllabus guidelines are integrated as an interactive rubric. Tick off cookie policies, accessible label bindings, headers nesting, and performance parameters in real-time.
              </p>
            </div>

            {/* Feature 4 - Vector SVG */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Preflight Diagnostics</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Automated check pipelines verify secure SSL protections, validate links, and measure load metrics. Spot unencrypted assets or empty redirects prior to formal submissions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* WEB STANDARDS WE PREACH (THE VALUE PROPOSITION) */}
      <section className="py-20 bg-slate-900 border-t border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                The Practical Standards We Preach
              </h2>
              <p className="text-slate-400 text-sm sm:text-base font-semibold leading-relaxed">
                In our curriculum, we are passionate about the details. We do not just teach layouts; we build professional-grade developers. That means understanding exactly how compliance, accessibility, and encryption work under the hood.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <span className="text-indigo-400 font-extrabold text-xs block uppercase tracking-widest mb-1">User Consent Consent Engine</span>
                  <p className="text-xs text-slate-300 font-semibold">
                    We require a fully functioning cookie consent banner that gathers explicit user consent prior to saving local storage flags. No exceptions.
                  </p>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <span className="text-indigo-400 font-extrabold text-xs block uppercase tracking-widest mb-1">WebAIM Compliant Styles</span>
                  <p className="text-xs text-slate-300 font-semibold">
                    Contrast ratios are measured against WCAG AA requirements (4.5:1 minimum ratio). We help students build interfaces that are accessible to everyone.
                  </p>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <span className="text-indigo-400 font-extrabold text-xs block uppercase tracking-widest mb-1">320px Fluid Layouts</span>
                  <p className="text-xs text-slate-300 font-semibold">
                    Your code must look fantastic and wrap naturally at small sizes down to 320px width, without clipped titles or awkward overflow-x lines.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-8 rounded-3xl space-y-6">
              <h3 className="text-xl font-bold text-white">Full 10-Point Checklist Pillars</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Every webpage is evaluated systematically. Workspace 2.0 tracks each milestone automatically:
              </p>
              <ul className="space-y-3.5 text-xs font-semibold text-slate-300">
                <li className="flex items-start space-x-3">
                  <span className="text-indigo-400 font-black">01</span>
                  <span><strong>Secure SSL Access</strong>: All scripts, assets, and routes loaded exclusively over HTTPS.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-indigo-400 font-black">02</span>
                  <span><strong>Semantic Header Hierarchy</strong>: Proper logical nesting from heading 1 down to heading 4.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-indigo-400 font-black">03</span>
                  <span><strong>Accessible Form Binding</strong>: Explicit label matching with matching ID inputs for screen readers.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-indigo-400 font-black">04</span>
                  <span><strong>Document Language Declaration</strong>: Proper HTML lang parameters defined on head nodes.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-indigo-400 font-black">05</span>
                  <span><strong>Contrast & Accessibility</strong>: WebAIM compliant high-contrast designs.</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Education is about building things that last.</span>
                <button 
                  onClick={() => setIsRubricOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-black text-xs transition-colors focus:outline-none"
                >
                  View Full Syllabus
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW TIMELINE */}
      <section id="workflow" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-wider">Unified Review Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              How the Feedback Loop Operates
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base font-semibold leading-relaxed">
              We connect student portals directly to review workspaces. It is a continuous loop of diagnostics, visual pinning, and AI assistance.
            </p>
          </div>

          <div className="relative border-l border-slate-800 max-w-3xl mx-auto pl-6 sm:pl-10 space-y-12">
            {/* Timeline Node 1 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                1
              </span>
              <h3 className="text-lg font-bold text-white">Student URL Submission</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Submit your active website link along with project diaries or screenshots. Our system instantly maps it to the reviewer pipeline.
              </p>
            </div>

            {/* Timeline Node 2 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                2
              </span>
              <h3 className="text-lg font-bold text-white">Preflight Inspection</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Automated protocols verify SSL encryption, inspect active link references, and log speed parameters before a manual check takes place.
              </p>
            </div>

            {/* Timeline Node 3 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                3
              </span>
              <h3 className="text-lg font-bold text-white">Pinpoint Coordinates Critique</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Instructors click directly on the layout inside Workspace 2.0 to drop pinpoint coordinate markers, tag severities, and link to specific checklist targets.
              </p>
            </div>

            {/* Timeline Node 4 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                4
              </span>
              <h3 className="text-lg font-bold text-white">AI Compilations & Revisions</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Google Gemini synthesizes all placed remarks and checklist points into a clean markdown draft. Students address fixes directly in code and toggle them off.
              </p>
            </div>
          </div>

          {/* Core Callout */}
          <div className="mt-16 bg-gradient-to-r from-slate-950 to-slate-900 rounded-2xl p-6 sm:p-10 border border-slate-900 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-bold text-white">Ready to test your code layout?</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xl font-semibold leading-relaxed">
                Connect your live project link right now to run instant audits against core Web engineering criteria.
              </p>
            </div>
            <button
              onClick={() => onSelectRole('student')}
              className="w-full md:w-auto shrink-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all focus:outline-none"
            >
              Access Student Portal
            </button>
          </div>

        </div>
      </section>

      {/* DYNAMIC COMPLIANCE FAQ */}
      <section id="faqs" className="py-20 bg-slate-900 border-t border-slate-950 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-wider">Help Desk</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none min-h-[44px]"
                >
                  <span className="font-bold text-white text-sm sm:text-base">{faq.q}</span>
                  <span className={`text-indigo-400 shrink-0 ml-4 transform transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : 'rotate-0'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-900 bg-slate-950/50"
                    >
                      <p className="p-6 text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* MULTI-COLUMN DETAILED FOOTER (POLISHED MENU) */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            
            {/* Column 1 - Brand & Purpose */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <LogoIcon className="h-6 w-6 text-indigo-400" />
                <span className="font-black text-white text-base tracking-tight">ESP Critique Canvas</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-semibold max-w-sm">
                A system designed to bridge classroom studies and production releases. We leverage live viewports, checklists, and predictive diagnostics to help students deploy secure, high-contrast, and fast-loading web applications.
              </p>
              <div className="pt-2 flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 w-fit">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">SYSTEM SECURED - SSL MANDATORY</span>
              </div>
            </div>

            {/* Column 2 - Active Portals */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Workspaces</h4>
              <ul className="space-y-2.5 font-bold text-slate-400">
                <li>
                  <button onClick={() => onSelectRole('reviewer_v2')} className="hover:text-indigo-400 transition-colors focus:outline-none text-left">
                    Reviewer Workspace 2.0
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectRole('reviewer')} className="hover:text-indigo-400 transition-colors focus:outline-none text-left">
                    Reviewer Workspace 1.0
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectRole('student')} className="hover:text-indigo-400 transition-colors focus:outline-none text-left">
                    Student Submission Portal
                  </button>
                </li>
                <li>
                  <a href="#features" className="hover:text-indigo-400 transition-colors">Compliance Diagnostics</a>
                </li>
              </ul>
            </div>

            {/* Column 3 - Developer Tools */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Syllabus Resources</h4>
              <ul className="space-y-2.5 font-bold text-slate-400">
                <li>
                  <button onClick={() => setIsRubricOpen(true)} className="hover:text-indigo-400 transition-colors focus:outline-none text-left">
                    10-Point Checklist Criteria
                  </button>
                </li>
                <li>
                  <a href="https://webaim.org/resources/contrastchecker/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                    WebAIM Contrast Checker
                  </a>
                </li>
                <li>
                  <a href="https://developer.mozilla.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                    MDN Layout Docs
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 - Code Policy preaching */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Legal & Preachings</h4>
              <ul className="space-y-2.5 font-bold text-slate-400">
                <li>
                  <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-indigo-400 text-left transition-colors focus:outline-none">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsTermsOpen(true)} className="hover:text-indigo-400 text-left transition-colors focus:outline-none">
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsRubricOpen(true)} className="hover:text-indigo-400 text-left transition-colors focus:outline-none">
                    Academic Honesty Syllabus
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom attribution */}
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 font-bold text-[11px] text-center md:text-left">
              &copy; {new Date().getFullYear()} ESP Amsterdam. All rights reserved. Registered Educational Platform.
            </p>
            <p className="text-slate-600 font-bold text-[10px] text-center md:text-right">
              Powered by standard HTML5 structure, CSS grids, Convex real-time synchronization, and Google Gemini model integrations.
            </p>
          </div>
        </div>
      </footer>

      {/* -------------------- MODALS (EMOJIS COMPLETELY REMOVED) -------------------- */}

      {/* Modal 1: Privacy Policy */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-white">Privacy Policy & Secure Data Guidelines</h3>
                </div>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto text-xs leading-relaxed text-slate-300 font-semibold">
                <p>
                  At ESP Amsterdam, we teach privacy compliance and data security as foundational pillars of modern software engineering. We believe what we preach in our courses should reflect directly in our apps.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">1. Encryption and Secure Protocols</h4>
                <p>
                  Any project address submitted to this platform is analyzed over SSL. In strict accordance with privacy regulations, we refuse to process unencrypted HTTP links to verify submissions. This ensures student data travels securely.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">2. Processing of Code Assets and Screenshots</h4>
                <p>
                  Screenshots, annotations, and code metrics are analyzed in real-time on secure cloud environments. No third-party ad networks or tracking scripts are ever connected. Your intellectual efforts remain entirely yours.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">3. Google Gemini API Pipeline</h4>
                <p>
                  We utilize secure Google Gemini model APIs to run compliance audits. Submitted links and user remarks are passed securely to extract checklist requirements and compile summaries. This analysis is transient and never used for training models.
                </p>
              </div>
              <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all focus:outline-none"
                >
                  Confirm and Agree
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Terms of Use */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-white">Terms of Use & Code of Conduct</h3>
                </div>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto text-xs leading-relaxed text-slate-300 font-semibold">
                <p>
                  By launching the portals of this application, you commit to respecting standard web design benchmarks and constructive critique practices.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">1. Academic Integrity and Originality</h4>
                <p>
                  All projects submitted to the canvas must be your own authentic code. Integrating template boilerplate code without direct annotation is strictly forbidden under academic guidelines.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">2. Respectful, Direct Feedback</h4>
                <p>
                  Reviews must remain constructive, technical, and aligned with standard visual design principles. Derivatives of offensive or unhelpful comments will result in instant credentials lock.
                </p>
              </div>
              <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all focus:outline-none"
                >
                  Accept Terms
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Course Rubric Guidelines */}
      <AnimatePresence>
        {isRubricOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-white">ESP Course Rubric & 10-Point Checklist</h3>
                </div>
                <button
                  onClick={() => setIsRubricOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto text-xs leading-relaxed text-slate-300 font-semibold">
                <p>
                  To earn a "Submit Ready" status in our Web curriculum, every student web application is systematically assessed against these rigorous criteria:
                </p>
                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">01</span>
                    <div>
                      <span className="text-white font-extrabold block">Cookie Consent Banner</span>
                      <p className="text-slate-400 text-[11px]">User consent must be explicitly gathered with options before storing local states.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">02</span>
                    <div>
                      <span className="text-white font-extrabold block">WebAIM Contrast Alignment</span>
                      <p className="text-slate-400 text-[11px]">All text must pass the WCAG AA contrast ratio of at least 4.5:1 for accessibility.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">03</span>
                    <div>
                      <span className="text-white font-extrabold block">Breakpoint Wrapping Flow</span>
                      <p className="text-slate-400 text-[11px]">Menus and content layouts must scale properly to 320px width without breaking structures or causing scroll-x lines.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">04</span>
                    <div>
                      <span className="text-white font-extrabold block">Semantic Headers Nesting</span>
                      <p className="text-slate-400 text-[11px]">Logical and sequential tag hierarchy from h1 down to h4 elements.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">05</span>
                    <div>
                      <span className="text-white font-extrabold block">Accessible Labels Matching</span>
                      <p className="text-slate-400 text-[11px]">Every text input block must have an explicitly linked label with matching ID.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">06</span>
                    <div>
                      <span className="text-white font-extrabold block">Active SSL Protection</span>
                      <p className="text-slate-400 text-[11px]">No unencrypted external files, assets, or scripts. Mandatory HTTPS access.</p>
                    </div>
                  </div>
                </div>
                <p>
                  Workspace 2.0 tracks each metric systematically, helping students and reviewers deploy compliant work fast.
                </p>
              </div>
              <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsRubricOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all focus:outline-none"
                >
                  Back to Overview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
