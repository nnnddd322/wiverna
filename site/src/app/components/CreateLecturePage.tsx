import { useState } from 'react';
import { ArrowLeft, ImagePlus, X, Save, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { lectureService } from '../../services/lectureService';
import { Alert, AlertDescription } from './ui/alert';

interface CreateLecturePageProps {
  disciplineId: string;
  disciplineTitle: string;
  lectureId?: string;
  onBack: () => void;
  onSave?: () => void;
}

export function CreateLecturePage({ disciplineId, disciplineTitle, lectureId, onBack, onSave }: CreateLecturePageProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (publish = false) => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Save as plain text, not JSON blocks
      const fullContent = content;

      if (lectureId) {
        await lectureService.updateLecture(lectureId, {
          title,
          content: fullContent,
          status: publish ? 'published' : 'draft'
        });
      } else {
        await lectureService.createLecture({
          discipline_id: disciplineId,
          title,
          type: 'article',
          content: fullContent,
          status: 'published', // Always publish by default
        });
      }

      setSuccess(true);
      if (onSave) onSave();
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      console.error('Error saving lecture:', err);
      setError('Не удалось сохранить лекцию');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
              <div>
                <h2 className="font-semibold text-gray-900">Создание текстовой лекции</h2>
                <p className="text-sm text-gray-500">{disciplineTitle}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleSubmit(false)}
                disabled={!title.trim() || !content.trim() || saving}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить черновик'}
              </Button>
              <Button 
                onClick={() => handleSubmit(true)}
                disabled={!title.trim() || !content.trim() || saving}
                className="gap-2"
                size="lg"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Публикация...' : 'Опубликовать'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Лекция успешно сохранена! Перенаправление...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-8 shadow-lg">
            <div className="grid gap-8">
              {/* Заголовок */}
              <div className="grid gap-3">
                <Label htmlFor="lecture-title" className="text-base font-semibold">
                  Заголовок лекции
                </Label>
                <Input
                  id="lecture-title"
                  placeholder="Например: Тема 1. Педагогика как наука"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Содержание */}
              <div className="grid gap-3">
                <Label htmlFor="lecture-content" className="text-base font-semibold">
                  Содержание лекции
                </Label>
                <Textarea
                  id="lecture-content"
                  placeholder="Введите текст лекции здесь...

Вы можете использовать разные абзацы, списки и форматирование.

Пример структуры:

1. Введение
   Здесь вводная информация о теме...

2. Основная часть
   Подробное описание темы...

3. Заключение
   Выводы и резюме..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="font-sans resize-none"
                />
                <p className="text-sm text-gray-500">
                  Используйте пустые строки для разделения абзацев
                </p>
              </div>

              {/* Изображения */}
              <div className="grid gap-3">
                <Label className="text-base font-semibold">
                  Изображения (необязательно)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Вставьте URL изображения"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddImage} 
                    variant="outline" 
                    className="gap-2 whitespace-nowrap"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Добавить
                  </Button>
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={img} 
                          alt={`Изображение ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border shadow-sm"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Ошибка+загрузки';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          Изображение {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Предпросмотр */}
              {(title || content) && (
                <div className="grid gap-3 border-t pt-8">
                  <Label className="text-base font-semibold">Предпросмотр</Label>
                  <div className="bg-gray-50 rounded-lg p-6">
                    {title && (
                      <h3 className="text-2xl font-bold mb-4 text-gray-900">{title}</h3>
                    )}
                    {content && (
                      <div className="prose prose-sm max-w-none">
                        {content.split('\n').map((paragraph, index) => (
                          paragraph.trim() ? (
                            <p key={index} className="mb-3 text-gray-700">{paragraph}</p>
                          ) : (
                            <br key={index} />
                          )
                        ))}
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {images.map((img, index) => (
                          <img 
                            key={index}
                            src={img} 
                            alt={`Изображение ${index + 1}`}
                            className="w-full rounded-lg shadow-md"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
