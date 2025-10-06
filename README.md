Math Problem Generator

An AI-powered learning platform that generates Primary 5 level math word problems and gives personalized feedback using Google Gemini AI. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

Live Demo

https://math-problem-generator-ten.vercel.app

Technologies Used

Next.js 14 (App Router)

TypeScript

Tailwind CSS

Supabase (Database & API)

Google Generative AI (Gemini 2.5-flash)

How to Run Locally
git clone https://github.com/Mali-121/math-problem-generator.git
cd math-problem-generator
cp .env.local
npm install
npm run dev

Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GOOGLE_API_KEY=your_google_gemini_api_key

Supabase Credentials (for testing)

These are public keys (safe to share):

SUPABASE_URL: https://rvbsnzhydudgcoiavwuz.supabase.co
SUPABASE_ANON_KEY:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2YnNuemh5ZHVkZ2NvaWF2d3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTg1NzEsImV4cCI6MjA3NTI5NDU3MX0.1k3IKzDelhuDq83SUZUifvw0xDMCF-hkTHnhpBX8tjc

Additional Features (Optional)
 Difficulty levels (Easy/Medium/Hard) - Implemented
 Problem history view - Implemented
 Score tracking - Implemented
 Different problem types (addition, subtraction, multiplication, division) - Implemented
 Hints system - Implemented
 Step-by-step solution explanations - Implemented

My Implementation Notes:

Ai-powered Problem Generator: 
Integrated with Gemini (2.5-flash) to generate Primary 5-level math work problems, reuturning a structured JSON with problem_text and final_answer and more. 

Personalised Feedback via Ai:
Implmeneted a sceondary call to generate a short ecnourageing and constructive feedback based on the students answer and the original problem.

Superbase integration: 
Math problem are stored in math_problem_sessions
Users answers and feeback is stored in math_problem_submissions.

Validation with Zod: 
Added strict zod schema validation to parse and safely handle AI responses before saving them to the database.

Clean, Responsive UI:
Built a mobile-friendly interface using Tailwind CSS with a card-based layout, consistent spacing, and intuitive input/submit flow.

Error Handling & Loading States: 
Included proper try/catch error handling and loading indicators during API calls to improve user experience and debug-ability.

Deployed on Vercel: 
Pushed to GitHub and deployed to Vercel with all required environment variables for a smooth end-to-end demo.

Feature i am perticularly proud of 
One feature I’m especially proud of is the two-stage AI-driven hint system I designed to enhance the learning experience. I carefully tailored the AI prompts to avoid giving away direct answers. Instead, the hints are crafted to gently nudge the user toward the first step of solving the problem, while also offering insight into how to approach the solution logically all without spoiling it.

What makes this system unique is its adaptive nature:

When a math problem is first generated, the AI also creates three general-purpose hints related to that problem.

If the user submits an incorrect answer and then clicks the “Hint” button, the system dynamically generates a more personalized, empathetic hint based on their specific mistake.

This approach not only supports deeper thinking but also helps user feel guided and supported, improving the overall learning experience without compromising problem-solving challenge.



