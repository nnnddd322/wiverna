import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, Award, AlertCircle, Loader2, Edit } from 'lucide-react';
import { TestEditor } from './TestEditor';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface TestData {
  id: string;
  lecture_id: string;
  questions: Question[];
  created_at?: string;
  updated_at?: string;
}

interface TestPageProps {
  test: TestData;
  lectureId?: string;
  onBack: () => void;
}

export function TestPage({ test, lectureId, onBack }: TestPageProps) {
  const { user, profile } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const isTeacher = profile?.role === 'teacher';
  const questions = Array.isArray(test.questions) ? test.questions : [];

  const handleSaveTest = async (updatedQuestions: Question[]) => {
    const { testService } = await import('../../services/testService');
    await testService.updateTest(test.id, updatedQuestions);
    window.location.reload();
  };

  if (editMode && isTeacher) {
    return (
      <TestEditor
        testId={test.id}
        lectureId={test.lecture_id}
        initialQuestions={questions}
        onBack={() => setEditMode(false)}
        onSave={handleSaveTest}
      />
    );
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    const score = calculateScore();
    
    // Save test result to progress
    if (user && lectureId) {
      setIsSaving(true);
      setSaveError(null);
      try {
        const { progressService } = await import('../../services/progressService');
        await progressService.saveTestResult(user.id, lectureId, score);
      } catch (error) {
        console.error('Error saving test result:', error);
        setSaveError('Не удалось сохранить результат. Попробуйте позже.');
      } finally {
        setIsSaving(false);
      }
    }
    
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600 mb-4">В этом тесте пока нет вопросов</p>
            <div className="flex gap-2">
              <Button onClick={onBack}>Назад</Button>
              {isTeacher && (
                <Button onClick={() => setEditMode(true)} variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Редактировать тест
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="min-h-[calc(100vh-73px)] bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-indigo-100 rounded-full p-4">
                    <Award className="w-12 h-12 text-indigo-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Тест завершен!</CardTitle>
                <CardDescription className="text-center">
                  {saveError ? 'Результаты не сохранены' : 'Ваши результаты сохранены'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {saveError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-800 font-medium">Предупреждение</p>
                      <p className="text-yellow-700 text-sm">{saveError}</p>
                    </div>
                  </div>
                )}
                
                <div className="text-center py-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                  <div className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                    {score}%
                  </div>
                  <p className="text-lg text-gray-700 font-medium">
                    Правильных ответов: {Object.values(answers).filter((answer, index) => 
                      answer === questions[index].correctAnswer
                    ).length} из {questions.length}
                  </p>
                  <div className="mt-4 max-w-xs mx-auto">
                    <Progress value={score} className="h-3" />
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const userAnswer = answers[question.id];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div 
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          isCorrect 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium mb-2">{question.question}</p>
                            <p className="text-sm text-gray-600">
                              Ваш ответ: {question.options[userAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-600 mt-1">
                                Правильный ответ: {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={onBack} size="lg" className="w-full">
                    Вернуться к материалам
                  </Button>
                  <Button 
                    onClick={() => {
                      setAnswers({});
                      setCurrentQuestion(0);
                      setShowResults(false);
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Пройти еще раз
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const selectedAnswer = answers[question.id];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          {isTeacher && (
            <Button 
              variant="outline" 
              onClick={() => setEditMode(true)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Редактировать тест
            </Button>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Тест</CardTitle>
                  <span className="text-sm text-gray-500">
                    Вопрос {currentQuestion + 1} из {questions.length}
                  </span>
                </div>
                <div className="space-y-2">
                  <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}% завершено
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-4">{question.question}</h3>
                
                <RadioGroup
                  value={selectedAnswer !== undefined ? selectedAnswer.toString() : undefined}
                  onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                >
                  {question.options.map((option, index) => (
                    <div key={`${question.id}-option-${index}`} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={index.toString()} id={`${question.id}-option-${index}`} />
                      <Label htmlFor={`${question.id}-option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="text-sm text-gray-500 text-center">
                  Отвечено: {Object.keys(answers).length} / {test.questions.length}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="flex-1"
                  >
                    Назад
                  </Button>

                  {currentQuestion < test.questions.length - 1 ? (
                    <Button 
                      onClick={handleNext}
                      disabled={selectedAnswer === undefined}
                      className="flex-1"
                    >
                      Далее
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit}
                      disabled={Object.keys(answers).length !== test.questions.length || isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Сохранение...
                        </>
                      ) : (
                        'Завершить тест'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
