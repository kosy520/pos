import React, { useState, useEffect } from 'react';
import { invoices as invoicesApi, customers as customersApi } from '../services/api';

function Invoices() {
  const [invoiceList, setInvoiceList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    type: 'sales',
    total_amount: '',
    tax_amount: '',
    due_date: '',
    notes: '',
    status: 'draft'
  });
  const [qrCode, setQrCode] = useState(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [filterType]);

  const loadInvoices = async () => {
    try {
      const params = filterType ? { type: filterType } : {};
      const response = await invoicesApi.getAll(params);
      setInvoiceList(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await invoicesApi.create(formData);
      setQrCode(response.data.qr_code);
      alert(`Invoice created successfully! #${response.data.invoice_number}`);
      resetForm();
      loadInvoices();
    } catch (error) {
      alert('Error creating invoice: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      type: 'sales',
      total_amount: '',
      tax_amount: '',
      due_date: '',
      notes: '',
      status: 'draft'
    });
    setShowForm(false);
  };

  const getInvoiceTypeLabel = (type) => {
    const labels = {
      'purchase': 'Purchase Order',
      'proforma': 'Proforma Invoice',
      'sales': 'Sales Invoice'
    };
    return labels[type] || type;
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Three-Way Invoicing</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Invoice'}
          </button>
        </div>

        <div className="alert alert-warning">
          <strong>Three-Way Invoicing System:</strong> Purchase Orders (PO), Proforma Invoices (PI), and Sales Invoices (SI)
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h3>Create Invoice</h3>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label>Invoice Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="purchase">Purchase Order (PO)</option>
                  <option value="proforma">Proforma Invoice (PI)</option>
                  <option value="sales">Sales Invoice (SI)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                >
                  <option value="">Select Customer</option>
                  {customerList.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Total Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tax Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="action-buttons">
              <button type="submit" className="btn btn-success">Create Invoice</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px' }}>Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Invoices</option>
            <option value="purchase">Purchase Orders</option>
            <option value="proforma">Proforma Invoices</option>
            <option value="sales">Sales Invoices</option>
          </select>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Type</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {invoiceList.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoice_number}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 
                      invoice.type === 'purchase' ? '#e3f2fd' :
                      invoice.type === 'proforma' ? '#fff3e0' : '#e8f5e9',
                    fontSize: '12px'
                  }}>
                    {getInvoiceTypeLabel(invoice.type)}
                  </span>
                </td>
                <td>{invoice.customer_name || 'N/A'}</td>
                <td>${invoice.total_amount.toFixed(2)}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 
                      invoice.status === 'paid' ? '#d4edda' :
                      invoice.status === 'sent' ? '#fff3cd' :
                      invoice.status === 'cancelled' ? '#f8d7da' : '#e2e3e5',
                    color: 
                      invoice.status === 'paid' ? '#155724' :
                      invoice.status === 'sent' ? '#856404' :
                      invoice.status === 'cancelled' ? '#721c24' : '#383d41'
                  }}>
                    {invoice.status}
                  </span>
                </td>
                <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoiceList.length === 0 && (
          <div className="alert alert-warning">No invoices found</div>
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
            <h3>Invoice Created!</h3>
            <div className="qr-code">
              <img src={qrCode} alt="Invoice QR Code" />
              <p>Scan this QR code for invoice details</p>
            </div>
            <button className="btn btn-primary" onClick={() => setQrCode(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
