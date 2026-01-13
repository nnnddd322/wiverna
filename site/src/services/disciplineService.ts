import { supabase } from '../lib/supabase';

export interface Discipline {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDisciplineData {
  title: string;
  description: string;
  icon?: string;
}

export const disciplineService = {
  async getMyDisciplines(userId: string, role: 'student' | 'teacher' | 'admin') {
    if (role === 'teacher' || role === 'admin') {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } else {
      const { data: accessData, error: accessError } = await supabase
        .from('discipline_access')
        .select(`
          discipline_id,
          disciplines (*)
        `)
        .eq('student_id', userId);

      if (accessError) throw accessError;

      const disciplines = accessData
        ?.map((access: any) => access.disciplines)
        .filter(Boolean) || [];

      // Remove duplicates
      const uniqueDisciplines = disciplines.filter((d: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t.id === d.id)
      );

      return uniqueDisciplines;
    }
  },

  async createDiscipline(data: CreateDisciplineData, teacherId: string) {
    const { data: discipline, error } = await supabase
      .from('disciplines')
      .insert({
        title: data.title,
        description: data.description,
        icon: data.icon || null,
        teacher_id: teacherId,
      })
      .select()
      .single();

    if (error) throw error;
    return discipline;
  },

  async updateDiscipline(id: string, data: Partial<CreateDisciplineData>) {
    const { data: discipline, error } = await supabase
      .from('disciplines')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return discipline;
  },

  async deleteDiscipline(id: string) {
    const { error } = await supabase
      .from('disciplines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async grantAccessToGroup(disciplineId: string, groupId: string) {
    // Get all students in the group
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('group_id', groupId)
      .eq('role', 'student');

    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      throw new Error('В группе нет студентов');
    }

    // Get existing access records
    const { data: existingAccess, error: existingError } = await supabase
      .from('discipline_access')
      .select('student_id')
      .eq('discipline_id', disciplineId)
      .in('student_id', students.map(s => s.id));

    if (existingError) throw existingError;

    // Filter out students who already have access
    const existingStudentIds = new Set(existingAccess?.map(a => a.student_id) || []);
    const newStudents = students.filter(s => !existingStudentIds.has(s.id));

    if (newStudents.length === 0) {
      throw new Error('Все студенты группы уже имеют доступ');
    }

    // Create access records only for new students
    const accessRecords = newStudents.map(student => ({
      discipline_id: disciplineId,
      student_id: student.id,
    }));

    const { error } = await supabase
      .from('discipline_access')
      .insert(accessRecords);

    if (error) throw error;
  },

  async grantAccessToStudent(disciplineId: string, studentId: string) {
    const { error } = await supabase
      .from('discipline_access')
      .insert({
        discipline_id: disciplineId,
        student_id: studentId,
      });

    if (error) throw error;
  },

  async revokeAccess(disciplineId: string, studentId?: string, groupId?: string) {
    let query = supabase
      .from('discipline_access')
      .delete()
      .eq('discipline_id', disciplineId);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async getAccessList(disciplineId: string) {
    const { data, error } = await supabase
      .from('discipline_access')
      .select(`
        id,
        student_id,
        group_id,
        profiles:student_id (first_name, last_name, email),
        groups:group_id (name)
      `)
      .eq('discipline_id', disciplineId);

    if (error) throw error;
    return data;
  },
};
