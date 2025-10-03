import React from 'react';
import { CheckCircle, Users, Calendar, MessageSquare, Star } from 'lucide-react';

const OverviewTab = ({ eventData }) => {
  return (
    <div className="space-y-6">
      {/* Event Status */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Event Status</h3>
        </div>
        <p className="text-gray-300">This event has ended successfully on {new Date(eventData.date).toLocaleDateString()}</p>
      </div>

      {/* Guest List Overview */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Guest List Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{eventData.soldTickets}</div>
            <div className="text-sm text-gray-300">Tickets Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{eventData.attendees}</div>
            <div className="text-sm text-gray-300">Attended</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{Math.round((eventData.attendees / eventData.soldTickets) * 100)}%</div>
            <div className="text-sm text-gray-300">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Event Recap */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Event Recap</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-300 mb-1">Total Revenue</div>
            <div className="text-xl font-bold text-green-400">${eventData.revenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-1">Capacity Utilization</div>
            <div className="text-xl font-bold text-blue-400">{Math.round((eventData.soldTickets / eventData.totalTickets) * 100)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-1">Average Rating</div>
            <div className="text-xl font-bold text-yellow-400">{eventData.rating}/5</div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-1">No-Shows</div>
            <div className="text-xl font-bold text-red-400">{eventData.soldTickets - eventData.attendees}</div>
          </div>
        </div>
      </div>

      {/* Feedback Overview */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Feedback Overview</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">{eventData.feedbackCount}</div>
            <div className="text-sm text-gray-300">Total Reviews</div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-lg font-semibold text-white">{eventData.rating}</span>
            <span className="text-gray-300">/5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;