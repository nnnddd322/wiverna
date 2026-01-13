import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Upload, Users, BarChart3, BookOpen, TrendingUp, Award, Settings } from 'lucide-react';
import { GroupManagementDialog } from './GroupManagementDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { StudentProgress } from '../data/mockData';

interface TeacherDashboardProps {
  studentProgress?: StudentProgress[];
  onBack?: () => void;
}

export function TeacherDashboard({ studentProgress: initialProgress, onBack }: TeacherDashboardProps = {}) {
  const { user, profile } = useAuth();
  
  // All hooks must be called unconditionally
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      loadDisciplines();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedDisciplineId) {
      loadProgress();
    }
  }, [selectedDisciplineId]);

  const loadDisciplines = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('teacher_id', user?.id);

      if (error) throw error;
      setDisciplines(data || []);
      
      // Auto-select first discipline if available
      if (data && data.length > 0 && !selectedDisciplineId) {
        setSelectedDisciplineId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading disciplines:', error);
      setDisciplines([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!selectedDisciplineId) return;
    
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Get all lectures for this discipline
      const { data: lectures, error: lecturesError } = await supabase
        .from('lectures')
        .select('id, title')
        .eq('discipline_id', selectedDisciplineId)
        .eq('status', 'published');

      if (lecturesError) throw lecturesError;
      const lectureIds = lectures?.map(l => l.id) || [];

      if (lectureIds.length === 0) {
        setStudentProgress([]);
        setLoading(false);
        return;
      }

      // Get students with access to this discipline (only individual students, not groups)
      const { data: accessData, error: accessError } = await supabase
        .from('discipline_access')
        .select(`
          student_id,
          profiles:student_id (
            id,
            first_name,
            last_name,
            email,
            group_id,
            groups:group_id (
              name
            )
          )
        `)
        .eq('discipline_id', selectedDisciplineId)
        .not('student_id', 'is', null);

      if (accessError) throw accessError;

      // Filter out entries where student profile doesn't exist (group access without students)
      const validAccess = accessData?.filter((a: any) => a.profiles && a.profiles.id) || [];
      
      // Get progress for all students
      const studentIds = validAccess.map((a: any) => a.student_id) || [];
      
      const progressPromises = studentIds.map(async (studentId: string) => {
        const { data: progress } = await supabase
          .from('student_progress')
          .select('*')
          .eq('student_id', studentId)
          .in('lecture_id', lectureIds);

        const student = validAccess.find((a: any) => a.student_id === studentId);
        const completedCount = progress?.filter(p => p.completed).length || 0;
        const totalCount = lectureIds.length;
        const scores = progress?.filter(p => p.score !== null).map(p => p.score) || [];
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const lastAccessed = progress?.reduce((latest: any, p: any) => {
          const pDate = new Date(p.last_accessed || 0);
          return pDate > new Date(latest || 0) ? p.last_accessed : latest;
        }, null);

        return {
          studentId,
          studentName: `${student?.profiles?.first_name || ''} ${student?.profiles?.last_name || ''}`.trim() || 'Неизвестно',
          email: student?.profiles?.email || '',
          groupName: student?.profiles?.groups?.name || 'Без группы',
          completedCount,
          totalCount,
          progressPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          averageScore: avgScore,
          lastAccessed: lastAccessed || null,
        };
      });

      const progressData = await Promise.all(progressPromises);
      setStudentProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
      setStudentProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = studentProgress.length;
  const totalMaterials = studentProgress[0]?.totalCount || 0;
  const completedMaterials = studentProgress.reduce((sum, s) => sum + s.completedCount, 0);
  const averageProgress = totalStudents > 0 
    ? Math.round(studentProgress.reduce((sum, s) => sum + s.progressPercentage, 0) / totalStudents)
    : 0;
  const averageScore = totalStudents > 0
    ? Math.round(studentProgress.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents)
    : 0;

  // Conditional rendering based on state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1>Панель преподавателя</h1>
              <p className="text-gray-600 mt-2">Управление контентом и статистика студентов</p>
            </div>
            <Button onClick={() => setIsGroupManagementOpen(true)} className="gap-2">
              <Settings className="w-4 h-4" />
              Управление группами
            </Button>
          </div>
          
          {disciplines.length > 0 && (
            <div className="mt-6 max-w-md">
              <Label htmlFor="discipline-select">Выберите дисциплину</Label>
              <Select value={selectedDisciplineId || ''} onValueChange={setSelectedDisciplineId}>
                <SelectTrigger id="discipline-select">
                  <SelectValue placeholder="Выберите дисциплину" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines.map((discipline) => (
                    <SelectItem key={discipline.id} value={discipline.id}>
                      {discipline.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {disciplines.length === 0 && (
            <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">У вас пока нет дисциплин. Создайте первую дисциплину, чтобы начать работу.</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Всего студентов</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">С доступом к дисциплине</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Средний прогресс</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageProgress}%</div>
              <p className="text-xs text-muted-foreground mt-1">Средний прогресс студентов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Средний балл</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">Средний балл по тестам</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Statistics */}
        <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Успеваемость студентов</CardTitle>
                <CardDescription>
                  {selectedDisciplineId 
                    ? 'Детальная статистика по каждому студенту' 
                    : 'Выберите дисциплину для просмотра статистики'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedDisciplineId ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Выберите дисциплину выше для просмотра статистики студентов</p>
                  </div>
                ) : studentProgress.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Пока нет студентов с доступом к этой дисциплине</p>
                    <p className="text-sm text-gray-400 mt-2">Предоставьте доступ студентам или группам на странице дисциплины</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Студент</TableHead>
                        <TableHead>Группа</TableHead>
                        <TableHead>Прогресс</TableHead>
                        <TableHead>Средний балл</TableHead>
                        <TableHead>Последнее посещение</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentProgress.map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.studentName}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{student.groupName}</TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium">{student.progressPercentage}%</div>
                              <div className="text-xs text-gray-500">
                                {student.completedCount} / {student.totalCount} материалов
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.averageScore > 0 ? (
                              <span className={`font-medium ${
                                student.averageScore >= 90 ? 'text-green-600' :
                                student.averageScore >= 75 ? 'text-blue-600' :
                                student.averageScore >= 60 ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {student.averageScore}%
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.lastAccessed ? (
                              <span className="text-sm text-gray-600">
                                {new Date(student.lastAccessed).toLocaleDateString('ru-RU')}
                              </span>
                            ) : (
                              <span className="text-gray-400">Не заходил</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Group Management Dialog */}
        <GroupManagementDialog 
          open={isGroupManagementOpen} 
          onOpenChange={setIsGroupManagementOpen} 
        />
      </div>
    </div>
  );
}