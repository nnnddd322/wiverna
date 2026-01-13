import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Loader2, Plus, Edit, Trash2, Users } from 'lucide-react';
import { groupService, Group } from '../../services/groupService';

interface GroupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupManagementDialog({ open, onOpenChange }: GroupManagementDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadGroups();
    }
  }, [open]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await groupService.getAllGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки групп');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Введите название группы');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await groupService.createGroup(newGroupName.trim());
      setNewGroupName('');
      await loadGroups();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания группы');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editName.trim()) {
      setError('Введите название группы');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await groupService.updateGroup(editingGroup.id, editName.trim());
      setEditingGroup(null);
      setEditName('');
      await loadGroups();
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления группы');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Удалить группу "${group.name}"? Это действие нельзя отменить.`)) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await groupService.deleteGroup(group.id);
      await loadGroups();
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления группы');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setError('');
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setEditName('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Управление группами
          </DialogTitle>
          <DialogDescription>
            Создавайте и управляйте группами студентов
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create New Group */}
        <div className="space-y-2">
          <Label>Создать новую группу</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Название группы (например, ТМ-22)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              disabled={loading}
            />
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-2">
          <Label>Существующие группы ({groups.length})</Label>
          <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="p-4 text-center text-gray-500">Нет созданных групп</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="p-3">
                  {editingGroup?.id === group.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateGroup()}
                        disabled={loading}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateGroup} disabled={loading}>
                        Сохранить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={loading}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-xs text-gray-500">
                          Создана: {new Date(group.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(group)}
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGroup(group)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
