import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Loader2, Search, Trash2, Users, User } from 'lucide-react';
import { disciplineService } from '../../services/disciplineService';
import { groupService, Group } from '../../services/groupService';
import { studentService, Student } from '../../services/studentService';

interface ManageAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disciplineId: string;
  disciplineTitle: string;
}

export function ManageAccessDialog({ open, onOpenChange, disciplineId, disciplineTitle }: ManageAccessDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [accessList, setAccessList] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      loadGroups();
      loadAccessList();
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      const data = await groupService.getAllGroups();
      setGroups(data);
    } catch (err: any) {
      console.error('Error loading groups:', err);
    }
  };

  const loadAccessList = async () => {
    try {
      const data = await disciplineService.getAccessList(disciplineId);
      setAccessList(data);
    } catch (err: any) {
      console.error('Error loading access list:', err);
    }
  };

  const handleGrantGroupAccess = async () => {
    if (!selectedGroupId) return;

    setError('');
    setLoading(true);

    try {
      await disciplineService.grantAccessToGroup(disciplineId, selectedGroupId);
      setSelectedGroupId('');
      await loadAccessList();
    } catch (err: any) {
      setError(err.message || 'Ошибка при выдаче доступа группе');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudents = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await studentService.searchStudents(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Ошибка поиска студентов');
    } finally {
      setSearching(false);
    }
  };

  const handleGrantStudentAccess = async (studentId: string) => {
    setError('');
    setLoading(true);

    try {
      await disciplineService.grantAccessToStudent(disciplineId, studentId);
      setSearchQuery('');
      setSearchResults([]);
      await loadAccessList();
    } catch (err: any) {
      setError(err.message || 'Ошибка при выдаче доступа студенту');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (accessId: string, studentId?: string, groupId?: string) => {
    setError('');
    setLoading(true);

    try {
      await disciplineService.revokeAccess(disciplineId, studentId, groupId);
      await loadAccessList();
    } catch (err: any) {
      setError(err.message || 'Ошибка при отзыве доступа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление доступом</DialogTitle>
          <DialogDescription>
            Дисциплина: {disciplineTitle}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="group" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="group">
              <Users className="w-4 h-4 mr-2" />
              По группам
            </TabsTrigger>
            <TabsTrigger value="student">
              <User className="w-4 h-4 mr-2" />
              По студентам
            </TabsTrigger>
          </TabsList>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label>Выберите группу</Label>
              <div className="flex gap-2">
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={loading}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleGrantGroupAccess} disabled={!selectedGroupId || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Выдать доступ'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="student" className="space-y-4">
            <div className="space-y-2">
              <Label>Поиск студента</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите ФИО или email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchStudents()}
                  disabled={searching}
                />
                <Button onClick={handleSearchStudents} disabled={!searchQuery.trim() || searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Результаты поиска</Label>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((student) => (
                    <div key={student.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleGrantStudentAccess(student.id)}
                        disabled={loading}
                      >
                        Выдать доступ
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Tabs defaultValue="group" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="group">
              <Users className="w-4 h-4 mr-2" />
              Текущие доступы групп
            </TabsTrigger>
            <TabsTrigger value="student">
              <User className="w-4 h-4 mr-2" />
              Текущие доступы студентов
            </TabsTrigger>
          </TabsList>

          <TabsContent value="group">
            <div className="space-y-2">
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {(() => {
                  // Group students by group_id, exclude students without group
                  const groupedStudents = accessList
                    .filter(a => a.student_id && a.profiles && a.profiles.groups?.name)
                    .reduce((acc: any, access) => {
                      const groupName = access.profiles.groups.name;
                      if (!acc[groupName]) {
                        acc[groupName] = [];
                      }
                      acc[groupName].push(access);
                      return acc;
                    }, {});

                  const groupEntries = Object.entries(groupedStudents);

                  if (groupEntries.length === 0) {
                    return <p className="p-4 text-center text-gray-500">Доступы группам не выданы</p>;
                  }

                  return groupEntries.map(([groupName, students]: [string, any]) => (
                    <div key={groupName} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{groupName}</span>
                          <span className="text-xs text-gray-500">({students.length} студ.)</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="student">
            <div className="space-y-2">
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {accessList.filter(a => a.student_id && a.profiles).length === 0 ? (
                  <p className="p-4 text-center text-gray-500">Доступы студентам не выданы</p>
                ) : (
                  accessList
                    .filter(a => a.student_id && a.profiles)
                    .map((access) => (
                      <div key={access.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium">
                              {access.profiles?.first_name} {access.profiles?.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{access.profiles?.groups?.name || 'Без группы'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevokeAccess(access.id, access.student_id, undefined)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
