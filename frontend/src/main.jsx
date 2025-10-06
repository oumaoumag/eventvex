import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MiniAppProvider from './components/MiniAppProvider';
import MaintenanceWrapper from './components/MaintenanceWrapper';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Testimonials from './pages/Testimonials';
import Hero from './pages/Hero';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import Qrcode from './pages/Qrcode';
import Footer from './components/Footer';
import Ticketsell from './pages/Ticketsell';
import MintNFT from './pages/MintNFT';
import Ticket from './pages/Ticket';
import Collection from './pages/Collection';
import Teams from './pages/Teams';
import Layout from './Layout';
import './index.css';
import WaitlistPage from './pages/WaitingList';
// Import database utilities for development
import './utils/clearDatabase.js';
import './utils/testTicketCreation.js';

// Initialize database on app start
(async () => {
  try {
    const { default: hybridDB } = await import('./database/HybridDB.js');
    await hybridDB.initialize();
    console.log('✅ Database initialized on app start');
  } catch (error) {
    console.warn('⚠️ Failed to initialize database on app start:', error);
  }
})();
import QuantumTicketResale from './pages/QuantamTicketResale';
import CreateEvent from './pages/CreateEvent';
import EventTicketListing from './pages/EventTicketListing';
import TicketPurchasePage from './pages/TicketPurchasePage';
import Dashboard from './pages/Dashboard';
import EventDashboard from './pages/EventDashboard';
import MaintenancePage from './pages/MaintenancePage';

// Initialize theme before rendering the app
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Add transition after initial render to prevent flash of unstyled content
setTimeout(() => {
  document.documentElement.classList.add('transition-theme');
}, 0);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MaintenanceWrapper><Layout><Home /></Layout></MaintenanceWrapper>,
  },
  {
    path: "discover",
    element: <MaintenanceWrapper><Layout><Discover /></Layout></MaintenanceWrapper>,
  },
  {
    path: "testimonials",
    element: <MaintenanceWrapper><Layout><Testimonials /></Layout></MaintenanceWrapper>,
  },
  {
    path: "qrcode",
    element: <MaintenanceWrapper><Layout><Qrcode /></Layout></MaintenanceWrapper>,
  },
  {
    path: "ticket",
    element: <MaintenanceWrapper><Layout><Ticket /></Layout></MaintenanceWrapper>,
  },
  {
    path: "collection",
    element: <MaintenanceWrapper><Layout><Collection /></Layout></MaintenanceWrapper>,
  },
  {
    path: "teams",
    element: <MaintenanceWrapper><Layout><Teams /></Layout></MaintenanceWrapper>,
  },
  {
    path: "ticketsell",
    element: <MaintenanceWrapper><Layout><Ticketsell /></Layout></MaintenanceWrapper>
  },
  {
    path: "hero",
    element: <MaintenanceWrapper><Layout><Hero /></Layout></MaintenanceWrapper>,
  },
  {
    path: "event",
    element: <MaintenanceWrapper><Layout><EventList /></Layout></MaintenanceWrapper>,
  },
  // {
  //   path: "mint",
  //   element: <Layout><MintNFT /></Layout>,
  // },

  {
    path: "event-details",
    element: <MaintenanceWrapper><Layout><EventDetails /></Layout></MaintenanceWrapper>,
  },

  {
    path: "create",
    element: <MaintenanceWrapper><Layout><CreateEvent /></Layout></MaintenanceWrapper>,
  },

  {
    path: "waiting",
    element: <Layout><WaitlistPage /></Layout>
  },

  {
    path: "resell",
    element: <MaintenanceWrapper><Layout><QuantumTicketResale /></Layout></MaintenanceWrapper>
  },

  {
    path: "event/:eventId/tickets",
    element: <MaintenanceWrapper><Layout><EventTicketListing /></Layout></MaintenanceWrapper>
  },

  {
    path: "ticket-purchase",
    element: <MaintenanceWrapper><Layout><TicketPurchasePage /></Layout></MaintenanceWrapper>
  },

  {
    path: "dashboard",
    element: <MaintenanceWrapper><Layout><Dashboard /></Layout></MaintenanceWrapper>
  },

  {
    path: "dashboard/event/:eventId",
    element: <MaintenanceWrapper><Layout><EventDashboard /></Layout></MaintenanceWrapper>
  },

  {
    path: "maintenance",
    element: <MaintenancePage />
  },

  {
    path: "*",
    element: <Footer />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MiniAppProvider>
      <RouterProvider router={router} />
    </MiniAppProvider>
  </React.StrictMode>
);