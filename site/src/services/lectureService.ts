import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Lecture = Database['public']['Tables']['lectures']['Row'];
type LectureInsert = Database['public']['Tables']['lectures']['Insert'];
type LectureUpdate = Database['public']['Tables']['lectures']['Update'];

export const lectureService = {
  async getLecturesByDiscipline(disciplineId: string, includeUnpublished = false) {
    let query = supabase
      .from('lectures')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('order_index', { ascending: true });

    if (!includeUnpublished) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading lectures:', error);
      throw error;
    }

    return (data || []) as Lecture[];
  },

  async getLectureById(id: string) {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading lecture:', error);
      throw error;
    }

    return data as Lecture;
  },

  async createLecture(lecture: {
    discipline_id: string;
    title: string;
    type: 'article' | 'presentation' | 'test';
    content?: any;
    status?: 'draft' | 'published';
    order_index?: number;
  }) {
    const { data, error } = await supabase
      .from('lectures')
      .insert({
        discipline_id: lecture.discipline_id,
        title: lecture.title,
        type: lecture.type,
        content: lecture.content || null,
        status: lecture.status || 'published',
        order_index: lecture.order_index ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lecture:', error);
      throw error;
    }

    return data as Lecture;
  },

  async updateLecture(id: string, updates: LectureUpdate) {
    const { data, error } = await supabase
      .from('lectures')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lecture:', error);
      throw error;
    }

    return data as Lecture;
  },

  async publishLecture(id: string) {
    return this.updateLecture(id, { status: 'published' });
  },

  async unpublishLecture(id: string) {
    return this.updateLecture(id, { status: 'draft' });
  },

  async deleteLecture(id: string) {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lecture:', error);
      throw error;
    }
  },

  async reorderLectures(lectureIds: string[]) {
    const updates = lectureIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      await this.updateLecture(update.id, { order_index: update.order_index });
    }
  },

  async getLectureCount(disciplineId: string) {
    const { count, error } = await supabase
      .from('lectures')
      .select('*', { count: 'exact', head: true })
      .eq('discipline_id', disciplineId)
      .eq('status', 'published');

    if (error) {
      console.error('Error counting lectures:', error);
      throw error;
    }

    return count || 0;
  },
};
