# ImpactGauge - Community Impact Assessment Platform

ImpactGauge is a comprehensive platform designed to optimize charitable event planning, analysis, and impact prediction. Built with Next.js, TypeScript, and modern UI components, it provides intelligent insights to help maximize the success and societal impact of charitable events and community initiatives.

## 🚀 Features

### Core Functionality
- **Comprehensive Analysis**: Weather, current events, historical data, and comprehensive impact scoring
- **Event Planning Interface**: Comprehensive form with validation and real-time feedback
- **Previous Events Gallery**: Historical event tracking with impact score visualization
- **Planning Assistant**: Interactive guidance for event planning and community engagement
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

### Backend
- **API Routes**: Next.js API routes with multi-agent system
- **Data Storage**: Mock data implementation (no database)
- **Smart Analytics**: Advanced data processing and insights
- **External APIs**: OpenWeatherMap for weather data

### Analysis Modules
1. **Weather Agent**: Weather analysis and forecasting
2. **Current Events Agent**: Local event conflict analysis
3. **Historic Events Agent**: Historical pattern analysis
4. **Organizer Scoring Agent**: Comprehensive event scoring
5. **Planning Assistant**: Interactive event planning and community impact guidance

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- pnpm package manager
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
GEMINI_API_KEY=your_gemini_api_key
WEATHER_API_KEY=your_openweather_api_key
MAPS_API_KEY=your_google_maps_api_key
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
│   ├── agents/           # Analysis module implementations
│   ├── prompts/          # Analysis templates
│   ├── types/            # TypeScript types
│   └── utils.ts          # Utility functions
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

## 📊 Data Storage

The application uses mock data for demonstration purposes. All event data and analysis results are stored in memory and reset on page refresh. This approach allows for:

- **Quick Setup**: No database configuration required
- **Demo Ready**: Immediate functionality for presentations
- **Development Focus**: Concentrate on AI analysis features
- **Easy Migration**: Can be easily connected to a real database later

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the charitable community
