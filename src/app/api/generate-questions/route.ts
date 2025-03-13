// src/app/api/generate-questions/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the question interface
interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Initialize Google Generative AI client with free tier API
// Using gemini-1.5-flash which is available in the free tier
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Fallback questions if API fails
const fallbackQuestions: Question[] = [
  {
    question: "What is the chemical symbol for gold?",
    options: ["Au", "Ag", "Fe", "Cu"],
    correctAnswer: "Au"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Mercury"],
    correctAnswer: "Mars"
  },
  {
    question: "What is the process by which plants make their own food using sunlight?",
    options: ["Photosynthesis", "Respiration", "Transpiration", "Germination"],
    correctAnswer: "Photosynthesis"
  },
  {
    question: "What is the largest organ in the human body?",
    options: ["Skin", "Liver", "Heart", "Brain"],
    correctAnswer: "Skin"
  },
  {
    question: "Which of these is NOT a state of matter?",
    options: ["Energy", "Solid", "Liquid", "Gas"],
    correctAnswer: "Energy"
  }
];

export async function POST(request: Request) {
  try {
    const { subject, difficulty, numberOfQuestions = 10 } = await request.json();

    if (!subject || !difficulty) {
      return NextResponse.json(
        { error: 'Subject and difficulty are required' },
        { status: 400 }
      );
    }

    try {
      // Create a simplified prompt for Gemini free tier
      const prompt = `Generate ${numberOfQuestions} multiple-choice questions about ${subject} at a ${difficulty} difficulty level. 
      Each question should have 4 options with only one correct answer.
      Format the response as a JSON object with the following structure:
      {
        "questions": [
          {
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "The correct option (must be exactly the same as one of the options)"
          }
        ]
      }
      Keep the questions educational and appropriate for the difficulty level.`;

      console.log(`Generating questions about ${subject} at ${difficulty} level with Gemini...`);
      
      // Call Gemini API to generate questions
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('Failed to generate questions');
      }

      // Parse the JSON response
      try {
        // Clean the response to ensure it's valid JSON by removing code blocks if present
        const cleanedContent = content.replace(/```json|```/g, '').trim();
        
        console.log('Parsing Gemini response...');
        const parsedContent = JSON.parse(cleanedContent);
        const questions = parsedContent.questions || [];

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error('No questions in the response');
        }

        console.log(`Successfully generated ${questions.length} questions`);
        return NextResponse.json({ questions });
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        console.log('Response content:', content);
        throw new Error('Failed to parse generated questions');
      }
    } catch (error) {
      console.error('Error using Gemini API:', error);
      console.log('Falling back to fallback questions due to API error');
      
      // Limit the number of questions to the requested amount
      const questions = fallbackQuestions.slice(0, Math.min(numberOfQuestions, fallbackQuestions.length));
      
      console.log(`Using ${questions.length} fallback questions for ${subject}`);
      return NextResponse.json({ 
        questions,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error in generate-questions API route:', error);
    
    // Final fallback - return some basic questions if everything else fails
    return NextResponse.json({ 
      questions: fallbackQuestions.slice(0, 5),
      source: 'error-fallback'
    }, { status: 200 }); // Return 200 status with fallback data instead of 500
  }
}
