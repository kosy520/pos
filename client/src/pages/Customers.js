import React, { useState, useEffect } from 'react';
import { customers as customersApi } from '../services/api';

function Customers() {
  const [customerList, setCustomerList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

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
      if (editingId) {
        await customersApi.update(editingId, formData);
      } else {
        await customersApi.create(formData);
      }
      resetForm();
      loadCustomers();
    } catch (error) {
      alert('Error saving customer: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersApi.delete(id);
        loadCustomers();
      } catch (error) {
        alert('Error deleting customer: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Customers (CRM)</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Customer'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h3>{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
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
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update Customer' : 'Add Customer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customerList.map(customer => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email || 'N/A'}</td>
                <td>{customer.phone || 'N/A'}</td>
                <td>{customer.address || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => handleEdit(customer)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(customer.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customerList.length === 0 && (
          <div className="alert alert-warning">No customers found</div>
        )}
      </div>
    </div>
  );
}

export default Customers;
