import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type StudentProgress = Database['public']['Tables']['student_progress']['Row'];
type StudentProgressInsert = Database['public']['Tables']['student_progress']['Insert'];
type StudentProgressUpdate = Database['public']['Tables']['student_progress']['Update'];

export const progressService = {
  async getStudentProgress(studentId: string, lectureId: string) {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lecture_id', lectureId)
      .maybeSingle();

    if (error) {
      console.error('Error loading progress:', error);
      throw error;
    }

    return data as StudentProgress | null;
  },

  async getStudentProgressByDiscipline(studentId: string, disciplineId: string) {
    const { data, error } = await supabase
      .from('student_progress')
      .select(`
        *,
        lectures:lecture_id (
          id,
          title,
          discipline_id,
          type
        )
      `)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error loading discipline progress:', error);
      throw error;
    }

    const filtered = data?.filter((p: any) => p.lectures?.discipline_id === disciplineId) || [];
    return filtered as (StudentProgress & { lectures: any })[];
  },

  async markLectureAccessed(studentId: string, lectureId: string) {
    const existing = await this.getStudentProgress(studentId, lectureId);

    if (existing) {
      const { data, error } = await supabase
        .from('student_progress')
        .update({
          last_accessed: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        throw error;
      }

      return data as StudentProgress;
    } else {
      const { data, error } = await supabase
        .from('student_progress')
        .insert({
          student_id: studentId,
          lecture_id: lectureId,
          completed: false,
          last_accessed: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
        throw error;
      }

      return data as StudentProgress;
    }
  },

  async markLectureCompleted(studentId: string, lectureId: string, score?: number) {
    const existing = await this.getStudentProgress(studentId, lectureId);

    const updates: StudentProgressUpdate = {
      completed: true,
      last_accessed: new Date().toISOString(),
    };

    if (score !== undefined) {
      updates.score = score;
    }

    if (existing) {
      const { data, error } = await supabase
        .from('student_progress')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        throw error;
      }

      return data as StudentProgress;
    } else {
      const { data, error } = await supabase
        .from('student_progress')
        .insert({
          student_id: studentId,
          lecture_id: lectureId,
          completed: true,
          score: score,
          last_accessed: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
        throw error;
      }

      return data as StudentProgress;
    }
  },

  async saveTestResult(studentId: string, lectureId: string, score: number) {
    return this.markLectureCompleted(studentId, lectureId, score);
  },

  async getDisciplineProgress(studentId: string, disciplineId: string) {
    const { data: lectures, error: lecturesError } = await supabase
      .from('lectures')
      .select('id')
      .eq('discipline_id', disciplineId)
      .eq('status', 'published');

    if (lecturesError) {
      console.error('Error loading lectures:', lecturesError);
      throw lecturesError;
    }

    const lectureIds = lectures?.map(l => l.id) || [];

    if (lectureIds.length === 0) {
      return {
        totalLectures: 0,
        completedLectures: 0,
        progressPercentage: 0,
      };
    }

    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .in('lecture_id', lectureIds)
      .eq('completed', true);

    if (progressError) {
      console.error('Error loading progress:', progressError);
      throw progressError;
    }

    const completedCount = progress?.length || 0;
    const totalCount = lectureIds.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalLectures: totalCount,
      completedLectures: completedCount,
      progressPercentage: percentage,
    };
  },

  async getStudentProgressForTeacher(disciplineId: string) {
    const { data: lectures, error: lecturesError } = await supabase
      .from('lectures')
      .select('id, title')
      .eq('discipline_id', disciplineId)
      .eq('status', 'published');

    if (lecturesError) {
      console.error('Error loading lectures:', lecturesError);
      throw lecturesError;
    }

    const lectureIds = lectures?.map(l => l.id) || [];

    if (lectureIds.length === 0) {
      return [];
    }

    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select(`
        *,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('lecture_id', lectureIds);

    if (progressError) {
      console.error('Error loading progress:', progressError);
      throw progressError;
    }

    return progress || [];
  },
};
