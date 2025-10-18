import React, { useState, useEffect } from 'react';
import { products } from '../services/api';

function Products() {
  const [productList, setProductList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: '',
    cost: '',
    quantity: '',
    min_quantity: '',
    category: '',
    unit: 'piece'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await products.getAll({ search: searchTerm });
      setProductList(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await products.update(editingId, formData);
      } else {
        await products.create(formData);
      }
      resetForm();
      loadProducts();
    } catch (error) {
      alert('Error saving product: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await products.delete(id);
        loadProducts();
      } catch (error) {
        alert('Error deleting product: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      price: '',
      cost: '',
      quantity: '',
      min_quantity: '',
      category: '',
      unit: 'piece'
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Products</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
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
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Min Quantity</label>
                <input
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="g">Gram</option>
                  <option value="l">Liter</option>
                  <option value="ml">Milliliter</option>
                  <option value="box">Box</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="action-buttons">
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') loadProducts();
            }}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productList.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku || 'N/A'}</td>
                <td>{product.category || 'N/A'}</td>
                <td>${product.price}</td>
                <td style={{ 
                  color: product.quantity <= product.min_quantity ? 'red' : 'inherit',
                  fontWeight: product.quantity <= product.min_quantity ? 'bold' : 'normal'
                }}>
                  {product.quantity}
                </td>
                <td>{product.unit}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => handleEdit(product)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(product.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productList.length === 0 && (
          <div className="alert alert-warning">No products found</div>
        )}
      </div>
    </div>
  );
}

export default Products;
