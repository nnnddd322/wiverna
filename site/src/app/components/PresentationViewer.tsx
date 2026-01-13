import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2, Upload, Loader2, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { presentationService } from '../../services/presentationService';

interface PresentationViewerProps {
  lectureId: string;
  title: string;
  onBack: () => void;
}

interface SlidesData {
  pageCount: number;
  slides: Array<{
    index: number;
    path: string;
    width: number;
    height: number;
  }>;
  thumb?: {
    path: string;
  };
}

export function PresentationViewer({ lectureId, title, onBack }: PresentationViewerProps) {
  const { user, profile } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Presentation state
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const maxPollingAttempts = 60; // 60 attempts * 3 sec = 3 minutes

  // Image preloading cache
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<Map<number, boolean>>(new Map());
  const [replacing, setReplacing] = useState(false);

  const isTeacher = profile?.role === 'teacher';
  const slidesData: SlidesData | null = presentation?.slides_data;
  const status = presentation?.status;

  useEffect(() => {
    loadPresentation();
  }, [lectureId]);

  useEffect(() => {
    // Start polling if status is processing
    if (status === 'processing' && pollingCount < maxPollingAttempts) {
      const timer = setTimeout(() => {
        loadPresentation();
        setPollingCount(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, pollingCount]);

  const loadPresentation = async () => {
    try {
      const data = await presentationService.getPresentationByLectureId(lectureId);
      setPresentation(data);
      setError(null);
    } catch (err) {
      console.error('Error loading presentation:', err);
      setError('Не удалось загрузить презентацию');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      setError('Пожалуйста, выберите файл .pptx');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Atomic operation: upload + create + trigger conversion
      await presentationService.uploadAndCreatePresentation(file, lectureId);
      
      // Reload presentation to show processing status
      await loadPresentation();
      setPollingCount(0); // Reset polling counter
    } catch (err) {
      console.error('Error uploading presentation:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить файл. Попробуйте еще раз.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplacePresentation = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      setError('Пожалуйста, выберите файл .pptx');
      return;
    }

    if (!confirm('Вы уверены, что хотите заменить презентацию? Старая презентация будет удалена.')) {
      return;
    }

    setReplacing(true);
    setError(null);

    try {
      await presentationService.replacePresentation(lectureId, file);
      await loadPresentation();
      setPollingCount(0);
      setCurrentSlide(0);
    } catch (err) {
      console.error('Error replacing presentation:', err);
      setError(err instanceof Error ? err.message : 'Не удалось заменить презентацию.');
    } finally {
      setReplacing(false);
    }
  };

  const nextSlide = useCallback(() => {
    if (slidesData && currentSlide < slidesData.pageCount - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [slidesData, currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Memoize slide URLs for better performance
  const slideUrls = useMemo(() => {
    if (!slidesData?.slides) return [];
    return slidesData.slides.map(slide => {
      const path = slide.path;
      return presentationService.getPresentationUrl(path);
    });
  }, [slidesData]);

  const getCurrentSlideUrl = useCallback(() => {
    if (!slideUrls || !slideUrls[currentSlide]) return null;
    return slideUrls[currentSlide];
  }, [slideUrls, currentSlide]);

  // Preload adjacent slides for smooth navigation
  useEffect(() => {
    if (!slideUrls || slideUrls.length === 0) return;

    const preloadSlide = (index: number) => {
      if (index < 0 || index >= slideUrls.length || preloadedImages.has(index)) return;
      
      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set(prev).add(index));
        setImageLoadingStates(prev => {
          const newMap = new Map(prev);
          newMap.set(index, true);
          return newMap;
        });
      };
      img.onerror = () => {
        setImageLoadingStates(prev => {
          const newMap = new Map(prev);
          newMap.set(index, false);
          return newMap;
        });
      };
      img.src = slideUrls[index];
    };

    // Preload current slide
    preloadSlide(currentSlide);
    
    // Preload next 2 slides
    preloadSlide(currentSlide + 1);
    preloadSlide(currentSlide + 2);
    
    // Preload previous slide
    preloadSlide(currentSlide - 1);
  }, [currentSlide, slideUrls, preloadedImages]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, slidesData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <p className="text-white text-lg">Загрузка презентации...</p>
        </div>
      </div>
    );
  }

  // No presentation uploaded yet
  if (!presentation && isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-12">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Загрузите презентацию</h2>
              <p className="text-gray-600 mb-6">
                Выберите файл .pptx для загрузки. Он будет автоматически конвертирован в слайды.
              </p>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button size="lg" disabled={uploading} asChild>
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Выбрать файл PPTX
                      </>
                    )}
                  </span>
                </Button>
              </label>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-red-800 font-medium">Ошибка</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-12">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Обрабатываем презентацию</h2>
              <p className="text-gray-600">
                Конвертация PPTX в слайды может занять несколько минут.
                <br />
                Страница обновится автоматически, когда презентация будет готова.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Попытка {pollingCount} из {maxPollingAttempts}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-12">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ошибка обработки</h2>
              <p className="text-gray-600 mb-4">
                {presentation.error_message || 'Не удалось обработать презентацию'}
              </p>
              
              {isTeacher && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Загрузка...
                      </>
                    ) : (
                      'Попробовать снова'
                    )}
                  </Button>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No slides data
  if (!slidesData || !slidesData.slides || slidesData.slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">В этой презентации нет слайдов</p>
          </div>
        </div>
      </div>
    );
  }

  const slideUrl = getCurrentSlideUrl();

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-2 sm:px-4 py-2 sm:py-3">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="gap-1 sm:gap-2 text-white hover:bg-gray-700 px-2 sm:px-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад</span>
          </Button>

          <div className="text-white text-xs sm:text-sm font-medium truncate max-w-[40%] sm:max-w-none">
            <span className="hidden sm:inline">{title} • </span>
            {currentSlide + 1} / {slidesData.pageCount}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {isTeacher && slidesData && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleReplacePresentation}
                  className="hidden"
                  disabled={replacing}
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-gray-700"
                  disabled={replacing}
                  title="Заменить презентацию"
                  asChild
                >
                  <span>
                    {replacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </span>
                </Button>
              </label>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-gray-700 px-2"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <span className="text-white text-xs hidden sm:inline">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-gray-700 px-2"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-gray-700 px-2"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="relative flex items-center justify-center" style={{
          maxWidth: isFullscreen ? '100%' : '1200px',
          width: '100%',
          height: isFullscreen ? '100%' : 'auto'
        }}>
          {slideUrl ? (
            <div className="relative w-full">
              {!preloadedImages.has(currentSlide) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              )}
              <img 
                src={slideUrl}
                alt={`Слайд ${currentSlide + 1}`}
                className={`rounded-lg shadow-2xl transition-opacity duration-200 ${
                  preloadedImages.has(currentSlide) ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  width: isFullscreen ? 'auto' : '100%',
                  height: isFullscreen ? '100vh' : 'auto',
                  maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
                  objectFit: 'contain',
                  imageRendering: 'crisp-edges',
                  transform: isFullscreen ? 'none' : `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out'
                } as React.CSSProperties}
                onLoad={() => {
                  setPreloadedImages(prev => new Set(prev).add(currentSlide));
                }}
                onError={(e) => {
                  console.error('Error loading slide:', e);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"%3E%3Crect fill="%23f3f4f6" width="1920" height="1080"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="24"%3EОшибка загрузки слайда%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ) : (
            <div className="aspect-[16/9] w-full flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-500">Слайд не найден</p>
            </div>
          )}

          {/* Navigation Arrows */}
          {currentSlide > 0 && (
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800/80 hover:bg-gray-800 backdrop-blur-sm text-white rounded-full p-3 transition-all shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {currentSlide < slidesData.pageCount - 1 && (
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800/80 hover:bg-gray-800 backdrop-blur-sm text-white rounded-full p-3 transition-all shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-2 sm:px-4 py-2 sm:py-3">
        <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-white text-xs sm:text-sm font-medium">
            <span className="hidden sm:inline">Слайд </span>{currentSlide + 1}<span className="hidden sm:inline"> из</span><span className="sm:hidden">/</span> {slidesData.pageCount}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === slidesData.pageCount - 1}
            className="text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}