import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/api';
import { Badge, Button, Input, Textarea, Table, StatusStepper, CircularProgress } from './UI';
import * as Icons from 'lucide-react';

export default function StudentDashboard({ token, onLogout, addToast }) {
  const [activeTab, setActiveTab] = useState('Overview'); // Overview, NewComplaint, MyComplaints, Profile
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('Hostel & Mess');
  const [description, setDescription] = useState('');
  const [hodEmail, setHodEmail] = useState('hod@school.edu');
  const [directMessage, setDirectMessage] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  // Selected complaint drawer/modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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

  // Handle local image upload preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit complaint to API
  const handleLodgeComplaint = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast('Description is required.', 'error');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const data = await mockApi.createComplaint(token, {
        category,
        description,
        photo: photoPreview,
        hodEmail: hodEmail.trim() || undefined,
        directMessage: directMessage.trim() || undefined
      });
      setPredictionResult(data);
      addToast(`Complaint submitted & notification email dispatched to HOD (${hodEmail})!`, 'success');
      
      // Reset form fields
      setCategory('Hostel & Mess');
      setDescription('');
      setHodEmail('hod@school.edu');
      setDirectMessage('');
      setPhoto(null);
      setPhotoPreview('');
      
      // Refresh complaints list
      fetchComplaints();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Send a chat response
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const reply = await mockApi.addReply(token, selectedComplaint.id, replyMessage);
      
      // Local state update
      const updated = { 
        ...selectedComplaint, 
        replies: [...selectedComplaint.replies, reply] 
      };
      setSelectedComplaint(updated);
      setComplaints(complaints.map(c => c.id === updated.id ? updated : c));
      
      setReplyMessage('');
      addToast('Reply message sent!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Statistics calculation
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const reviewCount = complaints.filter(c => c.status === 'Under Review' || c.status === 'In Progress').length;

  const sidebarItems = [
    { name: 'Overview', icon: Icons.LayoutDashboard },
    { name: 'New Complaint', icon: Icons.PlusCircle },
    { name: 'My Complaints', icon: Icons.FileText },
    { name: 'Profile', icon: Icons.UserCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <Icons.GraduationCap className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-sm text-white tracking-wide">SCP Portal</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 ${
        mobileMenuOpen ? 'block' : 'hidden md:flex'
      }`}>
        <div className="p-6">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <Icons.GraduationCap className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="font-black text-sm text-white leading-none tracking-wide">STUDENT PORTAL</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SCP Predictor</span>
            </div>
          </div>

          {/* User profile brief */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 mb-6.5">
            <h4 className="text-xs font-bold text-white truncate">{token.name}</h4>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">{token.role} • {token.id}</p>
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

      {/* DASHBOARD PAGE CONTENT */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        
        {/* OVERVIEW SCREEN */}
        {activeTab === 'Overview' && (
          <div className="space-y-8 max-w-5xl">
            {/* Header Greeting */}
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Dashboard Overview</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Welcome back, {token.name}. Here is a summary of your lodged grievances.
              </p>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Grievances</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{totalCount}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Pending Actions</p>
                <h3 className="text-2xl font-black text-slate-100 mt-1.5">{pendingCount}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Under Investigation</p>
                <h3 className="text-2xl font-black text-indigo-400 mt-1.5">{reviewCount}</h3>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Resolved Cases</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1.5">{resolvedCount}</h3>
              </div>
            </div>

            {/* Quick lodging banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/30 to-indigo-600/20 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white">Need to lodge a new complaint?</h4>
                <p className="text-xs text-slate-300 mt-1">Our NLP model will analyze description details, suggest resolving departments and calculate priority.</p>
              </div>
              <Button 
                onClick={() => setActiveTab('New Complaint')} 
                icon={Icons.PlusCircle}
                variant="primary"
                size="sm"
              >
                File New Case
              </Button>
            </div>

            {/* Recent complaints */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">Recent Complaints</h4>
              <Table
                columns={[
                  { key: 'id', header: 'Ticket ID' },
                  { key: 'category', header: 'Category' },
                  { key: 'priority', header: 'Priority', render: (row) => <Badge>{row.priority}</Badge> },
                  { key: 'createdAt', header: 'Lodged On', render: (row) => new Date(row.createdAt).toLocaleDateString() },
                  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
                ]}
                data={complaints.slice(0, 3)}
                loading={loading}
                onRowClick={(row) => {
                  setSelectedComplaint(row);
                }}
                emptyMessage="You haven't lodged any complaints yet."
              />
            </div>
          </div>
        )}

        {/* NEW COMPLAINT FORM SCREEN */}
        {activeTab === 'New Complaint' && (
          <div className="max-w-3xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Lodge New Grievance</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Fill the details below. Our model will auto-classify department and priority levels.
              </p>
            </div>

            {predictionResult ? (
              /* PREDICTION RESULT CARD */
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 animate-in zoom-in duration-300 max-w-xl shadow-2xl">
                <div className="flex items-center gap-3 text-emerald-400 font-bold">
                  <Icons.CheckCircle2 className="w-6 h-6" />
                  <h3>Grievance Filed Successfully!</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4.5 border-y border-slate-800 items-center justify-items-center md:justify-items-stretch">
                  <div className="flex flex-col items-center justify-center">
                    <CircularProgress percentage={predictionResult.confidence} />
                  </div>
                  <div className="space-y-4 w-full">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Assigned Dept</span>
                      <span className="text-sm font-bold text-slate-100 block mt-1">{predictionResult.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Priority Score</span>
                      <div className="mt-1">
                        <Badge>{predictionResult.priority}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ticket Code</span>
                      <span className="text-xs font-mono text-indigo-400 block mt-1">{predictionResult.id}</span>
                    </div>
                    {predictionResult.hodEmail && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Notified HOD Email</span>
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                          <Icons.Mail className="w-3.5 h-3.5" />
                          {predictionResult.hodEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-slate-300 block mb-1">Classifier Context Note:</span>
                  The model predicted the department and priority based on keywords in your complaint. Administrative heads can verify and modify assignment details if needed.
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setPredictionResult(null);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    File Another
                  </Button>
                  <Button 
                    onClick={() => {
                      setPredictionResult(null);
                      setActiveTab('My Complaints');
                    }}
                    variant="primary"
                    className="flex-1"
                  >
                    View Status
                  </Button>
                </div>
              </div>
            ) : (
              /* FORM SUBMISSION */
              <form onSubmit={handleLodgeComplaint} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6.5 space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Complaint Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl text-sm px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60"
                  >
                    <option value="Hostel & Mess">Hostel & Mess</option>
                    <option value="Academics">Academics</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <Textarea
                  label="Detailed Description"
                  placeholder="Clearly describe your problem. Include dates, locations, and details so the AI classifier works efficiently (e.g. mention 'Wifi bulb is blown' or 'Water supply is cut in Block A')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                {/* HOD / Authority Direct Email Notification Option */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                      <Icons.Mail className="w-4 h-4 text-indigo-400" />
                      Recipient HOD / Authority Email Notification
                    </label>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold border border-indigo-500/20">
                      Direct Alert
                    </span>
                  </div>

                  <Input
                    label="HOD Email Address"
                    type="email"
                    placeholder="e.g. hod@school.edu"
                    value={hodEmail}
                    onChange={(e) => setHodEmail(e.target.value)}
                    icon={Icons.AtSign}
                  />

                  {/* Preset quick email chips */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Quick Select:</span>
                    {[
                      { label: 'General HOD', email: 'hod@school.edu' },
                      { label: 'CS HOD', email: 'hod.cs@jecrc.ac.in' },
                      { label: 'Principal', email: 'principal@jecrc.ac.in' }
                    ].map((chip) => (
                      <button
                        key={chip.email}
                        type="button"
                        onClick={() => setHodEmail(chip.email)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          hodEmail === chip.email
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {chip.label} ({chip.email})
                      </button>
                    ))}
                  </div>

                  <Input
                    label="Direct Note / Message for HOD (Optional)"
                    placeholder="e.g. Respected Sir, kindly treat this request with high urgency as practical exams start Monday."
                    value={directMessage}
                    onChange={(e) => setDirectMessage(e.target.value)}
                    icon={Icons.MessageSquare}
                  />
                </div>

                {/* Picture attachment mockup */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Attachment Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-850 hover:border-indigo-500/55 rounded-xl cursor-pointer w-32 h-32 bg-slate-950/40 hover:bg-slate-950/80 transition-all duration-300">
                      <Icons.Upload className="w-5 h-5 text-slate-400 mb-2" />
                      <span className="text-[10px] text-slate-500 font-semibold text-center px-1">Upload Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoChange} 
                      />
                    </label>
                    
                    {photoPreview && (
                      <div className="relative border border-slate-800 rounded-xl w-32 h-32 overflow-hidden bg-slate-950/30 flex items-center justify-center">
                        <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                        <button 
                          type="button" 
                          onClick={() => { setPhoto(null); setPhotoPreview(''); }}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={submittingComplaint}
                    variant="primary"
                    icon={Icons.Send}
                    className="w-full md:w-auto md:px-10"
                  >
                    Analyze & Lodge Case
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MY COMPLAINTS TABLE SCREEN */}
        {activeTab === 'My Complaints' && (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Your Grievances History</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Monitor current investigations, response updates, and timeline progress below.
              </p>
            </div>

            <Table
              columns={[
                { key: 'id', header: 'Ticket Code', className: 'font-mono text-indigo-400' },
                { key: 'category', header: 'Category' },
                { key: 'priority', header: 'Priority', render: (row) => <Badge>{row.priority}</Badge> },
                { key: 'createdAt', header: 'Lodged Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
                { key: 'department', header: 'Assigned Dept' },
                { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
              ]}
              data={complaints}
              loading={loading}
              onRowClick={(row) => setSelectedComplaint(row)}
              emptyMessage="You have no filed grievances on record."
            />
          </div>
        )}

        {/* USER PROFILE SCREEN */}
        {activeTab === 'Profile' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Student Profile</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Your registered institutional identity details.
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Roll Number / ID</span>
                  <p className="text-slate-100 font-semibold mt-1">{token.id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</span>
                  <p className="text-slate-100 font-semibold mt-1">{token.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</span>
                  <p className="text-slate-100 font-semibold mt-1">+91 {token.mobile || '9876543210'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">College Department</span>
                  <p className="text-slate-100 font-semibold mt-1">Computer Science & Engineering</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SELECTED COMPLAINT DRAWER / DETAIL MODAL */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Grievance Details: ${selectedComplaint.id}` : ''}
      >
        {selectedComplaint && (
          <div className="space-y-6">
            
            {/* Status Stepper Timeline */}
            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
              <StatusStepper status={selectedComplaint.status} />
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Category</span>
                <span className="text-slate-200 font-bold">{selectedComplaint.category}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Assigned Department</span>
                <span className="text-slate-200 font-bold">{selectedComplaint.department}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">AI Classification Priority</span>
                <div className="mt-1">
                  <Badge>{selectedComplaint.priority}</Badge>
                </div>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-lg">
                <span className="text-slate-500 font-bold block mb-1">Assigned Officer</span>
                <span className="text-slate-200 font-bold">
                  {selectedComplaint.assignedName || 'Unassigned (Awaiting Review)'}
                </span>
              </div>
              {selectedComplaint.hodEmail && (
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg col-span-2">
                  <span className="text-indigo-400 font-bold block mb-1 text-[11px] flex items-center gap-1.5">
                    <Icons.Mail className="w-3.5 h-3.5" />
                    Target HOD / Authority Notified
                  </span>
                  <span className="text-slate-200 font-bold">{selectedComplaint.hodEmail}</span>
                  {selectedComplaint.directMessage && (
                    <p className="text-[11px] text-slate-400 italic mt-1">"{selectedComplaint.directMessage}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Description Text */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-4 border border-slate-850/65 rounded-xl">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Uploaded Photo Attachment */}
            {selectedComplaint.photo && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attachment Preview</h4>
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20 max-h-60 flex items-center justify-center">
                  <img 
                    src={selectedComplaint.photo} 
                    alt="Attachment" 
                    className="max-w-full max-h-full object-contain hover:scale-[1.02] transition-transform duration-300" 
                  />
                </div>
              </div>
            )}

            {/* REPLY/CHAT SECTION */}
            <div className="border-t border-slate-850 pt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolution Chat Thread</h4>
              
              {/* Message Bubbles Container */}
              <div className="space-y-3 max-h-56 overflow-y-auto p-3.5 bg-slate-950/40 rounded-xl border border-slate-850">
                
                {/* Seed Student Initial Text */}
                <div className="flex flex-col items-end">
                  <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%]">
                    <p className="font-bold text-[10px] text-indigo-400 mb-1">You (Student) • Original Case Details</p>
                    <p>{selectedComplaint.description.substring(0, 120)}...</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">{new Date(selectedComplaint.createdAt).toLocaleTimeString()}</span>
                </div>

                {selectedComplaint.replies.map((reply) => {
                  const isMe = reply.senderRole === 'Student';
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
              {selectedComplaint.status !== 'Resolved' ? (
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Send a response details update..."
                    className="flex-1 bg-slate-900/60 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Button 
                    type="submit" 
                    loading={sendingReply}
                    variant="primary"
                    icon={Icons.Send}
                    size="sm"
                  >
                    Reply
                  </Button>
                </form>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                  <Icons.Check className="w-4 h-4" />
                  <span>This grievance has been marked as Resolved. Chat is archived.</span>
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
