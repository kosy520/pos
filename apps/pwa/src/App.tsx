import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Scanner } from './pages/Scanner';
import { Verifier } from './pages/Verifier';
import { SyncStatus } from './pages/SyncStatus';

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <nav style={{
          backgroundColor: '#343a40',
          padding: '15px 20px',
          color: 'white',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <h2 style={{ margin: 0, marginRight: '30px' }}>POS Invoice System</h2>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '8px 15px' }}>
              Scanner
            </Link>
            <Link to="/verifier" style={{ color: 'white', textDecoration: 'none', padding: '8px 15px' }}>
              Verifier
            </Link>
            <Link to="/sync" style={{ color: 'white', textDecoration: 'none', padding: '8px 15px' }}>
              Sync Status
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Scanner />} />
          <Route path="/verifier" element={<Verifier />} />
          <Route path="/sync" element={<SyncStatus />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
