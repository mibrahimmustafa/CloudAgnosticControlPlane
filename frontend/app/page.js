"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Settings, 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  History, 
  KeyRound, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  Check
} from 'lucide-react';

export default function Dashboard() {
  // Navigation
  const [activeTab, setActiveTab] = useState('search');

  // Search Tab States
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Connectors Tab States
  const [connectors, setConnectors] = useState([]);
  const [isConnectorsLoading, setIsConnectorsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState({});
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [savingConnector, setSavingConnector] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState({});
  
  // Connector Form Inputs
  const [apiKeys, setApiKeys] = useState({
    telegram: '',
    google_sheets: '',
    crm: ''
  });
  const [activeToggles, setActiveToggles] = useState({
    telegram: false,
    google_sheets: false,
    crm: false
  });

  // History Tab States
  const [logs, setLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchConnectors();
    fetchLogs();
    checkHealth();
  }, []);

  const fetchConnectors = async () => {
    setIsConnectorsLoading(true);
    try {
      const res = await fetch('/api/connectors');
      if (res.ok) {
        const data = await res.json();
        setConnectors(data);
        
        // Populate form keys and toggles
        const newKeys = { telegram: '', google_sheets: '', crm: '' };
        const newToggles = { telegram: false, google_sheets: false, crm: false };
        
        data.forEach(c => {
          newKeys[c.connector_type] = c.api_key || '';
          newToggles[c.connector_type] = c.is_active === 1;
        });
        
        setApiKeys(newKeys);
        setActiveToggles(newToggles);
      }
    } catch (err) {
      console.error("Error fetching connectors:", err);
    } finally {
      setIsConnectorsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const checkHealth = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      }
    } catch (err) {
      console.error("Error checking connection health:", err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  const handleSearch = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const searchQuery = customQuery !== null ? customQuery : query;
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    if (customQuery !== null) {
      setQuery(customQuery);
      setActiveTab('search');
    }

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, user_id: 1 }),
      });
      const data = await response.json();
      if (response.status === 404) {
        setSearchError("No active connectors configured. Please go to the 'Connectors' tab and activate Telegram, Google Sheets, or CRM credentials.");
        setResults([]);
      } else if (data.error) {
        setSearchError(data.error);
        setResults([]);
      } else {
        setResults(data.results || []);
      }
      // Refresh search history log
      fetchLogs();
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Unable to connect to the search service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConnector = async (type) => {
    setSavingConnector(type);
    try {
      const response = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_type: type,
          api_key: apiKeys[type],
          is_active: activeToggles[type] ? 1 : 0
        })
      });
      if (response.ok) {
        setSaveSuccess(prev => ({ ...prev, [type]: true }));
        setTimeout(() => {
          setSaveSuccess(prev => ({ ...prev, [type]: false }));
        }, 3000);
        // Refresh connector data and connection health checks
        fetchConnectors();
        checkHealth();
      }
    } catch (err) {
      console.error("Error saving connector:", err);
    } finally {
      setSavingConnector(null);
    }
  };

  const handleToggleConnector = (type) => {
    setActiveToggles(prev => {
      const newToggles = { ...prev, [type]: !prev[type] };
      // Auto-save toggle status immediately
      setTimeout(() => {
        saveToggleStatus(type, newToggles[type]);
      }, 50);
      return newToggles;
    });
  };

  const saveToggleStatus = async (type, isActive) => {
    try {
      await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_type: type,
          api_key: apiKeys[type],
          is_active: isActive ? 1 : 0
        })
      });
      fetchConnectors();
      checkHealth();
    } catch (err) {
      console.error("Error saving toggle status:", err);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  // Determine overall health status
  const getOverallHealth = () => {
    const keys = Object.keys(healthStatus);
    if (keys.length === 0) return 'unknown';
    const activeCount = Object.values(activeToggles).filter(Boolean).length;
    if (activeCount === 0) return 'warning';
    
    const trueCount = Object.values(healthStatus).filter(Boolean).length;
    if (trueCount === activeCount) return 'healthy';
    if (trueCount > 0) return 'partial';
    return 'unhealthy';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <Database className="logo-icon" size={26} />
          <span className="logo-text">CAC Plane</span>
        </div>
        
        <nav className="nav-menu">
          <div 
            onClick={() => setActiveTab('search')} 
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          >
            <Search className="nav-icon" size={18} />
            <span>Search Workspace</span>
          </div>
          
          <div 
            onClick={() => setActiveTab('connectors')} 
            className={`nav-item ${activeTab === 'connectors' ? 'active' : ''}`}
          >
            <Settings className="nav-icon" size={18} />
            <span>Integrations</span>
          </div>
          
          <div 
            onClick={() => setActiveTab('history')} 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          >
            <History className="nav-icon" size={18} />
            <span>Search Audit Log</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <p>Cloud Agnostic Control Plane</p>
          <p style={{ marginTop: '4px', opacity: 0.6 }}>v1.0.0 (Demo Mode)</p>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            {activeTab === 'search' && (
              <>
                <h1>Unified Search Intelligence</h1>
                <p>Query all your business data across platforms in real-time from one unified portal.</p>
              </>
            )}
            {activeTab === 'connectors' && (
              <>
                <h1>Integrations & Connectors</h1>
                <p>Manage API credentials and toggle data source aggregations on the control plane.</p>
              </>
            )}
            {activeTab === 'history' && (
              <>
                <h1>Search Audit Logs</h1>
                <p>Audit trail of all executed global queries and search counts for user intelligence.</p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              User ID: <strong>Demo Account (1)</strong>
            </span>
          </div>
        </header>

        {/* Tab content viewports */}
        <div className="tab-pane">
          
          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <>
              <div className="search-form-container">
                <form onSubmit={handleSearch} className="search-box-wrapper">
                  <Search size={22} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a customer, keyword, message or document..."
                    className="search-input"
                  />
                  <button 
                    type="submit" 
                    disabled={isLoading || !query.trim()}
                    className="search-button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="spinner" size={16} />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {searchError && (
                <div style={{
                  maxWidth: '800px',
                  width: '100%',
                  margin: '0 auto',
                  padding: '16px 20px',
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: '16px',
                  color: 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{searchError}</span>
                </div>
              )}

              {results.length > 0 ? (
                <div className="results-grid">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Found <strong>{results.length}</strong> matching entries
                    </span>
                  </div>
                  
                  {results.map((res, idx) => (
                    <div key={idx} className="result-card">
                      <div className="result-body">
                        <div className={`source-icon-badge ${res.source ? res.source.toLowerCase() : 'default'}`}>
                          <Database size={18} />
                        </div>
                        <div className="result-info">
                          <div className="result-header">
                            <span className="source-tag">{res.source}</span>
                            <span className="result-timestamp">{formatTimestamp(res.timestamp)}</span>
                          </div>
                          <p className="result-content">{res.content}</p>
                        </div>
                      </div>
                      <button className="result-action-btn" title="View Source metadata">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !isLoading && !searchError && (
                  <div className="empty-state">
                    <div className="empty-icon-wrapper">
                      <Search size={32} />
                    </div>
                    <h3>No results displayed</h3>
                    <p>Enter a query in the search bar above to fetch aggregated context across all active platforms.</p>
                  </div>
                )
              )}

              {isLoading && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aggregating connector data pools...</p>
                </div>
              )}
            </>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'connectors' && (
            <>
              {/* Connection Health Banner */}
              <div className="health-dashboard">
                <div className="health-status-info">
                  {getOverallHealth() === 'healthy' && (
                    <>
                      <div className="health-indicator all-good" />
                      <div>
                        <div className="health-title">All Connectors Online</div>
                        <div className="health-desc">All configured integrations checked out green and are responding to queries.</div>
                      </div>
                    </>
                  )}
                  {getOverallHealth() === 'partial' && (
                    <>
                      <div className="health-indicator warning" />
                      <div>
                        <div className="health-title">Partial Connection Outage</div>
                        <div className="health-desc">Some enabled connectors are failing authentication tests. Check credentials below.</div>
                      </div>
                    </>
                  )}
                  {getOverallHealth() === 'unhealthy' && (
                    <>
                      <div className="health-indicator error" />
                      <div>
                        <div className="health-title">Data Silos Disconnected</div>
                        <div className="health-desc">None of the enabled connectors are successfully establishing data sessions.</div>
                      </div>
                    </>
                  )}
                  {(getOverallHealth() === 'warning' || getOverallHealth() === 'unknown') && (
                    <>
                      <div className="health-indicator warning" />
                      <div>
                        <div className="health-title">No Connectors Active</div>
                        <div className="health-desc">Activate at least one database credential below to index queries.</div>
                      </div>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={checkHealth} 
                  disabled={isHealthLoading}
                  className="health-refresh-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw className={isHealthLoading ? 'spinner' : ''} size={14} />
                  <span>{isHealthLoading ? 'Testing...' : 'Test Connections'}</span>
                </button>
              </div>

              {isConnectorsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading integrations...</p>
                </div>
              ) : (
                <div className="connectors-grid">
                  
                  {/* Telegram Connector */}
                  <div className="connector-card">
                    <div className="connector-card-header">
                      <div className="connector-info-block">
                        <div className="source-icon-badge telegram">
                          <Database size={18} />
                        </div>
                        <div className="connector-details">
                          <h3>Telegram</h3>
                          <span>Message Aggregator</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span 
                          onClick={() => handleToggleConnector('telegram')}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <span className={`connector-status-pill ${activeToggles.telegram ? 'active' : 'inactive'}`}>
                            {activeToggles.telegram ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="connector-card-body">
                      <p className="connector-description">
                        Indexes chat logs, channels, and conversation contexts in parallel using Telegram Bot Client protocols.
                      </p>
                      
                      <div className="form-group">
                        <label>Bot API Token</label>
                        <div className="form-input-wrapper">
                          <input 
                            type="password"
                            value={apiKeys.telegram}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, telegram: e.target.value }))}
                            placeholder="748392019:AAHfdK_..."
                            className="form-input"
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Connection: {healthStatus.telegram ? (
                            <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>ONLINE</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>OFFLINE</span>
                          )}
                        </span>
                        
                        <button 
                          onClick={() => handleSaveConnector('telegram')}
                          disabled={savingConnector === 'telegram'}
                          className="connector-save-btn"
                          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                        >
                          {savingConnector === 'telegram' ? (
                            <Loader2 className="spinner" size={14} />
                          ) : saveSuccess.telegram ? (
                            <Check size={14} />
                          ) : (
                            <KeyRound size={14} />
                          )}
                          <span>{savingConnector === 'telegram' ? 'Saving...' : saveSuccess.telegram ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Google Sheets Connector */}
                  <div className="connector-card">
                    <div className="connector-card-header">
                      <div className="connector-info-block">
                        <div className="source-icon-badge google_sheets">
                          <Database size={18} />
                        </div>
                        <div className="connector-details">
                          <h3>Google Sheets</h3>
                          <span>Document Sync</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span 
                          onClick={() => handleToggleConnector('google_sheets')}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <span className={`connector-status-pill ${activeToggles.google_sheets ? 'active' : 'inactive'}`}>
                            {activeToggles.google_sheets ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="connector-card-body">
                      <p className="connector-description">
                        Aggregates business datasheets, sales spreadsheets, and client lists from Google Drive storage.
                      </p>
                      
                      <div className="form-group">
                        <label>Google Cloud API Key</label>
                        <div className="form-input-wrapper">
                          <input 
                            type="password"
                            value={apiKeys.google_sheets}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, google_sheets: e.target.value }))}
                            placeholder="AIzaSyA4..."
                            className="form-input"
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Connection: {healthStatus.google_sheets ? (
                            <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>ONLINE</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>OFFLINE</span>
                          )}
                        </span>
                        
                        <button 
                          onClick={() => handleSaveConnector('google_sheets')}
                          disabled={savingConnector === 'google_sheets'}
                          className="connector-save-btn"
                          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                        >
                          {savingConnector === 'google_sheets' ? (
                            <Loader2 className="spinner" size={14} />
                          ) : saveSuccess.google_sheets ? (
                            <Check size={14} />
                          ) : (
                            <KeyRound size={14} />
                          )}
                          <span>{savingConnector === 'google_sheets' ? 'Saving...' : saveSuccess.google_sheets ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CRM Connector */}
                  <div className="connector-card">
                    <div className="connector-card-header">
                      <div className="connector-info-block">
                        <div className="source-icon-badge crm">
                          <Database size={18} />
                        </div>
                        <div className="connector-details">
                          <h3>CRM Portal</h3>
                          <span>Customer Intelligence</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span 
                          onClick={() => handleToggleConnector('crm')}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <span className={`connector-status-pill ${activeToggles.crm ? 'active' : 'inactive'}`}>
                            {activeToggles.crm ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="connector-card-body">
                      <p className="connector-description">
                        Indexes sales pipeline logs, customer logs, and account support tickets from your CRM platform.
                      </p>
                      
                      <div className="form-group">
                        <label>CRM Enterprise Secret</label>
                        <div className="form-input-wrapper">
                          <input 
                            type="password"
                            value={apiKeys.crm}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, crm: e.target.value }))}
                            placeholder="crm_sec_89..."
                            className="form-input"
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Connection: {healthStatus.crm ? (
                            <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>ONLINE</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>OFFLINE</span>
                          )}
                        </span>
                        
                        <button 
                          onClick={() => handleSaveConnector('crm')}
                          disabled={savingConnector === 'crm'}
                          className="connector-save-btn"
                          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                        >
                          {savingConnector === 'crm' ? (
                            <Loader2 className="spinner" size={14} />
                          ) : saveSuccess.crm ? (
                            <Check size={14} />
                          ) : (
                            <KeyRound size={14} />
                          )}
                          <span>{savingConnector === 'crm' ? 'Saving...' : saveSuccess.crm ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

          {/* HISTORY AUDIT TAB */}
          {activeTab === 'history' && (
            <>
              {isLogsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading query history...</p>
                </div>
              ) : logs.length > 0 ? (
                <div className="logs-table-wrapper">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Query String</th>
                        <th>Results Aggregated</th>
                        <th>Execution Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="log-query">"{log.query}"</td>
                          <td>
                            <span className={`log-count-badge ${log.results_count === 0 ? 'zero' : ''}`}>
                              {log.results_count} records
                            </span>
                          </td>
                          <td className="log-time">{formatTimestamp(log.timestamp)}</td>
                          <td>
                            <button 
                              onClick={() => handleSearch(null, log.query)}
                              className="log-action-btn"
                            >
                              <Search size={13} />
                              <span>Search Again</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <History size={32} />
                  </div>
                  <h3>No Search Audit Logs Found</h3>
                  <p>When you start searching, queries and result statistics will automatically log here for audit tracking.</p>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
