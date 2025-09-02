import React, { useState, useEffect } from 'react';
import { useHybridDB } from '../../hooks/useHybridDB';
import databaseAPI from '../../database/DatabaseAPI';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  HardDrive, 
  Cloud, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * Real-time sync status component for the hybrid database
 */
const SyncStatus = ({ className = "", showDetails = false }) => {
  const { isInitialized, isLoading, error, stats, forceSync, clearCache } = useHybridDB();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncProgress, setSyncProgress] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSyncStarted = () => {
      setSyncStatus('syncing');
      setSyncProgress(0);
    };

    const handleSyncProgress = (data) => {
      setSyncProgress(data.progress || 0);
    };

    const handleSyncCompleted = () => {
      setSyncStatus('completed');
      setLastSync(new Date());
      setSyncProgress(100);
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress(0);
      }, 2000);
    };

    const handleSyncError = (data) => {
      setSyncStatus('error');
      console.error('Sync error:', data);
    };

    // Add event listeners
    databaseAPI.addEventListener('sync_started', handleSyncStarted);
    databaseAPI.addEventListener('sync_progress', handleSyncProgress);
    databaseAPI.addEventListener('events_synced', handleSyncCompleted);
    databaseAPI.addEventListener('tickets_synced', handleSyncCompleted);
    databaseAPI.addEventListener('sync_error', handleSyncError);

    return () => {
      // In a real implementation, you'd remove specific listeners
    };
  }, []);

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return isOnline ? 
          <Wifi className="w-4 h-4 text-green-500" /> : 
          <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return `Syncing... ${syncProgress}%`;
      case 'completed':
        return 'Sync completed';
      case 'error':
        return 'Sync failed';
      default:
        return isOnline ? 'Online' : 'Offline';
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Database className="w-4 h-4 animate-pulse text-gray-400" />
        <span className="text-sm text-gray-500">Initializing database...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Database error</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getSyncStatusIcon()}
          <span className="text-sm font-medium">{getSyncStatusText()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={forceSync}
            disabled={syncStatus === 'syncing' || !isOnline}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Force sync"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
          
          {showDetails && (
            <button
              onClick={clearCache}
              className="p-1 rounded hover:bg-gray-100"
              title="Clear cache"
            >
              <HardDrive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {syncStatus === 'syncing' && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${syncProgress}%` }}
          ></div>
        </div>
      )}

      {/* Detailed stats */}
      {showDetails && stats && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Events:</span>
              <span className="font-medium">{stats.events || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tickets:</span>
              <span className="font-medium">{stats.tickets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Listings:</span>
              <span className="font-medium">{stats.marketplace_listings || 0}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cache:</span>
              <span className="font-medium">{stats.ipfs_cache || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Users:</span>
              <span className="font-medium">{stats.users || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last sync:</span>
              <span className="font-medium">{formatLastSync()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Storage indicators */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <HardDrive className="w-3 h-3" />
            <span>Local</span>
          </div>
          <div className="flex items-center space-x-1">
            <Cloud className="w-3 h-3" />
            <span>IPFS</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Blockchain</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact sync indicator for headers/toolbars
 */
export const SyncIndicator = ({ className = "" }) => {
  const { isInitialized, error } = useHybridDB();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleSyncStarted = () => setSyncStatus('syncing');
    const handleSyncCompleted = () => {
      setSyncStatus('completed');
      setTimeout(() => setSyncStatus('idle'), 2000);
    };
    const handleSyncError = () => setSyncStatus('error');

    databaseAPI.addEventListener('sync_started', handleSyncStarted);
    databaseAPI.addEventListener('events_synced', handleSyncCompleted);
    databaseAPI.addEventListener('sync_error', handleSyncError);

    return () => {
      // Remove listeners
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className={`flex items-center ${className}`}>
        <Database className="w-4 h-4 animate-pulse text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
      </div>
    );
  }

  const getIndicatorColor = () => {
    if (!isOnline) return 'text-gray-400';
    
    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-green-500';
    }
  };

  const getIcon = () => {
    if (syncStatus === 'syncing') {
      return <RefreshCw className={`w-4 h-4 animate-spin ${getIndicatorColor()}`} />;
    }
    
    return isOnline ? 
      <Wifi className={`w-4 h-4 ${getIndicatorColor()}`} /> : 
      <WifiOff className={`w-4 h-4 ${getIndicatorColor()}`} />;
  };

  return (
    <div className={`flex items-center ${className}`} title={isOnline ? 'Online' : 'Offline'}>
      {getIcon()}
    </div>
  );
};

export default SyncStatus;
