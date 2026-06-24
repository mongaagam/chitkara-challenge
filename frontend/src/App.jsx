import React, { useState } from 'react';
import { 
  GitBranch, 
  Play, 
  AlertTriangle, 
  Layers, 
  HelpCircle, 
  Terminal, 
  CheckCircle2, 
  AlertOctagon,
  FileCode,
  Network,
  Settings,
  Info
} from 'lucide-react';

// Recursive component to render tree nodes visually
const TreeNode = ({ nodeName, children }) => {
  const childNames = Object.keys(children || {});
  const hasChildren = childNames.length > 0;

  return (
    <div className="tree-node-wrapper">
      <div className="tree-node-item">
        <span className={`tree-node-circle ${hasChildren ? 'has-children' : ''}`}></span>
        <span className="tree-node-name">{nodeName}</span>
      </div>
      {hasChildren && (
        <div className="tree-node-children">
          {childNames.map((childName) => (
            <TreeNode 
              key={childName} 
              nodeName={childName} 
              children={children[childName]} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tree Visualizer Card for each hierarchy component
const TreeVisualizer = ({ hierarchy }) => {
  const { root, tree, depth, has_cycle } = hierarchy;

  return (
    <div className="tree-card">
      <div className="tree-header">
        <div className="tree-title-group">
          <div className="tree-root-badge">{root}</div>
          <div className="tree-label">Component Root: {root}</div>
        </div>
        {has_cycle ? (
          <span className="badge badge-warning">
            <AlertTriangle size={12} /> Cyclic Group
          </span>
        ) : (
          <span className="badge badge-info">
            Depth: {depth}
          </span>
        )}
      </div>

      <div className="tree-content">
        {has_cycle ? (
          <div className="alert alert-danger" style={{ marginTop: 0 }}>
            <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Cycle Detected:</strong> This connected component contains a cycle. Tree reconstruction is disabled. Node <strong>{root}</strong> is chosen as the lexicographical representative.
            </div>
          </div>
        ) : (
          // The tree object structure is { rootName: childrenObj }
          <TreeNode nodeName={root} children={tree[root]} />
        )}
      </div>
    </div>
  );
};

export default function App() {
  const defaultInput = `[
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
]`;

  const [inputData, setInputData] = useState(defaultInput);
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('visual');
  const [showConfig, setShowConfig] = useState(false);

  const handleClear = () => {
    setInputData('');
    setError(null);
  };

  const handleResetDefault = () => {
    setInputData(defaultInput);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 1. Input parsing
    let parsedArray = [];
    const trimmedInput = inputData.trim();

    if (!trimmedInput) {
      setError("Input data cannot be empty.");
      setIsLoading(false);
      return;
    }

    // Try parsing as JSON array first
    if (trimmedInput.startsWith('[')) {
      try {
        const json = JSON.parse(trimmedInput);
        if (Array.isArray(json)) {
          parsedArray = json;
        } else {
          setError("JSON input must be an array of strings.");
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setError(`Failed to parse JSON: ${err.message}. If you are entering plain text, remove the brackets.`);
        setIsLoading(false);
        return;
      }
    } else {
      // Split by comma or newline for plain text input
      parsedArray = trimmedInput
        .split(/[,\n]+/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    if (parsedArray.length === 0) {
      setError("No nodes found to analyze.");
      setIsLoading(false);
      return;
    }

    // 2. API Request
    try {
      const endpoint = `${apiUrl.replace(/\/+$/, '')}/bfhl`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: parsedArray })
      });

      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          errData = null;
        }
        throw new Error(errData?.error || `HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to the backend server. Check if the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <header>
        <h1>Hierarchy & Cycle Analyzer</h1>
        <p className="subtitle">
          Chitkara Full Stack Engineering Challenge. Input connection edges, parse hierarchical tree components, and discover cycle formations in real-time.
        </p>
      </header>

      <main className="app-container">
        {/* Left Side: Input Form & Configuration */}
        <section className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="node-input">Enter Node Connections</label>
              <button 
                type="button" 
                className="tab-btn" 
                style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings size={12} /> {showConfig ? 'Hide Config' : 'Configure API'}
              </button>
            </div>

            {showConfig && (
              <div className="form-group" style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                animation: 'fadeIn 0.2s ease'
              }}>
                <label className="form-label" htmlFor="api-url" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Backend Server URL
                </label>
                <input 
                  type="text" 
                  id="api-url"
                  className="form-textarea" 
                  style={{ minHeight: '38px', height: '38px', padding: '0.5rem', fontSize: '0.85rem' }} 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>
            )}

            <div className="form-group">
              <textarea
                id="node-input"
                className="form-textarea"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder='["A->B", "B->C"]'
              />
              <div className="form-help">
                Supports standard JSON arrays e.g., <code>["A-&gt;B", "A-&gt;C"]</code> or comma-separated lists e.g., <code>A-&gt;B, B-&gt;C</code>.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                type="button" 
                className="tab-btn" 
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button 
                type="button" 
                className="tab-btn" 
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={handleResetDefault}
              >
                Reset Default
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Analyzing...</>
              ) : (
                <>
                  <Play size={16} style={{ marginRight: '0.5rem' }} /> Run Analysis
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Credentials Display (From response or placeholders) */}
          <div className="credentials-bar">
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <Info size={12} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>API IDENTITY CREDENTIALS</span>
            </div>
            <div className="credentials-item">
              <span className="credentials-label">User ID:</span>
              <span className="credentials-value">
                {response?.user_id || 'agam_monga_24062026'}
              </span>
            </div>
            <div className="credentials-item">
              <span className="credentials-label">Roll No:</span>
              <span className="credentials-value">
                {response?.college_roll_number || '21CS1001'}
              </span>
            </div>
            <div className="credentials-item" style={{ width: '100%', marginTop: '0.25rem' }}>
              <span className="credentials-label">Email:</span>
              <span className="credentials-value">
                {response?.email_id || 'agam.monga@college.edu'}
              </span>
            </div>
          </div>
        </section>

        {/* Right Side: Results Showcase */}
        <section className="glass-card" style={{ minHeight: '400px' }}>
          {!response && !isLoading && (
            <div className="spinner-container" style={{ padding: '6rem 0' }}>
              <Network size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <h3 style={{ fontFamily: 'var(--font-header)', fontWeight: 600 }}>No Results Ready</h3>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', maxWidth: '300px' }}>
                Fill in connection edges on the left panel and click <strong>Run Analysis</strong> to fetch hierarchical insights.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="spinner-container" style={{ padding: '8rem 0' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Analyzing graph data and constructing components...
              </p>
            </div>
          )}

          {response && !isLoading && (
            <div>
              {/* Summary Statistics */}
              <div className="summary-grid">
                <div className="stat-card">
                  <span className="stat-label">Valid Trees</span>
                  <span className="stat-value accent">{response.summary.total_trees}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Cycles</span>
                  <span className="stat-value" style={{ color: response.summary.total_cycles > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                    {response.summary.total_cycles}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Largest Tree Root</span>
                  <span className="stat-value" style={{ fontSize: '1.25rem', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                    {response.summary.largest_tree_root || 'None'}
                  </span>
                </div>
              </div>

              {/* Tabs for different views */}
              <div className="tabs-header">
                <button 
                  className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('visual')}
                >
                  <GitBranch size={14} style={{ marginRight: '0.35rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  Visual Tree View
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <Layers size={14} style={{ marginRight: '0.35rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  Details & Logs
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                >
                  <FileCode size={14} style={{ marginRight: '0.35rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  Raw JSON Payload
                </button>
              </div>

              {/* Tab Content 1: Visual Tree View */}
              {activeTab === 'visual' && (
                <div className="tree-list">
                  {response.hierarchies && response.hierarchies.length > 0 ? (
                    response.hierarchies.map((hierarchy, index) => (
                      <TreeVisualizer key={`${hierarchy.root}-${index}`} hierarchy={hierarchy} />
                    ))
                  ) : (
                    <div className="list-card-empty" style={{ textAlign: 'center', padding: '2rem' }}>
                      No valid connections could be mapped to active components.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 2: Details & Logs */}
              {activeTab === 'details' && (
                <div className="details-section">
                  {/* Invalid Entries */}
                  <div className="list-card">
                    <div className="list-card-title" style={{ color: response.invalid_entries?.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      <AlertTriangle size={16} /> Invalid Entries ({response.invalid_entries?.length || 0})
                    </div>
                    {response.invalid_entries && response.invalid_entries.length > 0 ? (
                      <div className="list-badge-grid">
                        {response.invalid_entries.map((entry, idx) => (
                          <span key={idx} className="tag invalid">{entry}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="list-card-empty">
                        <CheckCircle2 size={12} style={{ color: 'var(--success)', marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                        No invalid entries found. All inputs follow pattern <code>X-&gt;Y</code>.
                      </div>
                    )}
                  </div>

                  {/* Duplicate Edges */}
                  <div className="list-card">
                    <div className="list-card-title" style={{ color: response.duplicate_edges?.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                      <Layers size={16} /> Duplicate Edges ({response.duplicate_edges?.length || 0})
                    </div>
                    {response.duplicate_edges && response.duplicate_edges.length > 0 ? (
                      <div className="list-badge-grid">
                        {response.duplicate_edges.map((entry, idx) => (
                          <span key={idx} className="tag duplicate">{entry}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="list-card-empty">
                        <CheckCircle2 size={12} style={{ color: 'var(--success)', marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                        No duplicate connections detected.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content 3: Raw JSON Payload */}
              {activeTab === 'json' && (
                <div className="json-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Response Status: 200 OK
                    </span>
                    <button 
                      className="tab-btn" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(response, null, 2))}
                    >
                      Copy Payload
                    </button>
                  </div>
                  <pre className="json-code">
                    <code>{JSON.stringify(response, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
