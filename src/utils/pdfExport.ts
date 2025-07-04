import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HouseOfficer } from '../types';
import { formatDate } from './dateUtils';

export const generatePDF = async (
  officers: HouseOfficer[],
  signature: string,
  chartElement?: HTMLElement
): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FMC UMUAHIA, ABIA STATE', pageWidth / 2, 20, { align: 'center' });
    pdf.text('DEPARTMENT OF INTERNAL MEDICINE', pageWidth / 2, 28, { align: 'center' });
    pdf.text('HOUSE OFFICERS CLINICAL FLOW', pageWidth / 2, 36, { align: 'center' });
    
    // Date and signature
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${formatDate(new Date().toISOString())}`, 20, 50);
    pdf.text(`Downloaded by: ${signature}`, 20, 56);
    
    let yPosition = 70;
    
    // Summary statistics
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Officers: ${officers.length}`, 20, yPosition);
    yPosition += 6;
    
    const maleCount = officers.filter(o => o.gender === 'Male').length;
    const femaleCount = officers.filter(o => o.gender === 'Female').length;
    pdf.text(`Male: ${maleCount}, Female: ${femaleCount}`, 20, yPosition);
    yPosition += 6;
    
    const upcomingPresentations = officers.filter(o => 
      o.clinicalPresentationDate && new Date(o.clinicalPresentationDate) > new Date()
    ).length;
    pdf.text(`Upcoming Presentations: ${upcomingPresentations}`, 20, yPosition);
    yPosition += 15;
    
    // Unit distribution
    const unitCounts = officers.reduce((acc, officer) => {
      acc[officer.unitAssigned] = (acc[officer.unitAssigned] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Unit Distribution', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    Object.entries(unitCounts).forEach(([unit, count]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${unit}: ${count} officer${count !== 1 ? 's' : ''}`, 20, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    
    // Officers table
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('House Officers Details', 20, yPosition);
    yPosition += 10;
    
    // Table headers
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const headers = ['Name', 'Gender', 'Unit', 'Sign In', 'Presentation', 'Sign Out'];
    const colWidths = [40, 15, 35, 25, 25, 25];
    let xPosition = 20;
    
    // Draw header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
    
    headers.forEach((header, index) => {
      pdf.text(header, xPosition + 2, yPosition + 2);
      xPosition += colWidths[index];
    });
    
    yPosition += 8;
    
    // Table data
    pdf.setFont('helvetica', 'normal');
    officers.forEach((officer, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
        
        // Redraw headers on new page
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
        
        let headerX = 20;
        headers.forEach((header, headerIndex) => {
          pdf.text(header, headerX + 2, yPosition + 2);
          headerX += colWidths[headerIndex];
        });
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
      }
      
      xPosition = 20;
      const rowData = [
        officer.fullName.length > 25 ? officer.fullName.substring(0, 22) + '...' : officer.fullName,
        officer.gender,
        officer.unitAssigned.length > 20 ? officer.unitAssigned.substring(0, 17) + '...' : officer.unitAssigned,
        formatDate(officer.dateSignedIn),
        officer.clinicalPresentationDate ? formatDate(officer.clinicalPresentationDate) : 'Not set',
        formatDate(officer.expectedSignOutDate)
      ];
      
      rowData.forEach((data, dataIndex) => {
        pdf.text(data, xPosition + 2, yPosition + 2);
        xPosition += colWidths[dataIndex];
      });
      
      yPosition += 8;
    });
    
    // Add new page for presentation topics if any exist
    const officersWithTopics = officers.filter(o => o.clinicalPresentationTopic);
    if (officersWithTopics.length > 0) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Presentation Topics', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      officersWithTopics.forEach(officer => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${officer.fullName} (${officer.unitAssigned})`, 20, yPosition);
        yPosition += 6;
        
        pdf.setFont('helvetica', 'normal');
        if (officer.clinicalPresentationDate) {
          pdf.text(`Date: ${formatDate(officer.clinicalPresentationDate)}`, 20, yPosition);
          yPosition += 6;
        }
        
        // Handle long topics with text wrapping
        const topic = officer.clinicalPresentationTopic;
        const maxWidth = pageWidth - 40;
        const lines = pdf.splitTextToSize(`Topic: ${topic}`, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        
        yPosition += 5; // Extra space between officers
      });
    }
    
    // Footer on last page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${totalPages} | Built by Dr. Onyemachi Joseph, copyright 2025`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `House_Officers_Clinical_Flow_${timestamp}.pdf`;
    
    // Save PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('Detailed PDF generation error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Error generating PDF. ';
    
    if (error instanceof Error) {
      if (error.message.includes('jsPDF')) {
        errorMessage += 'PDF library error. Please try again.';
      } else if (error.message.includes('canvas')) {
        errorMessage += 'Chart rendering error. PDF will be generated without charts.';
      } else {
        errorMessage += `Details: ${error.message}`;
      }
    } else {
      errorMessage += 'Unknown error occurred. Please try again.';
    }
    
    throw new Error(errorMessage);
  }
};