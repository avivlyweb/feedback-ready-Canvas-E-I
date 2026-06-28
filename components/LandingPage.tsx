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
      q: "What is the ESP Critique Canvas?",
      a: "It is an interactive assessment workspace built for modern web design courses. It bridges the gap between students and reviewers by allowing live, pixel-perfect, and localized visual annotations directly atop student websites across mobile, tablet, and desktop viewports."
    },
    {
      q: "How does the Automated Preflight Check work?",
      a: "When a project is reviewed, our preflight pipeline automatically checks for a secure HTTPS protocol, measures page-load speed reminders, and inspects active links. This ensures your code meets standard production requirements prior to human evaluation."
    },
    {
      q: "What is the role of Gemini AI in the workspace?",
      a: "Gemini AI serves dual roles: First, as a pre-scan auditor that predicts visual layout or accessibility risks before a human starts reviewing. Second, as a critique summarizer that compiles active checklist points, pins, and comments into a professional evaluation draft."
    },
    {
      q: "Is my personal work secure?",
      a: "Yes. All project submissions, screenshots, and live comments are stored securely using Convex database rules. We do not sell or track any student code data."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Course Rubric
              </button>
              <a href="#faqs" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">FAQs</a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => onSelectRole('student')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-sm focus:outline-none"
              >
                Student Submission
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
                className="p-2 text-slate-400 hover:text-white focus:outline-none rounded-lg hover:bg-slate-800/80 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
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
              className="md:hidden border-t border-slate-800 bg-slate-900 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60"
                >
                  Features
                </a>
                <a
                  href="#workflow"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60"
                >
                  How It Works
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRubricOpen(true);
                  }}
                  className="w-full text-left block text-base font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60"
                >
                  Course Rubric
                </button>
                <a
                  href="#faqs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60"
                >
                  FAQs
                </a>

                <div className="pt-4 border-t border-slate-800 flex flex-col space-y-3">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectRole('student');
                    }}
                    className="w-full py-3 bg-slate-800 text-white font-bold text-sm rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-center"
                  >
                    Student Submission
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectRole('reviewer_v2');
                    }}
                    className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-500 transition-all text-center shadow-lg shadow-indigo-500/25"
                  >
                    Launch Workspace 2.0
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectRole('reviewer');
                    }}
                    className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-200 text-xs font-semibold text-center transition-all"
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
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-indigo-400 text-xs font-black uppercase tracking-wider">
                <span>⚡ Version 2.0 Submit Ready Active</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                Interactive Website Reviews, <span className="text-indigo-400 bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">Perfected.</span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Design critique, responsive viewport testing, and compliance checklist evaluations for frontend clinical websites—unified into a real-time collaborative canvas.
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
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-center"
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
              <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/60 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="bg-slate-900 px-3 py-1 rounded-md text-[10px] font-mono text-indigo-400 border border-slate-800">
                    critique-canvas.esp.amsterdam
                  </div>
                  <div className="w-4 h-4"></div>
                </div>

                {/* Submissions viewport visualization with pins */}
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px]">
                    <span className="text-slate-400">Viewport:</span>
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
                    <div className="absolute top-1/4 left-1/3 w-6 h-6 rounded-full bg-red-500 text-white font-bold text-xs flex items-center justify-center animate-bounce shadow-lg shadow-red-500/30 cursor-pointer">
                      1
                    </div>
                    <div className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer">
                      2
                    </div>

                    {/* Live tooltip */}
                    <div className="absolute bottom-2 left-2 bg-slate-950 border border-slate-800 p-2 rounded-md shadow-xl text-[9px] max-w-[140px] leading-tight text-left">
                      <div className="font-extrabold text-red-400 flex items-center space-x-1">
                        <span>● MUST FIX</span>
                      </div>
                      <p className="text-slate-300 font-semibold mt-0.5">Forms have no accessible labels.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold">Diagnostics preflight:</span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <span>✓ SSL Secured</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Built for the Rigor of Professional Web Standards
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base font-medium leading-relaxed">
              We translate standard assessment criteria into automated digital signals, helping students publish robust, accessible, and high-performance frontend code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-400 text-xl font-bold">📍</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Critique Canvas</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Reviewers click directly on student layouts inside mobile, tablet, or desktop iFrames to pin contextual commentary precisely.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-400 text-xl font-bold">✨</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Pre-Scan Audit</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Run automated predictive reviews on any URL with Gemini AI, pinpointing potential layouts, forms, and contrast risks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-400 text-xl font-bold">📋</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">10-Point Checklist</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                An embedded grading checklist covers cookies, accessibility guidelines, font wrapping, forms validation, and speed checks.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-400 text-xl font-bold">🩺</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Preflight Diagnostics</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Automated protocols verify SSL protection (HTTPS) and warn users about dangerous unencrypted scripts or dead links instantly.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* WORKFLOW TIMELINE */}
      <section id="workflow" className="py-20 bg-slate-900 border-t border-slate-950 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-wider">Educational Synergy</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              How the Critique Feedback Loop Works
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base font-medium leading-relaxed">
              Seamlessly connect student submissions to rigorous reviewer checks, ensuring quick iterations toward live release.
            </p>
          </div>

          <div className="relative border-l border-slate-800 max-w-3xl mx-auto pl-6 sm:pl-10 space-y-12">
            {/* Timeline Node 1 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                1
              </span>
              <h3 className="text-lg font-bold text-white">Student Submission Portal</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Students enter their website address, add custom design journals, and upload screenshots. The app connects over Convex and immediately schedules audits.
              </p>
            </div>

            {/* Timeline Node 2 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                2
              </span>
              <h3 className="text-lg font-bold text-white">Automated AI Pre-Scan & Diagnostics</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Before the review begins, the reviewer triggers a predictive Gemini model pre-scan of the student's submission. SSL structures and speed diagnostics compile immediately.
              </p>
            </div>

            {/* Timeline Node 3 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                3
              </span>
              <h3 className="text-lg font-bold text-white">Interactive Viewport Annotation</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                Reviewers analyze the live viewport inside Workspace 2.0. They click directly on layouts, tag issues with specific severities (Must Fix, Suggestion), and tick rubric checklists.
              </p>
            </div>

            {/* Timeline Node 4 */}
            <div className="relative">
              <span className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-lg">
                4
              </span>
              <h3 className="text-lg font-bold text-white">AI Critique Compilations & Revisions</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-semibold">
                With one click, Gemini aggregates all placed pins, checklist criteria, and preflight findings to synthesize a draft evaluation report. Students address fixes on their live site and mark annotations as completed.
              </p>
            </div>
          </div>

          {/* Core Callout */}
          <div className="mt-16 bg-gradient-to-r from-slate-950 to-slate-900 rounded-2xl p-6 sm:p-10 border border-slate-850 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-bold text-white">Ready to streamline your frontend submissions?</h4>
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
      <section id="faqs" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
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
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
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
                      className="border-t border-slate-850 bg-slate-900/50"
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

      {/* MULTI-COLUMN DETAILED FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            
            {/* Column 1 - Brand & Explain */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <LogoIcon className="h-6 w-6 text-indigo-400" />
                <span className="font-black text-white text-base tracking-tight">ESP Critique Canvas</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-semibold max-w-sm">
                ESP Amsterdam educational review system. Our app leverages automated diagnostics, 10-point checklist rules, and visual annotator pins to prepare student projects for production-grade web releases.
              </p>
              <div className="pt-2 flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">SECURE DB ACCESS IN AMSTERDAM</span>
              </div>
            </div>

            {/* Column 2 - Quick Launch */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Workspaces</h4>
              <ul className="space-y-2.5 font-bold text-slate-400">
                <li>
                  <button onClick={() => onSelectRole('reviewer_v2')} className="hover:text-indigo-400 transition-colors">
                    Reviewer Workspace 2.0 (New)
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectRole('reviewer')} className="hover:text-indigo-400 transition-colors">
                    Reviewer Workspace 1.0
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectRole('student')} className="hover:text-indigo-400 transition-colors">
                    Student Submission Portal
                  </button>
                </li>
                <li>
                  <a href="#features" className="hover:text-indigo-400 transition-colors">Compliance Audits</a>
                </li>
              </ul>
            </div>

            {/* Column 3 - Course Resources */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Course Resources</h4>
              <ul className="space-y-2.5 font-bold text-slate-400">
                <li>
                  <button onClick={() => setIsRubricOpen(true)} className="hover:text-indigo-400 transition-colors">
                    10-Point Checklist Syllabus
                  </button>
                </li>
                <li>
                  <a href="https://webaim.org/resources/contrastchecker/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center space-x-1.5">
                    <span>WebAIM Contrast Checker</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">Ext</span>
                  </a>
                </li>
                <li>
                  <a href="https://developer.mozilla.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center space-x-1.5">
                    <span>MDN Web Docs</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">Ext</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 - Legal / Rules we preach */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Legal & Guidelines</h4>
              <ul className="space-y-2.5 font-bold text-slate-400">
                <li>
                  <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-indigo-400 text-left transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsTermsOpen(true)} className="hover:text-indigo-400 text-left transition-colors">
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsRubricOpen(true)} className="hover:text-indigo-400 text-left transition-colors">
                    Academic Honesty & Rubric
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom attribution */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 font-bold text-[11px] text-center md:text-left">
              &copy; {new Date().getFullYear()} ESP Amsterdam. All rights reserved. Registered Educational Platform.
            </p>
            <p className="text-slate-600 font-bold text-[10px] text-center md:text-right">
              Powered by standard HTML5, CSS Grid/Flexbox, Convex Real-time Sync, and Google Gemini API auditing models.
            </p>
          </div>
        </div>
      </footer>

      {/* -------------------- MODALS -------------------- */}

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
                  <span className="text-indigo-400 text-lg">🛡️</span>
                  <h3 className="text-base font-black text-white">Privacy Policy & Secure Data Guidelines</h3>
                </div>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto text-xs leading-relaxed text-slate-300 font-semibold">
                <p>
                  At ESP Amsterdam, we preach security and privacy compliance as critical components of standard frontend engineering curriculum.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">1. Encryption & HTTPS Mandatory Access</h4>
                <p>
                  Any project submitted to our servers undergoes an automated validation check. In alignment with modern privacy standards (such as GDPR), we do not process student URLs over unencrypted HTTP channels.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">2. Processing of Visual Assets and Logs</h4>
                <p>
                  Visual screenshots and pinpoint annotation text are handled directly by Convex server nodes. No cookie trackers or third-party behavioral marketing scripts are embedded in this product.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">3. Google Gemini API Disclosure</h4>
                <p>
                  When a reviewer generates evaluation markdown critique summaries or runs predictive pre-scan compliance audits, the student URL content and reviewer annotations are securely transmitted to the Google Gemini API for automated analysis. This data is not stored permanently or used for external model training.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">4. User Consent of Student Data</h4>
                <p>
                  By submitting an assignment to this feedback portal, students grant access to instructors, course reviewers, and peer critics to place comments on the submitted website.
                </p>
              </div>
              <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all focus:outline-none"
                >
                  I Understand & Agree
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
                  <span className="text-indigo-400 text-lg">⚖️</span>
                  <h3 className="text-base font-black text-white">Terms of Use & Code of Conduct</h3>
                </div>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto text-xs leading-relaxed text-slate-300 font-semibold">
                <p>
                  Welcome to ESP Critique Canvas. By accessing either our Reviewer Workspace 2.0 or Student Portals, you agree to comply with the academic guidelines set forth.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">1. Intellectual and Academic Honesty</h4>
                <p>
                  Any URL submitted must point to a web application developed directly by the submitting student. Incorporating template designs without explicit academic attribution constitutes plagiarism and is strictly prohibited under ESP guidelines.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">2. Respectful Critique and Review Tone</h4>
                <p>
                  Reviewer annotations must be constructive, professional, and targeted toward improving frontend layouts, CSS practices, accessibility (WebAIM guidelines), or legal requirements. Toxic or derogatory review language is grounds for immediate credential termination.
                </p>
                <h4 className="text-white font-extrabold text-sm pt-2">3. Automated Port Inspection Access</h4>
                <p>
                  By submitting a URL, you authorize ESP Critique tools to perform background network preflight testing (including speed and secure SSL verification), which accesses your public application assets.
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
                  <span className="text-indigo-400 text-lg">🎓</span>
                  <h3 className="text-base font-black text-white">ESP Course Rubric & 10-Point Checklist</h3>
                </div>
                <button
                  onClick={() => setIsRubricOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto text-xs leading-relaxed text-slate-300 font-semibold">
                <p>
                  To earn a "Submit Ready" badge in ESP Amsterdam Web Development, every student web application is evaluated against the following strict professional criteria:
                </p>
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="text-white font-extrabold block">1. Cookie Consent Banner</span>
                      <p className="text-slate-400 text-[11px]">User consent must be explicitly gathered with customizable options before storing local states.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="text-white font-extrabold block">2. WebAIM Compliant High-Contrast Styles</span>
                      <p className="text-slate-400 text-[11px]">All readable text must conform to WCAG AA standards (contrast ratio of at least 4.5:1).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="text-white font-extrabold block">3. Responsive Breakpoint Wrapping</span>
                      <p className="text-slate-400 text-[11px]">Typography and menus must adapt properly to 320px widths without clipping or horizontal scrolls.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="text-white font-extrabold block">4. Semantic Header Hierarchy</span>
                      <p className="text-slate-400 text-[11px]">Proper nesting of h1, h2, h3 tags for accurate reader structure.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="text-white font-extrabold block">5. Form Validations & Access Labels</span>
                      <p className="text-slate-400 text-[11px]">Every input element must hold a distinct label, paired with frontend/backend validation rules.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="text-white font-extrabold block">6. Active SSL Protected HTTPS Channels</span>
                      <p className="text-slate-400 text-[11px]">No unencrypted requests or mixed HTTP content allowed in scripts or style links.</p>
                    </div>
                  </div>
                </div>
                <p>
                  Our Reviewer Workspace 2.0 ensures these parameters are checked systematically, using automated preflights backed by real-time instructor reviews.
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
