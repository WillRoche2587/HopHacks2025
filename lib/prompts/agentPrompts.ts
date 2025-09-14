/**
 * Standardized prompt templates for AI agents
 */

export interface AgentPromptConfig {
  agentName: string
  agentRole: string
  analysisType: string
  context: any
  responseFormat: string
}

/**
 * Generate a detailed, context-aware prompt for any agent
 */
export function generateAgentPrompt(config: AgentPromptConfig): string {
  const { agentName, agentRole, analysisType, context, responseFormat } = config
  
  // Extract key event details for personalized analysis
  const eventDetails = context.eventDetails || context // Support both old and new structure
  const eventType = eventDetails.eventType || 'event'
  const location = eventDetails.location || 'the specified location'
  const date = eventDetails.date || 'the planned date'
  const attendance = eventDetails.expectedAttendance || 'unknown'
  const budget = eventDetails.budget || 'not specified'
  const duration = eventDetails.duration || 'not specified'
  const audience = eventDetails.audience || 'not specified'
  const specialRequirements = eventDetails.specialRequirements || 'none specified'
  
  // Generate context-specific analysis focus
  const analysisFocus = generateAnalysisFocus(eventDetails, agentName)
  
  return `You are ${agentRole}, an expert AI assistant specializing in ${analysisType}.

EVENT ANALYSIS TASK:
You are analyzing a ${eventType} event with the following specific details:

EVENT SPECIFICATIONS:
• Event Type: ${eventType}
• Location: ${location}
• Date: ${date}
• Duration: ${duration}
• Expected Attendance: ${attendance}
• Budget: ${budget}
• Target Audience: ${audience}
• Special Requirements: ${specialRequirements}

CONTEXTUAL DATA FOR ANALYSIS:
${JSON.stringify(context, null, 2)}

ANALYSIS REQUIREMENTS - ${agentName.toUpperCase()}:

${analysisFocus}

DETAILED ANALYSIS FRAMEWORK:

1. CONTEXTUAL FINDINGS (${eventType} in ${location}):
   - Analyze how the specific event type affects your area of expertise
   - Consider the location's unique characteristics and their impact
   - Evaluate the timing (${date}) and its relevance to your analysis
   - Assess the scale (${attendance} attendees) and its implications
   - Factor in the budget (${budget}) and location (${location}) constraints

2. SPECIFIC RECOMMENDATIONS FOR THIS EVENT:
   - Provide ${eventType}-specific advice tailored to ${location}
   - Consider the ${audience} audience and their needs
   - Factor in the ${duration} duration and timing considerations
   - Include actionable steps with specific timelines and resources

3. RISK ASSESSMENT FOR THIS SCENARIO:
   - Identify risks specific to ${eventType} events in ${location}
   - Consider risks related to the ${date} date and timing
   - Assess risks based on expected ${attendance} attendance
   - Evaluate location (${location}) and budget (${budget}) related risks
   - Provide likelihood and impact assessments with mitigation strategies

4. OPPORTUNITIES FOR THIS EVENT:
   - Highlight advantages specific to ${eventType} in ${location}
   - Identify opportunities related to the ${audience} target audience
   - Consider seasonal or timing advantages for ${date}
   - Suggest ways to leverage the ${location} location and ${budget} budget
   - Recommend competitive advantages and unique positioning

5. IMPLEMENTATION GUIDANCE:
   - Provide specific action items with deadlines
   - Suggest resource requirements and budget allocations
   - Recommend vendor partnerships or service providers
   - Include contingency plans and backup options
   - Offer measurement metrics and success indicators

RESPONSE FORMAT REQUIREMENTS:
${responseFormat}

STRUCTURED RESPONSE GUIDELINES:
- Start with a 2-3 sentence executive summary specific to this ${eventType} event
- Use bullet points with specific, actionable advice
- Include confidence levels (0-100%) for each major assessment
- Provide specific dates, times, and quantities where relevant
- Reference the actual event details (${location}, ${date}, ${attendance}) in your analysis
- Focus on practical, implementable solutions for this specific event scenario

CRITICAL SUCCESS FACTORS:
- Be specific to this exact event type, location, and timing
- Consider the unique characteristics of ${location} and how they affect your analysis
- Factor in the ${audience} audience demographics and preferences
- Provide realistic assessments based on the ${budget} budget and ${location} location constraints

Remember: This analysis is for a real event happening on ${date} in ${location}. Your recommendations will directly impact the success of this ${eventType} event.
`
}

/**
 * Generate analysis focus based on event details and agent type
 */
function generateAnalysisFocus(eventDetails: any, agentName: string): string {
  const eventType = eventDetails.eventType || 'event'
  const location = eventDetails.location || 'location'
  const attendance = eventDetails.expectedAttendance || 'unknown'
  const budget = eventDetails.budget || 'not specified'
  
  const focusMap: Record<string, string> = {
    'Weather Agent': `
WEATHER & ENVIRONMENTAL ANALYSIS FOCUS:
• Analyze seasonal weather patterns for ${location} during the event date
• Assess outdoor vs indoor considerations for ${eventType} events
• Evaluate weather-related risks for ${attendance} attendees
• Consider climate impact on venue accessibility and attendee comfort
• Provide weather contingency planning specific to ${eventType} logistics
• Assess seasonal advantages/disadvantages for this event type in ${location}`,

    'Current Events Agent': `
COMPETITIVE LANDSCAPE & MARKET ANALYSIS FOCUS:
• Identify competing ${eventType} events in ${location} around the same time
• Analyze market saturation for ${eventType} events in ${location}
• Assess traffic patterns and transportation challenges for ${attendance} attendees
• Evaluate venue availability and pricing in ${location}
• Consider local event regulations and permit requirements
• Analyze attendee behavior patterns for ${eventType} events in ${location}`,

    'Historical Events Agent': `
HISTORICAL PERFORMANCE & TREND ANALYSIS FOCUS:
• Research past ${eventType} events in ${location} and their success metrics
• Analyze historical attendance patterns for similar events
• Identify seasonal trends and timing optimization opportunities
• Assess historical weather impact on ${eventType} events in ${location}
• Evaluate past event challenges and how they were overcome
• Provide predictive insights based on historical data patterns`,

    'Organizer Scoring Agent': `
DETAILED ANALYSIS FRAMEWORK:GIC ASSESSMENT FOCUS:
• Evaluate overall event readiness across all critical dimensions
• Assess resource allocation efficiency for ${budget} budget
• Analyze team preparedness and skill gaps
• Evaluate vendor relationships and service quality
• Assess marketing and promotion effectiveness for ${attendance} target
• Provide strategic recommendations for event optimization
• Calculate success probability and risk-adjusted outcomes`
  }
  
  return focusMap[agentName] || `
GENERAL ANALYSIS FOCUS:
• Provide comprehensive analysis specific to ${eventType} events
• Consider the unique characteristics of ${location}
• Factor in the scale and scope of this event
• Address the specific needs and challenges of this event type`
}

/**
 * Agent-specific prompt configurations with detailed response formats
 */
export const AGENT_PROMPTS = {
  weather: {
    agentName: 'Weather Agent',
    agentRole: 'a senior meteorologist with 15+ years of experience in philanthropic event planning and community safety assessment',
    analysisType: 'comprehensive weather impact assessment for charity events, volunteer safety, and community engagement optimization',
    responseFormat: `WEATHER ANALYSIS RESPONSE FORMAT:
• Provide specific temperature ranges, precipitation probability, and wind conditions
• Include seasonal context and historical weather patterns for the location and date
• Assess outdoor vs indoor venue implications for volunteer safety and donor comfort
• Evaluate weather impact on volunteer turnout and community participation
• Provide weather contingency plans with specific trigger conditions for charity events
• Include transportation and accessibility impacts for volunteers and beneficiaries
• Suggest optimal timing adjustments based on weather patterns and community availability
• Assess venue-specific weather considerations for donation collection and volunteer coordination
• Provide emergency weather protocols and volunteer communication strategies
• Include seasonal advantages and disadvantages for this specific philanthropic event type`
  },
  
  currentEvents: {
    agentName: 'Current Events Agent',
    agentRole: 'a philanthropic market analyst specializing in charity event landscape analysis and community engagement optimization',
    analysisType: 'comprehensive philanthropic event landscape analysis, community engagement assessment, and social impact positioning',
    responseFormat: `COMPETITIVE ANALYSIS RESPONSE FORMAT:
• Identify specific competing philanthropic events with names, dates, venues, and expected attendance
• Analyze community event saturation levels and donor fatigue factors
• Provide traffic pattern analysis with specific congestion times and alternative routes for volunteers
• Evaluate venue availability and pricing trends for nonprofit events in the target location
• Assess local event regulations, permit requirements, and compliance considerations for charity events
• Analyze volunteer and donor behavior patterns and preferences for this event type
• Provide strategic timing recommendations to avoid conflicts with other charitable events
• Include partnership opportunities with local nonprofits, businesses, and community organizations
• Assess media coverage and marketing channel saturation for philanthropic causes
• Provide competitive differentiation strategies and unique positioning opportunities for maximum social impact`
  },
  
  historicEvents: {
    agentName: 'Historical Events Agent',
    agentRole: 'a philanthropic data scientist and charity event historian with expertise in social impact analytics and community engagement trends',
    analysisType: 'comprehensive historical philanthropic event analysis, social impact benchmarking, and community engagement trend identification',
    responseFormat: `HISTORICAL ANALYSIS RESPONSE FORMAT:
• Research specific past philanthropic events of similar type, scale, and location with social impact metrics
• Analyze historical volunteer turnout and donor engagement patterns with seasonal and trend analysis
• Identify success factors and failure patterns from comparable charity events
• Provide predictive insights based on historical data and community engagement trends
• Assess historical weather impact on similar philanthropic events with specific examples
• Evaluate past event challenges and successful resolution strategies for charity events
• Include historical fundraising trends and budget optimization insights for nonprofits
• Provide benchmark comparisons for volunteer turnout, donation amounts, and community impact metrics
• Analyze historical marketing effectiveness and promotional strategies for charitable causes
• Include lessons learned and best practices from similar successful philanthropic events`
  },
  
  organizerScoring: {
    agentName: 'Organizer Scoring Agent',
    agentRole: 'a senior philanthropic event strategist and social impact consultant with expertise in charity event readiness assessment',
    analysisType: 'comprehensive philanthropic event readiness evaluation, social impact planning, and community engagement success assessment',
    responseFormat: `READINESS ASSESSMENT RESPONSE FORMAT:
• Provide overall readiness score (0-100) with detailed breakdown by category
• Assess resource allocation efficiency with specific budget optimization recommendations for nonprofits
• Evaluate volunteer coordination preparedness with skill gap analysis and training recommendations
• Analyze nonprofit partnerships and service quality with specific improvement areas
• Assess community engagement and promotion effectiveness with reach and impact metrics
• Provide strategic recommendations with prioritized action items and timelines for maximum social impact
• Calculate success probability with risk-adjusted outcome scenarios for community benefit
• Include contingency planning with specific backup strategies for volunteer and donor engagement
• Assess compliance and regulatory readiness with checklist items for charity events
• Provide measurement metrics and KPIs for social impact and community engagement evaluation
• Include post-event analysis framework and continuous improvement recommendations for philanthropic effectiveness`
  },
  
}

/**
 * Generate prompt for specific agent
 */
export function getAgentPrompt(agentType: keyof typeof AGENT_PROMPTS, context: any): string {
  const config = {
    ...AGENT_PROMPTS[agentType],
    context,
    responseFormat: AGENT_PROMPTS[agentType].responseFormat
  }
  
  return generateAgentPrompt(config)
}

/**
 * Generate highly detailed, event-specific prompt with additional context
 */
export function getDetailedAgentPrompt(agentType: keyof typeof AGENT_PROMPTS, context: any): string {
  const basePrompt = getAgentPrompt(agentType, context)
  const eventDetails = context.eventDetails || {}
  
  // Add event-specific considerations
  const eventSpecificConsiderations = generateEventSpecificConsiderations(eventDetails, agentType)
  
  return `${basePrompt}

ADDITIONAL EVENT-SPECIFIC CONSIDERATIONS:

${eventSpecificConsiderations}

ENHANCED ANALYSIS REQUIREMENTS:

Based on the specific event details provided, please also consider:

1. INDUSTRY-SPECIFIC FACTORS:
   ${getIndustrySpecificFactors(eventDetails.eventType, agentType)}

2. SCALE-SPECIFIC CONSIDERATIONS:
   ${getScaleSpecificConsiderations(eventDetails.expectedAttendance, agentType)}

3. LOCATION-SPECIFIC FACTORS:
   ${getLocationSpecificFactors(eventDetails.location, agentType)}

4. TIMING-SPECIFIC ANALYSIS:
   ${getTimingSpecificFactors(eventDetails.date, agentType)}

5. BUDGET-SPECIFIC RECOMMENDATIONS:
   ${getBudgetSpecificFactors(eventDetails.budget, agentType)}

Remember to provide specific, actionable recommendations that are directly applicable to this exact event scenario.`
}

/**
 * Generate event-specific considerations based on event type and agent
 */
function generateEventSpecificConsiderations(eventDetails: any, agentType: string): string {
  const eventType = eventDetails.eventType?.toLowerCase() || ''
  const location = eventDetails.location || ''
  const attendance = eventDetails.expectedAttendance || 0
  
  const considerations: Record<string, Record<string, string>> = {
    'Weather Agent': {
      'charity fundraiser': `• Outdoor fundraisers need weather contingency plans for donor comfort
• Consider weather impact on donation collection and volunteer safety
• Evaluate weather protection for auction items and displays
• Assess backup indoor venue options for inclement weather`,
      'volunteer day': `• Volunteer activities often require specific weather conditions
• Consider safety equipment needs for different weather scenarios
• Evaluate weather impact on volunteer turnout and safety
• Assess weather-appropriate clothing and protection recommendations`,
      'community service': `• Community service events often involve outdoor work
• Consider weather impact on service delivery and volunteer safety
• Evaluate weather protection for supplies and equipment
• Assess weather-appropriate service activities and alternatives`,
      'benefit concert': `• Outdoor benefit concerts need weather protection for performers and audience
• Consider weather impact on sound equipment and stage setup
• Evaluate weather contingency plans for ticket sales and attendance
• Assess weather protection for food vendors and donation stations`
    },
    'Current Events Agent': {
      'charity fundraiser': `• Charity fundraisers often compete for donor attention and corporate sponsors
• Consider local philanthropic calendar conflicts and giving season timing
• Evaluate community event saturation and donor fatigue
• Assess venue availability and pricing for nonprofit events`,
      'volunteer day': `• Volunteer events compete for volunteer time and community engagement
• Consider seasonal volunteer availability and school/work schedules
• Evaluate local volunteer event saturation and community capacity
• Assess volunteer coordination and safety requirements`,
      'community service': `• Community service events compete for community attention and participation
• Consider local service event calendar and community needs
• Evaluate community engagement capacity and volunteer availability
• Assess local service organization partnerships and coordination`,
      'benefit concert': `• Benefit concerts compete for performer bookings and audience attention
• Consider local entertainment calendar and charitable giving season
• Evaluate local music venue availability and pricing for nonprofit events
• Assess performer availability and charitable cause alignment`
    }
  }
  
  const agentConsiderations = considerations[agentType] || {}
  const eventConsiderations = agentConsiderations[eventType] || ''
  
  return eventConsiderations || `• Consider the unique characteristics of ${eventType} events
• Factor in typical attendee behavior patterns for this event type
• Assess industry-specific challenges and opportunities
• Evaluate market positioning relative to similar events`
}

/**
 * Get industry-specific factors based on event type
 */
function getIndustrySpecificFactors(eventType: string, agentType: string): string {
  const factors: Record<string, string> = {
    'charity fundraiser': `• Fundraising events require donor engagement and stewardship strategies
• Consider giving season timing and donor fatigue factors
• Evaluate local philanthropic landscape and competing causes
• Assess corporate sponsorship opportunities and community partnerships`,
    'volunteer day': `• Volunteer events require coordination and safety management
• Consider seasonal volunteer availability and community capacity
• Evaluate local volunteer organization partnerships and coordination
• Assess volunteer training and safety equipment requirements`,
    'community service': `• Community service events require local needs assessment and impact measurement
• Consider community engagement strategies and long-term relationship building
• Evaluate local service organization partnerships and resource coordination
• Assess service delivery logistics and volunteer management`,
    'benefit concert': `• Benefit concerts require performer coordination and audience engagement
• Consider local entertainment industry partnerships and venue relationships
• Evaluate charitable cause alignment and audience demographics
• Assess ticket pricing strategies and donation collection methods`
  }
  
  return factors[eventType?.toLowerCase()] || `• Consider industry-specific requirements and constraints
• Evaluate market dynamics and competitive landscape
• Assess typical attendee expectations and behavior patterns
• Factor in industry-specific timing and scheduling considerations`
}

/**
 * Get scale-specific considerations based on expected attendance
 */
function getScaleSpecificConsiderations(attendance: number, agentType: string): string {
  if (attendance >= 1000) {
    return `• Large-scale events require extensive infrastructure and logistics planning
• Consider venue capacity constraints and overflow planning
• Evaluate transportation and parking requirements for large crowds
• Assess emergency services and safety protocol requirements
• Factor in vendor capacity and service level agreements`
  } else if (attendance >= 100) {
    return `• Mid-scale events require balanced infrastructure and personal attention
• Consider venue selection and capacity optimization
• Evaluate attendee experience and engagement strategies
• Assess vendor relationships and service quality requirements
• Factor in networking and interaction opportunities`
  } else {
    return `• Intimate events allow for personalized attention and premium experiences
• Consider venue ambiance and atmosphere requirements
• Evaluate high-touch service and customization opportunities
• Assess premium vendor and service provider options
• Factor in detailed attendee experience and satisfaction metrics`
  }
}

/**
 * Get location-specific factors
 */
function getLocationSpecificFactors(location: string, agentType: string): string {
  const cityFactors: Record<string, string> = {
    'san francisco': `• High cost of living affects venue and vendor pricing
• Tech industry presence creates competitive event landscape
• Public transportation (BART, Muni) provides good accessibility
• Weather is generally mild but fog can impact outdoor events
• High demand for event venues requires early booking`,
    'new york': `• Dense urban environment creates traffic and parking challenges
• High venue costs and competitive booking environment
• Extensive public transportation network (subway, buses)
• Seasonal weather variations require contingency planning
• High concentration of corporate and cultural events`,
    'los angeles': `• Sprawling geography affects attendee travel and logistics
• Entertainment industry presence creates unique opportunities
• Car-dependent transportation requires parking considerations
• Generally mild weather but occasional rain impacts outdoor events
• Diverse venue options from beach to urban settings`
  }
  
  const cityKey = Object.keys(cityFactors).find(city => 
    location.toLowerCase().includes(city.toLowerCase())
  )
  
  return cityKey ? cityFactors[cityKey] : `• Consider local market dynamics and competitive landscape
• Evaluate transportation infrastructure and accessibility
• Assess local vendor availability and pricing
• Factor in regional weather patterns and seasonal considerations
• Consider local regulations and permit requirements`
}

/**
 * Get timing-specific factors
 */
function getTimingSpecificFactors(date: string, agentType: string): string {
  const eventDate = new Date(date)
  const month = eventDate.getMonth()
  const dayOfWeek = eventDate.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isSummer = month >= 5 && month <= 8
  const isWinter = month >= 11 || month <= 2
  
  return `• ${isWeekend ? 'Weekend' : 'Weekday'} timing affects attendee availability and traffic patterns
• ${isSummer ? 'Summer' : isWinter ? 'Winter' : 'Spring/Fall'} season impacts weather considerations and attendee behavior
• Consider seasonal pricing variations for venues and vendors
• Evaluate holiday and vacation period impacts on attendance
• Assess industry calendar conflicts and optimal timing windows
• Factor in local event calendar and competition timing`
}

/**
 * Get budget-specific factors
 */
function getBudgetSpecificFactors(budget: string | number, agentType: string): string {
  const budgetNum = typeof budget === 'string' ? parseInt(budget.replace(/[^0-9]/g, '')) : budget
  
  if (budgetNum >= 100000) {
    return `• High budget allows for premium venues, vendors, and experiences
• Consider luxury amenities and high-end service providers
• Evaluate comprehensive contingency planning and backup options
• Assess premium marketing and promotional opportunities
• Factor in executive-level expectations and service standards`
  } else if (budgetNum >= 10000) {
    return `• Mid-range budget requires strategic allocation and prioritization
• Consider value-optimized venue and vendor selections
• Evaluate cost-effective marketing and promotional strategies
• Assess essential vs. nice-to-have elements for budget optimization
• Factor in contingency planning within budget constraints`
  } else {
    return `• Limited budget requires creative solutions and cost optimization
• Consider alternative venues and vendor options
• Evaluate volunteer and partnership opportunities
• Assess DIY and in-house capabilities for cost savings
• Factor in essential elements only and prioritize core objectives`
  }
}
