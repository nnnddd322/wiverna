import { useState } from 'react';
import { DisciplineSelector } from './components/DisciplineSelector';
import { PresentationHome } from './components/PresentationHome';
import { PresentationViewer } from './components/PresentationViewer';
import { disciplines, Discipline, Presentation } from './data/disciplines';

export default function App() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);

  const handleSelectDiscipline = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
  };

  const handleBackToDisciplines = () => {
    setSelectedDiscipline(null);
    setSelectedPresentation(null);
  };

  const handleSelectPresentation = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
  };

  const handleBackToPresentations = () => {
    setSelectedPresentation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {!selectedDiscipline ? (
        <DisciplineSelector 
          disciplines={disciplines.filter(d => !d.hidden)}
          onSelect={handleSelectDiscipline}
        />
      ) : !selectedPresentation ? (
        <PresentationHome 
          discipline={selectedDiscipline}
          onBack={handleBackToDisciplines}
          onSelectPresentation={handleSelectPresentation}
        />
      ) : (
        <PresentationViewer 
          presentation={selectedPresentation}
          onBack={handleBackToPresentations}
        />
      )}
    </div>
  );
}
