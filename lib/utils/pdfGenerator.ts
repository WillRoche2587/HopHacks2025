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

// Function to convert image file to base64
const getLogoBase64 = async (): Promise<string> => {
  try {
    const response = await fetch('/ImpactGauge.png')
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Logo not found, using placeholder')
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

export const generateEventAnalysisPDF = async (
  eventData: EventFormData,
  analysisResults: AnalysisResults
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // ImpactGauge color scheme
  const charityPurple = [147, 51, 234]
  const charityPurpleLight = [196, 181, 253]
  const white = [255, 255, 255]
  const darkGray = [31, 41, 55]
  const lightBackground = [251, 245, 255]

  // Get the logo
  const logoBase64 = await getLogoBase64()

  // Helper function to check if we need a new page
  const checkNewPage = (neededSpace: number): number => {
    if (yPosition + neededSpace > pageHeight - 30) {
      pdf.addPage()
      return addHeader()
    }
    return yPosition
  }

  // Helper function to add text with proper wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize)
    
    // Split text by explicit line breaks first, then wrap each line
    const paragraphs = text.split('\n')
    let currentY = y
    const lineHeight = fontSize * 0.45
    
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraph.trim() === '') {
        currentY += lineHeight * 0.5 // Add small spacing for empty lines
        return
      }
      
      const lines = pdf.splitTextToSize(paragraph.trim(), maxWidth)
      lines.forEach((line: string, lineIndex: number) => {
        pdf.text(line, x, currentY + (lineIndex * lineHeight))
      })
      
      currentY += (lines.length * lineHeight) + (paragraphIndex < paragraphs.length - 1 ? lineHeight * 0.3 : 0)
    })
    
    return currentY + 5
  }

  // Helper function to add section header
  const addSectionHeader = (title: string, y: number): number => {
    pdf.setFillColor(charityPurple[0], charityPurple[1], charityPurple[2])
    pdf.rect(margin, y, contentWidth, 10, 'F')
    
    pdf.setTextColor(white[0], white[1], white[2])
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin + 3, y + 7)
    
    pdf.setTextColor(0, 0, 0)
    return y + 15
  }

  // Helper function to clean and format text
  const cleanText = (text: string): string => {
    return text
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list items to bullets
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  // Helper function to format analysis content with proper structure
  const formatAnalysisContent = (content: string): string => {
    if (!content) return 'No analysis data available for this section.'
    
    // Split content into logical sections based on common patterns
    let formatted = content
      .replace(/\b(Key Findings|Top Recommendations|Risk Factors|Opportunities|Confidence Level):/g, '\n\n$1:\n')
      .replace(/\b(Weather Analysis|Current Events Analysis|Historical Analysis|Recommendations):/g, '\n\n$1:\n')
      .replace(/\b(Summary|Conclusion|Next Steps):/g, '\n\n$1:\n')
      
    // Add line breaks after sentences that end with periods followed by capital letters
    formatted = formatted.replace(/\.([A-Z])/g, '.\n$1')
    
    // Clean up multiple line breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n')
    
    // Add proper spacing around bullet points
    formatted = formatted.replace(/([.!?])\s*([A-Z][a-z])/g, '$1\n\n$2')
    
    // Clean up the final result
    return cleanText(formatted)
  }

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    } catch {
      return dateString
    }
  }

  // Add header function
  const addHeader = (): number => {
    pdf.setFillColor(lightBackground[0], lightBackground[1], lightBackground[2])
    pdf.rect(0, 0, pageWidth, 50, 'F')
    
    // Add logo
    try {
      pdf.addImage(logoBase64, 'PNG', margin, 10, 30, 30)
    } catch (error) {
      // Draw a better purple heart as fallback
      pdf.setFillColor(charityPurple[0], charityPurple[1], charityPurple[2])
      const heartX = margin + 15
      const heartY = 32
      const scale = 0.8
      
      // Create heart shape using path with curves
      const heartPath = [
        [heartX, heartY + 6*scale],
        [heartX - 13*scale, heartY - 5*scale],
        [heartX - 13*scale, heartY - 9*scale],
        [heartX - 9*scale, heartY - 13*scale],
        [heartX - 5*scale, heartY - 13*scale],
        [heartX, heartY - 9*scale],
        [heartX + 5*scale, heartY - 13*scale],
        [heartX + 9*scale, heartY - 13*scale],
        [heartX + 13*scale, heartY - 9*scale],
        [heartX + 13*scale, heartY - 5*scale]
      ]
      
      // Draw filled polygon for heart shape
      pdf.setDrawColor(charityPurple[0], charityPurple[1], charityPurple[2])
      pdf.setLineWidth(0)
      
      // Start path
      pdf.lines(heartPath.slice(1).map((point, i) => [
        point[0] - heartPath[i][0], 
        point[1] - heartPath[i][1]
      ]), heartPath[0][0], heartPath[0][1], [1, 1], 'F')
    }
    
    pdf.setTextColor(charityPurple[0], charityPurple[1], charityPurple[2])
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('ImpactGauge', margin + 40, 25)
    
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Event Analysis Report', margin + 40, 35)
    
    pdf.setDrawColor(charityPurpleLight[0], charityPurpleLight[1], charityPurpleLight[2])
    pdf.line(margin, 45, pageWidth - margin, 45)
    
    return 55
  }

  // Initialize first page
  yPosition = addHeader()

  // Event Details Section
  yPosition = checkNewPage(100)
  yPosition = addSectionHeader('Event Details', yPosition)
  
  pdf.setFillColor(lightBackground[0], lightBackground[1], lightBackground[2])
  pdf.rect(margin, yPosition, contentWidth, 85, 'F')
  
  yPosition += 8
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  
  const eventDetails = [
    ['Event Type:', eventData.eventType],
    ['Location:', eventData.location],
    ['Date:', formatDate(eventData.date)],
    ['Duration:', eventData.duration],
    ['Expected Attendance:', eventData.expectedAttendance.toLocaleString() + ' people'],
    ['Budget:', formatCurrency(eventData.budget)],
    ['Target Audience:', eventData.audience],
    ['Special Requirements:', eventData.specialRequirements || 'None specified']
  ]

  eventDetails.forEach(([label, value]) => {
    pdf.setTextColor(charityPurple[0], charityPurple[1], charityPurple[2])
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, margin + 5, yPosition)
    
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(value, margin + 45, yPosition, contentWidth - 50, 12)
  })

  yPosition += 15

  // Overall Score Section
  yPosition = checkNewPage(60)
  yPosition = addSectionHeader('AI Assessment Score', yPosition)

  pdf.setFillColor(charityPurple[0], charityPurple[1], charityPurple[2])
  pdf.rect(margin, yPosition, contentWidth, 40, 'F')
  
  pdf.setTextColor(white[0], white[1], white[2])
  pdf.setFontSize(36)
  pdf.setFont('helvetica', 'bold')
  const scoreText = `${analysisResults.overallScore}/100`
  const scoreWidth = pdf.getTextWidth(scoreText)
  pdf.text(scoreText, margin + (contentWidth - scoreWidth) / 2, yPosition + 25)
  
  pdf.setFontSize(10)
  const scoreLabel = 'Comprehensive Analysis Score'
  const labelWidth = pdf.getTextWidth(scoreLabel)
  pdf.text(scoreLabel, margin + (contentWidth - labelWidth) / 2, yPosition + 35)

  yPosition += 50

  // Analysis Sections
  const sections = [
    ['Weather Analysis', analysisResults.weatherAnalysis],
    ['Current Events Analysis', analysisResults.currentEventsAnalysis],
    ['Historical Analysis', analysisResults.historicAnalysis],
    ['Recommendations', analysisResults.organizerScoring]
  ]

  sections.forEach(([title, content]) => {
    yPosition = checkNewPage(80)
    yPosition = addSectionHeader(title, yPosition)
    
    const cleanContent = formatAnalysisContent(content)
    if (cleanContent.length > 0) {
      pdf.setFillColor(lightBackground[0], lightBackground[1], lightBackground[2])
      
      // Calculate content height with better spacing
      const lines = pdf.splitTextToSize(cleanContent, contentWidth - 10)
      const lineHeight = 4.5
      const contentHeight = Math.max(40, lines.length * lineHeight + 15)
      
      pdf.rect(margin, yPosition, contentWidth, contentHeight, 'F')
      
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      yPosition = addText(cleanContent, margin + 5, yPosition + 8, contentWidth - 10, 10)
      
      yPosition += 20
    } else {
      // Handle empty content
      pdf.setFillColor(lightBackground[0], lightBackground[1], lightBackground[2])
      pdf.rect(margin, yPosition, contentWidth, 30, 'F')
      
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text('No analysis data available for this section.', margin + 5, yPosition + 15)
      
      yPosition += 40
    }
  })

  // Add clean footer to all pages
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    
    pdf.text('ImpactGauge Event Analysis', margin, pageHeight - 10)
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 10)
  }

  // Save the PDF with better filename formatting
  const eventTypeClean = eventData.eventType.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase()
  const dateClean = new Date().toISOString().split('T')[0]
  const scoreClean = analysisResults.overallScore
  const fileName = `ImpactGauge_${eventTypeClean}_${scoreClean}pts_${dateClean}.pdf`
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
    allowTaint: true,
    backgroundColor: '#FFFFFF'
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