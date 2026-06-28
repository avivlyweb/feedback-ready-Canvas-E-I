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

    ### 🛠️ 4. Actionable Coding & Layout Advice
    Give clear, educational coding tips or CSS layout advice to help the student fix the identified bugs. Keep the tone encouraging, technical, and constructive.

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
