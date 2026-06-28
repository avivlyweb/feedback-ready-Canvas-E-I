import { GoogleGenAI } from "@google/genai";
import { Comment } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
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

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for image analysis:", error);
    return "An error occurred while generating the visual analysis. Please check the console for details.";
  }
};
