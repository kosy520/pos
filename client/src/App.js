import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import StockTake from './pages/StockTake';
import Inventory from './pages/Inventory';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <h1>POS/ERP System</h1>
            <nav className="nav">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/products" className="nav-link">Products</Link>
              <Link to="/sales" className="nav-link">Sales</Link>
              <Link to="/customers" className="nav-link">Customers</Link>
              <Link to="/invoices" className="nav-link">Invoices</Link>
              <Link to="/inventory" className="nav-link">Inventory</Link>
              <Link to="/stock-take" className="nav-link">Stock Take</Link>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/stock-take" element={<StockTake />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Online/Offline indicator */}
        <div className={isOnline ? 'online-indicator' : 'offline-indicator'}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>
    </Router>
  );
}

export default App;
