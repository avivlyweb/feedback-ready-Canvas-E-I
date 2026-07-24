import { GoogleGenAI } from "@google/genai";
import { Comment } from '../types';

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ 
  apiKey: API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const runAIPrescan = async (projectName: string, url: string, studentNotes: string): Promise<string> => {
  if (!API_KEY) {
    return "AI functionality is disabled. Please configure your API_KEY.";
  }

  const prompt = `
    You are an expert AI website auditor and frontend QA engineer.
    Analyze the project details below and perform an automated, predictive AI pre-scan and audit report of the website based on its URL, name, and notes.

    Project Name: ${projectName}
    Project URL: ${url}
    Student Notes: ${studentNotes}

    Provide a highly professional and realistic pre-scan audit report. Organize the output into clear Markdown sections:

    ### ⚡ AI Pre-Scan & Automated Audit Report

    #### 🔍 1. Predictive Risk Assessment
    Based on the project's purpose and URL, what are the top 3 potential frontend, layout, or responsiveness risks the student might have missed? (e.g. form fields validation, video embed responsiveness, mobile nav menu wrapping, contrast ratios).

    #### 🚨 2. Expected Rubric Checklist Pitfalls
    Analyze common failure points for a project of this nature and list specific checklist items (e.g. cookie consent, AI disclosure, privacy policies) that the reviewer should pay closest attention to.

    #### 💡 3. Recommended Expert Verification Steps
    Provide 3 step-by-step diagnostic actions for the reviewer to perform right now on the live canvas (e.g., "Trigger mobile view and test the submission button on the embedded quiz").

    Format the output cleanly in readable markdown. Keep the tone helpful, professional, and educational.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text || "No response received from Gemini.";
  } catch (error) {
    console.error("Error calling Gemini API for pre-scan:", error);
    return "An error occurred while generating the AI pre-scan. Please check your network connection and API key configuration.";
  }
};

export const generateV2EvaluationSummary = async (
  projectName: string,
  projectUrl: string,
  studentNotes: string,
  pins: any[],
  checklistItems: any[],
  preflightChecks: any[]
): Promise<string> => {
  if (!API_KEY) {
    return "AI functionality is disabled. Please configure your API_KEY.";
  }

  // Format annotations
  const formattedPins = pins.map(p => {
    const mainComment = p.comments?.[0]?.text || 'No comment text.';
    return `- **Pin #${p.number} [Severity: ${p.severity?.toUpperCase()}]** Category: ${p.rubricCategory?.toUpperCase() || 'GENERAL'} | Viewport: ${p.viewport?.toUpperCase() || 'ANY'}
      *Comment*: "${mainComment}"
      *Suggested Fix*: ${p.suggestedFix || 'Not specified'}`;
  }).join('\n');

  // Format checklist
  const passedChecks = checklistItems.filter(i => i.status === 'passed').map(i => `- ${i.text}`).join('\n') || '- None';
  const failedChecks = checklistItems.filter(i => i.status === 'failed').map(i => `- ${i.text}`).join('\n') || '- None';
  const pendingChecks = checklistItems.filter(i => i.status !== 'passed' && i.status !== 'failed').map(i => `- ${i.text}`).join('\n') || '- None';

  // Format preflight
  const formattedPreflight = preflightChecks.map(c => `- **${c.name}**: ${c.status === 'pass_signal' ? 'Passed ✅' : 'Warning ⚠️'} (${c.details})`).join('\n');

  const prompt = `
    You are an elite web design reviewer, frontend educator, and UX critic. 
    Compile a comprehensive, structured evaluation critique draft and summary report based on a live review of the project.

    --- PROJECT META ---
    Project Name: ${projectName}
    Project URL: ${projectUrl}
    Student Notes: ${studentNotes}

    --- REVIEWER PLACED FINDINGS & ANNOTATIONS ---
    ${formattedPins || "No pins/findings have been placed yet."}

    --- REQUIREMENTS CHECKLIST STATUS ---
    ### PASSED ITEMS:
    ${passedChecks}

    ### FAILED / BLOCKER ITEMS:
    ${failedChecks}

    ### UNASSESSED / PENDING:
    ${pendingChecks}

    --- AUTOMATED PREFLIGHT SIGNALS ---
    ${formattedPreflight}

    --- INSTRUCTIONS ---
    Generate a highly professional, constructive, and comprehensive evaluation markdown draft.
    Organize your response into the following clear sections with robust feedback:

    ## 🎓 AI evaluation & Critique Draft

    ### 📋 1. Executive Summary & Verdict
    Provide a professional, high-level summary of the submission's overall design quality, functional readiness, and layout responsiveness. State whether the submission looks close to "Submit Ready" or requires revisions.

    ### 🔴 2. Crucial Blocker Items (Must Fix)
    Highlight the most critical problems (specifically reference placed annotations and failed requirements). Focus on usability, broken elements, contrast, and layout issues.

    ### 🟢 3. Areas of Strength & Praise
    Praise what is done exceptionally well (e.g., visual layout clean, secure preflight passing, checklist compliance, etc.).

    ### 🛠️ 4. Actionable Design & Builder Advice
    Give clear, encouraging, non-technical advice on how to fix layout or readability issues in visual web builders (e.g. Wix, WordPress, Glide, or Lovable). Do NOT include raw CSS code snippets or HTML code blocks, as students do not understand code. Keep the tone warm, clear, and constructive.

    Produce the evaluation draft in structured markdown. Do not include placeholders, return a complete draft.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text || "No response received from Gemini.";
  } catch (error) {
    console.error("Error calling Gemini API for V2 evaluation summary:", error);
    return "An error occurred while compiling the AI evaluation summary.";
  }
};

export const summarizeFeedback = async (comments: Comment[]): Promise<string> => {
  if (!API_KEY) {
    return "AI functionality is disabled. Please configure your API_KEY.";
  }
  
  if (comments.length === 0) {
    return "No comments to summarize.";
  }

  const allCommentText = comments.map(c => `- ${c.author}: "${c.text}"`).join('\n');

  const prompt = `
    You are an expert UX analyst and product manager, tasked with analyzing feedback for a web project based on a comprehensive review rubric.

    Analyze the following user comments and categorize your findings into these specific sections. For each section, use bullet points to list the key insights.

    **Overall Summary**
    Provide a brief, high-level overview of the feedback, including general sentiment and the most critical recurring themes.

    **Relevance Feedback**
    Summarize comments related to the content's purpose, accuracy, originality, and appropriateness for the target audience. Are users finding the information relevant and credible?

    **UX (User Experience) Feedback**
    Summarize comments related to usability, navigation, functionality, interactivity, and structure. Mention any feedback on page speed, mobile compatibility, accessibility, or general ease of use.

    **Design Feedback**
    Summarize comments about the visual aspects, such as layout, color scheme, typography, use of images/videos, branding, and the overall professional look and feel.

    **Legal Feedback**
    Summarize any comments concerning copyright, privacy policies, terms of service, or other legal matters. If no comments mention these topics, state "No legal feedback was provided."

    Here are the feedback comments to analyze:
    ${allCommentText}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
    });
    return response.text || "No summary text returned.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "An error occurred while generating the summary. Please check the console for details.";
  }
};


export const analyzeImages = async (images: { base64Data: string; mimeType: string; }[]): Promise<string> => {
  if (!API_KEY) {
    return "AI functionality is disabled. Please configure your API_KEY.";
  }

  const prompt = `
    You are an expert UI/UX and frontend engineering critic. Provide a cohesive visual analysis covering all provided images. If there are multiple images, compare and contrast them where relevant. Use markdown for clear formatting.

    **1. Overall Impression & Concept Alignment:**
    - What is your first impression of the design(s)?
    - Does the visual design effectively communicate the website's purpose or brand identity across the images?
    - How well do the designs connect with the likely content of the website?

    **2. UI & Layout Analysis:**
    - Evaluate the layout and structure. Is it intuitive, balanced, and easy to navigate?
    - Comment on the use of white space, alignment, and visual hierarchy. Are these consistent if multiple images are provided?
    - Are UI elements (buttons, forms, navigation) clear and consistent?

    **3. Responsive Auditing & CSS Fixes:**
    - Actively scan the images for responsive layout bugs (e.g. text-wrap issues, overflow issues, squashed buttons, overlapping elements, or alignment glitches).
    - Suggest the exact CSS fix (e.g. \`flex-wrap: wrap;\`, \`overflow: hidden;\`, \`word-break: break-all;\`, \`justify-content: center;\`, or padding adjustments) for each bug you identify. Make it clear and educational so a student can implement it.

    **4. Color Palette & Typography:**
    - Assess color harmony, contrast accessibility, font choices, legibility, and visual hierarchy.

    **5. Actionable Suggestions for Improvement:**
    - Provide 2-3 specific, actionable recommendations to elevate both the design and the frontend implementation quality.
  `;

  try {
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64Data,
        mimeType: image.mimeType,
      },
    }));

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [...imageParts, textPart] },
    });

    return response.text || "No analysis text returned.";
  } catch (error) {
    console.error("Error calling Gemini API for image analysis:", error);
    return "An error occurred while generating the visual analysis. Please check the console for details.";
  }
};

export const analyzeWebsiteDesign = async (
  url: string, 
  productType: 'patient' | 'student',
  base64Screenshot?: string
): Promise<string> => {
  if (!API_KEY) {
    return "AI functionality is disabled. Please configure your API_KEY.";
  }

  const prompt = `
    You are an elite, highly critical UX/UI Design Auditor, Creative Director, and senior academic evaluator for the "Education and Innovation (E&I)" physiotherapy course at Amsterdam University of Applied Sciences (AUAS) / European School of Physiotherapy (ESP).

    Analyze the following website URL:
    Website URL: ${url}
    Product Type Focus: ${productType === 'patient' ? 'Patient Education Product (supporting patients in understanding a condition, behavior change, tracking progress, etc.)' : 'Student Education Product (supporting students in learning, practising, applying, or assessing knowledge and skills)'}

    ${base64Screenshot ? 'You are also provided with a direct visual screenshot snapshot of the student website page/viewport canvas. Please carefully analyze the visual layout, color contrast, typography, spacing, component alignments, and visual hierarchy from the image provided!' : ''}

    Please review the design, look and feel, colors, user experience (UX), and user interface (UI) of this website. Your review must be tailored to physiotherapy students who are NOT software developers. They are using visual web builders like Wix, WordPress, Glide, or Lovable.
    
    CRITICAL CONSTRAINT: 
    - DO NOT output ANY code blocks, CSS classes, HTML wrappers, or code snippets (such as <div style="..."> or .feedback-box {...}). Students do NOT understand code. This is a critical requirement. Instead, describe structural layout modifications, margins, and settings in plain, visual English terms.
    - Be direct, highly critical, and honest about amateur design flaws (e.g. inconsistent spacing, uninspiring templates, cluttered layouts, generic clinical stock images, and low-contrast typography). Give realistic "tough love" feedback so they can improve their score on the official rubric.
    - The audit must align with the E&I Course Guidelines:
      1. Central Online Environment (homepage + at least 3 content pages).
      2. Directly embedded self-produced educational video (16:9 landscape, YouTube recommended, playable directly without a separate login).
      3. Directly embedded interactive form, quiz, or tracking tool that provides automated, personalized feedback (NOT just a score, but explanation feedback that helps them understand the answers or outcomes without leaving the site).
      4. Custom privacy policy (complying with GDPR/privacy standards) and cookie/data processing disclosure where necessary.
      5. No placeholder text, dummy images, broken hyperlinks, or test elements.
      6. Good accessibility: legible text, high color contrast, responsive layout on mobile & desktop, and meaningful link labels.

    Format your response beautifully in Markdown with these specific sections:

    ### 🎨 AI Website Design & UX Audit Report

    #### 🌈 1. Brand Identity & Look and Feel ("The Vibe Check")
    - Evaluate the first impression of the website. Does it feel like a cohesive, human-centered educational product, or does it feel like a cold, sterile corporate clinic template?
    - Be honest: point out if the visual hierarchy is lacking or if the imagery feels uninspiring. Suggest concrete ways to make the overall feel more engaging and empathetic for the target audience.

    #### 🎨 2. Color Palette & Contrast Accessibility
    - Critique the color choices. Identify specific contrast issues (e.g., light-colored text on light backgrounds, orange text on white) that make it hard to read.
    - Remind them of WCAG AA standards (text needs to contrast sharply with the background, at least a 4.5:1 ratio) in simple terms. Suggest which colors to keep for text and which ones should only be used for buttons or accents.

    #### ✍️ 3. Typography & Page Layout
    - Assess font pairings (are they using too many different fonts, or are they too boring?).
    - Critique the layout density: is it a "wall of text" that will overwhelm patients or students? Is there enough blank space (negative space) for the eyes to rest?
    - Advise them on how to break up text blocks using headings, lists, or card grids.

    #### 📱 4. Mobile Responsiveness & Real-World Usability
    - Point out how their elements might wrap or get squished on mobile screens.
    - Discuss touch-target issues (buttons and links must be large enough to tap easily, especially for patients with finger stiffness or pain).
    - Give visual builder-friendly advice on how to group and stack elements for mobile.

    #### 🔄 5. Required Component Embedding Integrity
    - Evaluate how the educational video and the interactive form/quiz should be integrated into their pages.
    - Remind them why linking out to an external YouTube tab, Google Form, or Typeform is a major grading violation.
    - Give advice on how to style the feedback card/results box inside their visual builder so it stands out and provides rich, personalized educational advice.

    #### ⚖️ 6. Legal, Privacy & Compliance Warnings
    - Address the sensitive health data aspect of their quiz or tracker (GDPR compliance).
    - Remind them to add a customized privacy policy and cookie notice.
    - Warn them to remove all "Lorem Ipsum" text, placeholder images, and generic builder credits (like "Created with Wix").

    #### 🚀 Actionable Design Fixes (Your No-Code To-Do List)
    Provide 3-4 specific, simple, non-technical steps they can execute immediately in Wix, WordPress, Glide, or Lovable to level-up their design. Frame these as clear visual tasks (e.g., "In your style settings, change the text link color from orange to dark blue to fix readability," or "Double the empty space above and below your video player").

    Keep your assessment realistic, direct, highly relevant to ${url}, and fully aligned with the AUAS/ESP guidelines. Do NOT include any CSS classes or HTML style attributes.
  `;

  try {
    let contents: any = prompt;

    if (base64Screenshot) {
      // Strip header if data URL format
      const cleanBase64 = base64Screenshot.includes('base64,') 
        ? base64Screenshot.split('base64,')[1] 
        : base64Screenshot;

      contents = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg'
            }
          },
          { text: prompt }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
    });
    return response.text || "No response received from Gemini.";
  } catch (error) {
    console.error("Error calling Gemini API for design audit:", error);
    return "An error occurred while compiling the AI Design Audit.";
  }
};

