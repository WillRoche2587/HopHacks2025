import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface EventFormData {
  eventType: string
  location: string
  date: string
  duration: string
  expectedAttendance: number
  budget: number
  audience: string
  specialRequirements: string
}

interface AnalysisResults {
  weatherAnalysis: string
  currentEventsAnalysis: string
  historicAnalysis: string
  organizerScoring: string
  overallScore: number
}

export const generateEventAnalysisPDF = async (
  eventData: EventFormData,
  analysisResults: AnalysisResults
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 25
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Purple color scheme
  const purpleMain = [102, 51, 153] // #663399
  const purpleLight = [147, 112, 219] // #9370DB
  const purpleDark = [75, 0, 130] // #4B0082
  const white = [255, 255, 255]
  const lightGray = [248, 248, 248]

  // Helper function to add text with word wrapping and better spacing
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11, lineSpacing: number = 1.4): number => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    const lineHeight = fontSize * 0.35 * lineSpacing
    
    lines.forEach((line: string, index: number) => {
      pdf.text(line, x, y + (index * lineHeight))
    })
    
    return y + (lines.length * lineHeight) + 8
  }

  // Helper function to add section with purple header
  const addSectionHeader = (title: string, y: number): number => {
    // Add purple background rectangle
    pdf.setFillColor(purpleMain[0], purpleMain[1], purpleMain[2])
    pdf.rect(margin, y - 8, contentWidth, 12, 'F')
    
    // Add white text
    pdf.setTextColor(white[0], white[1], white[2])
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin + 5, y)
    
    // Reset text color to black
    pdf.setTextColor(0, 0, 0)
    return y + 20
  }

  // Helper function to clean markdown text with better formatting
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list items
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim()
  }

  // Add header with purple styling
  pdf.setFillColor(purpleDark[0], purpleDark[1], purpleDark[2])
  pdf.rect(0, 0, pageWidth, 35, 'F')
  
  pdf.setTextColor(white[0], white[1], white[2])
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Event Analysis Report', margin, 22)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Comprehensive AI-Powered Event Assessment', margin, 30)
  
  // Reset text color
  pdf.setTextColor(0, 0, 0)
  yPosition = 55

  // Add event details section with better spacing
  yPosition = addSectionHeader('Event Details', yPosition)
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  
  const eventDetails = [
    { label: 'Event Type:', value: eventData.eventType },
    { label: 'Location:', value: eventData.location },
    { label: 'Date:', value: eventData.date },
    { label: 'Duration:', value: eventData.duration },
    { label: 'Expected Attendance:', value: eventData.expectedAttendance.toString() },
    { label: 'Budget:', value: `$${eventData.budget.toLocaleString()}` },
    { label: 'Target Audience:', value: eventData.audience },
    { label: 'Special Requirements:', value: eventData.specialRequirements }
  ]

  eventDetails.forEach(detail => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = margin
    }
    
    // Add label in purple
    pdf.setTextColor(purpleMain[0], purpleMain[1], purpleMain[2])
    pdf.setFont('helvetica', 'bold')
    pdf.text(detail.label, margin, yPosition)
    
    // Add value in black
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    yPosition = addWrappedText(detail.value, margin + 45, yPosition, contentWidth - 45, 11, 1.3)
  })

  yPosition += 15

  // Add overall score section with purple styling
  if (yPosition > pageHeight - 80) {
    pdf.addPage()
    yPosition = margin
  }

  yPosition = addSectionHeader('Overall Assessment Score', yPosition)

  // Create score box with purple border
  const scoreBoxHeight = 40
  pdf.setDrawColor(purpleMain[0], purpleMain[1], purpleMain[2])
  pdf.setLineWidth(2)
  pdf.rect(margin, yPosition, contentWidth, scoreBoxHeight)
  
  // Add light purple background
  pdf.setFillColor(248, 245, 255)
  pdf.rect(margin + 1, yPosition + 1, contentWidth - 2, scoreBoxHeight - 2, 'F')

  // Add score text
  pdf.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2])
  pdf.setFontSize(32)
  pdf.setFont('helvetica', 'bold')
  const scoreText = `${analysisResults.overallScore}/100`
  const scoreWidth = pdf.getTextWidth(scoreText)
  pdf.text(scoreText, margin + (contentWidth - scoreWidth) / 2, yPosition + 25)

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  const subText = 'Based on comprehensive AI analysis'
  const subWidth = pdf.getTextWidth(subText)
  pdf.text(subText, margin + (contentWidth - subWidth) / 2, yPosition + 35)

  yPosition += scoreBoxHeight + 25

  // Add analysis sections with even distribution
  const sections = [
    { title: 'Weather Analysis', content: analysisResults.weatherAnalysis, icon: '☀' },
    { title: 'Current Events Analysis', content: analysisResults.currentEventsAnalysis, icon: '📅' },
    { title: 'Historical Analysis', content: analysisResults.historicAnalysis, icon: '📊' },
    { title: 'Comprehensive Recommendations', content: analysisResults.organizerScoring, icon: '💡' }
  ]

  // Calculate space per section for even distribution
  const remainingPages = Math.ceil(sections.length / 1.5) // Estimate pages needed
  
  sections.forEach((section, index) => {
    // Start each major section on a new page for even distribution
    if (index > 0) {
      pdf.addPage()
      yPosition = margin
    }

    // Add section header with icon
    yPosition = addSectionHeader(`${section.icon} ${section.title}`, yPosition)

    // Add section content with better formatting
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    
    const cleanContent = cleanMarkdown(section.content)
    const paragraphs = cleanContent.split('\n\n')
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = margin
        }
        yPosition = addWrappedText(paragraph.trim(), margin, yPosition, contentWidth, 11, 1.5)
        yPosition += 5 // Extra spacing between paragraphs
      }
    })
    
    yPosition += 10 // Extra spacing after each section
  })

  // Add footer to all pages
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    
    // Add footer background
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F')
    
    // Add footer text
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(purpleMain[0], purpleMain[1], purpleMain[2])
    
    pdf.text(
      `Generated by CharityAI`,
      margin,
      pageHeight - 8
    )
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2 - 10,
      pageHeight - 8
    )
    pdf.text(
      `${new Date().toLocaleDateString()}`,
      pageWidth - margin - 25,
      pageHeight - 8
    )
  }

  // Save the PDF
  const fileName = `${eventData.eventType.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

export const generateQuickPDF = async (elementId: string, fileName: string): Promise<void> => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Element not found')
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  const imgWidth = 210
  const pageHeight = 295
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight

  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(fileName)
}
