import { ArrowLeft, Download, CheckCircle, Loader2, AlertCircle, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './ui/button';
import jsPDF from 'jspdf';

interface LectureReaderProps {
  title: string;
  content: string;
  lectureId?: string;
  onBack: () => void;
}

export function LectureReader({ title, content, lectureId, onBack }: LectureReaderProps) {
  const { user, profile } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && lectureId) {
      loadProgress();
    } else {
      setLoadingProgress(false);
    }
  }, [user, lectureId]);

  const loadProgress = async () => {
    if (!user || !lectureId) return;
    
    setLoadingProgress(true);
    try {
      const { progressService } = await import('../../services/progressService');
      const progress = await progressService.getStudentProgress(user.id, lectureId);
      
      if (progress) {
        setIsCompleted(progress.completed || false);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoadingProgress(false);
    }
  };
  // Parse content if it's JSON
  const parseContent = (rawContent: string): string => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        // If it's an array of blocks, extract text
        return parsed
          .map((block: any) => {
            if (block.type === 'heading') return `# ${block.content}`;
            if (block.type === 'paragraph') return block.content;
            return '';
          })
          .filter(Boolean)
          .join('\n\n');
      }
      return rawContent;
    } catch {
      // If not JSON, return as is
      return rawContent;
    }
  };

  const cleanContent = parseContent(content);

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="mb-6">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="mb-4 mt-8">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="mb-3 mt-6">{line.substring(4)}</h3>;
      } else if (line.match(/^\d+\.\s/)) {
        return <li key={index} className="ml-6 mb-2">{line}</li>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 mb-2 list-disc">{line.substring(2)}</li>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={index} className="block mb-2">{line.slice(2, -2)}</strong>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-4 break-words">{line}</p>;
      }
    });
  };

  const handleMarkComplete = async () => {
    if (!user || !lectureId) return;
    
    setIsMarkingComplete(true);
    setError(null);
    try {
      const { progressService } = await import('../../services/progressService');
      await progressService.markLectureCompleted(user.id, lectureId);
      setIsCompleted(true);
    } catch (err) {
      console.error('Error marking lecture as complete:', err);
      setError('Не удалось сохранить прогресс. Попробуйте еще раз.');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleSaveContent = async () => {
    if (!lectureId) return;
    
    setSaving(true);
    setError(null);
    try {
      const { lectureService } = await import('../../services/lectureService');
      await lectureService.updateLecture(lectureId, { content: editedContent });
      setEditMode(false);
      window.location.reload(); // Reload to show updated content
    } catch (err) {
      console.error('Error saving lecture content:', err);
      setError('Не удалось сохранить изменения. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 20, 20);
      
      // Add content
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(cleanContent, 170);
      doc.text(lines, 20, 35);
      
      // Save PDF
      doc.save(`${title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download
      const fullContent = `${title}\n\n${cleanContent}`;
      const blob = new Blob([fullContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          <div className="flex gap-2">
            {lectureId && user && profile?.role === 'teacher' && (
              <Button 
                variant="outline"
                onClick={() => setEditMode(!editMode)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                {editMode ? 'Отменить' : 'Редактировать'}
              </Button>
            )}
            {lectureId && user && profile?.role !== 'teacher' && (
              <>
                {loadingProgress ? (
                  <Button variant="outline" disabled className="gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Загрузка...
                  </Button>
                ) : (
                  <Button 
                    variant={isCompleted ? "default" : "outline"}
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete || isCompleted}
                    className="gap-2"
                  >
                    {isMarkingComplete ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {isCompleted ? '✓ Пройдено' : 'Отметить как пройдено'}
                  </Button>
                )}
              </>
            )}
            <Button 
              variant="outline" 
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать лекцию
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Ошибка</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="mb-8">{title}</h1>
          {editMode ? (
            <div className="space-y-4">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full border rounded px-4 py-3 h-96 font-mono text-sm"
                placeholder="Введите содержимое лекции..."
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditMode(false);
                    setEditedContent(content);
                  }}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleSaveContent}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              {renderContent(cleanContent)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}