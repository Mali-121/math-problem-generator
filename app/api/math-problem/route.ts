import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../../../lib/superbase'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      return await generateProblem()
    } else if (action === 'submit') {
      const { sessionId, userAnswer } = body
      return await submitAnswer(sessionId, userAnswer)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateProblem() {
  try {
    // Generate math problem using Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const prompt = `Generate a math word problem suitable for Primary 5 students (ages 10-11). The problem should involve basic arithmetic operations (addition, subtraction, multiplication, or division) with whole numbers. Make it engaging and relatable to children.

Return your response as a JSON object with exactly this format:
{
  "problem_text": "The word problem text here",
  "final_answer": [numeric answer only]
}

Example:
{
  "problem_text": "Sarah has 24 stickers. She gives 8 stickers to her friend Emma. Then she buys 12 more stickers. How many stickers does Sarah have now?",
  "final_answer": 28
}

Make sure the problem is clear, age-appropriate, and has a single correct numeric answer.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the JSON response
    let problemData
    try {
      // Clean up the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      // Fallback problem if AI response is malformed
      problemData = {
        problem_text: "A teacher has 30 pencils. She gives 12 pencils to her students. How many pencils does she have left?",
        final_answer: 18
      }
    }

    // Save to database
    const { data, error } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save problem' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      problem: {
        problem_text: problemData.problem_text,
        final_answer: problemData.final_answer
      },
      sessionId: data.id
    })

  } catch (error) {
    console.error('Problem generation error:', error)
    return NextResponse.json({ error: 'Failed to generate problem' }, { status: 500 })
  }
}

async function submitAnswer(sessionId: string, userAnswer: number) {
  try {
    // Get the original problem
    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Problem session not found' }, { status: 404 })
    }

    // Check if answer is correct
    const isCorrect = userAnswer === session.correct_answer

    // Generate personalized feedback using AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const feedbackPrompt = `You are a helpful math tutor for Primary 5 students. Generate personalized feedback for this math problem:

Problem: "${session.problem_text}"
Correct Answer: ${session.correct_answer}
Student's Answer: ${userAnswer}
Is Correct: ${isCorrect}

Provide encouraging, educational feedback that:
1. Congratulates them if correct, or gently explains the mistake if wrong
2. Explains the solution step-by-step in simple terms
3. Encourages them to keep practicing
4. Is age-appropriate and supportive

Keep the feedback concise but helpful (2-3 sentences).`

    const result = await model.generateContent(feedbackPrompt)
    const response = await result.response
    const feedbackText = response.text().trim()

    // Save submission to database
    const { error: submitError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: sessionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        feedback_text: feedbackText
      })

    if (submitError) {
      console.error('Submission error:', submitError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      feedback: feedbackText
    })

  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json({ error: 'Failed to process answer' }, { status: 500 })
  }
}
