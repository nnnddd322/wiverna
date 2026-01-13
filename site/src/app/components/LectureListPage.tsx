import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Presentation, Clock, ArrowRight, Plus, Upload, FileEdit, ClipboardList, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { lectureService } from '../../services/lectureService';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

type Lecture = Database['public']['Tables']['lectures']['Row'];

interface LectureListPageProps {
  disciplineId: string;
  disciplineTitle: string;
  onBack: () => void;
  onSelectLecture: (lectureId: string) => void;
  onCreateLecture: () => void;
  onCreateTest: () => void;
}

export function LectureListPage({ 
  disciplineId,
  disciplineTitle, 
  onBack, 
  onSelectLecture,
  onCreateLecture,
  onCreateTest
}: LectureListPageProps) {
  const { isTeacher } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<Lecture | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadLectures();
  }, [disciplineId]);

  const loadLectures = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await lectureService.getLecturesByDiscipline(disciplineId, isTeacher);
      setLectures(data || []);
    } catch (err) {
      console.error('Error loading lectures:', err);
      setError('Не удалось загрузить материалы');
      setLectures([]);
    } finally {
      setLoading(false);
    }
  };

  const presentations = lectures.filter(l => l.type === 'presentation');
  const textLectures = lectures.filter(l => l.type === 'article');
  // Tests are NOT lectures - they should not appear here
  const tests = lectures.filter(l => l.type === 'test');

  const handleCreatePresentation = async () => {
    try {
      await lectureService.createLecture({
        discipline_id: disciplineId,
        title: 'Новая презентация',
        type: 'presentation',
      });
      await loadLectures();
    } catch (err) {
      console.error('Error creating presentation:', err);
    }
  };

  const handleDelete = async (lectureId: string) => {
    setDeleting(true);
    try {
      await lectureService.deleteLecture(lectureId);
      await loadLectures();
      setDeleteDialogOpen(null);
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert('Не удалось удалить лекцию');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = async (lecture: Lecture, title: string) => {
    try {
      await lectureService.updateLecture(lecture.id, { title });
      await loadLectures();
      setEditDialogOpen(null);
    } catch (error) {
      console.error('Error updating lecture:', error);
      alert('Не удалось обновить лекцию');
    }
  };

  const renderLectureCard = (lecture: Lecture, index: number) => (
    <Card 
      key={lecture.id}
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md group overflow-hidden"
      onClick={() => onSelectLecture(lecture.id)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 ${
            lecture.type === 'presentation' 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' 
              : lecture.type === 'test'
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            {lecture.type === 'presentation' ? (
              <Presentation className="w-6 h-6 text-white" />
            ) : lecture.type === 'test' ? (
              <ClipboardList className="w-6 h-6 text-white" />
            ) : (
              <FileText className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors flex-1">
                {lecture.title}
              </CardTitle>
              <div className="flex items-center gap-1">
                {isTeacher && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDialogOpen(lecture);
                      }}
                      className="h-8 w-8 p-0"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialogOpen(lecture.id);
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
            <CardDescription className="mt-2 flex items-center gap-4 flex-wrap">
              {lecture.type === 'presentation' && (
                <span className="text-sm flex items-center gap-1">
                  <Presentation className="w-3 h-3" />
                  Презентация
                </span>
              )}
              {lecture.type === 'test' && (
                <span className="text-sm flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />
                  Тест
                </span>
              )}
              {lecture.type === 'article' && (
                <span className="text-sm">Текстовая лекция</span>
              )}
              {isTeacher && lecture.status === 'draft' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Черновик</span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к дисциплинам
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            {disciplineTitle}
          </h1>
          <p className="text-gray-600 mt-3 text-lg">Выберите материал для изучения</p>
        </div>

        {isTeacher && (
          <div className="flex justify-end mb-6 max-w-4xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 shadow-lg">
                  <Plus className="w-4 h-4" />
                  Добавить материал
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleCreatePresentation}>
                  <Upload className="w-4 h-4 mr-2" />
                  Создать презентацию
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateLecture}>
                  <FileEdit className="w-4 h-4 mr-2" />
                  Создать текстовую лекцию
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateTest}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Создать тест
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Загрузка материалов...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 bg-red-50 rounded-xl">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadLectures}>
              Попробовать снова
            </Button>
          </div>
        )}

        {!loading && !error && lectures.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm max-w-4xl">
            <div className="space-y-4">
              <p className="text-gray-500">В этой дисциплине пока нет материалов</p>
              {isTeacher && (
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCreatePresentation}>
                    Создать презентацию
                  </Button>
                  <Button variant="outline" onClick={onCreateLecture}>
                    Создать лекцию
                  </Button>
                  <Button variant="outline" onClick={onCreateTest}>
                    Создать тест
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !error && lectures.length > 0 && (
          <Tabs defaultValue="presentations" className="max-w-4xl">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
            <TabsTrigger value="presentations" className="gap-2">
              <Presentation className="w-4 h-4" />
              Презентации
            </TabsTrigger>
            <TabsTrigger value="lectures" className="gap-2">
              <FileText className="w-4 h-4" />
              Лекции
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Тесты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presentations" className="grid gap-6">
            {presentations.length > 0 ? (
              presentations.map((lecture, index) => renderLectureCard(lecture, index))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Presentation className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Презентации пока не добавлены</p>
                {isTeacher && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleCreatePresentation}
                  >
                    Добавить первую презентацию
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lectures" className="grid gap-6">
            {textLectures.length > 0 ? (
              textLectures.map((lecture, index) => renderLectureCard(lecture, index))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Лекции пока не добавлены</p>
                {isTeacher && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={onCreateLecture}
                  >
                    Добавить первую лекцию
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="grid gap-6">
            {tests.length > 0 ? (
              tests.map((lecture, index) => renderLectureCard(lecture, index))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Тесты пока не добавлены</p>
                {isTeacher && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={onCreateTest}
                  >
                    Добавить первый тест
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>

      {editDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Редактирование лекции</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEdit(editDialogOpen, formData.get('title') as string);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Название</label>
                <input
                  name="title"
                  type="text"
                  defaultValue={editDialogOpen.title}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(null)}>
                  Отмена
                </Button>
                <Button type="submit">
                  Сохранить
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-2">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-4">
              Вы уверены, что хотите удалить эту лекцию? Это действие нельзя отменить.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(null)} disabled={deleting}>
                Отмена
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteDialogOpen)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}