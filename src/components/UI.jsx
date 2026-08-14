import React from 'react';
import * as Icons from 'lucide-react';

// 1. BADGE COMPONENT
export function Badge({ children, variant = 'info', className = '' }) {
  const baseStyle = 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-300';
  
  const variants = {
    // Priority Badges
    High: 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.07)]',
    Medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.07)]',
    Low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.07)]',
    
    // Status Badges
    Pending: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-400',
    'Under Review': 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse',
    'In Progress': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.07)]',
    Resolved: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.07)]',

    // Misc
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  };

  const activeVariant = variants[children] || variants[variant] || variants.info;

  return (
    <span className={`${baseStyle} ${activeVariant} ${className}`}>
      {children}
    </span>
  );
}

// 2. BUTTON COMPONENT
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon: IconComponent, 
  className = '', 
  disabled = false,
  ...props 
}) {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 border border-indigo-500/20',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.05)]',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5'
  };

  return (
    <button 
      disabled={disabled || loading} 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Icons.Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : IconComponent ? (
        <IconComponent className="w-4 h-4 text-current" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

// 3. INPUT COMPONENT
export function Input({ 
  label, 
  error, 
  icon: IconComponent, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {IconComponent && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
            <IconComponent className="w-4.5 h-4.5" />
          </div>
        )}
        <input 
          className={`w-full bg-slate-900/60 border rounded-xl text-sm px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
            IconComponent ? 'pl-11' : ''
          } ${
            error 
              ? 'border-red-500/40 focus:ring-red-500/20 focus:border-red-400 text-red-200' 
              : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500/60 hover:border-slate-700'
          }`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <Icons.AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// 4. TEXTAREA COMPONENT
export function Textarea({ 
  label, 
  error, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <textarea 
        className={`w-full bg-slate-900/60 border rounded-xl text-sm px-4 py-3 min-h-[120px] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
          error 
            ? 'border-red-500/40 focus:ring-red-500/20 focus:border-red-400 text-red-200' 
            : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500/60 hover:border-slate-700'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <Icons.AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// 5. STATUS STEPPER (TIMELINE)
export function StatusStepper({ status }) {
  const steps = ['Pending', 'Under Review', 'In Progress', 'Resolved'];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connection line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-700" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step} className="flex flex-col items-center z-10 relative">
              {/* Node Circle */}
              <div 
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : isActive 
                      ? 'bg-slate-900 border-indigo-500 text-indigo-400 scale-110 ring-4 ring-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.3)]' 
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Icons.Check className="w-4 h-4" />
                ) : isActive ? (
                  <Icons.Clock className="w-4 h-4 animate-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span 
                className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive 
                    ? 'text-indigo-400' 
                    : isCompleted 
                      ? 'text-emerald-400' 
                      : 'text-slate-500'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 6. CIRCULAR PROGRESS RING (CONFIDENCE GRAPH)
export function CircularProgress({ percentage, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Decide colors based on score
  let strokeColor = 'stroke-emerald-500';
  let filterColor = 'rgba(16, 185, 129, 0.2)';
  if (percentage < 85 && percentage >= 75) {
    strokeColor = 'stroke-indigo-500';
    filterColor = 'rgba(99, 102, 241, 0.2)';
  } else if (percentage < 75) {
    strokeColor = 'stroke-amber-500';
    filterColor = 'rgba(245, 158, 11, 0.2)';
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Active Ring */}
        <circle
          className={`${strokeColor} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ filter: `drop-shadow(0 0 4px ${filterColor})` }}
        />
      </svg>
      {/* Centered text */}
      <div className="absolute text-center">
        <span className="text-2xl font-extrabold text-white tracking-tight">{percentage}%</span>
        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Confidence</span>
      </div>
    </div>
  );
}

// 7. RESPONSIVE TABLE WITH SKELETON LOADERS
export function Table({ 
  columns, 
  data, 
  loading = false, 
  onRowClick, 
  emptyMessage = 'No data records found.' 
}) {
  return (
    <div className="w-full overflow-hidden border border-slate-800/80 rounded-2xl bg-slate-900/30 backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              // Skeleton Loaders
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/20">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-5.5">
                      <div className="h-4 bg-slate-800 rounded-md animate-pulse w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Icons.FileText className="w-8 h-8 text-slate-600" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rIdx) => (
                <tr 
                  key={row.id || rIdx} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors duration-200 border-slate-800/60 ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-800/40' : 'hover:bg-slate-800/10'
                  }`}
                >
                  {columns.map(col => (
                    <td 
                      key={col.key} 
                      className={`px-6 py-4.5 text-sm text-slate-300 font-medium ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 8. CUSTOM MODAL (GLASSMORPHISM OVERLAY)
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      {/* Modal Card */}
      <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-indigo-500/5 z-10 animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/40">
          <h3 className="text-base font-bold text-slate-100 tracking-wide">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// 9. TOAST NOTIFICATIONS RENDERER
export function Toast({ message, type = 'success', onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    error: 'bg-red-950/90 border-red-500/30 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    info: 'bg-blue-950/90 border-blue-500/30 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    warning: 'bg-amber-950/90 border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
  };

  const icons = {
    success: <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <Icons.AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Icons.AlertCircle className="w-5 h-5 text-blue-400" />,
    warning: <Icons.AlertTriangle className="w-5 h-5 text-amber-400" />
  };

  return (
    <div className={`flex items-center gap-3 px-4.5 py-3.5 border rounded-xl backdrop-blur-md animate-in slide-in-from-top duration-300 z-50 select-none ${styles[type]}`}>
      {icons[type]}
      <p className="text-xs font-semibold tracking-wide">{message}</p>
      <button 
        onClick={onClose} 
        className="ml-3 p-0.5 rounded text-current opacity-60 hover:opacity-100 transition-opacity"
      >
        <Icons.X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
