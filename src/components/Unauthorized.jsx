import React from 'react';
import { Button } from './UI';
import * as Icons from 'lucide-react';

export default function Unauthorized({ onGoBack, userRole }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center relative z-10 space-y-6">
        
        {/* Warning Icon */}
        <div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full animate-bounce">
          <Icons.ShieldAlert className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">403 - Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            You do not have the required permissions to view this dashboard page. 
            {userRole && (
              <span> Your current role is registered as <strong className="text-red-400 font-bold uppercase">{userRole}</strong>.</span>
            )}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button 
            onClick={onGoBack} 
            variant="secondary"
            className="w-full"
            icon={Icons.ArrowLeft}
          >
            Go to Your Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
