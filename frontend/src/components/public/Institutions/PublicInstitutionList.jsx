// src/components/public/Institutions/PublicInstitutionList.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const PublicInstitutionList = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    search: ''
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [institutions, filters]);

  const fetchInstitutions = async () => {
    try {
      const response = await get('/public/institutions');
      if (response.data.success) {
        setInstitutions(response.data.institutions);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      addNotification('Error loading institutions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = institutions;

    if (filters.type) {
      filtered = filtered.filter(inst => inst.institutionType === filters.type);
    }

    if (filters.location) {
      filtered = filtered.filter(inst => 
        inst.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        inst.country?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(inst => 
        inst.name.toLowerCase().includes(searchLower) ||
        inst.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredInstitutions(filtered);
  };

  const institutionTypes = [...new Set(institutions.map(inst => inst.institutionType).filter(Boolean))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="public-institution-list">
      <div className="page-header">
        <h1>Educational Institutions</h1>
        <p>Discover top educational institutions and their programs</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Institution Type</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="">All Types</option>
              {institutionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="City or country..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search institutions..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Institutions Grid */}
      <div className="institutions-section">
        <div className="section-header">
          <h2>Partner Institutions ({filteredInstitutions.length})</h2>
        </div>

        {filteredInstitutions.length > 0 ? (
          <div className="institutions-grid">
            {filteredInstitutions.map(institution => (
              <div key={institution.id} className="institution-card">
                <div className="institution-header">
                  <div className="institution-avatar">
                    {institution.name.charAt(0)}
                  </div>
                  <div className="institution-info">
                    <h3 className="institution-name">{institution.name}</h3>
                    <p className="institution-type">{institution.institutionType}</p>
                  </div>
                </div>

                <div className="institution-details">
                  <div className="detail-item">
                    <span className="label">Location:</span>
                    <span className="value">
                      {institution.city && `${institution.city}, `}{institution.country}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Established:</span>
                    <span className="value">{institution.establishedYear}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Courses:</span>
                    <span className="value">{institution.courseCount || 0} programs</span>
                  </div>
                </div>

                {institution.description && (
                  <div className="institution-description">
                    {institution.description.length > 150 
                      ? `${institution.description.substring(0, 150)}...`
                      : institution.description
                    }
                  </div>
                )}

                <div className="institution-actions">
                  <button className="btn-outline">View Profile</button>
                  <button className="btn-primary">View Courses</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <h3>No institutions found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicInstitutionList;