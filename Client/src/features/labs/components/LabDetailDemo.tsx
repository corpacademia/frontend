
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Star, 
  Clock, 
  Users, 
  Tag,
  Cloud,
  MapPin,
  Calendar,
  Layers,
  Play,
  Edit,
  User,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { formatDate } from '../../../utils/date';

// Demo data for Cloud Slice with modules
const demoLab = {
  id: 'cloud-slice-demo-1',
  title: 'AWS DevOps Pipeline with Microservices',
  description: 'Master the art of building scalable DevOps pipelines using AWS services. This comprehensive lab covers CI/CD implementation, containerization with Docker, orchestration with Kubernetes, and monitoring with CloudWatch and Prometheus.',
  type: 'cloud-slice',
  provider: 'aws',
  region: 'us-east-1',
  services: ['EC2', 'ECS', 'EKS', 'CodePipeline', 'CodeBuild', 'CloudWatch', 'S3', 'RDS', 'Lambda'],
  difficulty: 'Advanced',
  duration: 180,
  rating: 4.8,
  totalEnrollments: 1247,
  price: 49.99,
  modules: [
    {
      id: 'module-1',
      title: 'Infrastructure Setup',
      description: 'Set up the foundational AWS infrastructure including VPC, subnets, and security groups.',
      exercises: [
        { title: 'Create VPC and Subnets', type: 'lab' },
        { title: 'Configure Security Groups', type: 'lab' },
        { title: 'Infrastructure Knowledge Check', type: 'quiz' }
      ]
    },
    {
      id: 'module-2', 
      title: 'CI/CD Pipeline Configuration',
      description: 'Build automated CI/CD pipelines using AWS CodePipeline and CodeBuild.',
      exercises: [
        { title: 'Setup CodePipeline', type: 'lab' },
        { title: 'Configure Build Stages', type: 'lab' },
        { title: 'Deployment Strategies', type: 'lab' },
        { title: 'Pipeline Assessment', type: 'quiz' }
      ]
    },
    {
      id: 'module-3',
      title: 'Container Orchestration',
      description: 'Deploy and manage containerized applications using Amazon EKS.',
      exercises: [
        { title: 'EKS Cluster Setup', type: 'lab' },
        { title: 'Deploy Microservices', type: 'lab' },
        { title: 'Scaling and Load Balancing', type: 'lab' },
        { title: 'Kubernetes Concepts Quiz', type: 'quiz' }
      ]
    }
  ],
  startDate: '2024-04-01T09:00:00Z',
  endDate: '2024-04-30T18:00:00Z',
  technologies: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform']
};

const demoReviews = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Alex Chen',
    userAvatar: '',
    labId: demoLab.id,
    rating: 5,
    comment: 'Outstanding lab! The modular approach makes it easy to follow, and the hands-on exercises really help solidify the concepts. The AWS integration is seamless.',
    createdAt: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Sarah Johnson',
    userAvatar: '',
    labId: demoLab.id,
    rating: 4,
    comment: 'Great content and well-structured modules. The CI/CD section was particularly valuable. Could use a bit more detail in the monitoring section.',
    createdAt: '2024-03-10T14:45:00Z',
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Michael Rodriguez',
    userAvatar: '',
    labId: demoLab.id,
    rating: 5,
    comment: 'Perfect for DevOps engineers looking to upskill on AWS. The practical exercises mirror real-world scenarios.',
    createdAt: '2024-03-08T16:20:00Z',
  }
];

export const LabDetailDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState(demoReviews);

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleSubmitReview = () => {
    if (!newReview.comment.trim()) return;
    
    const review = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Demo User',
      userAvatar: '',
      labId: demoLab.id,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString(),
    };

    setReviews(prev => [review, ...prev]);
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  return (
    <div className="min-h-screen bg-dark-100">
      {/* Header */}
      <div className="bg-dark-200/80 backdrop-blur-sm border-b border-primary-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Labs</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Lab</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lab Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-primary-500/10 p-6">
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold mb-2">
                    <GradientText>{demoLab.title}</GradientText>
                  </h1>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-amber-400 fill-current" />
                      <span>{demoLab.rating}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-primary-400" />
                      <span>{demoLab.totalEnrollments}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-secondary-400" />
                      <span>{demoLab.duration}m</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-primary-300">{demoLab.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-primary-300">Cloud Slice</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-emerald-300">${demoLab.price}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Technologies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {demoLab.technologies.map((tech, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-dark-400/50 text-primary-300 rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full btn-primary flex items-center justify-center space-x-2">
                  <Play className="h-4 w-4" />
                  <span>Start Lab</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-primary-500/10 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-300">About This Lab</h2>
              <p className="text-gray-400 leading-relaxed">{demoLab.description}</p>
            </div>

            {/* Cloud Configuration */}
            <div className="bg-dark-300/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Cloud Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-400">
                  <Cloud className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Provider: {demoLab.provider.toUpperCase()}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Region: {demoLab.region}</span>
                </div>
              </div>
            </div>

            {/* Available Services */}
            <div className="bg-dark-300/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Available AWS Services</h3>
              <div className="flex flex-wrap gap-2">
                {demoLab.services.map((service, index) => (
                  <span key={index} className="px-3 py-1 text-sm bg-primary-500/20 text-primary-300 rounded-full">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Learning Modules */}
            <div className="bg-dark-300/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Learning Modules</h3>
              <div className="space-y-4">
                {demoLab.modules.map((module, index) => (
                  <div key={module.id} className="border border-primary-500/20 rounded-lg p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer" 
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-300">{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-gray-300">{module.title}</h4>
                      </div>
                      {expandedModules[module.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {expandedModules[module.id] && (
                      <div className="mt-4 pl-11 space-y-3">
                        <p className="text-sm text-gray-400">{module.description}</p>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-300">Exercises:</h5>
                          {module.exercises.map((exercise: any, exIndex: number) => (
                            <div key={exIndex} className="flex items-center text-sm text-gray-400 pl-4">
                              <div className={`w-2 h-2 rounded-full mr-3 ${
                                exercise.type === 'lab' ? 'bg-primary-400' : 'bg-secondary-400'
                              }`}></div>
                              <span className="flex-1">{exercise.title}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                exercise.type === 'lab' 
                                  ? 'bg-primary-500/20 text-primary-300' 
                                  : 'bg-secondary-500/20 text-secondary-300'
                              }`}>
                                {exercise.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-dark-300/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-400">
                  <Calendar className="h-5 w-5 mr-3 text-primary-400" />
                  <span>Start: {formatDateTime(demoLab.startDate)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Calendar className="h-5 w-5 mr-3 text-secondary-400" />
                  <span>End: {formatDateTime(demoLab.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-primary-500/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-300">Reviews & Ratings</h2>
                <button 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-secondary text-sm"
                >
                  Write Review
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6 p-4 bg-dark-300/50 rounded-lg border border-primary-500/20">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className={`p-1 transition-colors ${
                            star <= newReview.rating ? 'text-amber-400' : 'text-gray-500'
                          }`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Comment</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none
                               resize-none h-20"
                      placeholder="Share your experience with this lab..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSubmitReview}
                      disabled={!newReview.comment.trim()}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span>Submit</span>
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-dark-300/30 rounded-lg border border-primary-500/10">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-300">{review.userName}</h4>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${
                                  star <= review.rating ? 'text-amber-400 fill-current' : 'text-gray-500'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(review.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-400">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
