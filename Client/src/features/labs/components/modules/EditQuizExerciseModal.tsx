import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  AlertCircle, 
  Loader, 
  Clock, 
  Check 
} from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { QuizExercise } from '../../types/modules';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface EditQuizExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  quizExercise: QuizExercise | null;
  onSave: (exerciseId: string, quizExercise: QuizExercise) => void;
}

export const EditQuizExerciseModal: React.FC<EditQuizExerciseModalProps> = ({
  isOpen,
  onClose,
  exerciseId,
  quizExercise,
  onSave
}) => {
  const [formData, setFormData] = useState<QuizExercise>({
    id: '',
    exerciseId: '',
    duration: 15,
    questions: [{
      id: `question-${Date.now()}`,
      text: '',
      description: '', // Added description field for question
      marks: 1, // Marks assigned to the question instead of options
      options: [
        { option_id: `option-${Date.now()}-1`, text: '', is_correct: false },
        { option_id: `option-${Date.now()}-2`, text: '', is_correct: false }
      ]
    }]
  });
  
  // New fields for adding a new exercise
  const [exerciseTitle, setExerciseTitle] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (quizExercise) {
      setFormData({ ...quizExercise, duration: quizExercise.questions[0].duration });
      // Don't set title for existing quizzes
    } else {
      setFormData({
        id: `quiz-${Date.now()}`,
        exerciseId,
        duration: 15,
        questions: [{
          id: uuidv4(),
          text: '',
          description: '', // Added description field for question
          marks: 1, // Marks assigned to the question
          options: [
            { option_id: `option-${Date.now()}-1`, text: '', is_correct: false },
            { option_id: `option-${Date.now()}-2`, text: '', is_correct: false }
          ]
        }]
      });
      // Reset title for new quizzes
      setExerciseTitle('');
    }
  }, [quizExercise, exerciseId, isOpen]);

  const handleDurationChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      duration: value
    }));
  };

  const handleAddQuestion = () => {
    const newQuestionId = uuidv4();
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: newQuestionId,
          text: '',
          description: '', // Added description field for new question
          marks: 1, // Default marks for new question
          options: [
            { option_id: `option-${Date.now()}-1`, text: '', is_correct: false },
            { option_id: `option-${Date.now()}-2`, text: '', is_correct: false }
          ]
        }
      ]
    });
  };

  const handleQuestionChange = (questionIndex: number, text: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], text };
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleQuestionDescriptionChange = (questionIndex: number, description: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], description };
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleRemoveQuestion = (questionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(questionIndex, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    question.options = [
      ...question.options,
      { option_id: `option-${Date.now()}`, text: '', is_correct: false }
    ];
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, text: string) => {
    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    question.options[optionIndex] = { ...question.options[optionIndex], text };
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleCorrectOptionChange = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    
    // Reset all options to not correct
    question.options = question.options.map(option => ({
      ...option,
      is_correct: false
    }));
    
    // Set the selected option as correct
    question.options[optionIndex] = { 
      ...question.options[optionIndex], 
      is_correct: true 
    };
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleMarksChange = (questionIndex: number, marks: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex] = { 
      ...updatedQuestions[questionIndex], 
      marks: marks 
    };
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    question.options.splice(optionIndex, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setApiError(null);
    setSuccess(null);

    try {
      // Validate form
      if (formData.questions.some(q => !q.text.trim())) {
        throw new Error('All questions must have text');
      }

      if (formData.questions.some(q => q.options.some(o => !o.text.trim()))) {
        throw new Error('All options must have text');
      }

      if (formData.questions.some(q => !q.options.some(o => o.is_correct))) {
        throw new Error('Each question must have at least one correct answer');
      }

      if (formData.duration <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      
      // For new exercises, validate title
      if (!quizExercise && !exerciseTitle.trim()) {
        throw new Error('Exercise title is required');
      }

      try {
        // Determine if this is an update or create operation
        if (quizExercise) {
          console.log('Updating quiz exercise:', formData)
          console.log(exerciseId)
          // Update existing quiz
          setIsLoading(true);
          const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateQuizExercise`, {
            ...formData,
            exerciseId:formData.exerciseId
          });
          
          if (response.data.success) {
            setSuccess('Quiz updated successfully');
            // Save quiz
            onSave(exerciseId, formData);
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setApiError(response.data.message || 'Failed to update quiz');
          }
        } else {
          // Create new quiz - directly using a single endpoint
          setIsLoading(true);
          // Create the exercise and quiz in a single request
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/createQuizExercise`, {
            title: exerciseTitle,
            type: 'questions',
            order: 1, // Default order
            duration: formData.duration,
            moduleId: exerciseId.split('-')[0], // Extract module ID from exerciseId
            quizData: formData // Pass the quiz data directly
          });
          
          if (response.data.success) {
            setSuccess('Quiz created successfully');
            
            // Save quiz with the ID from the response
            const savedQuiz = {
              ...formData,
              id: response.data.data?.id || formData.id,
              exerciseId: formData.id
            };
            
            onSave(formData.id, savedQuiz);
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setApiError(response.data.message || 'Failed to create quiz');
          }
        }
      } catch (err: any) {
        console.log(err)
        setApiError(err.response?.data?.message || 'An error occurred while saving the quiz');
      } finally {
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>{quizExercise ? 'Edit Quiz' : 'Add Quiz'}</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Only show title field for new exercises */}
          {!quizExercise && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exercise Title
              </label>
              <input
                type="text"
                value={exerciseTitle}
                onChange={(e) => setExerciseTitle(e.target.value)}
                placeholder="Enter exercise title"
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>
          )}
          
          {/* Duration Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (in minutes)
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
            </div>
          </div>

          {formData.questions.map((question, questionIndex) => (
            <div key={question.id} className="p-4 bg-dark-300/50 rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question {questionIndex + 1}
                  </label>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                    placeholder="Enter question text"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(questionIndex)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                  disabled={formData.questions.length <= 1}
                >
                  <X className="h-4 w-4 text-red-400" />
                </button>
              </div>

              {/* Question Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question Description
                </label>
                <textarea
                  value={question.description || ''}
                  onChange={(e) => handleQuestionDescriptionChange(questionIndex, e.target.value)}
                  placeholder="Enter additional details or context for this question"
                  rows={2}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              {/* Marks input for the question */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Marks for this question
                </label>
                <input
                  type="number"
                  min="1"
                  value={question.marks || 1}
                  onChange={(e) => handleMarksChange(questionIndex, parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-300">
                    Options
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddOption(questionIndex)}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </button>
                </div>

                {question.options.map((option, optionIndex) => (
                  <div key={option.option_id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={option.is_correct}
                      onChange={() => handleCorrectOptionChange(questionIndex, optionIndex)}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                      className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                      disabled={question.options.length <= 2}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full p-3 border border-dashed border-primary-500/30 rounded-lg
                     text-primary-400 hover:text-primary-300 hover:border-primary-500/50
                     transition-colors flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Question
          </button>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          {apiError && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{apiError}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-200">{success}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <GradientText>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </button>
            </GradientText>
            <GradientText>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn-primary"
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                'Save Quiz'
              )}
            </button>
            </GradientText>
          </div>
        </form>
      </div>
    </div>
  );
};