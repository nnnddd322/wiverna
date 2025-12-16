import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Home } from 'lucide-react';
import { Slide } from './Slide';
import { Presentation } from '../data/disciplines';

interface PresentationViewerProps {
  presentation: Presentation;
  onBack: () => void;
}

export function PresentationViewer({ presentation, onBack }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleNext = () => {
    if (currentSlide < presentation.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
  };

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 flex flex-col"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Fullscreen Slide */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full h-full max-w-[1920px] max-h-[1080px]">
            <Slide 
              slide={presentation.slides[currentSlide]} 
              isFullscreen={true}
            />
          </div>
        </div>

        {/* Fullscreen Controls */}
        <div className="bg-slate-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Назад
            </button>

            <div className="flex items-center gap-4">
              <div className="text-blue-200">
                {currentSlide + 1} / {presentation.slides.length}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:text-blue-300 transition-colors"
                title="Выйти из полноэкранного режима"
              >
                <Minimize className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentSlide === presentation.slides.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Вперед
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>К темам</span>
          </button>
          <h1 className="text-xl text-white">{presentation.title}</h1>
          <div className="text-blue-200">
            {currentSlide + 1} / {presentation.slides.length}
          </div>
        </div>
      </div>

      {/* Slide Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-7xl relative">
          <Slide 
            slide={presentation.slides[currentSlide]} 
            isFullscreen={false}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-blue-300 transition-colors"
              title="Полноэкранный режим"
            >
              <Maximize className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === presentation.slides.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Вперед
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
