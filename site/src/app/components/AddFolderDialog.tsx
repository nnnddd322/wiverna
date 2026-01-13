import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface AddFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (folder: { title: string; description: string }) => void;
}

export function AddFolderDialog({ open, onOpenChange, onAdd }: AddFolderDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd({ title, description });
      // Сброс формы
      setTitle('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создание папки</DialogTitle>
          <DialogDescription>
            Создайте новую папку для группировки материалов
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="folder-title">Название папки</Label>
            <Input
              id="folder-title"
              placeholder="Например: Модуль 1. Основы педагогики"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="folder-description">Описание (необязательно)</Label>
            <Textarea
              id="folder-description"
              placeholder="Краткое описание содержимого папки..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Создать папку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
