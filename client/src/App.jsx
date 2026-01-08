import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import LinSynqLogo from './assets/Linqsynqlogo.png';
import Login from './Login';

import ThemeToggle from './components/ThemeToggle';

const socket = io('http://localhost:3001');

function App() {
  // --- State ---
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState('light'); // Default to light (day)
  const [data, setData] = useState({});
  const [config, setConfig] = useState({ ip: '192.168.103.24' });
  const [tagMetadata, setTagMetadata] = useState({});
  const [user, setUser] = useState(null); // { username, role, permissions }
  const [auditLogs, setAuditLogs] = useState([]);
  const [categorizedTags, setCategorizedTags] = useState({ active: {}, empty: {}, new: {}, old: {} });
  const [activeTab, setActiveTab] = useState('active'); // active, new, empty, old

  // Toggle Theme Handler
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Apply Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // User Management State
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'operator',
    permissions: ['read_tag']
  });

  // --- Project & PLC Configuration ---
  const [currentProject, setCurrentProject] = useState('lumax');
  const [plcType, setPlcType] = useState('Siemens');
  const [plcModel, setPlcModel] = useState('S7-1500');
  const [protocol, setProtocol] = useState('OPC UA');

  const projects = [
    { id: 'lumax', name: 'Lumax', type: 'Siemens', model: 'S7-1500', protocol: 'OPC UA', ip: '192.168.103.24' },
    { id: 'new_s7', name: 'New S7 Project', type: 'Siemens', model: 'S7-1500', protocol: 'Snap7 (S7 Comm)', ip: '192.168.0.1' },
    { id: 'fiat', name: 'Fiat', type: 'Rockwell', model: 'CompactLogix 5380', protocol: 'EtherNet/IP (CIP)', ip: '192.168.1.10' }
  ];

  const plcOptions = {
    'Siemens': {
      models: ['S7-1200', 'S7-1500', 'S7-300', 'S7-400'],
      protocols: ['OPC UA', 'Snap7 (S7 Comm)', 'Node-RED', 'Modbus TCP', 'MQTT']
    },
    'Rockwell': {
      models: ['ControlLogix', 'CompactLogix 5380', 'CompactLogix 5380', 'Micro800'],
      protocols: ['EtherNet/IP (CIP)', 'Modbus TCP', 'MQTT']
    }
  };

  // Update settings when project changes
  useEffect(() => {
    const proj = projects.find(p => p.id === currentProject);
    if (proj) {
      setPlcType(proj.type);
      setPlcModel(proj.model);
      setProtocol(proj.protocol);
      setConfig(prev => ({ ...prev, ip: proj.ip }));
    }
  }, [currentProject]);

  const [newTag, setNewTag] = useState({ name: '', address: '' });
  const [mqttConnected, setMqttConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [writeValues, setWriteValues] = useState({});
  const [writeStatus, setWriteStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // --- Search & Pagination State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterType, setFilterType] = useState('all');

  // --- Change Tracking State ---
  const [previousData, setPreviousData] = useState({});
  const [changeHistory, setChangeHistory] = useState([]);
  const changesEndRef = useRef(null);

  // --- Helpers ---
  const addLog = (type, message) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => {
      const newLogs = [...prev, { time, type, message }];
      if (newLogs.length > 100) newLogs.shift();
      return newLogs;
    });
  };

  const getDatatype = (address) => {
    if (!address) return 'Unknown';
    const addr = String(address).toUpperCase();
    if (addr.includes('BOOL') || addr.includes('X') || /M\d+\.\d+/.test(addr)) return 'Boolean';
    if (addr.includes('REAL') || addr.includes('FLOAT')) return 'Float';
    if (addr.includes('INT') || addr.includes('WORD') || addr.includes('BYTE') || addr.includes('DINT')) return 'Integer';
    if (addr.includes('STRING') || addr.includes('CHAR')) return 'String';
    return 'Unknown';
  };

  const validateInput = (value, datatype) => {
    if (datatype === 'Boolean') {
      const v = String(value).toLowerCase();
      if (v === 'true' || v === 'false' || v === '1' || v === '0') return { valid: true };
      return { valid: false, message: `Datatype is Boolean. Please enter a valid boolean value (true/false or 0/1).` };
    }
    if (datatype === 'Integer') {
      if (!isNaN(value) && Number.isInteger(parseFloat(value)) && !String(value).includes('.')) return { valid: true };
      return { valid: false, message: `Datatype is Integer. Please enter a whole number.` };
    }
    if (datatype === 'Float') {
      if (!isNaN(parseFloat(value))) return { valid: true };
      return { valid: false, message: `Datatype is Float. Please enter a valid number.` };
    }
    return { valid: true };
  };

  // --- Effects ---
  const fetchMetadata = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/status');
      if (res.data.tags) setTagMetadata(res.data.tags);
      if (res.data.categorizedTags) setCategorizedTags(res.data.categorizedTags);

      // Sync Connection State
      if (res.data.connected !== undefined) setConnected(res.data.connected);
      if (res.data.protocol) setProtocol(res.data.protocol);
      if (res.data.config && res.data.config.host) {
        setConfig(prev => ({ ...prev, ip: res.data.config.host }));
      }
    } catch (err) {
      console.error("Failed to fetch tag metadata", err);
    }
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    changesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [changeHistory]);

  useEffect(() => {
    // Initial fetch
    fetchMetadata();

    socket.on('connect', () => {
      addLog('sys', 'Connected to Backend API');
      fetchMetadata(); // Re-fetch on reconnect
    });

    socket.on('plc-status', (status) => {
      setConnected(status.connected);
      if (status.protocol) setProtocol(status.protocol);
      // Only log if status changed (optimization could be added here, but for now just update text)
    });

    socket.on('mqtt-status', (status) => setMqttConnected(status.connected));

    socket.on('plc-data', (newData) => {
      // Detect changes
      Object.keys(newData).forEach(tagName => {
        const newValue = newData[tagName];
        const oldValue = previousData[tagName];

        if (oldValue !== undefined && oldValue !== newValue) {
          const time = new Date().toLocaleTimeString('en-US', { hour12: false });
          setChangeHistory(prev => {
            const change = {
              time,
              tagName,
              oldValue: String(oldValue),
              newValue: String(newValue)
            };
            const newHistory = [change, ...prev];
            if (newHistory.length > 50) newHistory.pop();
            return newHistory;
          });
        }
      });

      setPreviousData(newData);
      setData(newData);
      setHistory(prev => {
        const timestamp = new Date().toLocaleTimeString();
        const newHistory = [...prev, { timestamp, ...newData }];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('plc-status');
      socket.off('mqtt-status');
      socket.off('plc-data');
    };
  }, []);

  // --- Handlers ---
  const handleLogout = () => setUser(null);

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/audit-logs');
      setAuditLogs(res.data);
    } catch (err) { console.error(err); }
  };

  // User Management Handlers
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;
    try {
      await axios.post('http://localhost:3001/api/users', { ...newUser, requestor: user.username });
      setNewUser({ username: '', password: '', role: 'operator', permissions: ['read_tag'] });
      fetchUsers();
      addLog('sys', `User Added: ${newUser.username}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Delete user ${username}?`)) return;
    try {
      await axios.delete(`http://localhost:3001/api/users/${username}?requestor=${user.username}`);
      fetchUsers();
      addLog('sys', `User Deleted: ${username}`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAuditLogs();
      fetchUsers();
      const interval = setInterval(() => {
        fetchAuditLogs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleConnect = async () => {
    if (protocol === 'Node-RED') {
      addLog('sys', '🚀 Deploying to Node-RED...');
      try {
        await axios.post('http://localhost:3001/api/nodered/sync', { ip: config.ip });
        addLog('sys', '✅ Node-RED Flow Updated & Active');
        setConnected(true);
      } catch (error) {
        addLog('err', `Node-RED Sync Failed: ${error.message}`);
      }
      return;
    }

    try {
      addLog('tx', `Connecting to ${config.ip} via ${protocol}...`);
      let endpointUrl = config.ip;
      if (protocol === 'OPC UA' && !config.ip.startsWith('opc.tcp://')) {
        endpointUrl = `opc.tcp://${config.ip}:4840`;
      }
      await axios.post('http://localhost:3001/api/connect', {
        endpointUrl,
        protocol,
        plcType,
        plcModel
      });
    } catch (error) {
      addLog('err', `Connection failed: ${error.message}`);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.name || !newTag.address) return;
    try {
      addLog('tx', `Add Tag: ${newTag.name} (${newTag.datatype})`);
      const res = await axios.post('http://localhost:3001/api/tags', {
        name: newTag.name,
        nodeId: newTag.address,
        datatype: newTag.datatype,
        user
      });
      if (res.data.tags) setTagMetadata(res.data.tags);
      if (res.data.categorizedTags) setCategorizedTags(res.data.categorizedTags);
      setNewTag({ name: '', address: '', datatype: 'Boolean' });
      addLog('sys', `Tag Added: ${newTag.name}`);
    } catch (error) {
      addLog('err', `Add Tag Failed: ${error.message}`);
    }
  };

  const handleImportNodeRed = async () => {
    try {
      addLog('tx', 'Importing tags from Node-RED...');
      const res = await axios.post('http://localhost:3001/api/nodered/import');
      if (res.data.success) {
        addLog('sys', res.data.message);
      }
    } catch (error) {
      addLog('err', `Import Failed: ${error.message}`);
    }
  };

  const handleDeleteTag = async (tagName) => {
    try {
      addLog('tx', `Delete Tag: ${tagName}`);
      const res = await axios.delete(`http://localhost:3001/api/tags/${tagName}?user=${user.username}`);
      if (res.data.tags) setTagMetadata(res.data.tags);
      if (res.data.categorizedTags) setCategorizedTags(res.data.categorizedTags);
      setData(prev => { const n = { ...prev }; delete n[tagName]; return n; });
      if (selectedTag === tagName) setSelectedTag(null);
      addLog('sys', `Tag Deleted: ${tagName}`);
    } catch (error) {
      addLog('err', `Delete Failed: ${error.message}`);
    }
  };

  const handleWriteTag = async (tagName) => {
    const value = writeValues[tagName];
    if (value === undefined || value === '') return;

    const address = tagMetadata[tagName];
    const datatype = getDatatype(address);
    const validation = validateInput(value, datatype);

    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    if (!window.confirm(`Confirm Write: ${tagName} = ${value}?`)) return;

    try {
      addLog('tx', `Write ${tagName} = ${value}`);
      const res = await axios.post('http://localhost:3001/api/write', { tagName, value, user });
      if (res.data.success) {
        setWriteStatus(`✅ Wrote ${value} to ${tagName}`);
        setWriteValues(prev => ({ ...prev, [tagName]: '' }));
        addLog('sys', `Write Success: ${tagName}`);
      } else {
        setWriteStatus(`❌ Write Failed`);
        addLog('err', `Write Failed: ${res.data.message}`);
      }
    } catch (error) {
      setWriteStatus(`❌ Write Error`);
      addLog('err', `Write Error: ${error.message}`);
    }
    setTimeout(() => setWriteStatus(''), 3000);
  };

  // --- Data Processing: Filter, Search, Sort, Paginate ---
  const processedTags = (() => {
    let sourceTags = categorizedTags[activeTab] || {};
    let tags = Object.keys(sourceTags).map(key => [key, data[key] !== undefined ? data[key] : '...']);

    // 1. Filter by type
    if (filterType !== 'all') {
      tags = tags.filter(([key]) => {
        if (filterType === 'bool') return key.includes('Bool') || key.includes('SPARE') || key.includes('STKR1');
        if (filterType === 'int') return key.includes('INT') || key.includes('WORD');
        if (filterType === 'real') return key.includes('REAL') || key.includes('DINT');
        if (filterType === 'string') return key.includes('CODE') || key.includes('MATERIAL');
        return true;
      });
    }

    // 2. Search filter
    if (searchQuery) {
      tags = tags.filter(([key, value]) =>
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 3. Sort
    tags.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
      } else {
        const valA = parseFloat(a[1]) || 0;
        const valB = parseFloat(b[1]) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    // 4. Pagination
    const totalPages = Math.ceil(tags.length / rowsPerPage);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const paginatedTags = tags.slice(startIdx, startIdx + rowsPerPage);

    return { paginatedTags, totalPages, totalTags: tags.length };
  })();

  const handleRefresh = async () => {
    addLog('sys', 'Manual Refresh Triggered');
    await fetchMetadata();
    if (user?.role === 'admin') {
      fetchAuditLogs();
      fetchUsers();
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div id="root">
      {/* --- Header --- */}
      <header className="app-header">
        <div className="brand-section">
          <img src={LinSynqLogo} alt="LinSynQ Logo" style={{ height: "48px", width: "auto" }} title="LinSynQ: Industrial Connectivity Solution" />
          <div>
            <div className="brand-logo" title="Universal IIoT Gateway for PLCs">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '8px', cursor: 'help', opacity: 0.7 }} title="Hover over any element to see what it does.">ⓘ</span>
            </div>
            <div className="brand-subtitle">{currentProject} Project</div>
          </div>
        </div>

        <div className="header-status-bar">
          <div className="kpi-badge" title="Current connection status to the physical PLC">
            <span className="kpi-label">PLC Status</span>
            <span className="kpi-value">
              <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
              {connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="kpi-badge" title="The configured IP address of the target PLC">
            <span className="kpi-label">Active IP</span>
            <span className="kpi-value">{config.ip}</span>
          </div>
          <div className="kpi-badge" title="Communication protocol being used (e.g., OPC UA, S7)">
            <span className="kpi-label">Protocol</span>
            <span className="kpi-value" style={{ color: '#f97316' }}>{protocol}</span>
          </div>
          <div className="kpi-badge" title="Connection status to the Central MQTT Broker">
            <span className="kpi-label">MQTT Cloud</span>
            <span className="kpi-value">
              <span className={`status-dot ${mqttConnected ? 'online' : 'offline'}`}></span>
              {mqttConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem',
              transition: 'all 0.3s ease',
              marginRight: '0.5rem'
            }}
            title="Refresh Data (Keeps you logged in)"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'rotate(180deg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >
            ↻
          </button>

          <ThemeToggle theme={theme} toggleTheme={toggleTheme} title="Switch between Light and Dark visual themes" />

          <div className="user-profile" title={`Logged in as ${user.username}`}>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout" title="Log out of the system">LOGOUT</button>
          </div>
        </div>
      </header>

      {/* --- Dashboard Grid --- */}
      <div className="dashboard-container">
        {/* --- Sidebar --- */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Connection Panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title" title="Configure connection to your industrial hardware">Connection</span>
              <div className={`status-dot ${connected ? 'online' : 'offline'}`} title="Green = Connected, Red = Disconnected" />
            </div>
            <div className="panel-body">
              <div className="control-group">
                <label className="control-label">Project</label>
                <select value={currentProject} onChange={(e) => setCurrentProject(e.target.value)} title="Select the specific manufacturing project configuration">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="control-group">
                  <label className="control-label">PLC Type</label>
                  <select value={plcType} onChange={(e) => {
                    setPlcType(e.target.value);
                    setPlcModel(plcOptions[e.target.value].models[0]);
                    setProtocol(plcOptions[e.target.value].protocols[0]);
                    // Also update current project default IP if switching back? 
                    // For now just keep manual IP or project default.
                  }} title="Hardware specification of the target PLC">
                    {Object.keys(plcOptions).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="control-group">
                  <label className="control-label">Model</label>
                  <select value={plcModel} onChange={(e) => setPlcModel(e.target.value)} title="Select the specific model of the PLC">
                    {plcOptions[plcType]?.models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Protocol</label>
                <select value={protocol} onChange={(e) => setProtocol(e.target.value)} title="Driver protocol used to communicate with the PLC">
                  {plcOptions[plcType]?.protocols.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {/* Node-RED Editor Button */}
                {(protocol && protocol.includes('Node-RED') || protocol.includes('Snap7')) && (
                  /* Showing for Snap7 too as requested if user selects node red logic, but strictly protocol name usually */
                  /* User asked: "in protocol drop box when the **node red** is selected" */
                  protocol.includes('Node-RED') &&
                  <button
                    className="btn-primary"
                    style={{ marginTop: '0.8rem', width: '100%', background: '#800000', fontSize: '0.8rem' }}
                    onClick={() => window.open('http://localhost:1881/red', '_blank')}
                    title="Open the Node-RED Flow Editor in a new tab"
                  >
                    Launch Node-RED Editor ↗
                  </button>
                )}
              </div>

              <div className="control-group">
                <label className="control-label">Endpoint URL / IP</label>
                <input
                  value={config.ip}
                  onChange={(e) => setConfig({ ...config, ip: e.target.value })}
                  placeholder="192.168.x.x"
                  title="Network IP Address of the PLC"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className={connected ? "btn-danger" : "btn-primary"}
                  style={{ flex: 1 }}
                  onClick={connected ? () => socket.emit('disconnect-driver') : handleConnect}
                  title={connected ? "Click to Disconnect from PLC" : "Click to Initiate Connection"}
                >
                  {connected ? 'DISCONNECT' : 'CONNECT'}
                </button>
                <button onClick={() => setMqttConnected(!mqttConnected)} style={{ width: '40px', fontSize: '1.2rem', background: '#e2e8f0', border: '1px solid #cbd5e1' }} title="Simulate or Toggle connection to Cloud MQTT">☁️</button>
              </div>
            </div>
          </div>

          {/* Tag Management Panel */}
          {user.permissions?.includes('add_tag') && (
            <div className="panel">
              <div className="panel-header"><span className="panel-title" title="Add new tags to monitor">Tag Management</span></div>
              <div className="panel-body">
                <div className="control-group">
                  <input placeholder="Tag Name" value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} style={{ marginBottom: '0.5rem' }} title="Unique identifier for the new tag" />

                  <select
                    value={newTag.datatype}
                    onChange={(e) => setNewTag({ ...newTag, datatype: e.target.value })}
                    style={{ marginBottom: '0.5rem', width: '100%' }} // Ensure consistent width
                    title="Data Type of the tag (e.g. Bool, Int, Float)"
                  >
                    <option value="Boolean">Boolean</option>
                    <option value="Int16">Int16</option>
                    <option value="UInt16">UInt16</option>
                    <option value="Int32">Int32</option>
                    <option value="Float">Float</option>
                    <option value="String">String</option>
                    <option value="Byte">Byte</option>
                  </select>

                  <input placeholder="Node ID / Address" value={newTag.address} onChange={(e) => setNewTag({ ...newTag, address: e.target.value })} style={{ marginBottom: '0.5rem' }} title="Memory address or Node ID on the PLC" />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddTag} title="Register this new tag to the system">+ Add Tag</button>
                    <button className="btn-icon" style={{ background: '#3b82f6', color: 'white' }} onClick={handleImportNodeRed} title="Import tags configured in Node-RED flows">⬇</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management Panel (Admin Only) */}
          {user.role === 'admin' && (
            <div className="panel">
              <div className="panel-header"><span className="panel-title" title="Manage system users and their permissions">User Management (Access Matrix)</span></div>
              <div className="panel-body">
                <div className="control-group">
                  <input style={{ marginBottom: '0.5rem' }} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} title="New user's login name" />
                  <input style={{ marginBottom: '0.5rem' }} type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} title="New user's password" />
                  <select style={{ marginBottom: '0.5rem' }} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} title="Assign a role">
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }} title="Grant specific access rights">
                    {['read_tag', 'write_tag', 'add_tag', 'delete_tag', 'manage_users'].map(perm => (
                      <label key={perm} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', gap: '4px', color: '#cbd5e1' }} title={`Allow user to ${perm.replace('_', ' ')}`}>
                        <input
                          type="checkbox"
                          checked={newUser.permissions?.includes(perm)}
                          onChange={(e) => {
                            const current = newUser.permissions || [];
                            setNewUser({
                              ...newUser,
                              permissions: e.target.checked
                                ? [...current, perm]
                                : current.filter(p => p !== perm)
                            });
                          }}
                        />
                        {perm.replace('_', ' ')}
                      </label>
                    ))}
                  </div>

                  <button className="btn-primary" style={{ width: '100%' }} onClick={handleAddUser} title="Create this new user">+ Add User</button>
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  {users.map(u => (
                    <div key={u.username} style={{ padding: '4px 0', borderBottom: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span title={`Role: ${u.role}`}>{u.username} <span style={{ color: '#64748b' }}>({u.role})</span></span>
                        {u.username !== 'admin' && u.username !== user.username && (
                          <button onClick={() => handleDeleteUser(u.username)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }} title="Delete this user">✕</button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        {u.permissions?.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin Audit Log Panel */}
          {user.role === 'admin' && (
            <div className="panel" style={{ flex: 1 }}>
              <div className="panel-header"><span className="panel-title" title="System activity log">Audit Trail (Admin)</span></div>
              <div className="panel-body" style={{ padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f1f5f9', color: '#64748b' }}><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead>
                  <tbody>
                    {auditLogs.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }} title={`Action by ${log.user} at ${log.timestamp}`}>
                        <td style={{ padding: '4px' }}>{log.timestamp.split('T')[1].split('.')[0]}</td>
                        <td style={{ padding: '4px', fontWeight: 'bold' }}>{log.user}</td>
                        <td style={{ padding: '4px' }}>{log.action}</td>
                        <td style={{ padding: '4px', color: '#475569' }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </aside>

        {/* --- Main Content Area --- */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title" title="Real-time list of all monitored tags">Live Data Monitor</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '2px', borderRadius: '4px' }} title="Filter tags by their lifecycle status">
                  {['active', 'new', 'empty', 'old'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                      title={`Filter tags by their lifecycle status: ${tab}`}
                      style={{
                        border: 'none', background: activeTab === tab ? 'white' : 'transparent',
                        padding: '4px 10px', borderRadius: '3px', fontSize: '0.8rem', cursor: 'pointer',
                        color: activeTab === tab ? 'var(--brand-primary)' : '#64748b', fontWeight: 'bold', textTransform: 'capitalize'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Showing {processedTags.paginatedTags.length} tags</span>
                {writeStatus && <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>{writeStatus}</span>}
              </div>
            </div>

            {/* Toolbar Options - Grid Layout for Alignment */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="control-label" style={{ marginBottom: '8px' }}>Search Tag</label>
                <input type="text" placeholder="🔍 Find by name or value..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} title="Search for tags by Name or current Value" />
              </div>

              <div>
                <label className="control-label" style={{ marginBottom: '8px' }}>Data Type</label>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} title="Filter displayed tags by Data Type (Bool, Int, etc)">
                  <option value="all">All Types</option>
                  <option value="bool">Booleans</option>
                  <option value="int">Integers/Words</option>
                  <option value="real">Reals/DInts</option>
                  <option value="string">Strings</option>
                </select>
              </div>

              <div>
                <label className="control-label" style={{ marginBottom: '8px' }}>Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Choose criteria to sort the tag list">
                  <option value="name">Name</option>
                  <option value="value">Value</option>
                </select>
              </div>

              <div>
                <label className="control-label" style={{ marginBottom: '8px' }}>Order</label>
                <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={{ width: '100%', padding: '0.75rem', background: 'white', border: '2px solid var(--border-color)', borderRadius: '12px' }} title="Toggle between Ascending and Descending order">
                  {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
              </div>

              <div>
                <label className="control-label" style={{ marginBottom: '8px' }}>Rows</label>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} title="Number of tags to display per page">
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
              <table className="data-grid">
                <thead>
                  <tr>
                    <th title="Row Number">#</th>
                    <th title="Name of the Tag">Tag Name</th>
                    <th title="Data Type of the Tag">Datatype</th>
                    <th title="Current live value from PLC">Value</th>
                    <th title="Enter value to write to PLC">Write</th>
                    <th title="Available Actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedTags.paginatedTags.map(([key, value], idx) => (
                    <tr key={key} onClick={() => setSelectedTag(key)} className={selectedTag === key ? 'selected' : ''} title="Click to view trend graph below">
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      <td className="cell-tag">{key}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{tagMetadata[key]?.datatype || getDatatype(tagMetadata[key]?.address)}</td>
                      <td className="cell-value">{String(value)}</td>
                      <td>
                        <input className="cell-input" placeholder="Set..." value={writeValues[key] || ''} onChange={(e) => setWriteValues({ ...writeValues, [key]: e.target.value })} onClick={(e) => e.stopPropagation()} title={`Enter a new value for ${key} to write to the PLC`} />
                      </td>
                      <td className="cell-actions">
                        <button className="btn-primary btn-icon" onClick={(e) => { e.stopPropagation(); handleWriteTag(key); }} title="Write this value to the PLC immediately">SET</button>
                        <button className="btn-danger btn-icon" onClick={(e) => { e.stopPropagation(); handleDeleteTag(key); }} title="Stop monitoring this tag">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center'
            }}>

              {/* Left: Page Info */}
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Page <b>{currentPage}</b> of <b>{processedTags.totalPages || 1}</b>
              </div>

              {/* Center: Total Rows */}
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: 'var(--brand-primary)',
                background: 'rgba(253, 191, 70, 0.1)',
                padding: '4px 12px',
                borderRadius: '12px',
                whiteSpace: 'nowrap'
              }}>
                Total Rows: {processedTags.totalTags}
              </div>

              {/* Right: Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifySelf: 'end' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="Go to First Page"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: currentPage === 1 ? '#e2e8f0' : 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  title="Go to Previous Page"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: currentPage === 1 ? '#e2e8f0' : 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(processedTags.totalPages, currentPage + 1))}
                  disabled={currentPage === processedTags.totalPages}
                  title="Go to Next Page"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: currentPage === processedTags.totalPages ? '#e2e8f0' : 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: currentPage === processedTags.totalPages ? 'not-allowed' : 'pointer' }}
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(processedTags.totalPages)}
                  disabled={currentPage === processedTags.totalPages}
                  title="Go to Last Page"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: currentPage === processedTags.totalPages ? '#e2e8f0' : 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: currentPage === processedTags.totalPages ? 'not-allowed' : 'pointer' }}
                >
                  »»
                </button>
              </div>
            </div>
          </div>

          {/* Trend Chart Panel */}
          <div className="panel" style={{ height: '350px' }}>
            <div className="panel-header">
              <span className="panel-title">Real-time Trend: {selectedTag || 'Select a Tag'}</span>
            </div>
            <div className="panel-body" style={{ height: '100%', paddingBottom: '2rem' }}>
              {selectedTag ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} tick={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    <Line type="step" dataKey={selectedTag} stroke="#ff6b35" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                  Select a tag from the table above to view trend data
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
      <footer className="app-footer">
        <div>System Version: 2.1.0 (OPC UA Build)</div>
        <div>© Koustubh Deodhar | ATS Conveyors 2025</div>
      </footer>
    </div>
  );
}

export default App;
