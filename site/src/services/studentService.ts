import { supabase } from '../lib/supabase';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  group_id: string | null;
}

export const studentService = {
  async searchStudents(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, group_id')
      .eq('role', 'student')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('last_name')
      .limit(20);

    if (error) throw error;
    return data;
  },

  async getStudentById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, group_id')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (error) throw error;
    return data;
  },
};
