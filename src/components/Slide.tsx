import { CheckCircle2, Lightbulb, ArrowRight, Quote } from 'lucide-react';
import { Slide as SlideData } from '../data/disciplines';

interface SlideProps {
  slide: SlideData;
  isFullscreen: boolean;
}

export function Slide({ slide, isFullscreen }: SlideProps) {
  const baseClasses = isFullscreen 
    ? "w-full h-full flex flex-col" 
    : "w-full aspect-[16/9] flex flex-col";

  // Title slide
  if (slide.type === 'title') {
    return (
      <div className={`${baseClasses} bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl shadow-2xl p-12 justify-center items-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-7xl text-white text-center mb-6 drop-shadow-lg">{slide.title}</h1>
          {slide.subtitle && (
            <p className="text-4xl text-blue-100 text-center drop-shadow">{slide.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // Highlight/Key point slide
  if (slide.type === 'highlight') {
    return (
      <div className={`${baseClasses} bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-12 justify-center items-center`}>
        <div className="flex items-start gap-8 max-w-5xl">
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
            <Lightbulb className="w-20 h-20 text-white flex-shrink-0" />
          </div>
          <div>
            <h2 className="text-5xl text-white mb-8 drop-shadow-lg">{slide.title}</h2>
            <p className="text-2xl text-white leading-relaxed drop-shadow">{slide.highlightText}</p>
          </div>
        </div>
      </div>
    );
  }

  // Quote slide
  if (slide.type === 'quote') {
    return (
      <div className={`${baseClasses} bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-12 justify-center items-center`}>
        <div className="max-w-5xl relative">
          <Quote className="w-16 h-16 text-white/30 absolute -top-8 -left-4" />
          <h2 className="text-4xl text-white mb-8 text-center drop-shadow">{slide.title}</h2>
          <p className="text-3xl text-white leading-relaxed text-center italic drop-shadow-lg">
            {slide.quote}
          </p>
          {slide.author && (
            <p className="text-2xl text-white/80 text-right mt-6 drop-shadow">— {slide.author}</p>
          )}
        </div>
      </div>
    );
  }

  // List slide
  if (slide.type === 'list') {
    const getColorClasses = (color?: string) => {
      switch (color) {
        case 'blue':
          return 'from-blue-100 to-blue-200 border-blue-600 text-blue-800';
        case 'green':
          return 'from-green-100 to-green-200 border-green-600 text-green-800';
        case 'purple':
          return 'from-purple-100 to-purple-200 border-purple-600 text-purple-800';
        case 'orange':
          return 'from-orange-100 to-orange-200 border-orange-600 text-orange-800';
        case 'red':
          return 'from-red-100 to-red-200 border-red-600 text-red-800';
        default:
          return 'from-slate-100 to-slate-200 border-slate-600 text-slate-800';
      }
    };

    return (
      <div className={`${baseClasses} bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl p-10`}>
        <h2 className="text-4xl text-slate-800 mb-8 pb-4 border-b-4 border-gradient-to-r from-blue-500 to-purple-500">{slide.title}</h2>
        <div className="flex-1 overflow-y-auto space-y-4">
          {slide.listItems?.map((item, index) => (
            <div 
              key={index} 
              className={`rounded-xl p-6 ${
                item.highlight 
                  ? `bg-gradient-to-r ${getColorClasses(item.color)} border-l-4 shadow-md hover:shadow-lg transition-shadow` 
                  : 'bg-gray-100 border-l-4 border-gray-400'
              }`}
            >
              <div className="flex items-start gap-4">
                {item.highlight && <CheckCircle2 className="w-7 h-7 flex-shrink-0 mt-1 opacity-70" />}
                <div className="flex-1">
                  <h3 className="text-2xl mb-3">{item.title}</h3>
                  <p className="text-lg text-slate-700 leading-relaxed">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Two-column slide
  if (slide.type === 'two-column') {
    return (
      <div className={`${baseClasses} bg-white rounded-2xl shadow-2xl p-10`}>
        <h2 className="text-4xl text-slate-800 mb-8 pb-4 border-b-4 border-blue-500">{slide.title}</h2>
        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
          <div className="space-y-4">
            {slide.leftContent?.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-l-4 border-blue-500 shadow hover:shadow-md transition-shadow">
                <p className="text-lg text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {slide.rightContent?.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-l-4 border-purple-500 shadow hover:shadow-md transition-shadow">
                <p className="text-lg text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grid slide
  if (slide.type === 'grid') {
    return (
      <div className={`${baseClasses} bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl p-10`}>
        <h2 className="text-4xl text-slate-800 mb-8 pb-4 border-b-4 border-blue-500">{slide.title}</h2>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            {slide.gridItems?.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-blue-200"
              >
                <div className="flex items-start gap-4">
                  {item.icon && (
                    <div className="text-4xl flex-shrink-0">{item.icon}</div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl text-blue-800 mb-3">{item.title}</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Comparison slide
  if (slide.type === 'comparison') {
    return (
      <div className={`${baseClasses} bg-white rounded-2xl shadow-2xl p-10`}>
        <h2 className="text-4xl text-slate-800 mb-8 pb-4 border-b-4 border-blue-500 text-center">{slide.title}</h2>
        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg">
            <h3 className="text-3xl text-green-800 mb-6 pb-3 border-b-2 border-green-500">
              {slide.leftColumn?.title}
            </h3>
            <div className="space-y-3">
              {slide.leftColumn?.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <ArrowRight className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-lg text-slate-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg">
            <h3 className="text-3xl text-orange-800 mb-6 pb-3 border-b-2 border-orange-500">
              {slide.rightColumn?.title}
            </h3>
            <div className="space-y-3">
              {slide.rightColumn?.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <ArrowRight className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <p className="text-lg text-slate-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Content slide (default)
  return (
    <div className={`${baseClasses} bg-white rounded-2xl shadow-2xl p-10`}>
      <h2 className="text-4xl text-slate-800 mb-8 pb-4 border-b-4 border-blue-500">{slide.title}</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        {slide.content?.map((paragraph, index) => (
          <div key={index} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 shadow hover:shadow-md transition-shadow">
            <p className="text-lg text-slate-700 leading-relaxed">{paragraph}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
