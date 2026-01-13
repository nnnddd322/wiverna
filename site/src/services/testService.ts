import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Test = Database['public']['Tables']['tests']['Row'];
type TestInsert = Database['public']['Tables']['tests']['Insert'];
type TestUpdate = Database['public']['Tables']['tests']['Update'];

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export const testService = {
  async getTestByLectureId(lectureId: string) {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('lecture_id', lectureId)
      .maybeSingle();

    if (error) {
      console.error('Error loading test:', error);
      throw error;
    }

    return data as Test | null;
  },

  async createTest(lectureId: string, questions: Question[]) {
    const { data, error } = await supabase
      .from('tests')
      .insert({
        lecture_id: lectureId,
        questions: questions as any,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test:', error);
      throw error;
    }

    return data as Test;
  },

  async updateTest(id: string, questions: Question[]) {
    const { data, error } = await supabase
      .from('tests')
      .update({
        questions: questions as any,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating test:', error);
      throw error;
    }

    return data as Test;
  },

  async deleteTest(id: string) {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  checkAnswers(questions: Question[], userAnswers: Record<string, number>) {
    let correctCount = 0;
    const results: Record<string, boolean> = {};

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      results[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);

    return {
      score,
      correctCount,
      totalQuestions: questions.length,
      results,
    };
  },
};
