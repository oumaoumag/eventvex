import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Star, TrendingUp } from 'lucide-react';
import OverviewTab from '../components/dashboard/OverviewTab';
import GuestListTab from '../components/dashboard/GuestListTab';
import InsightsTab from '../components/dashboard/InsightsTab';
import FeedbackTab from '../components/dashboard/FeedbackTab';

const EventDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Dummy event data
  const eventData = {
    id: 1,
    title: "Tech Conference 2024",
    date: "2024-01-15",
    location: "San Francisco, CA",
    totalTickets: 500,
    soldTickets: 485,
    revenue: 48500,
    status: "ended",
    attendees: 465,
    rating: 4.8,
    feedbackCount: 234
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'guests', label: 'Guest List', icon: Users },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'feedback', label: 'Feedback', icon: Star }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab eventData={eventData} />;
      case 'guests':
        return <GuestListTab eventData={eventData} />;
      case 'insights':
        return <InsightsTab eventData={eventData} />;
      case 'feedback':
        return <FeedbackTab eventData={eventData} />;
      default:
        return <OverviewTab eventData={eventData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{eventData.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-300">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(eventData.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {eventData.location}
              </div>
              <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                {eventData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDashboard;