import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Dummy past event data
  const pastEvents = [
    {
      id: 1,
      title: "Tech Ignite Conference 2024",
      date: "2025-06-15",
      location: "Kisumu, Kenya",
      totalTickets: 300,
      soldTickets: 285,
      revenue: 18500,
      status: "ended",
      image: "/api/placeholder/300/200"
    }
  ];

  const handleEventClick = (eventId) => {
    navigate(`/dashboard/event/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-300">Manage your events and track performance</p>
        </div>

        <div className="grid gap-6">
          {pastEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event.id)}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{event.title.charAt(0)}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {event.title}
                    </h3>
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4" />
                      {event.soldTickets}/{event.totalTickets} sold
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      ${event.revenue.toLocaleString()} revenue
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;