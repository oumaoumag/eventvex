import React from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

const FeedbackTab = ({ eventData }) => {
  // Dummy feedback data
  const feedbacks = [
    {
      id: 1,
      name: 'John Doe',
      rating: 5,
      comment: 'Amazing event! Great speakers and excellent organization.',
      date: '2024-01-16',
      helpful: 12
    },
    {
      id: 2,
      name: 'Jane Smith',
      rating: 4,
      comment: 'Really enjoyed the networking opportunities. Food could have been better.',
      date: '2024-01-16',
      helpful: 8
    },
    {
      id: 3,
      name: 'Bob Johnson',
      rating: 5,
      comment: 'Outstanding content and venue. Will definitely attend next year!',
      date: '2024-01-17',
      helpful: 15
    }
  ];

  const ratingDistribution = [
    { stars: 5, count: 156, percentage: 67 },
    { stars: 4, count: 52, percentage: 22 },
    { stars: 3, count: 18, percentage: 8 },
    { stars: 2, count: 5, percentage: 2 },
    { stars: 1, count: 3, percentage: 1 }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Overall Rating</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{eventData.rating}</div>
            <div className="flex justify-center gap-1 mb-2">
              {renderStars(Math.round(eventData.rating))}
            </div>
            <div className="text-gray-300">Based on {eventData.feedbackCount} reviews</div>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDistribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm text-gray-300">{item.stars}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 w-8">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Feedback</h3>
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className="border-b border-gray-600 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-white">{feedback.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {renderStars(feedback.rating)}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(feedback.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-3">{feedback.comment}</p>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-green-400 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({feedback.helpful})
                </button>
                <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">89%</div>
          <div className="text-sm text-gray-300">Positive Reviews</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">4.2</div>
          <div className="text-sm text-gray-300">Avg Response Time</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">92%</div>
          <div className="text-sm text-gray-300">Would Recommend</div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTab;