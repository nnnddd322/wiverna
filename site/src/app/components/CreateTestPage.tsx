import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Save, Trash2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { testService, Question } from '../../services/testService';
import { lectureService } from '../../services/lectureService';
import { Alert, AlertDescription } from './ui/alert';

interface CreateTestPageProps {
  disciplineId: string;
  disciplineTitle: string;
  lectureId?: string;
  onBack: () => void;
  onSave?: () => void;
}

export function CreateTestPage({ disciplineId, disciplineTitle, lectureId, onBack, onSave }: CreateTestPageProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testLectureId, setTestLectureId] = useState<string | null>(lectureId || null);

  useEffect(() => {
    if (!lectureId) {
      addQuestion();
    }
  }, []);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      options: ['', ''],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, question: text } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
  };

  const updateOptionText = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = text;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const setCorrectAnswer = (questionId: string, answerIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, correctAnswer: answerIndex };
      }
      return q;
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let currentLectureId = testLectureId;

      if (!currentLectureId) {
        const lecture = await lectureService.createLecture({
          discipline_id: disciplineId,
          title: title,
          type: 'test',
        });
        currentLectureId = lecture.id;
        setTestLectureId(currentLectureId);
      }

      const existingTest = await testService.getTestByLectureId(currentLectureId);

      if (existingTest) {
        await testService.updateTest(existingTest.id, questions);
      } else {
        await testService.createTest(currentLectureId, questions);
      }

      await lectureService.publishLecture(currentLectureId);

      setSuccess(true);
      if (onSave) onSave();
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      console.error('Error saving test:', err);
      setError('Не удалось сохранить тест');
    } finally {
      setSaving(false);
    }
  };

  const isValid = title.trim() && questions.length > 0 && questions.every(q => 
    q.question.trim() && 
    q.options.every(opt => opt.trim()) &&
    q.correctAnswer >= 0 && q.correctAnswer < q.options.length
  );

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
                <h2 className="font-semibold text-gray-900">Создание теста</h2>
                <p className="text-sm text-gray-500">{disciplineTitle}</p>
              </div>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!isValid || saving}
              className="gap-2"
              size="lg"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить и опубликовать'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Тест успешно сохранен! Перенаправление...
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
          {/* Название теста */}
          <Card className="p-6 shadow-lg mb-6">
            <div className="grid gap-3">
              <Label htmlFor="test-title" className="text-base font-semibold">
                Название теста
              </Label>
              <Input
                id="test-title"
                placeholder="Например: Тест по теме 'Педагогика как наука'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
              />
            </div>
          </Card>

          {/* Вопросы */}
          <div className="space-y-6">
            {questions.map((question, qIndex) => (
              <Card key={question.id} className="p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">Вопрос {qIndex + 1}</h3>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-6">
                  {/* Текст вопроса */}
                  <div className="grid gap-2">
                    <Label>Текст вопроса</Label>
                    <Input
                      placeholder="Введите текст вопроса..."
                      value={question.question}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                    />
                  </div>


                  {/* Варианты ответов */}
                  <div className="grid gap-3">
                    <Label>Варианты ответов (выберите правильный)</Label>
                    <RadioGroup
                      value={question.correctAnswer.toString()}
                      onValueChange={(value) => setCorrectAnswer(question.id, parseInt(value))}
                    >
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                          <Input
                            placeholder={`Вариант ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOptionText(question.id, oIndex, e.target.value)}
                            className="flex-1"
                          />
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(question.id, oIndex)}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      className="gap-2 w-fit"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить вариант
                    </Button>
                    <p className="text-xs text-gray-500">
                      Отметьте правильный ответ с помощью переключателя
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Добавить вопрос */}
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={addQuestion}
              className="gap-2 w-full border-dashed border-2 py-6"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              Добавить вопрос
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
