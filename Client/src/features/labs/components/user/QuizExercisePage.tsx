import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  Check,
  Loader,
  HelpCircle,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';

export const QuizExercisePage: React.FC = () => {
  const { exerciseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<any>(location.state?.exercise || null);
  const [labDetails, setLabDetails] = useState<any>(location.state?.labDetails || null);
  const [moduleId, setModuleId] = useState<string | null>(location.state?.moduleId || null);
  const [quizExercise, setQuizExercise] = useState<any>(location.state?.quizExercise || null);
  const [isLoading, setIsLoading] = useState(!location.state?.quizExercise);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);
  const[isQuizResult,setIsQuizResult] = useState(false);


    // Fetch user details
    useEffect(() => {
      const fetchUserProfile = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      };
  
      fetchUserProfile();
    }, []);
  
    

  // Fetch quiz exercise if not provided in location state
  useEffect(() => {
    const fetchQuizExercise = async () => {
      if (quizExercise || !exerciseId || !moduleId) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/quiz-exercise/${exerciseId}`);
        if (response.data.success) {
          setQuizExercise(response.data.data);
          setCountdown(response.data.data.duration * 60); // Convert minutes to seconds
        } else {
          throw new Error('Failed to fetch quiz details');
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizExercise();
  }, [exerciseId, moduleId, quizExercise]);

  // Fetch quiz result if available
useEffect(() => {
  const fetchQuizResult = async () => {
    setIsQuizResult(true);
    try {
      
      const user_profile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(user_profile.data.user);
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getUserQuizData`,{
      moduleId,
      exerciseId,
      userId:user_profile.data.user.id
    });
    if(response.data.success){
      setQuizResult(response.data.data[0])
    }
    } catch (error) {
      console.log(error)
    }
    finally{
      setIsQuizResult(false);
    }
    
  }
    fetchQuizResult();
  },[]);
  


  // Set countdown when quiz exercise is loaded
  useEffect(() => {
    if (quizExercise && !countdown) {
      setCountdown(exercise.duration * 60); // Convert minutes to seconds
    }
  }, [quizExercise, countdown]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Submit quiz
  const handleSubmit = async () => {
    // Check if all questions are answered
    if (!quizExercise || !quizExercise.questions) return;
    
    const unansweredQuestions = quizExercise.questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setNotification({ 
        type: 'error', 
        message: `Please answer all questions before submitting (${unansweredQuestions.length} remaining)` 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setIsSubmitting(true);
    setNotification(null);
    
    try {
      // Submit answers to the server
      // Calculate results
      const correctAnswers = quizExercise.questions.filter(q => {
        const correctOption = q.options.find(o => o.is_correct);
        return answers[q.id] === correctOption?.option_id;
      }).length;
      
      const incorrectAnswers = quizExercise.questions.length - correctAnswers;
      const score = Math.round((correctAnswers / quizExercise.questions.length) * 100);
      
      const feedback = quizExercise.questions.map(q => {
        const correctOption = q.options.find(o => o.is_correct);
        return {
          questionId: q.id,
          isCorrect: answers[q.id] === correctOption?.option_id,
          correctOptionId: correctOption?.option_id
        };
      });
      
      const result = {
        score,
        totalQuestions: quizExercise.questions.length,
        correctAnswers,
        incorrectAnswers,
        feedback
      };
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/submit-quiz/${exerciseId}`, {
        data:result,
        moduleId,
        userId: user.id,
      });
      
      if (response.data.success) {
          
        setQuizResult(result);
        setNotification({ type: 'success', message: 'Quiz submitted successfully' });
      } else {
        throw new Error(response.data.message || 'Failed to submit quiz');
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit quiz' 
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null || quizResult) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          if (!quizResult && Object.keys(answers).length > 0) {
            handleSubmit();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown, quizResult, answers]);

  

  if (isLoading ) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }
  

  if (error) {
    return (
      <div className="glass-panel p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">{error}</h2>
        <p className="text-gray-400 mb-6">Unable to load the quiz details.</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>
    );
  }

  if(isQuizResult){
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold">
              <GradientText>{exercise?.title || quizExercise?.title || 'Quiz Exercise'}</GradientText>
            </h1>
            <p className="mt-1 text-gray-400">{exercise?.description || quizExercise?.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {countdown !== null && !quizResult && (
            <div className="px-4 py-2 bg-dark-300/50 rounded-lg flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-mono text-gray-300">{formatTimeRemaining(countdown)}</span>
            </div>
          )}
          
          {!quizResult && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length === 0}
              className="btn-primary"
            >
              {isSubmitting ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Answers
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/20 border border-emerald-500/20' 
            : 'bg-red-500/20 border border-red-500/20'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
          <span className={`text-sm ${
            notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      <div className={`grid grid-cols-1 ${quizResult ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Questions */}
        <div className="glass-panel">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              <GradientText>Questions</GradientText>
            </h2>
            <HelpCircle className="h-5 w-5 text-primary-400" />
          </div>

          <div className="space-y-8">
            {quizExercise?.questions?.map((question, qIndex) => (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-dark-400/80 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">{qIndex + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-200">{question.text}</h3>
                    {question.description && (
                      <p className="text-sm text-gray-400 mt-1">{question.description}</p>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      {question.options.map(option => (
                        <label 
                          key={option.option_id}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            quizResult ? (
                              option.is_correct
                                ? 'bg-emerald-500/20 border border-emerald-500/20'
                                : answers[question.id] === option.option_id && !option.is_correct
                                  ? 'bg-red-500/20 border border-red-500/20'
                                  : 'bg-dark-300/50 hover:bg-dark-300'
                            ) : (
                              answers[question.id] === option.option_id
                                ? 'bg-primary-500/20 border border-primary-500/20'
                                : 'bg-dark-300/50 hover:bg-dark-300'
                            )
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.option_id}
                            checked={answers[question.id] === option.option_id}
                            onChange={() => !quizResult && handleAnswerSelect(question.id, option.option_id)}
                            className="form-radio h-4 w-4 text-primary-500 border-gray-500/20 focus:ring-primary-500"
                            disabled={quizResult !== null}
                          />
                          <span className="ml-3 text-gray-300">{option.text}</span>
                          
                          {quizResult && (
                            <div className="ml-auto">
                              {option.is_correct ? (
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                              ) : (
                                answers[question.id] === option.option_id && (
                                  <XCircle className="h-5 w-5 text-red-400" />
                                )
                              )}
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results (only shown after submission) */}
        {quizResult && (
          <div className="glass-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Quiz Results</GradientText>
              </h2>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary-400" />
                <span className="text-gray-300">Completed</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="h-32 w-32 rounded-full bg-dark-300/80 border-4 border-primary-500/30 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-primary-400">{quizResult?.score}%</span>
                    <p className="text-xs text-gray-400 mt-1">Score</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-dark-300/50 rounded-lg">
                  <div className="text-2xl font-semibold text-emerald-400">
                    {quizResult?.correct}
                  </div>
                  <p className="text-sm text-gray-400">Correct</p>
                </div>
                
                <div className="p-4 bg-dark-300/50 rounded-lg">
                  <div className="text-2xl font-semibold text-red-400">
                    {quizResult?.incorrect}
                  </div>
                  <p className="text-sm text-gray-400">Incorrect</p>
                </div>
              </div>

              <div className="p-4 bg-dark-300/50 rounded-lg">
                <h3 className="font-medium text-gray-200 mb-2">Summary</h3>
                <p className="text-sm text-gray-400">
                  You answered {quizResult?.correct} out of {quizResult?.total_questions} questions correctly.
                </p>
                {quizResult?.score >= 70 ? (
                  <div className="mt-2 flex items-center text-emerald-400">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">You passed this quiz!</span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center text-red-400">
                    <XCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">You did not pass this quiz. Required score: 70%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(-1)}
                className="btn-primary w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Module
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
