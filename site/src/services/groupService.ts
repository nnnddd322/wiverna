import { supabase } from '../lib/supabase';

export interface Group {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const groupService = {
  async getAllGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async createGroup(name: string) {
    const { data, error } = await supabase
      .from('groups')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGroup(id: string, name: string) {
    const { data, error } = await supabase
      .from('groups')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGroup(id: string) {
    const { data: students, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('group_id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (students && students.length > 0) {
      throw new Error('Невозможно удалить группу, в которой есть студенты');
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStudentsByGroup(groupId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('group_id', groupId)
      .eq('role', 'student')
      .order('last_name');

    if (error) throw error;
    return data;
  },
};
