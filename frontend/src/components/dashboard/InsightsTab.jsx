import React from 'react';
import { TrendingUp, DollarSign, Users, Ticket } from 'lucide-react';

const InsightsTab = ({ eventData }) => {
  // Dummy data for visualizations
  const ticketSalesData = [
    { day: 'Week 1', sales: 45 },
    { day: 'Week 2', sales: 120 },
    { day: 'Week 3', sales: 180 },
    { day: 'Week 4', sales: 140 }
  ];

  const maxSales = Math.max(...ticketSalesData.map(d => d.sales));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-300">Tickets Sold</span>
          </div>
          <div className="text-2xl font-bold text-white">{eventData.soldTickets}</div>
          <div className="text-sm text-green-400">97% of capacity</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Revenue</span>
          </div>
          <div className="text-2xl font-bold text-white">${eventData.revenue.toLocaleString()}</div>
          <div className="text-sm text-green-400">+15% vs target</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">Attendance</span>
          </div>
          <div className="text-2xl font-bold text-white">{eventData.attendees}</div>
          <div className="text-sm text-yellow-400">96% show rate</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-300">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold text-white">{eventData.rating}</div>
          <div className="text-sm text-green-400">Excellent</div>
        </div>
      </div>

      {/* Ticket Sales Chart */}
      <div className="bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ticket Sales Over Time</h3>
        <div className="space-y-4">
          {ticketSalesData.map((data, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-300">{data.day}</div>
              <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(data.sales / maxSales) * 100}%` }}
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white font-medium">
                  {data.sales}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">VIP Tickets (50)</span>
              <span className="text-white font-medium">$25,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Regular Tickets (435)</span>
              <span className="text-white font-medium">$21,750</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Processing Fees</span>
              <span className="text-white font-medium">$1,750</span>
            </div>
            <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
              <span className="text-white">Total Revenue</span>
              <span className="text-green-400">${eventData.revenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Attendance Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Check-in Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-600 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }} />
                </div>
                <span className="text-white text-sm">96%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Peak Check-in Time</span>
              <span className="text-white">6:30 PM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Average Stay Duration</span>
              <span className="text-white">3.2 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;