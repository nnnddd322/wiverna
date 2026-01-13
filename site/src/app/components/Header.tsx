import { Home, BookOpen, FileText, GraduationCap, BarChart3, User } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isTeacher?: boolean;
  userName?: string;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

export function Header({ currentPage, onNavigate, isTeacher = false, userName = 'Пользователь', onLogout, isAuthenticated = false }: HeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-1.5 sm:p-2">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              EduPortal
            </span>
            <p className="text-xs text-gray-500">Образовательная платформа</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={currentPage === 'home' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('home')}
            className="gap-1 sm:gap-2 rounded-lg px-2 sm:px-3"
          >
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">Главная</span>
          </Button>
          
          <Button
            variant={currentPage === 'disciplines' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('disciplines')}
            className="gap-1 sm:gap-2 rounded-lg px-2 sm:px-3"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Дисциплины</span>
          </Button>
          
          <Button
            variant={currentPage === 'tests' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('tests')}
            className="gap-1 sm:gap-2 rounded-lg px-2 sm:px-3"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Тесты</span>
          </Button>

          {isTeacher && (
            <Button
              variant={currentPage === 'teacher-dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('teacher-dashboard')}
              className="gap-1 sm:gap-2 rounded-lg px-2 sm:px-3"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden lg:inline">Панель преподавателя</span>
              <span className="hidden md:inline lg:hidden">Панель</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 sm:gap-2 rounded-lg px-2 sm:px-3">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Роль: {isTeacher ? 'Преподаватель' : 'Студент'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onLogout && (
                <DropdownMenuItem onClick={onLogout}>
                  Выйти
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}