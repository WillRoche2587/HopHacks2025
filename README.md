# CharityAI - AI-Powered Charitable Event Planning Platform

CharityAI is a comprehensive AI-powered platform designed to optimize charitable event planning, analysis, and impact prediction. Built with Next.js, TypeScript, and modern UI components, it provides intelligent insights to help maximize the success and impact of charitable events.

## 🚀 Features

### Core Functionality
- **Multi-Agent AI Analysis**: Weather, current events, historical data, and comprehensive scoring
- **Event Planning Interface**: Comprehensive form with validation and real-time feedback
- **Previous Events Gallery**: Historical event tracking with impact score visualization
- **AI Assistant Chat**: Conversational interface for event planning guidance
- **Settings Management**: Account, notifications, API configuration, and privacy controls

### Technical Features
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Real-time Updates**: Live loading states and progress indicators
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui component library
- **Icons**: Lucide React
- **Fonts**: Space Grotesk (headings), DM Sans (body)

### Backend
- **API Routes**: Next.js API routes with multi-agent system
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth with anonymous support
- **AI Integration**: Google Gemini API
- **External APIs**: OpenWeatherMap for weather data

### AI Agents
1. **Weather Agent**: Weather analysis and forecasting
2. **Current Events Agent**: Local event conflict analysis
3. **Historic Events Agent**: Historical pattern analysis
4. **Organizer Scoring Agent**: Comprehensive event scoring
5. **AI Assistant Agent**: Conversational event planning support

## 🎨 Design System

### Color Palette
- **Primary**: Purple (#9333ea) - Main brand color
- **Success**: Green (#10b981) - Positive feedback
- **Warning**: Orange (#f59e0b) - Caution states
- **Info**: Blue (#3b82f6) - Information display
- **Destructive**: Red (#ef4444) - Error states

### Typography
- **Headings**: Space Grotesk (modern, geometric)
- **Body**: DM Sans (readable, friendly)
- **Responsive**: Fluid typography scaling

### Components
- **Cards**: Elevated surfaces with subtle shadows
- **Buttons**: Multiple variants with hover states
- **Forms**: Accessible inputs with validation
- **Navigation**: Sidebar with active states
- **Loading**: Skeleton screens and spinners

## 📱 User Interface

### Main Navigation
- **Sidebar**: Fixed navigation with 4 main sections
- **Mobile**: Collapsible sidebar with hamburger menu
- **Active States**: Visual feedback for current page

### Event Analysis Tab
- **Form**: Comprehensive event details input
- **Validation**: Real-time form validation
- **Results**: Grid layout with agent-specific cards
- **Scoring**: Visual impact score display

### Previous Events Tab
- **Gallery**: Responsive grid of event cards
- **Impact Scores**: Color-coded progress bars
- **Empty State**: Helpful guidance for new users

### AI Assistant Tab
- **Chat Interface**: Message bubbles with timestamps
- **Welcome Screen**: Capability overview
- **Loading States**: Real-time feedback

### Settings Tab
- **Account**: Organization and contact information
- **Notifications**: Preference toggles
- **API Config**: External service configuration
- **Privacy**: Data and analytics controls

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Supabase account
- Google Gemini API key
- OpenWeatherMap API key

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd HopHacks2025

# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ErrorBoundary.tsx # Error handling
│   └── LoadingSpinner.tsx # Loading states
├── lib/                  # Utility libraries
│   ├── agents/           # AI agent implementations
│   ├── prompts/          # AI prompts
│   ├── types/            # TypeScript types
│   └── utils.ts          # Utility functions
└── supabase/             # Database schema
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Compatible with Next.js static export
- **Railway**: Full-stack deployment with database
- **Docker**: Containerized deployment option

## 📊 Database Schema

### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  duration TEXT,
  expected_attendance INTEGER,
  budget DECIMAL,
  audience TEXT,
  special_requirements TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the component library
- **Tailwind CSS** for the styling framework
- **Supabase** for the backend infrastructure
- **Google Gemini** for AI capabilities
- **OpenWeatherMap** for weather data

## 📞 Support

For support, email support@charityai.com or join our Discord community.

---

Built with ❤️ for the charitable community