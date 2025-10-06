# Math Problem Generator - Developer Assessment Starter Kit

## Overview

This is a starter kit for building an AI-powered math problem generator application. The goal is to create a standalone prototype that uses AI to generate math word problems suitable for Primary 5 students, saves the problems and user submissions to a database, and provides personalized feedback.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd math-problem-generator
```

### 2. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API to find your:
   - Project URL (starts with `https://`)
   - Anon/Public Key

### 3. Set Up Database Tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `database.sql`
3. Click "Run" to create the tables and policies

### 4. Get Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini

### 5. Configure Environment Variables

1. Create `.env.local` file:
   ```bash
   touch .env.local
   ```
2. Edit `.env.local` and add your actual keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   GOOGLE_API_KEY=your_actual_google_api_key
   ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Implementation Status

### ✅ Completed Features

- **AI Problem Generation**: Uses Gemini 2.5 Flash to generate Primary 5 appropriate math problems
- **Database Integration**: Problems and submissions saved to Supabase
- **Answer Validation**: Automatic checking of user answers
- **Personalized Feedback**: AI-generated feedback based on student responses
- **Responsive UI**: Clean, mobile-friendly interface
- **Error Handling**: Graceful error handling for API failures
- **Loading States**: Visual feedback during API calls

### 3. Requirements Checklist

- [x] AI generates appropriate Primary 5 level math problems
- [x] Problems and answers are saved to Supabase
- [x] User submissions are saved with feedback
- [x] AI generates helpful, personalized feedback
- [x] UI is clean and mobile-responsive
- [x] Error handling for API failures
- [x] Loading states during API calls

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add your environment variables in Vercel's project settings
4. Deploy!

## Assessment Submission

When submitting your assessment, provide:

1. **GitHub Repository URL**: Make sure it's public
2. **Live Demo URL**: Your Vercel deployment
3. **Supabase Credentials**: Add these to your README for testing:
   ```
   SUPABASE_URL: [Your Supabase Project URL]
   SUPABASE_ANON_KEY: [Your Supabase Anon Key]
   ```

## Implementation Notes

### My Implementation:

- **Gemini 2.5 Flash Integration**: Used the latest Gemini model for both problem generation and feedback
- **Robust Error Handling**: Implemented fallback problems and comprehensive error handling
- **TypeScript Configuration**: Proper path mapping and type safety throughout
- **Database Design**: Clean schema with proper relationships and indexes
- **User Experience**: Intuitive interface with clear feedback and loading states

## Additional Features (Optional)

If you have time, consider adding:

- [ ] Difficulty levels (Easy/Medium/Hard)
- [ ] Problem history view
- [ ] Score tracking
- [ ] Different problem types (addition, subtraction, multiplication, division)
- [ ] Hints system
- [ ] Step-by-step solution explanations

---

Good luck with your assessment! 🎯
