import React, { useState, useEffect } from 'react';
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
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';

// Recursive Collapsible Tree Node Component
const TreeNode = ({ nodeName, children }) => {
  const childNames = Object.keys(children || {});
  const hasChildren = childNames.length > 0;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="tree-node-wrapper">
      <div className="tree-node-item">
        {hasChildren ? (
          <span className="tree-node-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 16 }}></span>
        )}
        <span className={`tree-node-circle ${hasChildren ? 'has-children' : ''}`}></span>
        <span className="tree-node-name" style={{ color: hasChildren ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {nodeName}
        </span>
      </div>
      {hasChildren && isOpen && (
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

// Tree Visualizer Container
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

      <div className="tree-content" style={{ animation: 'fadeIn 0.3s ease' }}>
        {has_cycle ? (
          <div className="alert alert-danger" style={{ marginTop: 0 }}>
            <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Cycle Detected:</strong> This connected component forms a cycle. Tree reconstruction is disabled. Node <strong>{root}</strong> is chosen as the lexicographical root.
            </div>
          </div>
        ) : (
          <TreeNode nodeName={root} children={tree[root]} />
        )}
      </div>
    </div>
  );
};

// Dynamic SVG Graph Visualizer Component
const GraphCanvas = ({ response, inputData }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!response || !response.hierarchies) return;

    const invalidSet = new Set(response.invalid_entries || []);
    const duplicateSet = new Set(response.duplicate_edges || []);

    // Reconstruct valid active edges from raw input
    let parsedArray = [];
    const trimmedInput = inputData.trim();
    if (trimmedInput.startsWith('[')) {
      try {
        parsedArray = JSON.parse(trimmedInput);
      } catch {
        parsedArray = [];
      }
    } else {
      parsedArray = trimmedInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    }

    const uniqueNodes = new Set();
    const activeEdgesList = [];
    const parentOf = {};

    parsedArray.forEach(entry => {
      const trimmed = entry.trim();
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) return;

      const parent = match[1];
      const child = match[2];
      
      if (parent === child) return;
      
      const edgeKey = `${parent}->${child}`;
      if (invalidSet.has(trimmed) || duplicateSet.has(edgeKey)) return;

      // Multi-parent check (first parent wins)
      if (parentOf[child]) return;
      
      parentOf[child] = parent;
      uniqueNodes.add(parent);
      uniqueNodes.add(child);
      activeEdgesList.push({ from: parent, to: child });
    });

    const nodesList = Array.from(uniqueNodes).sort();
    
    // Calculate node coordinates on a circular ring layout
    const width = 550;
    const height = 350;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 45;

    const nodesWithCoords = nodesList.map((node, i) => {
      const theta = (2 * Math.PI * i) / nodesList.length;
      return {
        id: node,
        x: cx + radius * Math.cos(theta),
        y: cy + radius * Math.sin(theta)
      };
    });

    setNodes(nodesWithCoords);
    setEdges(activeEdgesList);
  }, [response, inputData]);

  if (nodes.length === 0) {
    return (
      <div className="list-card-empty" style={{ textAlign: 'center', padding: '3rem' }}>
        No active nodes to visualize. Make sure you entered valid node edges.
      </div>
    );
  }

  // Check if an edge is highlighted or faded based on hover state
  const getEdgeClass = (edge) => {
    if (!hoveredNode) return 'graph-edge';
    if (edge.from === hoveredNode || edge.to === hoveredNode) {
      return 'graph-edge highlighted';
    }
    return 'graph-edge faded';
  };

  const getEdgeColor = (edge) => {
    if (!hoveredNode) return 'var(--primary)';
    if (edge.from === hoveredNode || edge.to === hoveredNode) {
      return 'var(--text-primary)';
    }
    return 'rgba(255, 255, 255, 0.08)';
  };

  return (
    <div className="canvas-card">
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Hover over nodes to inspect structural connections (Inward/Outward paths).
        </span>
      </div>
      
      <svg 
        viewBox="0 0 550 350" 
        className="graph-svg" 
        style={{ width: '100%', height: '350px' }}
      >
        <defs>
          <marker 
            id="arrow" 
            viewBox="0 0 10 10" 
            refX="6" 
            refY="5" 
            markerWidth="5" 
            markerHeight="5" 
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--primary)" />
          </marker>
          <marker 
            id="arrow-hover" 
            viewBox="0 0 10 10" 
            refX="6" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#ffffff" />
          </marker>
        </defs>

        {/* Draw Edges (Shortened to not overlap circles) */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist === 0) return null;

          // Shorten the edges slightly by the radius of node circles (18px)
          const nodeRadius = 18;
          const startX = fromNode.x + (dx / dist) * nodeRadius;
          const startY = fromNode.y + (dy / dist) * nodeRadius;
          const endX = toNode.x - (dx / dist) * (nodeRadius + 4);
          const endY = toNode.y - (dy / dist) * (nodeRadius + 4);

          const isHoveredEdge = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);

          return (
            <line
              key={idx}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              className={getEdgeClass(edge)}
              stroke={getEdgeColor(edge)}
              strokeWidth={isHoveredEdge ? 2.5 : 1.5}
              markerEnd={isHoveredEdge ? "url(#arrow-hover)" : "url(#arrow)"}
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node) => {
          const isNodeHovered = hoveredNode === node.id;
          return (
            <g
              key={node.id}
              className={`graph-node ${isNodeHovered ? 'active' : ''}`}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle
                r="16"
                className="graph-node-circle"
                fill={isNodeHovered ? 'var(--primary)' : 'rgba(0, 0, 0, 0.65)'}
                stroke={isNodeHovered ? '#ffffff' : 'var(--glass-border-focus, var(--primary))'}
                strokeWidth={isNodeHovered ? 2.5 : 1.5}
                filter={isNodeHovered ? "drop-shadow(0px 0px 8px var(--primary))" : "none"}
              />
              <text
                dy="4"
                textAnchor="middle"
                fill={isNodeHovered ? '#ffffff' : 'var(--text-primary)'}
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-header)"
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
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
  const [apiUrl, setApiUrl] = useState('https://backend-two-ruddy-50.vercel.app');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('visual');
  const [showConfig, setShowConfig] = useState(false);
  const [theme, setTheme] = useState('indigo');
  const [syntaxStatus, setSyntaxStatus] = useState('json');

  // Load preset templates
  const loadPreset = (type) => {
    setError(null);
    if (type === 'challenge') {
      setInputData(defaultInput);
    } else if (type === 'tree') {
      setInputData(`[
  "A->B", "A->C", 
  "B->D", "B->E", 
  "C->F", "C->G"
]`);
    } else if (type === 'cycles') {
      setInputData(`[
  "A->B", "B->C", "C->A",
  "X->Y", "Y->Z", "Z->X"
]`);
    } else if (type === 'diamond') {
      setInputData(`[
  "A->D", "B->D", 
  "A->B", "B->C"
]`);
    }
  };

  // Real-time syntax detection
  useEffect(() => {
    const trimmed = inputData.trim();
    if (!trimmed) {
      setSyntaxStatus('empty');
    } else if (trimmed.startsWith('[')) {
      setSyntaxStatus('json');
    } else {
      setSyntaxStatus('list');
    }
  }, [inputData]);

  // Set theme attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleClear = () => {
    setInputData('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let parsedArray = [];
    const trimmedInput = inputData.trim();

    if (!trimmedInput) {
      setError("Input data cannot be empty.");
      setIsLoading(false);
      return;
    }

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
        setError(`Failed to parse JSON: ${err.message}. Ensure double quotes and square brackets are correct.`);
        setIsLoading(false);
        return;
      }
    } else {
      parsedArray = trimmedInput
        .split(/[,\n]+/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    if (parsedArray.length === 0) {
      setError("No valid connections to parse.");
      setIsLoading(false);
      return;
    }

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
        throw new Error(errData?.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to reach backend API. Confirm server is active and CORS is open.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="bg-grid"></div>
      <div className="glow-blob"></div>

      <header>
        <h1>Network Hierarchy & Cycle Analyzer</h1>
        <p className="subtitle">
          Input node relationships, build interactive trees, detect cycle components, and visualize structure in real-time.
        </p>
      </header>

      {/* Floating Theme Switcher */}
      <div className="theme-selector">
        <span 
          className={`theme-dot ${theme === 'indigo' ? 'active' : ''}`} 
          style={{ backgroundColor: '#6366f1' }}
          onClick={() => setTheme('indigo')}
          title="Indigo Neon"
        />
        <span 
          className={`theme-dot ${theme === 'emerald' ? 'active' : ''}`} 
          style={{ backgroundColor: '#10b981' }}
          onClick={() => setTheme('emerald')}
          title="Emerald Cyber"
        />
        <span 
          className={`theme-dot ${theme === 'rose' ? 'active' : ''}`} 
          style={{ backgroundColor: '#f43f5e' }}
          onClick={() => setTheme('rose')}
          title="Rose Cyber"
        />
      </div>

      <main className="app-container">
        {/* Left Control Panel */}
        <section className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-label-row">
              <label className="form-label" htmlFor="node-input">Enter Node Connections</label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {syntaxStatus === 'json' && <span className="syntax-badge json">JSON Array</span>}
                {syntaxStatus === 'list' && <span className="syntax-badge list">Text List</span>}
                
                <button 
                  type="button" 
                  className="tab-btn" 
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  onClick={() => setShowConfig(!showConfig)}
                >
                  <Settings size={12} /> config
                </button>
              </div>
            </div>

            {showConfig && (
              <div className="form-group" style={{ 
                background: 'rgba(255,255,255,0.015)', 
                border: '1px solid rgba(255,255,255,0.04)', 
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
                  placeholder="https://backend-two-ruddy-50.vercel.app"
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <textarea
                id="node-input"
                className="form-textarea"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder='["A->B", "B->C"]'
              />
            </div>

            {/* Quick Templates Panel */}
            <div className="form-group">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quick Presets:</span>
              <div className="templates-row">
                <button type="button" className="template-btn" onClick={() => loadPreset('challenge')}>🌳 Challenge Demo</button>
                <button type="button" className="template-btn" onClick={() => loadPreset('tree')}>🌳 Balanced Tree</button>
                <button type="button" className="template-btn" onClick={() => loadPreset('cycles')}>🔄 Double Cycle</button>
                <button type="button" className="template-btn" onClick={() => loadPreset('diamond')}>💎 Multi-Parent</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                type="button" 
                className="tab-btn" 
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button 
                type="button" 
                className="tab-btn" 
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => loadPreset('challenge')}
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

          {/* Credentials Display */}
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
              <span className="credentials-value" style={{ fontSize: '0.75rem' }}>
                {response?.email_id || 'agam.monga@college.edu'}
              </span>
            </div>
          </div>
        </section>

        {/* Right Output Dashboard */}
        <section className="glass-card" style={{ minHeight: '520px' }}>
          {!response && !isLoading && (
            <div className="spinner-container" style={{ padding: '8rem 0' }}>
              <Network size={54} style={{ color: 'var(--text-muted)', opacity: 0.4, animation: 'pulse 3s infinite ease-in-out' }} />
              <h3 style={{ fontFamily: 'var(--font-header)', fontWeight: 600, color: 'var(--text-primary)' }}>Interactive Sandbox Ready</h3>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', maxWidth: '340px' }}>
                Choose a preset or type node relationships on the left, then click <strong>Run Analysis</strong> to visualizes structures!
              </p>
            </div>
          )}

          {isLoading && (
            <div className="spinner-container" style={{ padding: '10rem 0' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Processing edge connections & compiling components...
              </p>
            </div>
          )}

          {response && !isLoading && (
            <div>
              {/* Summary Dashboard Cards */}
              <div className="summary-grid">
                <div className="stat-card">
                  <span className="stat-label">Valid Trees</span>
                  <span className="stat-value accent">{response.summary.total_trees}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Cycles</span>
                  <span className="stat-value" style={{ color: response.summary.total_cycles > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {response.summary.total_cycles}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Largest Tree</span>
                  <span className="stat-value" style={{ fontSize: '1.5rem', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Sparkles size={16} style={{ color: 'var(--warning)', opacity: response.summary.largest_tree_root ? 1 : 0 }} />
                    {response.summary.largest_tree_root || 'None'}
                  </span>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="tabs-header">
                <button 
                  className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('visual')}
                >
                  <GitBranch size={14} />
                  Interactive Tree
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setActiveTab('graph')}
                >
                  <Network size={14} />
                  Graph Canvas
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <Layers size={14} />
                  Validation Logs
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                >
                  <FileCode size={14} />
                  JSON Payload
                </button>
              </div>

              {/* Tab 1: Interactive Tree View */}
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

              {/* Tab 2: Graph Canvas */}
              {activeTab === 'graph' && (
                <GraphCanvas response={response} inputData={inputData} />
              )}

              {/* Tab 3: Validation Logs */}
              {activeTab === 'details' && (
                <div className="details-section">
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
                        All connection strings follow the <code>X-&gt;Y</code> pattern correctly.
                      </div>
                    )}
                  </div>

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

              {/* Tab 4: JSON Payload */}
              {activeTab === 'json' && (
                <div className="json-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Response Status: 200 OK
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="tab-btn" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `bfhl_response_${response.user_id}.json`;
                          a.click();
                        }}
                      >
                        <Download size={11} style={{ marginRight: '0.2rem', display: 'inline-block', verticalAlign: 'middle' }} />
                        Download
                      </button>
                      <button 
                        className="tab-btn" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(response, null, 2))}
                      >
                        <Share2 size={11} style={{ marginRight: '0.2rem', display: 'inline-block', verticalAlign: 'middle' }} />
                        Copy
                      </button>
                    </div>
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
