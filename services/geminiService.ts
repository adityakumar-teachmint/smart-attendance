
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Student } from "../types";

export class AttendanceAIService {
  private ai: GoogleGenAI;

  constructor() {
    // Correctly initialize GoogleGenAI using the process.env.API_KEY directly.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeClassroom(classroomBase64: string, students: Student[]): Promise<{ studentId: string; present: boolean; confidence: number }[]> {
    if (students.length === 0) return [];

    const classroomPart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: classroomBase64.split(',')[1] || classroomBase64,
      },
    };

    // Construct profile parts with metadata hints
    const studentParts = students.map((s, idx) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: s.photo.split(',')[1] || s.photo,
      },
      // We'll associate these in the text prompt
    }));

    const prompt = `
      TASK: Classroom Attendance Recognition.
      I have provided one main classroom photo and ${students.length} profile photos of registered students.
      
      STUDENT LIST (in order of attached profile images):
      ${students.map((s, i) => `[ID: ${s.id}] Name: ${s.name} (Image #${i + 1})`).join('\n')}

      Compare each student's profile image against the classroom photo. 
      Determine if each student is physically present in the classroom photo.
      
      Return a JSON array of objects with these exact keys:
      - studentId: The ID of the student.
      - present: Boolean (true if visible in classroom photo).
      - confidence: Number (0-100) indicating matching confidence.

      Analyze carefully. Even if blurry, try to find matching features.
    `;

    try {
      // Use ai.models.generateContent to query GenAI with model name and prompt.
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            classroomPart,
            ...studentParts
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                studentId: { type: Type.STRING },
                present: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER },
              },
              required: ["studentId", "present", "confidence"],
            },
          },
        },
      });

      // The GenerateContentResponse features a text property (not a method).
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }
}

export const aiService = new AttendanceAIService();
