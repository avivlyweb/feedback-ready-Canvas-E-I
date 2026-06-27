import { Project, ContentType, Comment, Pin } from '../types';
import { summarizeFeedback, analyzeImages } from './geminiService';

// To inform TypeScript about the global jspdf variable from the CDN
declare const jspdf: any;

// Helper function to add a section with a title and wrapped text content
const addSection = (doc: any, cursor: { y: number }, title: string, content: string, contentWidth: number, margin: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const titleHeight = 20; // Estimated height for title
  const initialContentLines = doc.splitTextToSize(content, contentWidth);
  const contentHeight = initialContentLines.length * doc.getFontSize() * 0.6; // Approximation

  if (cursor.y + titleHeight + contentHeight > pageHeight - margin) {
    doc.addPage();
    cursor.y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, margin, cursor.y);
  cursor.y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(content, contentWidth);
  // Check again after getting exact lines, in case of edge cases
  if (cursor.y + lines.length * doc.getFontSize() * 0.6 > pageHeight - margin) {
    doc.addPage();
    cursor.y = margin;
  }
  doc.text(lines, margin, cursor.y);
  cursor.y += lines.length * doc.getFontSize() * 0.6 + 20; // Add padding after section
};

export const exportProjectAsPDF = async (project: Project): Promise<void> => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const cursor = { y: margin };

  // --- 1. TITLE PAGE ---
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Feedback Report', pageWidth / 2, cursor.y + 20, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name, pageWidth / 2, cursor.y + 40, { align: 'center' });
  
  doc.setFontSize(12);
  const reportDate = `Generated on: ${new Date().toLocaleDateString()}`;
  doc.text(reportDate, pageWidth / 2, pageHeight - margin - 20, { align: 'center' });

  // --- 2. AI SECTIONS ---
  doc.addPage();
  cursor.y = margin;

  // AI Visual Analysis (for image projects)
  if (project.type === ContentType.IMAGE) {
    const base64Data = project.content.split(',')[1];
    if (base64Data) {
      const mimeType = project.content.match(/:(.*?);/)?.[1] || 'image/png';
      const analysis = await analyzeImages([{ base64Data, mimeType }]);
      addSection(doc, cursor, 'AI Visual Analysis', analysis, contentWidth, margin);
    }
  }

  // AI Feedback Summary
  const allComments = project.pins.flatMap(p => p.comments);
  const summary = await summarizeFeedback(allComments);
  addSection(doc, cursor, 'AI Feedback Summary', summary, contentWidth, margin);


  // --- 3. PROJECT CONTENT PREVIEW ---
  if (cursor.y + 60 > pageHeight - margin) { // Check if there's enough space for header + a bit of content
    doc.addPage();
    cursor.y = margin;
  }
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Content', margin, cursor.y);
  cursor.y += 20;
  
  if (project.type === ContentType.IMAGE) {
    try {
      const img = new Image();
      img.src = project.content;
      await new Promise(resolve => { img.onload = resolve; });
      
      const imgWidth = img.width;
      const imgHeight = img.height;
      const aspectRatio = imgWidth / imgHeight;
      
      let pdfImgWidth = contentWidth;
      let pdfImgHeight = pdfImgWidth / aspectRatio;
      
      if (pdfImgHeight > 400) { // Limit max height to avoid huge images
        pdfImgHeight = 400;
        pdfImgWidth = pdfImgHeight * aspectRatio;
      }

      if (cursor.y + pdfImgHeight > pageHeight - margin) {
        doc.addPage();
        cursor.y = margin;
      }

      doc.addImage(project.content, 'PNG', margin, cursor.y, pdfImgWidth, pdfImgHeight);
      cursor.y += pdfImgHeight + 20;

    } catch (e) {
      console.error("Error adding project image to PDF:", e);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text("Could not load project image for the report.", margin, cursor.y);
      doc.setTextColor(0, 0, 0);
      cursor.y += 15;
    }
  } else {
    doc.setFontSize(10);
    doc.text(`Project URL: ${project.content}`, margin, cursor.y, {
      maxWidth: contentWidth,
    });
    cursor.y += 20;
  }

  // --- 4. DETAILED FEEDBACK ---
  doc.addPage();
  cursor.y = margin;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Feedback', margin, cursor.y);
  cursor.y += 20;

  for (const pin of project.pins.sort((a,b) => a.number - b.number)) {
    if (cursor.y + 20 > pageHeight - margin) {
      doc.addPage();
      cursor.y = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Pin #${pin.number} (Status: ${pin.status})`, margin, cursor.y);
    cursor.y += 15;

    if(pin.comments.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No comments on this pin.', margin + 10, cursor.y);
        cursor.y += 20;
    }

    for (const comment of pin.comments) {
      const commentHeader = `${comment.author} - ${new Date(comment.timestamp).toLocaleString()}`;
      const textLines = doc.splitTextToSize(comment.text, contentWidth - 10);
      const textHeight = textLines.length * doc.getFontSize() * 0.6;
      let attachmentHeight = 0;
      if (comment.attachment) {
          attachmentHeight = 120; // Estimated height for attachment + padding
      }
      
      if (cursor.y + textHeight + attachmentHeight + 15 > pageHeight - margin) {
        doc.addPage();
        cursor.y = margin;
      }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(commentHeader, margin + 10, cursor.y);
      cursor.y += 12;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(textLines, margin + 10, cursor.y);
      cursor.y += textHeight + 5;

      if (comment.attachment) {
          try {
             doc.addImage(comment.attachment.data, 'PNG', margin + 10, cursor.y, 150, 100);
             cursor.y += 110;
          } catch (e) {
              console.error("Error adding attachment to PDF:", e);
              doc.setTextColor(255, 0, 0);
              doc.text("Could not load attachment image.", margin + 10, cursor.y);
              doc.setTextColor(0, 0, 0);
              cursor.y += 15;
          }
      }
    }
     cursor.y += 10; // Padding between pins
  }

  // --- SAVE DOCUMENT ---
  doc.save(`${project.name}_Feedback_Report.pdf`);
};