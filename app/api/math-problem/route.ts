import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../../../lib/superbase'

// TODO: maybe add error handling for missing API key?
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // handle different actions
    if (action === 'generate') {
      const { difficulty = 'easy', problemType = 'mixed' } = body
      return await generateProblem(difficulty, problemType)
    } 
    else if (action === 'submit') {
      const { sessionId, userAnswer, hintsUsed } = body
      return await submitAnswer(sessionId, userAnswer, hintsUsed || 0)
    } 
    else if (action === 'getHistory') {
      return await getProblemHistory()
    } 
    else if (action === 'getHint') {
      const { sessionId, hintIndex, userAnswer } = body
      return await getHint(sessionId, hintIndex, userAnswer)
    } 
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateProblem(difficulty: string, problemType: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    // difficulty settings
    const difficultyPrompts = {
      easy: "Use small numbers (1-20) and simple operations",
      medium: "Use medium numbers (1-100) and may involve 2-step problems",
      hard: "Use larger numbers (1-1000) and may involve multiple steps or complex scenarios"
    }

    // problem type settings
    const typePrompts = {
      addition: "Focus on addition problems",
      subtraction: "Focus on subtraction problems", 
      multiplication: "Focus on multiplication problems",
      division: "Focus on division problems",
      mixed: "Mix different operations (addition, subtraction, multiplication, division)"
    }

    const prompt = `Generate a math word problem suitable for Primary 5 students (ages 10-11). 

${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}
${typePrompts[problemType as keyof typeof typePrompts]}

Make it engaging and relatable to children. Include step-by-step solution and 3 progressive hints.

Return your response as a JSON object with exactly this format:
{
  "problem_text": "The word problem text here",
  "final_answer": [numeric answer only],
  "difficulty": "${difficulty}",
  "problem_type": "${problemType}",
  "steps": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"],
  "hints": ["Hint 1: gentle clue about operation", "Hint 2: suggest breaking into parts", "Hint 3: clue about final step"]
}

Example:
{
  "problem_text": "Sarah has 24 stickers. She gives 8 stickers to her friend Emma. Then she buys 12 more stickers. How many stickers does Sarah have now?",
  "final_answer": 28,
  "difficulty": "easy",
  "problem_type": "mixed",
  "steps": [
    "Sarah starts with 24 stickers",
    "She gives away 8 stickers: 24 - 8 = 16 stickers",
    "She buys 12 more stickers: 16 + 12 = 28 stickers"
  ]
}

Make sure the problem is clear, age-appropriate, and has a single correct numeric answer.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // parse JSON response
    let problemData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      // fallback problem if AI fails
      problemData = {
        problem_text: "A teacher has 30 pencils. She gives 12 pencils to her students. How many pencils does she have left?",
        final_answer: 18,
        difficulty: difficulty,
        problem_type: problemType,
        steps: [
          "Teacher starts with 30 pencils",
          "She gives away 12 pencils: 30 - 12 = 18 pencils"
        ],
        hints: [
          "Think about what operation you need: addition or subtraction?",
          "Start with what the teacher has, then subtract what she gives away",
          "The answer should be less than 30 since pencils were given away"
        ]
      }
    }

    // save to db
    const { data, error } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer,
        difficulty: problemData.difficulty,
        problem_type: problemData.problem_type,
        steps: problemData.steps,
        hints: problemData.hints
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
            final_answer: problemData.final_answer,
            difficulty: problemData.difficulty,
            problem_type: problemData.problem_type,
            steps: problemData.steps,
            hints: problemData.hints
          },
          sessionId: data.id
        })

  } catch (error) {
    console.error('Problem generation error:', error)
    return NextResponse.json({ error: 'Failed to generate problem' }, { status: 500 })
  }
}

async function submitAnswer(sessionId: string, userAnswer: number, hintsUsed: number = 0) {
  try {
    // get the original problem
    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Problem session not found' }, { status: 404 })
    }

    // check if answer is correct
    const isCorrect = userAnswer === session.correct_answer

    // generate instant feedback (no AI delay)
    let feedbackText = ''
    if (isCorrect) {
      feedbackText = `🎉 Excellent! Your answer ${userAnswer} is correct! You solved this ${session.difficulty} ${session.problem_type} problem perfectly. Keep up the great work!`
    } else {
      feedbackText = `🤔 Not quite right. Your answer was ${userAnswer}, but the correct answer is ${session.correct_answer}. Don't worry - every mistake is a chance to learn! Try again or use a hint if you need help.`
    }

    // Optional: Generate AI feedback in background (non-blocking)
    // This could be implemented later for enhanced feedback

    // save submission to db
    const { error: submitError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: sessionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        feedback_text: feedbackText,
        difficulty: session.difficulty,
        problem_type: session.problem_type,
        hints_used: hintsUsed
      })

    if (submitError) {
      console.error('Submission error:', submitError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    // calculate score and streak
    const { data: submissions } = await supabase
      .from('math_problem_submissions')
      .select('is_correct, created_at')
      .order('created_at', { ascending: false })

    const total = submissions?.length || 0
    const correct = submissions?.filter(s => s.is_correct).length || 0
    
    // Calculate current streak
    let streak = 0
    if (submissions) {
      for (const submission of submissions) {
        if (submission.is_correct) {
          streak++
        } else {
          break
        }
      }
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      feedback: feedbackText,
      score: {
        correct,
        total,
        streak
      }
    })

  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json({ error: 'Failed to process answer' }, { status: 500 })
  }
}

async function getProblemHistory() {
  try {
    // get recent submissions with session details
    const { data: submissions, error } = await supabase
      .from('math_problem_submissions')
      .select(`
        id,
        user_answer,
        is_correct,
        feedback_text,
        created_at,
        difficulty,
        problem_type,
        hints_used,
        math_problem_sessions (
          problem_text,
          correct_answer,
          difficulty,
          problem_type,
          hints
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('History error:', error)
      return NextResponse.json({ error: 'Failed to get history' }, { status: 500 })
    }

    // format the data
    const history = submissions?.map(sub => ({
      id: sub.id,
      problem_text: (sub.math_problem_sessions as any)?.problem_text || '',
      user_answer: sub.user_answer,
      correct_answer: (sub.math_problem_sessions as any)?.correct_answer || 0,
      is_correct: sub.is_correct,
      difficulty: (sub.math_problem_sessions as any)?.difficulty || sub.difficulty || 'easy',
      problem_type: (sub.math_problem_sessions as any)?.problem_type || sub.problem_type || 'mixed',
      hints_used: sub.hints_used || 0,
      total_hints: (sub.math_problem_sessions as any)?.hints?.length || 0,
      created_at: sub.created_at
    })) || []

    // Calculate overall score
    const total = submissions?.length || 0
    const correct = submissions?.filter(s => s.is_correct).length || 0
    
    // Calculate current streak
    let streak = 0
    if (submissions) {
      for (const submission of submissions) {
        if (submission.is_correct) {
          streak++
        } else {
          break
        }
      }
    }

    return NextResponse.json({
      success: true,
      history,
      score: {
        correct,
        total,
        streak
      }
    })

  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 })
  }
}

async function getHint(sessionId: string, hintIndex: number, userAnswer?: number) {
  try {
    // get the problem
    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Problem session not found' }, { status: 404 })
    }

    // get the user's last wrong answer if available
    const { data: lastSubmission } = await supabase
      .from('math_problem_submissions')
      .select('user_answer')
      .eq('session_id', sessionId)
      .eq('is_correct', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // generate hint using AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const hintPrompts = [
      "Give a gentle hint about what operation to use",
      "Suggest breaking the problem into smaller parts",
      "Provide a clue about the final step"
    ]

    let hintPrompt = `You are a helpful math tutor. Generate a helpful hint for this math problem:

Problem: "${session.problem_text}"
Correct Answer: ${session.correct_answer}
Hint Level: ${hintIndex + 1}/3

${hintPrompts[hintIndex] || "Give a general hint"}`

    // Add context about wrong answer if available
    if (lastSubmission?.user_answer !== undefined) {
      hintPrompt += `\n\nIMPORTANT: The student previously answered ${lastSubmission.user_answer}, which was incorrect. In your hint, directly reference their wrong answer and help them understand where they might have gone wrong. For example, say something like "I see you answered ${lastSubmission.user_answer}, but..." and then guide them toward the correct approach without giving away the answer.`
    }

    hintPrompt += `\n\nMake the hint helpful but don't give away the answer. Keep it encouraging and age-appropriate for Primary 5 students (10-11 years old).`

    const result = await model.generateContent(hintPrompt)
    const response = await result.response
    const hintText = response.text().trim()

    return NextResponse.json({
      success: true,
      hint: hintText
    })

  } catch (error) {
    console.error('Get hint error:', error)
    return NextResponse.json({ error: 'Failed to get hint' }, { status: 500 })
  }
}