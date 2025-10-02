import { switchNetwork, BASE_SEPOLIA_PARAMS } from '../utils/walletUtils';

const NetworkStatus = ({ networkId, expectedChainId = 84532 }) => {
  const isCorrectNetwork = networkId === expectedChainId;

  if (!networkId) return null;

  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-yellow-800 text-sm">
            ⚠️ Wrong Network - Please switch to Base Sepolia
          </div>
          <button
            onClick={() => switchNetwork(BASE_SEPOLIA_PARAMS)}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
          >
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-green-600 text-sm flex items-center">
      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
      Connected to Base Sepolia
    </div>
  );
};

export default NetworkStatus;