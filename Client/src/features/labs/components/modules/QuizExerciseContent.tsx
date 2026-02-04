import React from 'react';
import { AlertCircle, Plus, Pencil, Clock } from 'lucide-react';
import { Exercise, QuizExercise } from '../../types/modules';

interface QuizExerciseContentProps {
  exercise: Exercise;
  quizExercise: QuizExercise | undefined;
  isLoading: boolean;
  onEdit: () => void;
  canEdit: boolean;
}

export const QuizExerciseContent: React.FC<QuizExerciseContentProps> = ({
  exercise,
  quizExercise,
  isLoading,
  onEdit,
  canEdit
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!quizExercise) {
    return (
      <div className="p-6 bg-dark-300/50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <p>Quiz content not found</p>
          </div>
          {canEdit && (
            <button
              onClick={onEdit}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quiz Content</h3>
        <div className="flex items-center space-x-4">
          {canEdit && (
            <button
              onClick={onEdit}
              className="btn-secondary"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Quiz
            </button>
          )}
        </div>
      </div>

      {quizExercise?.questions?.map((question, qIndex) => (
        <div key={question?.id} className="p-6 bg-dark-300/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Question {qIndex + 1}</h3>
          <p className="text-gray-300 mb-4">{question?.text}</p>
          
          <div className="space-y-3">
            {question?.options?.map((option) => (
              <div key={option?.id} className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <input
                    type="radio"
                    name={`question-${question?.id}`}
                    className="h-5 w-5 border-gray-500 text-primary-500 focus:ring-primary-500"
                    defaultChecked={option?.is_correct}
                  />
                </div>
                <p className={`text-gray-300 ${option?.is_correct ? 'font-medium' : ''}`}>
                  {option?.text}
                  {option?.is_correct && (
                    <span className="ml-2 text-xs text-emerald-400">(Correct Answer)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button className="btn-primary">
          Submit Answers
        </button>
      </div>
    </div>
  );
};