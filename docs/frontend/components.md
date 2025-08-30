# 🧩 EventVex Component Library

> **Comprehensive documentation of React components with Web3 integration capabilities**

## 📋 Table of Contents

- [Overview](#overview)
- [Page Components](#page-components)
- [Shared Components](#shared-components)
- [Integration Components](#integration-components)
- [Component Patterns](#component-patterns)
- [Props Documentation](#props-documentation)
- [Usage Examples](#usage-examples)

## 🎯 Overview

The EventVex component library consists of page-level components for major user flows and shared components for common functionality. All components maintain existing UI/UX while adding Web3 integration capabilities.

### Component Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Page Components** | Full page interfaces | CreateEvent, EventTicketListing |
| **Shared Components** | Reusable UI elements | TicketPurchase, WalletConnection |
| **Integration Components** | Web3-specific functionality | ContractInteraction, NetworkStatus |
| **Layout Components** | Structure and navigation | Header, Footer, Sidebar |

## 📄 Page Components

### **CreateEvent.jsx**

Event creation interface with smart contract integration.

#### **Features**
- Form validation and submission
- EventFactory contract integration
- POAP and badge creation options
- Real-time transaction feedback

#### **Props**
```typescript
interface CreateEventProps {
  // No props - standalone page component
}
```

#### **State Management**
```javascript
const [eventData, setEventData] = useState({
  name: '',
  date: '',
  venue: '',
  ticketPrice: '',
  totalTickets: '',
  description: ''
});

const [isLoading, setIsLoading] = useState(false);
const [contractConfigValid, setContractConfigValid] = useState(false);
```

#### **Integration Points**
- `createEvent()` - Smart contract event creation
- `connectWallet()` - Wallet connection requirement
- `validateContractConfig()` - Configuration validation

#### **Usage**
```javascript
import CreateEvent from '../pages/CreateEvent';

// Used in router configuration
<Route path="/create-event" element={<CreateEvent />} />
```

### **EventTicketListing.jsx**

Event details and ticket availability display.

#### **Features**
- Blockchain event loading with fallback
- Real-time seat availability
- Ticket purchase integration
- Event information display

#### **Props**
```typescript
interface EventTicketListingProps {
  // Uses URL parameters for event ID
}
```

#### **Integration Points**
- `getEventDetails()` - Load event from blockchain
- `getAvailableSeats()` - Real-time seat availability
- Fallback to sample data for existing events

#### **Data Flow**
```javascript
// Load event from blockchain first
const blockchainEvent = await getEventDetails(parseInt(eventId));
const availableSeats = await getAvailableSeats(blockchainEvent.contractAddress);

// Convert to component format
const formattedEvent = {
  id: blockchainEvent.id,
  name: blockchainEvent.title,
  contractAddress: blockchainEvent.contractAddress,
  // ... other properties
};
```

### **TicketPurchasePage.jsx**

Complete ticket purchase flow for original and resale tickets.

#### **Features**
- Original ticket purchasing
- Resale ticket purchasing
- Payment processing
- Transaction confirmation

#### **Props**
```typescript
interface TicketPurchasePageProps {
  // Uses location state for ticket and event data
}
```

#### **Integration Points**
- `purchaseTicket()` - Original ticket minting
- `buyResaleTicket()` - Resale ticket purchase
- Smart contract payment distribution

### **QuantamTicketResale.tsx**

Ticket resale marketplace interface.

#### **Features**
- List tickets for resale
- Browse resale marketplace
- Secure transaction processing
- Wallet integration

#### **Props**
```typescript
interface QuantamTicketResaleProps {
  // No props - standalone page component
}
```

#### **Integration Points**
- `listTicketForResale()` - List tickets for sale
- `buyResaleTicket()` - Purchase resale tickets
- `getUserTickets()` - Load user's tickets

## 🔄 Shared Components

### **TicketPurchase.jsx**

Reusable ticket purchase component with seat selection.

#### **Features**
- Seat selection interface
- Wallet connection validation
- Purchase transaction handling
- Success/error feedback

#### **Props**
```typescript
interface TicketPurchaseProps {
  eventContractAddress: string;    // Event contract address
  ticketPrice?: number;           // Ticket price in ETH
  eventId?: string;               // Event identifier
  onPurchaseSuccess?: (result: PurchaseResult) => void; // Success callback
}

interface PurchaseResult {
  tokenId: number;
  txHash: string;
}
```

#### **Usage Example**
```javascript
<TicketPurchase
  eventContractAddress="0x123..."
  ticketPrice={0.01}
  eventId="1"
  onPurchaseSuccess={(result) => {
    console.log('Ticket purchased:', result.tokenId);
    refreshEventData();
  }}
/>
```

#### **State Management**
```javascript
const [selectedSeat, setSelectedSeat] = useState(null);
const [availableSeats, setAvailableSeats] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
```

#### **Integration Flow**
```javascript
// Load available seats on mount
useEffect(() => {
  if (eventContractAddress) {
    const loadSeats = async () => {
      const seats = await getAvailableSeats(eventContractAddress);
      setAvailableSeats(seats);
      if (seats.length > 0) {
        setSelectedSeat(seats[0]);
      }
    };
    loadSeats();
  }
}, [eventContractAddress]);

// Handle purchase
const handlePurchase = async () => {
  const result = await purchaseTicket(
    eventContractAddress,
    selectedSeat,
    pricePerTicket.toString()
  );
  
  if (onPurchaseSuccess) {
    onPurchaseSuccess(result);
  }
};
```

## 🔌 Integration Components

### **WalletConnection Component**

Standardized wallet connection interface.

#### **Features**
- Multi-wallet support
- Network validation
- Connection state management
- Error handling

#### **Props**
```typescript
interface WalletConnectionProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  showNetworkStatus?: boolean;
  className?: string;
}
```

#### **Usage**
```javascript
<WalletConnection
  onConnect={(address) => setUserAddress(address)}
  onDisconnect={() => setUserAddress('')}
  showNetworkStatus={true}
  className="mb-4"
/>
```

### **NetworkStatus Component**

Network validation and switching interface.

#### **Features**
- Current network display
- Network switching prompts
- Visual status indicators
- Error messaging

#### **Props**
```typescript
interface NetworkStatusProps {
  requiredChainId?: number;
  onNetworkSwitch?: (chainId: number) => void;
  showSwitchButton?: boolean;
}
```

### **TransactionStatus Component**

Transaction progress and status display.

#### **Features**
- Loading states
- Transaction hash display
- Block explorer links
- Error handling

#### **Props**
```typescript
interface TransactionStatusProps {
  txHash?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  onRetry?: () => void;
}
```

## 🎨 Component Patterns

### **Higher-Order Components (HOCs)**

#### **withWalletConnection**
```javascript
const withWalletConnection = (WrappedComponent) => {
  return (props) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
      checkWalletConnection().then(address => {
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
        }
      });
    }, []);

    if (!isConnected) {
      return <WalletConnectionPrompt />;
    }

    return (
      <WrappedComponent
        {...props}
        walletAddress={walletAddress}
        isConnected={isConnected}
      />
    );
  };
};

// Usage
const ProtectedEventCreation = withWalletConnection(CreateEvent);
```

### **Custom Hooks**

#### **useWallet**
```javascript
const useWallet = () => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connect = async () => {
    setIsLoading(true);
    try {
      const { address } = await connectWallet();
      setAddress(address);
      setIsConnected(true);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAddress('');
    setIsConnected(false);
  };

  return { address, isConnected, isLoading, connect, disconnect };
};
```

#### **useContract**
```javascript
const useContract = (contractAddress, needsSigner = false) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const contractInstance = await getEventTicketContract(
          contractAddress,
          needsSigner
        );
        setContract(contractInstance);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (contractAddress) {
      loadContract();
    }
  }, [contractAddress, needsSigner]);

  return { contract, loading, error };
};
```

### **Error Boundaries**

#### **Web3ErrorBoundary**
```javascript
class Web3ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Web3 Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium">Web3 Connection Error</h3>
          <p className="text-red-600 mt-2">
            There was an issue connecting to the blockchain. Please refresh the page and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 📝 Props Documentation

### **Common Props Patterns**

#### **Event Props**
```typescript
interface EventProps {
  eventId: string;
  eventContractAddress: string;
  eventData?: {
    title: string;
    date: Date;
    location: string;
    ticketPrice: string;
    maxTickets: number;
  };
}
```

#### **Transaction Props**
```typescript
interface TransactionProps {
  onTransactionStart?: () => void;
  onTransactionSuccess?: (txHash: string) => void;
  onTransactionError?: (error: Error) => void;
  gasLimit?: number;
  gasPrice?: string;
}
```

#### **Wallet Props**
```typescript
interface WalletProps {
  walletAddress?: string;
  isConnected?: boolean;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  requiredNetwork?: number;
}
```

## 💡 Usage Examples

### **Complete Event Creation Flow**
```javascript
const EventCreationPage = () => {
  const { address, isConnected, connect } = useWallet();
  const [eventCreated, setEventCreated] = useState(false);

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <h2>Connect Your Wallet</h2>
        <p>Please connect your wallet to create events</p>
        <button onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  if (eventCreated) {
    return <EventCreationSuccess />;
  }

  return (
    <Web3ErrorBoundary>
      <CreateEvent onEventCreated={() => setEventCreated(true)} />
    </Web3ErrorBoundary>
  );
};
```

### **Ticket Purchase Integration**
```javascript
const EventDetailsPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);

  const handlePurchaseSuccess = (result) => {
    // Refresh event data to show updated seat availability
    loadEventData();
    
    // Show success message
    toast.success(`Ticket purchased! Token ID: ${result.tokenId}`);
  };

  return (
    <div>
      <EventHeader event={event} />
      <TicketPurchase
        eventContractAddress={event?.contractAddress}
        ticketPrice={event?.ticketPrice}
        eventId={eventId}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};
```

## 🔗 Related Documentation

- [Frontend Architecture](./README.md)
- [Wallet Integration](./wallet-integration.md)
- [Web3 Integration](../web3/README.md)
- [Development Guide](../development/getting-started.md)

---

**Next**: [Mobile Optimization Guide](./mobile.md) →
