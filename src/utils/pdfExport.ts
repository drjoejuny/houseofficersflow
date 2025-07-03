import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HouseOfficer } from '../types';
import { formatDate } from './dateUtils';

export const generatePDF = async (
  officers: HouseOfficer[],
  signature: string,
  chartElement?: HTMLElement
): Promise<void> => {
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
  
  // Chart if provided
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPosition + imgHeight > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Error adding chart to PDF:', error);
    }
  }
  
  // Officers table
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('House Officers Details', 20, yPosition);
  yPosition += 10;
  
  // Table headers
  pdf.setFontSize(8);
  const headers = ['Name', 'Gender', 'Unit', 'Sign In', 'Presentation', 'Sign Out'];
  const colWidths = [35, 15, 30, 25, 25, 25];
  let xPosition = 20;
  
  headers.forEach((header, index) => {
    pdf.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });
  
  yPosition += 5;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 5;
  
  // Table data
  pdf.setFont('helvetica', 'normal');
  officers.forEach(officer => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    
    xPosition = 20;
    const rowData = [
      officer.fullName.substring(0, 20),
      officer.gender,
      officer.unitAssigned.substring(0, 15),
      formatDate(officer.dateSignedIn),
      formatDate(officer.clinicalPresentationDate),
      formatDate(officer.expectedSignOutDate)
    ];
    
    rowData.forEach((data, index) => {
      pdf.text(data, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    
    yPosition += 6;
  });
  
  // Footer
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.text('Built by Dr. Onyemachi Joseph, copyright 2025', pageWidth / 2, footerY, { align: 'center' });
  
  // Save PDF
  pdf.save(`House_Officers_Clinical_Flow_${new Date().toISOString().split('T')[0]}.pdf`);
};