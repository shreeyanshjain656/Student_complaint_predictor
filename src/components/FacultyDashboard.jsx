import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/api';
import { Badge, Button, Table, StatusStepper, Modal } from './UI';
import * as Icons from 'lucide-react';

export default function FacultyDashboard({ token, onLogout, addToast }) {
  const [activeTab, setActiveTab] = useState('Overview'); // Overview, AssignedComplaints, Profile
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected complaint drawer/modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch complaints on load
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getComplaints(token);
      setComplaints(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token]);

  // Update status (Under Review / In Progress / Resolved)
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedComplaint) return;
    setUpdatingStatus(true);
    try {
      const updated = await mockApi.updateComplaintStatus(token, selectedComplaint.id, newStatus);
      setSelectedComplaint(updated);
      setComplaints(complaints.map(c => c.id === updated.id ? updated : c));
      addToast(`Status updated to: ${newStatus}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Send reply in chat
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
      addToast('Reply sent to student thread!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress' || c.status === 'Under Review').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const sidebarItems = [
    { name: 'Overview', icon: Icons.LayoutDashboard },
    { name: 'Assigned Complaints', icon: Icons.Briefcase },
    { name: 'Profile', icon: Icons.UserCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <Icons.GraduationCap className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-sm text-white tracking-wide">Faculty Desk</span>
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
              <h1 className="font-black text-sm text-white leading-none tracking-wide">FACULTY DESK</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SCP Predictor</span>
            </div>
          </div>

          {/* Profile card */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 mb-6.5">
            <h4 className="text-xs font-bold text-white truncate">{token.name}</h4>
            <p className="text-[9px] text-indigo-400 font-bold tracking-wider uppercase mt-1">
              DEPT: {token.department || 'Academic Affairs'}
            </p>
            <p className="text-[9px] text-slate-500 font-bold tracking-wider mt-0.5">Faculty ID: {token.id}</p>
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

      {/* PAGE CONTAINER */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Faculty Dashboard Overview</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                You are reviewing complaints routed to the <span className="text-slate-200 font-bold">{token.department}</span> division.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4.5">
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Grievances</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{totalCount}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Awaiting Assignment</p>
                <h3 className="text-2xl font-black text-slate-100 mt-1.5">{pendingCount}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Active Workloads</p>
                <h3 className="text-2xl font-black text-indigo-400 mt-1.5">{inProgressCount}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Resolved Cases</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1.5">{resolvedCount}</h3>
              </div>
            </div>

            {/* Recent work */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">Urgent Grievances Awaiting Action</h4>
              <Table
                columns={[
                  { key: 'id', header: 'Ticket ID' },
                  { key: 'studentName', header: 'Filed By' },
                  { key: 'category', header: 'Category' },
                  { key: 'priority', header: 'Priority', render: (row) => <Badge>{row.priority}</Badge> },
                  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
                ]}
                data={complaints.filter(c => c.status !== 'Resolved').slice(0, 3)}
                loading={loading}
                onRowClick={(row) => setSelectedComplaint(row)}
                emptyMessage="No active grievances awaiting investigation."
              />
            </div>
          </div>
        )}

        {/* ASSIGNED COMPLAINTS TAB */}
        {activeTab === 'Assigned Complaints' && (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Assigned Grievances</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                A structured table of student tickets that requires resolution, sorted by departments.
              </p>
            </div>

            <Table
              columns={[
                { key: 'id', header: 'Ticket ID', className: 'font-mono text-indigo-400' },
                { key: 'studentName', header: 'Student Name' },
                { key: 'category', header: 'Category' },
                { key: 'priority', header: 'Priority', render: (row) => <Badge>{row.priority}</Badge> },
                { key: 'createdAt', header: 'Lodged Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
                { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
              ]}
              data={complaints}
              loading={loading}
              onRowClick={(row) => setSelectedComplaint(row)}
              emptyMessage="No complaints have been assigned to your department roster yet."
            />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'Profile' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Faculty Profile</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Your registered credentials in the college database.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-4.5 pb-6 border-b border-slate-850">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xl">
                  {token.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{token.name}</h3>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{token.role} Account</span>
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Division</span>
                  <p className="text-slate-100 font-semibold mt-1">{token.department || 'Academic Affairs'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Joined On</span>
                  <p className="text-slate-100 font-semibold mt-1">July 12, 2024</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DETAIL MODAL / CHAT DRAWER */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Assigned Ticket: ${selectedComplaint.id}` : ''}
      >
        {selectedComplaint && (
          <div className="space-y-6">
            
            {/* Status Stepper */}
            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
              <StatusStepper status={selectedComplaint.status} />
            </div>

            {/* QUICK STATUS UPDATES */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Manage Ticket Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleUpdateStatus('Under Review')}
                  disabled={updatingStatus}
                  variant={selectedComplaint.status === 'Under Review' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Review
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('In Progress')}
                  disabled={updatingStatus}
                  variant={selectedComplaint.status === 'In Progress' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Progress
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={updatingStatus}
                  variant={selectedComplaint.status === 'Resolved' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Resolve
                </Button>
              </div>
            </div>

            {/* Student metadata */}
            <div className="grid grid-cols-2 gap-4.5 text-xs">
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Student Submitter</span>
                <span className="text-slate-200 font-bold">{selectedComplaint.studentName} ({selectedComplaint.studentId})</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Lodged Date</span>
                <span className="text-slate-200 font-bold">{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Category type</span>
                <span className="text-slate-200 font-bold">{selectedComplaint.category}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">AI Prediction Priority</span>
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

            {/* Attachment preview */}
            {selectedComplaint.photo && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attached Image</h4>
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20 max-h-60 flex items-center justify-center">
                  <img src={selectedComplaint.photo} alt="Attachment" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            )}

            {/* CHAT THREAD */}
            <div className="border-t border-slate-850 pt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolution Chat Thread</h4>
              
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
                  const isMe = reply.senderRole === 'Faculty';
                  return (
                    <div key={reply.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] border ${
                        isMe 
                          ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-200 rounded-tr-none' 
                          : reply.senderRole === 'HOD' 
                            ? 'bg-violet-500/10 border-violet-500/20 text-violet-200 rounded-tl-none' 
                            : 'bg-slate-800/60 border-slate-700 text-slate-200 rounded-tl-none'
                      }`}>
                        <p className={`font-bold text-[9px] mb-1 ${
                          isMe ? 'text-indigo-400' : reply.senderRole === 'HOD' ? 'text-violet-400' : 'text-slate-400'
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
                  placeholder="Send a resolution update / instruction..."
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
