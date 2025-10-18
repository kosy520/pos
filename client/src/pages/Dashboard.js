import React, { useState, useEffect } from 'react';
import { sales, inventory, products } from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [salesSummary, invValue, lowStockProducts] = await Promise.all([
        sales.getSummary(),
        inventory.getValue(),
        products.getLowStock(),
      ]);

      setSummary(salesSummary.data);
      setInventoryValue(invValue.data);
      setLowStock(lowStockProducts.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      
      <div className="grid grid-4">
        <div className="dashboard-card">
          <h3>Total Sales</h3>
          <div className="value">{summary?.total_sales || 0}</div>
        </div>
        
        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <h3>Total Revenue</h3>
          <div className="value">${(summary?.total_revenue || 0).toFixed(2)}</div>
        </div>
        
        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <h3>Inventory Value</h3>
          <div className="value">${(inventoryValue?.total_retail_value || 0).toFixed(2)}</div>
        </div>
        
        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <h3>Total Products</h3>
          <div className="value">{inventoryValue?.total_products || 0}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card">
          <h2>Low Stock Alert</h2>
          <div className="alert alert-warning">
            {lowStock.length} product(s) are running low on stock
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Min Required</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(product => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku || 'N/A'}</td>
                  <td style={{ color: 'red', fontWeight: 'bold' }}>{product.quantity}</td>
                  <td>{product.min_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
