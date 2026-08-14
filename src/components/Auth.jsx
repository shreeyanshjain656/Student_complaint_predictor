import React, { useState, useEffect, useRef } from 'react';
import { mockApi } from '../services/api';
import { Button, Input } from './UI';
import * as Icons from 'lucide-react';

export default function Auth({ onLoginSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('Student'); // Student, Faculty, HOD
  
  // Form states
  const [name, setName] = useState('');
  const [id, setId] = useState(''); // Roll No / Employee ID
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  
  // OTP Flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  
  // API loader/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const otpRefs = useRef([]);

  // Handle OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // Reset states when swapping view
  const toggleView = () => {
    setIsLogin(!isLogin);
    setError('');
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setName('');
    setId('');
    setMobile('');
    setEmail('');
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  // Submit sign up details or login email
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Email is required.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const res = await mockApi.login(email);
        addToast(res.message, 'success');
      } else {
        if (!name || !id || !mobile) {
          throw new Error('Please fill in all form details.');
        }
        const details = { name, id, mobile, email };
        const res = await mockApi.signUp(role, details);
        addToast(res.message, 'success');
      }
      setOtpSent(true);
      setTimer(30);
      setIsResendDisabled(true);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendOtp = async () => {
    setError('');
    setIsResendDisabled(true);
    setTimer(30);
    try {
      const res = await mockApi.resendOtp(email);
      addToast(res.message, 'success');
      setOtpDigits(['', '', '', '', '', '']);
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
      setIsResendDisabled(false);
    }
  };

  // Split OTP input key management & Paste support
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{1,6}$/.test(pasted)) {
      const digits = pasted.slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      digits.forEach((d, idx) => { newDigits[idx] = d; });
      setOtpDigits(newDigits);
      const focusIndex = Math.min(digits.length, 5);
      if (otpRefs.current[focusIndex]) otpRefs.current[focusIndex].focus();
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return; // numbers only

    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-focus next box
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Submit OTP for validation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 OTP digits.');
      setLoading(false);
      return;
    }

    try {
      const { token } = await mockApi.verifyOtp(email, otpCode);
      addToast('Successfully authenticated!', 'success');
      onLoginSuccess(token);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mb-4.5">
            <Icons.GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-2">
            Complaints Predictor
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            AI-powered Student Complaint Routing & Analytics
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2 animate-shake">
            <Icons.AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!otpSent ? (
          /* REGISTRATION / LOGIN FORMS */
          <div>
            {/* Action Swap tabs (Sign Up vs Sign In) */}
            <div className="flex border-b border-slate-800 mb-6.5 text-sm font-semibold">
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                  isLogin 
                    ? 'border-indigo-500 text-white font-bold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                  !isLogin 
                    ? 'border-indigo-500 text-white font-bold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Role selection tab (Only visible during Sign Up) */}
            {!isLogin && (
              <div className="mb-6.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select User Role
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
                  {['Student', 'Faculty', 'HOD', 'Principal'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`py-2 text-[11px] font-semibold rounded-lg transition-all duration-300 ${
                        role === r 
                          ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {!isLogin && (
                <>
                  <Input 
                    label="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your name" 
                    icon={Icons.User} 
                  />
                  <Input 
                    label={
                      role === 'Student' ? 'Roll Number' :
                      role === 'Faculty' ? 'Faculty ID' :
                      role === 'HOD' ? 'HOD ID' :
                      role === 'Principal' ? 'Principal ID' : 'User ID'
                    } 
                    value={id} 
                    onChange={(e) => setId(e.target.value)} 
                    placeholder={
                      role === 'Student' ? 'e.g. 2023CS01' :
                      role === 'Faculty' ? 'e.g. FAC101' :
                      role === 'HOD' ? 'e.g. HOD201' : 'e.g. PRN301'
                    } 
                    icon={Icons.Key} 
                  />
                  <Input 
                    label="Mobile Number" 
                    value={mobile} 
                    onChange={(e) => setMobile(e.target.value)} 
                    placeholder="e.g. 9876543210" 
                    type="tel"
                    icon={Icons.Phone} 
                  />
                </>
              )}
              <Input 
                label="Academic Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={role === 'Student' ? 'student@school.edu' : role === 'Faculty' ? 'faculty@school.edu' : 'hod@school.edu'} 
                type="email" 
                icon={Icons.Mail} 
              />

              <Button 
                type="submit" 
                loading={loading} 
                className="w-full mt-3"
                icon={isLogin ? Icons.LogIn : Icons.UserPlus}
              >
                {isLogin ? 'Get OTP Code' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-xs text-slate-500 font-medium">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                onClick={toggleView} 
                className="text-xs text-indigo-400 hover:underline font-bold transition-all"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </div>

            {/* Quick Login Assist details */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
                Quick testing credentials:
              </p>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-400 font-semibold">
                <div className="flex justify-between py-1 px-2.5 bg-slate-950/40 rounded-lg">
                  <span>Student: student@school.edu</span>
                  <span className="text-indigo-400 cursor-pointer" onClick={() => { setEmail('student@school.edu'); setIsLogin(true); }}>Use</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 bg-slate-950/40 rounded-lg">
                  <span>Faculty: faculty@school.edu</span>
                  <span className="text-indigo-400 cursor-pointer" onClick={() => { setEmail('faculty@school.edu'); setIsLogin(true); }}>Use</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 bg-slate-950/40 rounded-lg">
                  <span>HOD: hod@school.edu</span>
                  <span className="text-indigo-400 cursor-pointer" onClick={() => { setEmail('hod@school.edu'); setIsLogin(true); }}>Use</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* OTP SCREEN FLOW */
          <div>
            <button 
              onClick={() => setOtpSent(false)} 
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold mb-6 transition-all"
            >
              <Icons.ArrowLeft className="w-3.5 h-3.5" />
              <span>Change email / registration</span>
            </button>

            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white mb-2">Verify OTP Code</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                A 6-digit OTP verification code has been dispatched to <span className="text-slate-200 font-semibold">{email}</span>. Please check your inbox or spam folder.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2 max-w-sm mx-auto">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    className="w-12 h-13 text-center bg-slate-900/60 border border-slate-800 text-lg font-bold text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60"
                  />
                ))}
              </div>

              <div className="text-center">
                {timer > 0 ? (
                  <span className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                    <Icons.Clock className="w-3.5 h-3.5 animate-pulse" />
                    Resend code in {timer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResendDisabled}
                    className="text-xs text-indigo-400 hover:underline font-bold transition-all disabled:opacity-50"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <Button 
                type="submit" 
                loading={loading} 
                className="w-full"
                icon={Icons.Check}
              >
                Verify & Continue
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
