import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DisciplinesPage } from './components/DisciplinesPage';
import { LectureListPage } from './components/LectureListPage';
import { PresentationViewer } from './components/PresentationViewer';
import { LectureReader } from './components/LectureReader';
import { TestListPage } from './components/TestListPage';
import { TestPage } from './components/TestPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { CreateLecturePage } from './components/CreateLecturePage';
import { CreateTestPage } from './components/CreateTestPage';

type Page = 'home' | 'login' | 'register' | 'disciplines' | 'lecture-list' | 'lecture-view' | 'tests' | 'test-view' | 'teacher-dashboard' | 'create-lecture' | 'create-test';

export default function App() {
  const { user, profile, isTeacher, isAdmin, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    if (page !== 'home' && page !== 'login' && page !== 'register' && !user) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page as Page);
    if (page === 'home') {
      setSelectedDisciplineId(null);
      setSelectedLectureId(null);
      setSelectedTestId(null);
    }
  };

  const handleRequireAuth = () => {
    setCurrentPage('login');
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('home');
  };

  const handleSelectDiscipline = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId);
    setCurrentPage('lecture-list');
  };

  const handleSelectLecture = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setCurrentPage('lecture-view');
  };

  const handleSelectTest = (testId: string) => {
    setSelectedTestId(testId);
    setCurrentPage('test-view');
  };

  const handleBackFromLectureList = () => {
    setCurrentPage('disciplines');
    setSelectedDisciplineId(null);
  };

  const handleBackFromLectureView = () => {
    // If we have a selected discipline, go back to lecture list
    // Otherwise go back to tests page
    if (selectedDisciplineId) {
      setCurrentPage('lecture-list');
    } else {
      setCurrentPage('tests');
    }
    setSelectedLectureId(null);
  };

  const handleBackFromTestView = () => {
    // If we came from tests page, go back to tests
    // Otherwise go back to lecture list
    if (selectedDisciplineId) {
      setCurrentPage('lecture-list');
    } else {
      setCurrentPage('tests');
    }
    setSelectedTestId(null);
  };

  const handleCreateLecture = () => {
    setCurrentPage('create-lecture');
  };

  const handleCreateTest = () => {
    setCurrentPage('create-test');
  };


  return (
    <div className="min-h-screen bg-white">
      {currentPage === 'login' && (
        <LoginPage
          onSwitchToRegister={() => setCurrentPage('register')}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage
          onSwitchToLogin={() => setCurrentPage('login')}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'lecture-view' && currentPage !== 'test-view' && currentPage !== 'create-lecture' && currentPage !== 'create-test' && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isTeacher={isTeacher}
          userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Гость'}
          onLogout={handleLogout}
          isAuthenticated={!!user}
        />
      )}

      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} isAuthenticated={!!user} />}

      {currentPage === 'disciplines' && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <DisciplinesPage
            onSelectDiscipline={handleSelectDiscipline}
          />
        </ProtectedRoute>
      )}

      {currentPage === 'lecture-list' && selectedDisciplineId && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <LectureListPage
            disciplineId={selectedDisciplineId}
            disciplineTitle="Дисциплина"
            onBack={handleBackFromLectureList}
            onSelectLecture={handleSelectLecture}
            onCreateLecture={handleCreateLecture}
            onCreateTest={handleCreateTest}
          />
        </ProtectedRoute>
      )}


      {currentPage === 'create-lecture' && selectedDisciplineId && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <CreateLecturePage
            disciplineId={selectedDisciplineId}
            disciplineTitle="Дисциплина"
            onBack={() => setCurrentPage('lecture-list')}
            onSave={() => setCurrentPage('lecture-list')}
          />
        </ProtectedRoute>
      )}

      {currentPage === 'create-test' && selectedDisciplineId && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <CreateTestPage
            disciplineId={selectedDisciplineId}
            disciplineTitle="Дисциплина"
            onBack={() => setCurrentPage('lecture-list')}
            onSave={() => setCurrentPage('lecture-list')}
          />
        </ProtectedRoute>
      )}

      {currentPage === 'tests' && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <TestsPageWrapper
            onSelectTest={(lectureId) => {
              setSelectedLectureId(lectureId);
              setCurrentPage('lecture-view');
            }}
          />
        </ProtectedRoute>
      )}

      {currentPage === 'teacher-dashboard' && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <TeacherDashboard />
        </ProtectedRoute>
      )}

      {currentPage === 'lecture-view' && selectedLectureId && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <LectureViewWrapper
            lectureId={selectedLectureId}
            onBack={handleBackFromLectureView}
            onSelectTest={handleSelectTest}
          />
        </ProtectedRoute>
      )}

      {currentPage === 'test-view' && selectedTestId && (
        <ProtectedRoute onRequireAuth={handleRequireAuth}>
          <TestViewWrapper
            testId={selectedTestId}
            onBack={handleBackFromTestView}
          />
        </ProtectedRoute>
      )}
    </div>
  );
}

// Wrapper component for tests page that loads all tests
function TestsPageWrapper({ onSelectTest }: { onSelectTest: (lectureId: string) => void }) {
  const { user, profile } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, [user]);

  const loadTests = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      
      // Get all lectures of type 'test' that the student has access to
      const { data: lectures, error: lecturesError } = await supabase
        .from('lectures')
        .select(`
          id,
          title,
          discipline_id,
          disciplines:discipline_id (
            id,
            title
          )
        `)
        .eq('type', 'test')
        .eq('status', 'published');

      if (lecturesError) throw lecturesError;

      // For each lecture, get the test data
      const testsData = await Promise.all(
        (lectures || []).map(async (lecture: any) => {
          const { data: test } = await supabase
            .from('tests')
            .select('*')
            .eq('lecture_id', lecture.id)
            .single();

          return {
            id: test?.id || lecture.id,
            lectureId: lecture.id,
            title: lecture.title,
            disciplineTitle: lecture.disciplines?.title || 'Неизвестная дисциплина',
            questions: test?.questions || [],
          };
        })
      );

      setTests(testsData.filter(t => t.questions.length > 0));
    } catch (error) {
      console.error('Error loading tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600">Загрузка тестов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Тесты
          </h1>
          <p className="text-gray-600 mt-3 text-lg">Проверьте свои знания</p>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">У вас пока нет доступных тестов</p>
          </div>
        ) : (
          <TestListPage 
            tests={tests} 
            onSelectTest={(testId) => {
              // Find the test and get its lectureId
              const test = tests.find(t => t.id === testId);
              if (test?.lectureId) {
                onSelectTest(test.lectureId);
              }
            }} 
          />
        )}
      </div>
    </div>
  );
}

// Wrapper component for lecture view that loads lecture data
function LectureViewWrapper({ lectureId, onBack, onSelectTest }: { lectureId: string; onBack: () => void; onSelectTest: (testId: string) => void }) {
  const { user } = useAuth();
  const [lecture, setLecture] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLecture();
  }, [lectureId]);

  const loadLecture = async () => {
    setLoading(true);
    setError(null);
    try {
      const { lectureService } = await import('../services/lectureService');
      const { progressService } = await import('../services/progressService');
      const { testService } = await import('../services/testService');
      
      const data = await lectureService.getLectureById(lectureId);
      setLecture(data);

      // Mark lecture as accessed
      if (user) {
        await progressService.markLectureAccessed(user.id, lectureId);
      }

      // If it's a test, load test data
      if (data.type === 'test') {
        const testData = await testService.getTestByLectureId(lectureId);
        if (testData) {
          setTest(testData);
        }
      }
    } catch (err) {
      console.error('Error loading lecture:', err);
      setError('Не удалось загрузить лекцию');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // Show loading without knowing type yet
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Контент не найден'}</p>
          <button onClick={onBack} className="text-indigo-600 hover:underline">Назад</button>
        </div>
      </div>
    );
  }

  // Render based on lecture type
  if (lecture.type === 'presentation') {
    return <PresentationViewer lectureId={lectureId} title={lecture.title} onBack={onBack} />;
  } else if (lecture.type === 'test') {
    // Render test
    if (!test) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Тест не найден</p>
            <button onClick={onBack} className="text-indigo-600 hover:underline">Назад</button>
          </div>
        </div>
      );
    }
    return <TestPage test={test} lectureId={lectureId} onBack={onBack} />;
  } else if (lecture.type === 'article') {
    const content = typeof lecture.content === 'string' ? lecture.content : JSON.stringify(lecture.content || '');
    return <LectureReader title={lecture.title} content={content} lectureId={lectureId} onBack={onBack} />;
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Неизвестный тип лекции</p>
          <button onClick={onBack} className="text-indigo-600 hover:underline">Назад</button>
        </div>
      </div>
    );
  }
}

// Wrapper component for test view that loads test data
function TestViewWrapper({ testId, onBack }: { testId: string; onBack: () => void }) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error: fetchError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (fetchError) throw fetchError;
      setTest(data);
    } catch (err) {
      console.error('Error loading test:', err);
      setError('Не удалось загрузить тест');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Тест не найден'}</p>
          <button onClick={onBack} className="text-indigo-600 hover:underline">Назад</button>
        </div>
      </div>
    );
  }

  return <TestPage test={test} onBack={onBack} />;
}