import React, { useState, useEffect } from 'react';
import { stockTakes } from '../services/api';

function StockTake() {
  const [stockTakeList, setStockTakeList] = useState([]);
  const [activeStockTake, setActiveStockTake] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadStockTakes();
  }, []);

  const loadStockTakes = async () => {
    try {
      const response = await stockTakes.getAll();
      setStockTakeList(response.data);
    } catch (error) {
      console.error('Error loading stock takes:', error);
    }
  };

  const createNewStockTake = async () => {
    try {
      const response = await stockTakes.create({
        notes: 'Physical stock count'
      });
      alert(`Stock take created: ${response.data.reference}`);
      loadStockTakes();
    } catch (error) {
      alert('Error creating stock take: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadStockTakeDetails = async (id) => {
    try {
      const response = await stockTakes.getById(id);
      setActiveStockTake(response.data);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error loading stock take details:', error);
    }
  };

  const updateItemCount = async (itemId, countedQuantity) => {
    try {
      await stockTakes.updateItem(itemId, { counted_quantity: parseInt(countedQuantity) });
      // Reload details
      if (activeStockTake) {
        loadStockTakeDetails(activeStockTake.id);
      }
    } catch (error) {
      alert('Error updating count: ' + (error.response?.data?.error || error.message));
    }
  };

  const completeStockTake = async (id) => {
    if (!window.confirm('Complete this stock take and adjust inventory? This cannot be undone.')) {
      return;
    }

    try {
      const response = await stockTakes.complete(id);
      alert(response.data.message);
      setActiveStockTake(null);
      setItems([]);
      loadStockTakes();
    } catch (error) {
      alert('Error completing stock take: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Physical Stock Taking</h2>
          <button className="btn btn-primary" onClick={createNewStockTake}>
            + New Stock Take
          </button>
        </div>

        {!activeStockTake ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Started By</th>
                  <th>Started At</th>
                  <th>Completed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockTakeList.map(st => (
                  <tr key={st.id}>
                    <td>{st.reference}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: st.status === 'completed' ? '#d4edda' : '#fff3cd',
                        color: st.status === 'completed' ? '#155724' : '#856404'
                      }}>
                        {st.status}
                      </span>
                    </td>
                    <td>{st.user_name || 'N/A'}</td>
                    <td>{new Date(st.started_at).toLocaleString()}</td>
                    <td>{st.completed_at ? new Date(st.completed_at).toLocaleString() : 'N/A'}</td>
                    <td>
                      {st.status === 'in_progress' && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => loadStockTakeDetails(st.id)}
                        >
                          Count Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {stockTakeList.length === 0 && (
              <div className="alert alert-warning">No stock takes found</div>
            )}
          </>
        ) : (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Stock Take: {activeStockTake.reference}</h3>
                <p>Status: {activeStockTake.status}</p>
              </div>
              <div className="action-buttons">
                <button 
                  className="btn btn-success" 
                  onClick={() => completeStockTake(activeStockTake.id)}
                >
                  Complete Stock Take
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setActiveStockTake(null);
                    setItems([]);
                  }}
                >
                  Back to List
                </button>
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Expected Qty</th>
                  <th>Counted Qty</th>
                  <th>Variance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.sku || 'N/A'}</td>
                    <td>{item.expected_quantity}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.counted_quantity ?? ''}
                        onChange={(e) => {
                          // Update local state
                          setItems(items.map(i => 
                            i.id === item.id 
                              ? { ...i, counted_quantity: e.target.value }
                              : i
                          ));
                        }}
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td style={{
                      color: item.variance !== null && item.variance !== 0 
                        ? (item.variance > 0 ? 'green' : 'red') 
                        : 'inherit',
                      fontWeight: item.variance !== null && item.variance !== 0 ? 'bold' : 'normal'
                    }}>
                      {item.variance !== null ? (item.variance > 0 ? '+' : '') + item.variance : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateItemCount(item.id, item.counted_quantity)}
                        disabled={item.counted_quantity === null || item.counted_quantity === ''}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 && (
              <div className="alert alert-warning">No items in this stock take</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StockTake;
