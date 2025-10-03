import React, { useState } from 'react';
import { Search, Filter, User, Mail, Phone } from 'lucide-react';

const GuestListTab = ({ eventData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Dummy guest data
  const guests = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', status: 'attended', ticketType: 'VIP' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', status: 'attended', ticketType: 'Regular' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892', status: 'no-show', ticketType: 'Regular' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+1234567893', status: 'attended', ticketType: 'VIP' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '+1234567894', status: 'attended', ticketType: 'Regular' }
  ];

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || guest.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Status</option>
          <option value="attended">Attended</option>
          <option value="no-show">No Show</option>
        </select>
      </div>

      {/* Guest List */}
      <div className="bg-gray-700/50 rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-600/50 text-sm font-medium text-gray-300">
          <div>Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Ticket Type</div>
          <div>Status</div>
        </div>
        
        <div className="divide-y divide-gray-600">
          {filteredGuests.map((guest) => (
            <div key={guest.id} className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-600/30 transition-colors">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-white">{guest.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4" />
                {guest.email}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4" />
                {guest.phone}
              </div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  guest.ticketType === 'VIP' 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {guest.ticketType}
                </span>
              </div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  guest.status === 'attended' 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {guest.status === 'attended' ? 'Attended' : 'No Show'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{guests.length}</div>
          <div className="text-sm text-gray-300">Total Guests</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{guests.filter(g => g.status === 'attended').length}</div>
          <div className="text-sm text-gray-300">Attended</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{guests.filter(g => g.status === 'no-show').length}</div>
          <div className="text-sm text-gray-300">No Shows</div>
        </div>
      </div>
    </div>
  );
};

export default GuestListTab;