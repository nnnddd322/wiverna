import { useState, useEffect } from 'react';
import { Code2, Presentation, ArrowRight, Plus, Settings, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { disciplineService, Discipline } from '../../services/disciplineService';
import { CreateDisciplineDialog } from './CreateDisciplineDialog';
import { ManageAccessDialog } from './ManageAccessDialog';
import { Loader2 } from 'lucide-react';

interface DisciplinesPageProps {
  onSelectDiscipline: (disciplineId: string) => void;
}

export function DisciplinesPage({ onSelectDiscipline }: DisciplinesPageProps) {
  const { user, profile, isTeacher } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDisciplineForAccess, setSelectedDisciplineForAccess] = useState<{ id: string; title: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<Discipline | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDisciplines();
  }, [user, profile]);

  const loadDisciplines = async () => {
    if (!user || !profile) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await disciplineService.getMyDisciplines(user.id, profile.role);
      setDisciplines(data || []);
    } catch (error) {
      console.error('Error loading disciplines:', error);
      setDisciplines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDisciplineClick = (disciplineId: string, e: React.MouseEvent) => {
    onSelectDiscipline(disciplineId);
  };

  const handleDelete = async (disciplineId: string) => {
    setDeleting(true);
    try {
      await disciplineService.deleteDiscipline(disciplineId);
      await loadDisciplines();
      setDeleteDialogOpen(null);
    } catch (error) {
      console.error('Error deleting discipline:', error);
      alert('Не удалось удалить дисциплину');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = async (discipline: Discipline, updates: { title: string; description: string }) => {
    try {
      await disciplineService.updateDiscipline(discipline.id, updates);
      await loadDisciplines();
      setEditDialogOpen(null);
    } catch (error) {
      console.error('Error updating discipline:', error);
      alert('Не удалось обновить дисциплину');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" />
          <p className="text-gray-600">Загрузка дисциплин...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="text-center mb-12">
          <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Дисциплины
          </h1>
          <p className="text-gray-600 mt-3 text-lg">Выберите категорию для изучения</p>
        </div>

        {isTeacher && (
          <div className="flex justify-end mb-8 max-w-5xl mx-auto">
            <Button 
              className="gap-2 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Добавить дисциплину
            </Button>
          </div>
        )}

        {disciplines.length === 0 && !loading && (
          <div className="text-center py-12 max-w-5xl mx-auto">
            <p className="text-gray-600 mb-4">
              {isTeacher ? 'У вас пока нет дисциплин. Создайте первую!' : 'У вас пока нет доступных дисциплин'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {disciplines.map((discipline, index) => (
            <Card 
              key={discipline.id}
              className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg group overflow-hidden"
              onClick={(e) => handleDisciplineClick(discipline.id, e)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg">
                    {discipline.icon === 'code' ? (
                      <Code2 className="w-8 h-8 text-white" />
                    ) : (
                      <Presentation className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                  {discipline.title}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {discipline.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex gap-3 flex-wrap items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      {discipline.icon || '📚'}
                    </Badge>
                  </div>
                  {isTeacher && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditDialogOpen(discipline);
                        }}
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDisciplineForAccess({ id: discipline.id, title: discipline.title });
                        }}
                        title="Управление доступом"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialogOpen(discipline.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {disciplines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {isTeacher ? 'У вас пока нет дисциплин. Создайте первую!' : 'У вас пока нет доступных дисциплин'}
            </p>
          </div>
        )}
      </div>

      {user && (
        <>
          <CreateDisciplineDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            teacherId={user.id}
            onSuccess={loadDisciplines}
          />

          {selectedDisciplineForAccess && (
            <ManageAccessDialog
              open={!!selectedDisciplineForAccess}
              onOpenChange={(open) => !open && setSelectedDisciplineForAccess(null)}
              disciplineId={selectedDisciplineForAccess.id}
              disciplineTitle={selectedDisciplineForAccess.title}
            />
          )}
        </>
      )}

      {editDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Редактирование дисциплины</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEdit(editDialogOpen, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
              });
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
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  name="description"
                  defaultValue={editDialogOpen.description}
                  className="w-full border rounded px-3 py-2 h-32"
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
              Вы уверены, что хотите удалить эту дисциплину? Это действие нельзя отменить.
              Все лекции и материалы будут удалены.
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
