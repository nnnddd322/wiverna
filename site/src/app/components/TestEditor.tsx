import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface TestEditorProps {
  testId: string;
  lectureId: string;
  initialQuestions: Question[];
  onBack: () => void;
  onSave: (questions: Question[]) => Promise<void>;
}

export function TestEditor({ testId, lectureId, initialQuestions, onBack, onSave }: TestEditorProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      explanation: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Тест должен содержать хотя бы один вопрос');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length <= 2) {
      alert('Вопрос должен содержать минимум 2 варианта ответа');
      return;
    }
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    // Adjust correctAnswer if needed
    if (updated[questionIndex].correctAnswer >= updated[questionIndex].options.length) {
      updated[questionIndex].correctAnswer = updated[questionIndex].options.length - 1;
    }
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Вопрос ${i + 1}: текст вопроса не может быть пустым`);
        return;
      }
      if (q.options.length < 2) {
        setError(`Вопрос ${i + 1}: должно быть минимум 2 варианта ответа`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Вопрос ${i + 1}, вариант ${j + 1}: текст не может быть пустым`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(questions);
    } catch (err) {
      console.error('Error saving test:', err);
      setError('Не удалось сохранить тест. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>

          <div className="flex gap-2">
            <Button 
              onClick={addQuestion}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить вопрос
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить тест
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Вопрос {qIndex + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium mb-2">Текст вопроса</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full border rounded px-3 py-2 h-24"
                    placeholder="Введите текст вопроса..."
                  />
                </div>

                {/* Options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Варианты ответа</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Добавить вариант
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex gap-2 items-center">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className="flex-shrink-0"
                          title="Правильный ответ"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className="flex-1 border rounded px-3 py-2"
                          placeholder={`Вариант ${oIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          disabled={question.options.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Отметьте радиокнопку слева, чтобы указать правильный ответ
                  </p>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Объяснение (опционально)
                  </label>
                  <textarea
                    value={question.explanation || ''}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    className="w-full border rounded px-3 py-2 h-20"
                    placeholder="Объяснение правильного ответа..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">Нет вопросов в тесте</p>
            <Button onClick={addQuestion} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить первый вопрос
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
