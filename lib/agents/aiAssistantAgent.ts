import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateWordLimit, truncateToWordLimit } from '@/lib/utils/wordCount'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function run(payload: { message: string; conversationHistory?: any[] }): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `You are CharityAI Assistant, a helpful AI assistant specialized in charitable event planning, volunteer management, fundraising strategies, and community engagement.

User's question: ${payload.message}

Please provide helpful, actionable advice related to charitable event planning. Focus on:
- Event logistics and planning
- Volunteer coordination and management
- Fundraising strategies and donor engagement
- Marketing and community outreach
- Risk management and contingency planning
- Impact measurement and evaluation

IMPORTANT: Format your response using markdown for better readability:
- Use ## for section headers
- Use **bold** for emphasis
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Use > for important tips or quotes
- Keep response under 250 words
- No bullet points

Keep your response practical and encouraging. If the question is not related to charitable events, politely redirect the conversation back to charitable event planning topics.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Validate and truncate if necessary to stay under 250 words
    return truncateToWordLimit(text, 250)
  } catch (error) {
    console.error('AI Assistant error:', error)
    return `I'm sorry, I'm having trouble processing your request right now. Please try again in a moment. 

## Quick Event Planning Tips

If you need immediate help with event planning, here are some quick tips:

**Start planning** at least 6-8 weeks in advance
**Recruit volunteers** early and provide clear roles
**Set realistic fundraising goals** and track progress
**Create backup plans** for weather and other contingencies
**Focus on your mission** and impact story

Is there a specific aspect of event planning I can help you with?`
  }
}
