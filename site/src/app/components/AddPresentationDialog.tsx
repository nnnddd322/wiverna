import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, FileCheck } from 'lucide-react';

interface AddPresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (presentation: { title: string; fileName: string }) => void;
}

export function AddPresentationDialog({ open, onOpenChange, onAdd }: AddPresentationDialogProps) {
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!title) {
        // Автоматически установить заголовок из имени файла
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = () => {
    if (title.trim() && fileName) {
      onAdd({ title, fileName });
      // Сброс формы
      setTitle('');
      setFileName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Загрузка презентации</DialogTitle>
          <DialogDescription>
            Загрузите файл презентации в формате PPTX
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="presentation-title">Название презентации</Label>
            <Input
              id="presentation-title"
              placeholder="Например: Тема 2. Педагогическая система"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file-upload">Файл презентации</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                id="file-upload"
                type="file"
                accept=".pptx,.ppt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {fileName ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileCheck className="w-6 h-6" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="w-10 h-10" />
                    <span className="font-medium">Нажмите для выбора файла</span>
                    <span className="text-sm">или перетащите файл сюда</span>
                    <span className="text-xs mt-2">Поддерживаемые форматы: .pptx, .ppt</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {fileName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Примечание:</strong> После загрузки презентация будет автоматически конвертирована в слайды для просмотра.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !fileName}>
            Загрузить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
