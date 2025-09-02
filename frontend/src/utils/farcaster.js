// Farcaster Mini App Integration
export const initFarcasterSDK = () => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    // Running inside Farcaster frame
    return {
      isFrame: true,
      postMessage: (data) => window.parent.postMessage(data, '*')
    };
  }
  return { isFrame: false };
};

export const getFarcasterUser = () => {
  // Get user data from Farcaster context
  const urlParams = new URLSearchParams(window.location.search);
  return {
    fid: urlParams.get('fid'),
    username: urlParams.get('username'),
    pfp: urlParams.get('pfp')
  };
};