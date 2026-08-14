// FastAPI Connected Database & API Service for Student Complaint Predictor

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const FACULTY_LIST = [
  { id: 'EMP101', name: 'Dr. Amit Patel', department: 'Academic Affairs' },
  { id: 'EMP102', name: 'Dr. Sunita Rao', department: 'Electrical Engineering' },
  { id: 'EMP103', name: 'Prof. Rajesh Mehra', department: 'Mechanical Engineering' },
  { id: 'EMP104', name: 'Dr. Priya Sen', department: 'Hostel Administration' }
];

// LocalStorage helpers for offline/standalone fallback
const getDb = (key, initial) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveDb = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize DBs
let users = getDb('scp_users', []);
let complaints = getDb('scp_complaints', []);
let pendingOtps = {};

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // --- AUTH SERVICES ---
  
  // Register a new user
  signUp: async (role, details) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          email: details.email,
          name: details.name,
          id: details.id,
          mobile: details.mobile,
          department: details.department || (role === 'Faculty' ? 'Academic Affairs' : undefined)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Sign up failed');
      return data;
    } catch (err) {
      console.warn('FastAPI backend fallback to local store:', err.message);
      await delay();
      const emailLower = details.email.toLowerCase();
      const existing = users.find(u => u.email.toLowerCase() === emailLower);
      if (existing) throw new Error('Email is already registered. Please go to Login.');

      pendingOtps[emailLower] = {
        code: '123456',
        role,
        details,
        expiry: Date.now() + 300000
      };
      return { success: true, message: 'OTP sent to email/mobile number.' };
    }
  },

  // Login registered user
  login: async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      return data;
    } catch (err) {
      console.warn('FastAPI backend fallback to local store:', err.message);
      await delay();
      const emailLower = email.toLowerCase();
      const user = users.find(u => u.email.toLowerCase() === emailLower);
      if (!user) throw new Error('This email is not registered. Please sign up first.');

      pendingOtps[emailLower] = {
        code: '123456',
        role: user.role,
        details: user,
        expiry: Date.now() + 300000
      };
      return { success: true, message: 'OTP sent to registered email.' };
    }
  },

  // Verify OTP
  verifyOtp: async (email, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OTP verification failed');
      return data;
    } catch (err) {
      console.warn('FastAPI backend fallback to local store:', err.message);
      await delay();
      const emailLower = email.toLowerCase();
      const pending = pendingOtps[emailLower];
      if (!pending) throw new Error('Session expired or OTP request not found.');
      if (pending.code !== otp) throw new Error('Invalid OTP entered. Please try again.');

      let user = users.find(u => u.email.toLowerCase() === emailLower);
      if (!user) {
        user = {
          email: pending.details.email,
          name: pending.details.name,
          id: pending.details.id,
          mobile: pending.details.mobile,
          role: pending.role,
          department: pending.role === 'Faculty' ? 'Academic Affairs' : undefined
        };
        users.push(user);
        saveDb('scp_users', users);
      }
      delete pendingOtps[emailLower];

      const token = {
        email: user.email,
        name: user.name,
        id: user.id,
        role: user.role,
        department: user.department || null,
        exp: Date.now() + 86400000
      };
      return { token };
    }
  },

  // Resend OTP
  resendOtp: async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Resend failed');
      return data;
    } catch (err) {
      await delay(200);
      return { success: true, message: 'New OTP sent.' };
    }
  },

  // --- COMPLAINT SERVICES ---

  // Get filtered complaints based on current user token
  getComplaints: async (token) => {
    try {
      const queryParams = new URLSearchParams({
        role: token.role,
        user_id: token.id,
        department: token.department || ''
      });
      const res = await fetch(`${API_BASE_URL}/complaints?${queryParams.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch complaints');
      return data;
    } catch (err) {
      console.warn('FastAPI backend fallback to local store:', err.message);
      await delay();
      complaints = getDb('scp_complaints', []);
      if (token.role === 'Student') {
        return complaints.filter(c => c.studentId === token.id);
      } else if (token.role === 'Faculty') {
        return complaints.filter(c => c.assignedTo === token.id || c.department === token.department);
      } else if (token.role === 'HOD') {
        return complaints;
      }
      return [];
    }
  },

  // Create complaint with FastAPI AI Prediction Engine & HOD Notification
  createComplaint: async (token, { category, description, photo, hodEmail, directMessage }) => {
    try {
      const queryParams = new URLSearchParams({
        user_id: token.id,
        user_name: token.name,
        user_role: token.role
      });
      const res = await fetch(`${API_BASE_URL}/complaints?${queryParams.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, photo, hodEmail, directMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to lodge complaint');
      return data;
    } catch (err) {
      console.warn('FastAPI backend fallback to local prediction:', err.message);
      await delay(800);
      const text = (description + ' ' + category).toLowerCase();
      let priority = 'Low';
      let department = 'Estate & Maintenance';
      let confidence = Math.floor(Math.random() * 15) + 70;

      if (text.includes('water') || text.includes('tap') || text.includes('washroom') || text.includes('leak')) {
        priority = 'High';
        department = 'Hostel Administration';
        confidence = 92;
      } else if (text.includes('wifi') || text.includes('internet') || text.includes('computer')) {
        priority = 'High';
        department = 'IT Support';
        confidence = 95;
      }

      const newId = `COMP-${Date.now().toString().slice(-4)}`;
      const newComplaint = {
        id: newId,
        studentId: token.id,
        studentName: token.name,
        category,
        description,
        photo: photo || null,
        hodEmail: hodEmail || null,
        directMessage: directMessage || null,
        priority,
        confidence,
        department,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        assignedTo: null,
        assignedName: null,
        replies: []
      };

      if (hodEmail) {
        console.log(`[MOCK EMAIL SERVICE] Notification email sent to HOD: ${hodEmail} for Ticket ${newId}`);
      }

      complaints = getDb('scp_complaints', []);
      complaints.unshift(newComplaint);
      saveDb('scp_complaints', complaints);
      return newComplaint;
    }
  },

  // Update complaint status (Faculty or HOD)
  updateComplaintStatus: async (token, complaintId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Status update failed');
      return data;
    } catch (err) {
      await delay();
      complaints = getDb('scp_complaints', []);
      const item = complaints.find(c => c.id === complaintId);
      if (item) {
        item.status = status;
        saveDb('scp_complaints', complaints);
      }
      return item;
    }
  },

  // Reassign complaint to a faculty member (HOD only)
  reassignComplaint: async (token, complaintId, facultyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reassignment failed');
      return data;
    } catch (err) {
      await delay();
      complaints = getDb('scp_complaints', []);
      const item = complaints.find(c => c.id === complaintId);
      const facultyObj = FACULTY_LIST.find(f => f.id === facultyId);
      if (item && facultyObj) {
        item.assignedTo = facultyObj.id;
        item.assignedName = facultyObj.name;
        if (item.status === 'Pending') item.status = 'Under Review';
        saveDb('scp_complaints', complaints);
      }
      return item;
    }
  },

  // Post a message in the complaint reply thread
  addReply: async (token, complaintId, message) => {
    try {
      const queryParams = new URLSearchParams({
        sender_role: token.role,
        sender_name: token.name
      });
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/reply?${queryParams.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send reply');
      return data;
    } catch (err) {
      await delay(300);
      complaints = getDb('scp_complaints', []);
      const item = complaints.find(c => c.id === complaintId);
      const reply = {
        id: `R-${Date.now().toString().slice(-4)}`,
        senderRole: token.role,
        senderName: token.name,
        message,
        createdAt: new Date().toISOString()
      };
      if (item) {
        item.replies = item.replies || [];
        item.replies.push(reply);
        saveDb('scp_complaints', complaints);
      }
      return reply;
    }
  },

  // --- ANALYTICS & UTILITY SERVICES ---

  // Get Analytics data (HOD only)
  getAnalytics: async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analytics failed');
      return data;
    } catch (err) {
      await delay(400);
      complaints = getDb('scp_complaints', []);
      const categoriesMap = {};
      complaints.forEach(c => {
        categoriesMap[c.category] = (categoriesMap[c.category] || 0) + 1;
      });
      const categoryData = Object.keys(categoriesMap).map(cat => ({ name: cat, value: categoriesMap[cat] }));
      return {
        categoryData,
        trendData: [
          { date: 'Aug 10', complaints: 2 },
          { date: 'Aug 11', complaints: 4 },
          { date: 'Aug 12', complaints: 1 },
          { date: 'Aug 13', complaints: 5 },
          { date: 'Aug 14', complaints: 3 }
        ],
        stats: {
          total: complaints.length,
          pending: complaints.filter(c => c.status === 'Pending').length,
          highPriority: complaints.filter(c => c.priority === 'High' && c.status !== 'Resolved').length,
          resolvedToday: complaints.filter(c => c.status === 'Resolved').length
        }
      };
    }
  },

  // Fetch registered faculty members
  getFacultyList: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/faculty`);
      const data = await res.json();
      if (!res.ok) throw new Error('Faculty fetch failed');
      return data;
    } catch (err) {
      return FACULTY_LIST;
    }
  }
};
