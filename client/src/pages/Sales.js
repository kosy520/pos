import React, { useState, useEffect } from 'react';
import { sales as salesApi, products, customers as customersApi } from '../services/api';

function Sales() {
  const [salesList, setSalesList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [productList, setProductList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    loadSales();
    loadProducts();
    loadCustomers();
  }, []);

  const loadSales = async () => {
    try {
      const response = await salesApi.getAll();
      setSalesList(response.data);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await products.getAll();
      setProductList(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customersApi.getAll();
      setCustomerList(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: parseInt(quantity) }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    try {
      const response = await salesApi.create({
        customer_id: selectedCustomer || null,
        items: cart,
        payment_method: paymentMethod,
        notes: notes
      });

      setQrCode(response.data.qr_code);
      alert(`Sale created successfully! Invoice: ${response.data.invoice_number}`);
      
      // Reset form
      setCart([]);
      setSelectedCustomer('');
      setNotes('');
      loadSales();
    } catch (error) {
      alert('Error creating sale: ' + (error.response?.data?.error || error.message));
    }
  };

  const closeQrModal = () => {
    setQrCode(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Sales</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'View Sales' : '+ New Sale'}
          </button>
        </div>

        {showForm ? (
          <div>
            <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
              <h3>New Sale</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Customer (Optional)</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">Walk-in Customer</option>
                    {customerList.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Payment</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <h3>Products</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {productList.map(product => (
                    <div
                      key={product.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #ddd',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <strong>{product.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Stock: {product.quantity} | ${product.price}
                        </div>
                      </div>
                      <button className="btn btn-primary">Add</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Cart</h3>
                {cart.length === 0 ? (
                  <div className="alert alert-warning">Cart is empty</div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div
                        key={item.product_id}
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #ddd',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            ${item.unit_price} x {item.quantity} = ${(item.unit_price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.product_id, e.target.value)}
                          style={{ width: '60px' }}
                        />
                      </div>
                    ))}
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '15px', 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    }}>
                      <h3>Total: ${calculateTotal().toFixed(2)}</h3>
                    </div>
                    <button 
                      className="btn btn-success" 
                      style={{ width: '100%', marginTop: '10px' }}
                      onClick={handleSubmit}
                    >
                      Complete Sale
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {salesList.map(sale => (
                  <tr key={sale.id}>
                    <td>{sale.invoice_number}</td>
                    <td>{sale.customer_name || 'Walk-in'}</td>
                    <td>${sale.total_amount.toFixed(2)}</td>
                    <td>{sale.payment_method}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: sale.status === 'completed' ? '#d4edda' : '#fff3cd',
                        color: sale.status === 'completed' ? '#155724' : '#856404'
                      }}>
                        {sale.status}
                      </span>
                    </td>
                    <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {salesList.length === 0 && (
              <div className="alert alert-warning">No sales found</div>
            )}
          </>
        )}
      </div>

      {qrCode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px' }}>
            <h3>Sale Completed!</h3>
            <div className="qr-code">
              <img src={qrCode} alt="Invoice QR Code" />
              <p>Scan this QR code for invoice details</p>
            </div>
            <button className="btn btn-primary" onClick={closeQrModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
