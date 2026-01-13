import { FileCheck, ArrowRight, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface Test {
  id: string;
  lectureId?: string;
  title: string;
  disciplineTitle?: string;
  questions: any[];
}

interface TestListPageProps {
  tests: Test[];
  onSelectTest: (testId: string) => void;
}

export function TestListPage({ tests, onSelectTest }: TestListPageProps) {
  return (
    <div className="grid gap-6 max-w-4xl mx-auto">
          {tests.map((test, index) => (
            <Card 
              key={test.id}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md group overflow-hidden"
              onClick={() => onSelectTest(test.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                        {test.title}
                      </CardTitle>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <HelpCircle className="w-3 h-3" />
                        {test.questions.length} вопросов
                      </Badge>
                      {test.disciplineTitle && (
                        <Badge variant="secondary">
                          {test.disciplineTitle}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
    </div>
  );
}