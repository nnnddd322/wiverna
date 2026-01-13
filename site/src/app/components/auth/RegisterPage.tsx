import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { UserPlus, AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onBack: () => void;
}

interface Group {
  id: string;
  name: string;
}

export function RegisterPage({ onSwitchToLogin, onBack }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherSecret, setTeacherSecret] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error loading groups:', error);
        setError('Ошибка загрузки групп. Проверьте подключение к базе данных.');
        return;
      }
      
      console.log('Loaded groups:', data);
      setGroups(data || []);
      
      if (!data || data.length === 0) {
        console.warn('No groups found in database');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Ошибка загрузки групп');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!isTeacher && !groupId) {
      setError('Выберите группу');
      return;
    }

    if (isTeacher && !teacherSecret) {
      setError('Введите секретный ключ преподавателя');
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      firstName,
      lastName,
      groupId: isTeacher ? undefined : groupId,
      isTeacher,
      teacherSecret: isTeacher ? teacherSecret : undefined,
    });

    if (error) {
      setError(error.message || 'Ошибка регистрации');
    } else {
      // Успешная регистрация - перенаправляем на главную страницу
      window.location.href = '/';
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
          <CardDescription className="text-center">
            Создайте аккаунт для доступа к платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between space-x-2 p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="teacher-mode" className="cursor-pointer">
                Я преподаватель
              </Label>
              <Switch
                id="teacher-mode"
                checked={isTeacher}
                onCheckedChange={setIsTeacher}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Иван"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Иванов"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {!isTeacher && (
              <div className="space-y-2">
                <Label htmlFor="group">Группа</Label>
                <Select value={groupId} onValueChange={setGroupId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isTeacher && (
              <div className="space-y-2">
                <Label htmlFor="teacherSecret">Секретный ключ преподавателя</Label>
                <Input
                  id="teacherSecret"
                  type="password"
                  placeholder="Введите секретный ключ"
                  value={teacherSecret}
                  onChange={(e) => setTeacherSecret(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToLogin}
                disabled={loading}
              >
                Уже есть аккаунт? Войти
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={loading}
                className="w-full"
              >
                Вернуться на главную
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
