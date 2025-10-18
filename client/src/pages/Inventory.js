import React, { useState, useEffect } from 'react';
import { inventory as inventoryApi } from '../services/api';

function Inventory() {
  const [movements, setMovements] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [showAdjustForm, setShowAdjustForm] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      const [movementsResponse, valueResponse] = await Promise.all([
        inventoryApi.getMovements(),
        inventoryApi.getValue()
      ]);
      setMovements(movementsResponse.data);
      setInventoryValue(valueResponse.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Inventory Management</h2>
        
        {inventoryValue && (
          <div className="grid grid-3">
            <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h3>Total Cost Value</h3>
              <div className="value">${(inventoryValue.total_cost_value || 0).toFixed(2)}</div>
            </div>
            
            <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <h3>Total Retail Value</h3>
              <div className="value">${(inventoryValue.total_retail_value || 0).toFixed(2)}</div>
            </div>
            
            <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <h3>Total Units</h3>
              <div className="value">{inventoryValue.total_units || 0}</div>
            </div>
          </div>
        )}

        <h3 style={{ marginTop: '30px' }}>Stock Movements</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Reference</th>
              <th>User</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(movement => (
              <tr key={movement.id}>
                <td>{movement.product_name}</td>
                <td>{movement.sku || 'N/A'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 
                      movement.type === 'sale' ? '#f8d7da' :
                      movement.type === 'addition' ? '#d4edda' :
                      movement.type === 'adjustment' ? '#fff3cd' : '#e2e3e5',
                    fontSize: '12px'
                  }}>
                    {movement.type}
                  </span>
                </td>
                <td style={{
                  color: movement.quantity < 0 ? 'red' : 'green',
                  fontWeight: 'bold'
                }}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </td>
                <td>{movement.reference || 'N/A'}</td>
                <td>{movement.username || 'System'}</td>
                <td>{new Date(movement.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {movements.length === 0 && (
          <div className="alert alert-warning">No stock movements found</div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
