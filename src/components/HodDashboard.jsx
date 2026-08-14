import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/api';
import { Badge, Button, Table, StatusStepper, Modal } from './UI';
import * as Icons from 'lucide-react';

// Recharts components are imported via ESM
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

export default function HodDashboard({ token, onLogout, addToast }) {
  const [activeTab, setActiveTab] = useState('Overview'); // Overview, AllComplaints, Analytics, PriorityQueue, Profile
  const [complaints, setComplaints] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters for All Complaints
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint details
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Analytics Data
  const [analytics, setAnalytics] = useState({
    categoryData: [],
    trendData: [],
    stats: { total: 0, pending: 0, highPriority: 0, resolvedToday: 0 }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getComplaints(token);
      setComplaints(data);
      const facs = await mockApi.getFacultyList();
      setFacultyList(facs);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await mockApi.getAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'Analytics' || activeTab === 'Overview') {
      fetchAnalytics();
    }
  }, [activeTab, complaints]);

  // Set default reassign dropdown value when complaint is selected
  useEffect(() => {
    if (selectedComplaint) {
      setSelectedFacultyId(selectedComplaint.assignedTo || '');
    }
  }, [selectedComplaint]);

  // Reassign complaint
  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !selectedFacultyId) return;
    setReassigning(true);
    try {
      const updated = await mockApi.reassignComplaint(token, selectedComplaint.id, selectedFacultyId);
      setSelectedComplaint(updated);
      setComplaints(complaints.map(c => c.id === updated.id ? updated : c));
      addToast(`Reassigned to: ${updated.assignedName}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setReassigning(false);
    }
  };

  // Reply in chat
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const reply = await mockApi.addReply(token, selectedComplaint.id, replyMessage);
      const updated = { 
        ...selectedComplaint, 
        replies: [...selectedComplaint.replies, reply] 
      };
      setSelectedComplaint(updated);
      setComplaints(complaints.map(c => c.id === updated.id ? updated : c));
      setReplyMessage('');
      addToast('Reply sent from Admin Desk!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Status metrics summary
  const stats = analytics.stats;

  // Filter complaints list
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesDept = deptFilter === 'All' || c.department === deptFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      c.id.toLowerCase().includes(searchLower) ||
      c.studentName.toLowerCase().includes(searchLower) ||
      c.description.toLowerCase().includes(searchLower) ||
      c.category.toLowerCase().includes(searchLower);

    return matchesStatus && matchesCategory && matchesDept && matchesSearch;
  });

  // Priority Queue Complaints: High priority, sorted newest first
  const highPriorityComplaints = complaints
    .filter(c => c.priority === 'High' && c.status !== 'Resolved')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const sidebarItems = [
    { name: 'Overview', icon: Icons.LayoutDashboard },
    { name: 'All Complaints', icon: Icons.FileText },
    { name: 'Analytics', icon: Icons.BarChart3 },
    { name: 'Priority Queue', icon: Icons.AlertTriangle },
    { name: 'Profile', icon: Icons.UserCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <Icons.GraduationCap className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-sm text-white tracking-wide">HOD Office</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-35 ${
        mobileMenuOpen ? 'block' : 'hidden md:flex'
      }`}>
        <div className="p-6">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <Icons.GraduationCap className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="font-black text-sm text-white leading-none tracking-wide">HOD DASHBOARD</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SCP Predictor</span>
            </div>
          </div>

          {/* User badge card */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 mb-6.5">
            <h4 className="text-xs font-bold text-white truncate">{token.name}</h4>
            <p className="text-[9px] text-violet-400 font-bold tracking-wider uppercase mt-1">
              DEPT: {token.department || 'Computer Science'}
            </p>
            <p className="text-[9px] text-slate-500 font-bold tracking-wider mt-0.5">HOD ID: {token.id}</p>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-850">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <Icons.LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'Overview' && (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Office Overview</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Real-time metrics aggregating grievance prediction logs and faculty workloads.
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Incidents</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{stats.total}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pending Review</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1.5">{stats.pending}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)] border-red-500/20">
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-400">High Priority Alert</p>
                <h3 className="text-2xl font-black text-red-400 mt-1.5">{stats.highPriority}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)] border-emerald-500/20">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Resolved Grievances</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1.5">{stats.resolvedToday}</h3>
              </div>
            </div>

            {/* Urgent Items Alert Banner */}
            {stats.highPriority > 0 && (
              <div className="p-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icons.AlertOctagon className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs">High Priority Incidents Require Assignment</h4>
                    <p className="text-[11px] text-red-300 mt-0.5">There are currently {stats.highPriority} critical cases awaiting faculty routing.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveTab('Priority Queue')} 
                  variant="danger" 
                  size="sm"
                  className="bg-red-500/25 border-red-500 text-white font-bold"
                >
                  Open Queue
                </Button>
              </div>
            )}

            {/* Quick table list */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">Active Incident Registry</h4>
              <Table
                columns={[
                  { key: 'id', header: 'Ticket Code' },
                  { key: 'studentName', header: 'Filed By' },
                  { key: 'category', header: 'Category' },
                  { key: 'priority', header: 'Priority', render: (row) => <Badge>{row.priority}</Badge> },
                  { key: 'department', header: 'Department' },
                  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
                ]}
                data={complaints.slice(0, 4)}
                loading={loading}
                onRowClick={(row) => setSelectedComplaint(row)}
                emptyMessage="No active grievances found in the system database."
              />
            </div>
          </div>
        )}

        {/* ALL COMPLAINTS TAB (WITH COMPREHENSIVE FILTERING) */}
        {activeTab === 'All Complaints' && (
          <div className="space-y-8 max-w-6xl">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">College Grievance Database</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Filter and inspect all filed tickets, reassign routing endpoints and respond directly.
              </p>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5.5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search box */}
                <div className="flex-1 relative">
                  <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Ticket ID, Student Name, Description..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status dropdown */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {/* Category dropdown */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Hostel & Mess">Hostel & Mess</option>
                    <option value="Academics">Academics</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Department dropdown */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Departments</option>
                    <option value="Hostel Administration">Hostel Administration</option>
                    <option value="Academic Affairs">Academic Affairs</option>
                    <option value="Library Services">Library Services</option>
                    <option value="Estate & Maintenance">Estate & Maintenance</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List Table */}
            <Table
              columns={[
                { key: 'id', header: 'Ticket Code', className: 'font-mono text-indigo-400' },
                { key: 'studentName', header: 'Student Name' },
                { key: 'category', header: 'Category' },
                { key: 'priority', header: 'Priority', render: (row) => <Badge>{row.priority}</Badge> },
                { key: 'department', header: 'Department' },
                { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
              ]}
              data={filteredComplaints}
              loading={loading}
              onRowClick={(row) => setSelectedComplaint(row)}
              emptyMessage="No grievances matching the filters were found."
            />
          </div>
        )}

        {/* ANALYTICS CHARTS TAB */}
        {activeTab === 'Analytics' && (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Trend & Category Analytics</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Visualizing distribution of grievance categories and timelines of filed tickets.
              </p>
            </div>

            {analyticsLoading ? (
              <div className="h-64 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-center animate-pulse text-xs text-slate-500 font-semibold">
                Loading data matrices...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6.5">
                
                {/* Category-wise Distribution Bar Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5.5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Grievances per Category</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} labelStyle={{ fontWeight: 'bold' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Complaints over Time Line Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5.5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Complaints Volume Trend (7 Days)</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                        <Line type="monotone" dataKey="complaints" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* PRIORITY QUEUE TAB */}
        {activeTab === 'Priority Queue' && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                <Icons.AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Priority Queue</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  High-priority grievances requiring immediate attention. Sorted newest first.
                </p>
              </div>
            </div>

            <Table
              columns={[
                { key: 'id', header: 'Ticket Code', className: 'font-mono text-red-400 font-bold' },
                { key: 'studentName', header: 'Student Name' },
                { key: 'category', header: 'Category' },
                { key: 'createdAt', header: 'Date Filed', render: (row) => new Date(row.createdAt).toLocaleString() },
                { key: 'department', header: 'Suggested Department' },
                { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
              ]}
              data={highPriorityComplaints}
              loading={loading}
              onRowClick={(row) => setSelectedComplaint(row)}
              emptyMessage="Excellent! No high priority complaints are currently pending review."
            />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'Profile' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Office Profile</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Your registered office coordinates and permissions details.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-4.5 pb-6 border-b border-slate-850">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-black text-xl">
                  {token.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{token.name}</h3>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{token.role} Administrator</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee ID</span>
                  <p className="text-slate-100 font-semibold mt-1">{token.id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</span>
                  <p className="text-slate-100 font-semibold mt-1">{token.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role Authority</span>
                  <p className="text-slate-100 font-semibold mt-1">Head of Department (HOD) - CS</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Privilege</span>
                  <p className="text-emerald-400 font-bold mt-1">Global Routing & Reassignments</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DETAIL MODAL / DRAWER */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Incident Investigation: ${selectedComplaint.id}` : ''}
      >
        {selectedComplaint && (
          <div className="space-y-6">
            
            {/* Status Stepper */}
            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
              <StatusStepper status={selectedComplaint.status} />
            </div>

            {/* REASSIGNMENT FORM */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                Assign / Route to Faculty Officer
              </label>
              <form onSubmit={handleReassign} className="flex gap-2">
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200"
                >
                  <option value="">-- Choose Faculty Officer --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  loading={reassigning}
                  disabled={!selectedFacultyId}
                  variant="primary"
                  size="sm"
                >
                  Route Ticket
                </Button>
              </form>
            </div>

            {/* Student Direct Message / HOD Notification Alert */}
            {selectedComplaint.hodEmail && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Icons.Mail className="w-4 h-4" />
                  <span>Direct HOD Notification Email Sent To: {selectedComplaint.hodEmail}</span>
                </div>
                {selectedComplaint.directMessage && (
                  <p className="text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-amber-500/20">
                    "{selectedComplaint.directMessage}"
                  </p>
                )}
              </div>
            )}

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Student Submitter</span>
                <span className="text-slate-200 font-bold">{selectedComplaint.studentName} ({selectedComplaint.studentId})</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">AI Prediction Confidence</span>
                <span className="text-indigo-400 font-bold">{selectedComplaint.confidence}% Match</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Core Category</span>
                <span className="text-slate-200 font-bold">{selectedComplaint.category}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">AI Priority badge</span>
                <div className="mt-1">
                  <Badge>{selectedComplaint.priority}</Badge>
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Grievance Description</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-4 border border-slate-850/65 rounded-xl">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Attached Photo */}
            {selectedComplaint.photo && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attached Photo Preview</h4>
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20 max-h-60 flex items-center justify-center">
                  <img src={selectedComplaint.photo} alt="Attachment" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            )}

            {/* DISCUSSION CHAT FORUM */}
            <div className="border-t border-slate-850 pt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolution Discussion Feed</h4>
              
              {/* Message Bubbles Container */}
              <div className="space-y-3 max-h-56 overflow-y-auto p-3.5 bg-slate-950/40 rounded-xl border border-slate-850">
                
                {/* Seed Student Initial Text */}
                <div className="flex flex-col items-start">
                  <div className="bg-slate-850 border border-slate-850 text-slate-200 p-3 rounded-2xl rounded-tl-none text-xs max-w-[85%]">
                    <p className="font-bold text-[9px] text-slate-400 mb-1">{selectedComplaint.studentName} (Student)</p>
                    <p>{selectedComplaint.description.substring(0, 120)}...</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">{new Date(selectedComplaint.createdAt).toLocaleTimeString()}</span>
                </div>

                {selectedComplaint.replies.map((reply) => {
                  const isMe = reply.senderRole === 'HOD';
                  return (
                    <div key={reply.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] border ${
                        isMe 
                          ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-200 rounded-tr-none' 
                          : reply.senderRole === 'Faculty' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 rounded-tl-none' 
                            : 'bg-slate-800/60 border-slate-700 text-slate-200 rounded-tl-none'
                      }`}>
                        <p className={`font-bold text-[9px] mb-1 ${
                          isMe ? 'text-indigo-400' : reply.senderRole === 'Faculty' ? 'text-emerald-400' : 'text-slate-450'
                        }`}>
                          {reply.senderName} ({reply.senderRole})
                        </p>
                        <p>{reply.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                    </div>
                  );
                })}

                {selectedComplaint.replies.length === 0 && (
                  <p className="text-center text-[10px] text-slate-500 font-semibold py-4">No discussions have started on this ticket yet.</p>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Send an instruction / official statement..."
                  className="flex-1 bg-slate-900/60 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Button 
                  type="submit" 
                  loading={sendingReply}
                  variant="primary"
                  icon={Icons.Send}
                  size="sm"
                >
                  Send
                </Button>
              </form>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
