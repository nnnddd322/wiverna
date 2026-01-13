import { Button } from './ui/button';
import { BookOpen, FileText, GraduationCap, Sparkles, TrendingUp, Users } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

export function HomePage({ onNavigate, isAuthenticated = false }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Современная образовательная платформа</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Программа профессиональной переподготовки
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              "Педагогика и психология", 530 часов
            </p>
            
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Изучайте материалы, просматривайте презентации и проверяйте знания в современной интерактивной среде
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mt-8">
              {isAuthenticated ? (
                <>
                  <Button 
                    onClick={() => onNavigate('disciplines')}
                    className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <BookOpen className="w-5 h-5" />
                    Начать обучение
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => onNavigate('tests')}
                    className="gap-2 text-lg px-8 py-6 rounded-xl border-2"
                    size="lg"
                  >
                    <FileText className="w-5 h-5" />
                    Пройти тесты
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => onNavigate('login')}
                    className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    Войти
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => onNavigate('register')}
                    className="gap-2 text-lg px-8 py-6 rounded-xl border-2"
                    size="lg"
                  >
                    Зарегистрироваться
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={() => onNavigate('disciplines')}
                    className="gap-2 text-lg px-8 py-6 rounded-xl"
                    size="lg"
                  >
                    <BookOpen className="w-5 h-5" />
                    Начать обучение
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h3 className="mb-3">Качественное образование</h3>
              <p className="text-gray-600">
                Доступ к профессиональным лекциям и презентациям
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="mb-3">Отслеживание прогресса</h3>
              <p className="text-gray-600">
                Следите за своими достижениями и результатами тестов
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="mb-3">Личный кабинет</h3>
              <p className="text-gray-600">
                Удобная панель управления для студентов и преподавателей
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}