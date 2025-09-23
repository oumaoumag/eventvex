import React, { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

const MiniAppProvider = ({ children }) => {
  useEffect(() => {
    // Initialize MiniApp SDK when component mounts
    const initializeMiniApp = async () => {
      try {
        // Signal that the app is ready to be displayed
        await sdk.actions.ready();
        console.log('MiniApp SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize MiniApp SDK:', error);
      }
    };

    initializeMiniApp();
  }, []);

  return <>{children}</>;
};

export default MiniAppProvider;