import { GraduationCap, BookOpen } from 'lucide-react';
import { Discipline } from '../data/disciplines';

interface DisciplineSelectorProps {
  disciplines: Discipline[];
  onSelect: (discipline: Discipline) => void;
}

export function DisciplineSelector({ disciplines, onSelect }: DisciplineSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <GraduationCap className="w-20 h-20 text-blue-400" />
            <h1 className="text-6xl text-white">Учебные дисциплины</h1>
          </div>
          <p className="text-2xl text-blue-200">Выберите дисциплину для изучения</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {disciplines.map((discipline) => (
            <button
              key={discipline.id}
              onClick={() => onSelect(discipline)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-10 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group text-left"
            >
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl group-hover:from-blue-400 group-hover:to-blue-500 transition-all shadow-lg">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl text-white mb-3">{discipline.name}</h2>
                  <p className="text-xl text-blue-200 mb-4">{discipline.description}</p>
                  <div className="flex items-center gap-2 text-blue-300">
                    <span className="text-lg">Тем: {discipline.presentations.length}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
