import { BookOpen, ChevronLeft } from 'lucide-react';
import { Discipline, Presentation } from '../data/disciplines';

interface PresentationHomeProps {
  discipline: Discipline;
  onBack: () => void;
  onSelectPresentation: (presentation: Presentation) => void;
}

export function PresentationHome({ discipline, onBack, onSelectPresentation }: PresentationHomeProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors text-lg"
          >
            <ChevronLeft className="w-6 h-6" />
            Назад к дисциплинам
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl text-white mb-3">{discipline.name}</h1>
          <p className="text-xl text-blue-200">{discipline.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {discipline.presentations.filter(p => !p.hidden).map((presentation, index) => (
            <button
              key={index}
              onClick={() => onSelectPresentation(presentation)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-4 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-8 h-8 text-blue-300" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-2xl text-white mb-2">{presentation.title}</h2>
                  <p className="text-blue-200">Слайдов: {presentation.slides.length}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
