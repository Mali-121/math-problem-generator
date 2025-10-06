# Math Problem Generator

An AI-powered learning platform that generates Primary 5 level math word problems and provides personalized feedback using Google Gemini AI. Built with modern web technologies for an engaging educational experience.

## 🚀 Live Demo

[**View Live Application**](https://math-problem-generator-ten.vercel.app)

## 📋 Overview

This application creates an interactive math learning environment where students can:
- Generate age-appropriate math word problems
- Receive personalized AI-powered hints
- Track their learning progress
- View detailed problem history and statistics

## 🛠️ Tech Stack

- **Frontend Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **AI Integration:** Google Generative AI (Gemini 2.5-flash)
- **Deployment:** Vercel

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Mali-121/math-problem-generator.git
cd math-problem-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Setup

### Supabase Configuration

1. Create a new project at [Supabase](https://supabase.com)
2. Run the SQL schema from `database.sql` to create required tables
3. Update your environment variables with Supabase credentials

### Test Credentials (Public)

For testing purposes, you can use these public Supabase credentials:

- **URL:** `https://rvbsnzhydudgcoiavwuz.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2YnNuemh5ZHVkZ2NvaWF2d3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTg1NzEsImV4cCI6MjA3NTI5NDU3MX0.1k3IKzDelhuDq83SUZUifvw0xDMCF-hkTHnhpBX8tjc`

## ✨ Features

### Core Features
- ✅ **AI Problem Generation** - Dynamic math word problems using Gemini AI
- ✅ **Difficulty Levels** - Easy, Medium, and Hard problem variations
- ✅ **Problem Types** - Addition, subtraction, multiplication, division, and mixed operations
- ✅ **Intelligent Hint System** - Two-stage AI-powered hints (pre-generated + dynamic)
- ✅ **Progress Tracking** - Score tracking and streak counting
- ✅ **Problem History** - Complete history of attempted problems
- ✅ **Achievement System** - Gamified learning with unlockable badges

### Advanced Features
- ✅ **Personalized Feedback** - AI-generated feedback based on student responses
- ✅ **Real-time Updates** - Live statistics and history updates
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Error Handling** - Comprehensive error management and loading states

## 🎯 Key Implementation Highlights

### AI-Powered Problem Generator
Integrated with Gemini 2.5-flash to generate Primary 5-level math word problems, returning structured JSON with problem text, final answer, difficulty level, and step-by-step solutions.

### Intelligent Hint System
**Feature I'm particularly proud of:** A sophisticated two-stage hint system that enhances learning without giving away answers:

1. **Pre-generated Hints** - Three general hints created with each problem
2. **Dynamic AI Hints** - Personalized hints generated when users submit wrong answers

The AI prompts are carefully crafted to:
- Avoid revealing direct answers
- Guide users toward the first step
- Provide logical approach insights
- Maintain problem-solving challenge

### Database Integration
- **Problem Storage:** `math_problem_sessions` table stores generated problems
- **User Submissions:** `math_problem_submissions` table tracks answers and feedback
- **Data Validation:** Zod schema validation for AI response parsing

### User Experience
- **Clean Interface:** Card-based layout with consistent spacing
- **Loading States:** Visual feedback during AI operations
- **Error Handling:** Graceful error management with user-friendly messages
- **Real-time Updates:** Instant feedback and progress tracking

## 🏆 Achievement System

The application includes a comprehensive achievement system with 8 unlockable badges:

- 🎯 **First Problem** - Solve your first math problem
- 🧠 **Quick Learner** - Solve 5 problems correctly
- 🔥 **Hot Streak** - Get 3 correct answers in a row
- 🏆 **Math Master** - Solve 10 problems total
- 💯 **Perfect Score** - Achieve 100% accuracy on 5+ problems
- 💡 **Hint Master** - Use hints effectively on 3+ problems
- ⚡ **Speed Demon** - Get 5 correct answers in a row
- 🧩 **Problem Solver** - Solve 20 problems total

## 🚀 Deployment

The application is deployed on Vercel with automatic deployments from the main branch. All environment variables are configured for production use.

## 📊 Project Statistics

- **TypeScript:** 89.6%
- **JavaScript:** 2.3%
- **Other:** 8.1%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language model capabilities
- Supabase for reliable database infrastructure
- Next.js team for the excellent React framework
- Vercel for seamless deployment platform