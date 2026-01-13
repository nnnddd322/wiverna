export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher';
}

export interface Discipline {
  id: string;
  title: string;
  description: string;
  icon: 'code' | 'presentation';
  courseCount: number;
  lectureCount: number;
}

export interface Lecture {
  id: string;
  disciplineId: string;
  title: string;
  content: string;
  type: 'text' | 'presentation' | 'test';
  slides?: Slide[];
  questions?: Question[];
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  gradient: string;
}

export interface Test {
  id: string;
  disciplineId: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  disciplineId: string;
  coursesCompleted: number;
  lecturesCompleted: number;
  testsCompleted: number;
  averageScore: number;
}

export const mockDisciplines: Discipline[] = [
  {
    id: '1',
    title: 'Презентации через код',
    description: 'Лекционные презентации, созданные через код',
    icon: 'code',
    courseCount: 12,
    lectureCount: 48,
  },
  {
    id: '2',
    title: 'Презентации из PPTX',
    description: 'Презентации из классических PPTX презентаций',
    icon: 'presentation',
    courseCount: 8,
    lectureCount: 32,
  },
];

export const mockLectures: Lecture[] = [
  {
    id: '1',
    disciplineId: '1',
    title: 'Тема 1. Воспитание как социально-педагогическое явление',
    type: 'presentation',
    content: '',
    slides: [
      {
        id: '1',
        title: 'Тема 1',
        content: 'Воспитание как социально-педагогическое явление',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        id: '2',
        title: 'Введение',
        content: 'Воспитание - это целенаправленный процесс формирования личности в условиях специально организованной воспитательной системы.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        id: '3',
        title: 'Основные понятия',
        content: 'Социализация\nВоспитание\nОбразование\nРазвитие',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    ],
  },
  {
    id: '2',
    disciplineId: '1',
    title: 'Тема 2. Педагогический процесс',
    type: 'text',
    content: `# Педагогический процесс

## Понятие педагогического процесса

Педагогический процесс - это специально организованное взаимодействие педагогов и воспитанников, направленное на решение развивающих и образовательных задач.

## Основные компоненты

1. **Целевой компонент** - определяет цели и задачи обучения
2. **Содержательный компонент** - включает содержание образования
3. **Деятельностный компонент** - методы, формы и средства обучения
4. **Результативный компонент** - оценка достижения целей

## Принципы организации

- Целостность педагогического процесса
- Единство обучения и воспитания
- Связь теории с практикой
- Научность и доступность
- Систематичность и последовательность

## Этапы педагогического процесса

1. Подготовительный этап
2. Основной этап (реализация)
3. Заключительный этап (анализ результатов)`,
  },
  {
    id: '3',
    disciplineId: '1',
    title: 'Тест по теме 1: Воспитание',
    type: 'test',
    content: '',
    questions: [
      {
        id: '1',
        question: 'Что такое воспитание?',
        options: [
          'Процесс передачи знаний',
          'Целенаправленный процесс формирования личности',
          'Метод обучения',
          'Форма контроля',
        ],
        correctAnswer: 1,
      },
      {
        id: '2',
        question: 'Какой из компонентов НЕ входит в педагогический процесс?',
        options: [
          'Целевой',
          'Содержательный',
          'Финансовый',
          'Результативный',
        ],
        correctAnswer: 2,
      },
      {
        id: '3',
        question: 'Что является основной целью воспитания?',
        options: [
          'Получение диплома',
          'Формирование всесторонне развитой личности',
          'Сдача экзаменов',
          'Накопление знаний',
        ],
        correctAnswer: 1,
      },
    ],
  },
];

export const mockTests: Test[] = [
  {
    id: '1',
    disciplineId: '1',
    title: 'Тест по теме 1: Воспитание',
    questions: [
      {
        id: '1',
        question: 'Что такое воспитание?',
        options: [
          'Процесс передачи знаний',
          'Целенаправленный процесс формирования личности',
          'Метод обучения',
          'Форма контроля',
        ],
        correctAnswer: 1,
      },
      {
        id: '2',
        question: 'Какой из компонентов НЕ входит в педагогический процесс?',
        options: [
          'Целевой',
          'Содержательный',
          'Финансовый',
          'Результативный',
        ],
        correctAnswer: 2,
      },
      {
        id: '3',
        question: 'Что является основной целью воспитания?',
        options: [
          'Получение диплома',
          'Формирование всесторонне развитой личности',
          'Сдача экзаменов',
          'Накопление знаний',
        ],
        correctAnswer: 1,
      },
    ],
  },
];

export const mockStudentProgress: StudentProgress[] = [
  {
    studentId: '1',
    studentName: 'Иванов Иван Иванович',
    disciplineId: '1',
    coursesCompleted: 8,
    lecturesCompleted: 32,
    testsCompleted: 6,
    averageScore: 85,
  },
  {
    studentId: '2',
    studentName: 'Петрова Мария Сергеевна',
    disciplineId: '1',
    coursesCompleted: 10,
    lecturesCompleted: 40,
    testsCompleted: 8,
    averageScore: 92,
  },
  {
    studentId: '3',
    studentName: 'Сидоров Алексей Петрович',
    disciplineId: '1',
    coursesCompleted: 5,
    lecturesCompleted: 20,
    testsCompleted: 4,
    averageScore: 78,
  },
  {
    studentId: '4',
    studentName: 'Козлова Анна Викторовна',
    disciplineId: '1',
    coursesCompleted: 12,
    lecturesCompleted: 48,
    testsCompleted: 10,
    averageScore: 95,
  },
];

export const currentUser: User = {
  id: '1',
  name: 'Пользователь',
  role: 'student', // Change to 'teacher' to see teacher dashboard
};