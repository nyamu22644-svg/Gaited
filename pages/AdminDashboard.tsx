
import React, { useState, useEffect } from 'react';
import { MOCK_ADMIN_STATS, MOCK_PAYOUTS, MOCK_NOTES, getAllUsers } from '../services/db';
import { formatCurrency } from '../lib/utils';
import { 
  TrendingUp, Users, AlertCircle, Check, Trash2, ShieldAlert, 
  DollarSign, Activity, Eye, Search, Ban, ShieldCheck, XCircle, 
  MoreVertical, Filter, Download, Lock, Key, Unlock, Siren, History, FileText, LogOut 
} from 'lucide-react';
import { Note, Profile } from '../types';

// --- SHADCN-LIKE UI PRIMITIVES (Internal Design System) ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-900/20",
      destructive: "bg-red-900/50 text-red-200 hover:bg-red-900/70 border border-red-900",
      outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200",
      secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700",
      ghost: "hover:bg-slate-800 text-slate-300 hover:text-white",
      link: "text-emerald-500 underline-offset-4 hover:underline",
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    };
    return (
      <button ref={ref} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
    );
  }
);
Button.displayName = "Button";

const Card = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border border-slate-800 bg-slate-900/50 text-slate-200 shadow-sm ${className}`} {...props} />
);

const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`font-semibold leading-none tracking-tight text-white ${className}`} {...props} />
);

const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

const Badge = ({ variant = 'default', className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'outline' | 'destructive' | 'success' | 'warning' }) => {
  const variants = {
    default: "border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700",
    outline: "border-slate-700 text-slate-400",
    destructive: "border-transparent bg-red-900/30 text-red-400 hover:bg-red-900/40",
    success: "border-transparent bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/40",
    warning: "border-transparent bg-amber-900/30 text-amber-400 hover:bg-amber-900/40",
  };
  return <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${variants[variant]} ${className}`} {...props} />;
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-200 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));
Input.displayName = "Input";

const Tabs = ({ value, onValueChange, children, className = '' }: any) => (
  <div className={`w-full ${className}`}>{children}</div>
);

const TabsList = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 p-1 text-slate-400 ${className}`} {...props} />
);

const TabsTrigger = ({ value, activeValue, onClick, children, className = '' }: any) => (
  <button
    onClick={() => onClick(value)}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-slate-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeValue === value
        ? 'bg-slate-800 text-emerald-400 shadow-sm'
        : 'hover:bg-slate-800/50 hover:text-slate-200'
    } ${className}`}
  >
    {children}
  </button>
);

const Table = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
);

const TableHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`[&_tr]:border-b [&_tr]:border-slate-800 ${className}`} {...props} />
);

const TableRow = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`border-b border-slate-800 transition-colors hover:bg-slate-800/50 data-[state=selected]:bg-slate-800 ${className}`} {...props} />
);

const TableHead = ({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={`h-10 px-4 text-left align-middle font-medium text-slate-400 [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);

const TableCell = ({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);

// --- TYPES FOR AUDIT LOGS ---
interface AuditLog {
  id: string;
  action: string;
  admin: string;
  details: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

interface AdminDashboardProps {
  onExit: () => void;
  onLogout: () => void;
}

// --- MAIN COMPONENT ---

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'police' | 'users' | 'security'>('overview');
  const [payouts, setPayouts] = useState(MOCK_PAYOUTS);
  const [reportedNotes, setReportedNotes] = useState<Note[]>(MOCK_NOTES);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Security State
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [platformFrozen, setPlatformFrozen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'log-1', action: 'SYSTEM_STARTUP', admin: 'SYSTEM', details: 'Admin console initialized.', timestamp: new Date().toISOString(), status: 'SUCCESS' }
  ]);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
       getAllUsers().then(data => setUsers(data));
    }
  }, [activeTab]);

  // --- SECURITY LOGIC ---

  const logAction = (action: string, details: string, status: AuditLog['status'] = 'SUCCESS') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      admin: 'SuperAdmin',
      details,
      timestamp: new Date().toISOString(),
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '25400') {
      setIsLocked(false);
      logAction('ADMIN_LOGIN', 'Superadmin authenticated via PIN.');
      setAuthError('');
    } else {
      setAuthError('Invalid PIN. Access Denied.');
      setPin('');
      logAction('LOGIN_ATTEMPT_FAILED', 'Invalid PIN entry.', 'FAILURE');
    }
  };

  const togglePlatformFreeze = () => {
    const action = platformFrozen ? 'Unfreeze' : 'Freeze';
    if (window.confirm(`EMERGENCY: Are you sure you want to ${action} all platform transactions?`)) {
      setPlatformFrozen(!platformFrozen);
      logAction('EMERGENCY_STATUS_CHANGE', `Platform ${platformFrozen ? 'resumed' : 'frozen'} by admin.`, 'WARNING');
    }
  };

  // --- BUSINESS LOGIC ---

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "audit_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logAction('LOG_EXPORT', 'Audit logs downloaded manually.');
  };

  const handleCheckLatency = () => {
    const start = Date.now();
    // Simulate ping
    setTimeout(() => {
        const ms = Date.now() - start;
        alert(`API Latency: ${ms}ms (Healthy)`);
        logAction('HEALTH_CHECK', `Manual latency check: ${ms}ms`);
    }, Math.random() * 200 + 50);
  };

  const handleApprovePayout = (id: string, amount: number) => {
    if (platformFrozen) {
      alert("Platform is FROZEN. Cannot process payouts.");
      return;
    }
    const confirm = window.confirm(`Approve payout of ${formatCurrency(amount)} via M-Pesa B2C?`);
    if (!confirm) return;
    
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    logAction('PAYOUT_APPROVED', `Payout ID ${id} for ${formatCurrency(amount)} approved.`);
  };

  const handleDeleteNote = (id: string) => {
    const confirm = window.confirm("Delete this note and refund all recent buyers?");
    if (confirm) {
      setReportedNotes(prev => prev.filter(n => n.id !== id));
      logAction('NOTE_DELETED', `Reported note ${id} removed from platform.`, 'WARNING');
    }
  };

  const handleToggleBan = (userId: string, currentBanStatus?: boolean) => {
    const action = currentBanStatus ? 'Unban' : 'Ban';
    const confirm = window.confirm(`Are you sure you want to ${action} this user?`);
    if (confirm) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
      logAction('USER_STATUS_CHANGE', `User ${userId} ${action}ned.`, 'WARNING');
    }
  };

  const handleToggleVerify = (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Revoke Verified Badge from' : 'Verify';
    const confirm = window.confirm(`Are you sure you want to ${action} this seller?`);
    if (confirm) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified_seller: !currentStatus } : u));
      logAction('SELLER_VERIFICATION', `User ${userId} verification: ${!currentStatus}`);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.mpesa_number && user.mpesa_number.includes(userSearch)) || 
    user.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  // --- RENDER LOCK SCREEN ---
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
        <button 
          onClick={onExit} 
          className="absolute top-4 left-4 text-slate-500 hover:text-slate-300 flex items-center gap-2"
        >
          <LogOut size={16} /> Back to Marketplace
        </button>
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">Restricted Access</CardTitle>
            <p className="text-slate-400 text-sm">GAITED Superadmin Console</p>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleUnlock} className="space-y-4">
               <div>
                 <Input 
                    type="password" 
                    placeholder="Enter Secure PIN (25400)" 
                    className="text-center text-2xl tracking-[0.5em] h-12 bg-slate-950 border-slate-700"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={5}
                    autoFocus
                 />
               </div>
               {authError && (
                 <div className="flex items-center justify-center text-red-500 text-sm gap-2 bg-red-950/30 p-2 rounded">
                   <AlertCircle size={14} /> {authError}
                 </div>
               )}
               <Button type="submit" className="w-full h-12 text-base">
                 <Unlock className="mr-2 w-4 h-4" /> Unlock Console
               </Button>
             </form>
             <p className="text-center text-xs text-slate-600 mt-6">
               Unauthorized access is monitored and logged. <br/> IP: 102.135.x.x
             </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-8 pb-32 font-sans animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2 tracking-tight">
            <ShieldAlert className="text-emerald-500" />
            Admin Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform integrity, financials, and users.</p>
        </div>
        <div className="flex items-center gap-3">
          {platformFrozen && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold animate-pulse shadow-lg shadow-red-900/50">
               <Siren size={14} /> SYSTEM FROZEN
            </div>
          )}
          <Badge variant="outline">v1.0.4</Badge>
          <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md text-xs font-mono border border-emerald-500/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]">
            SUPER_ADMIN
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsLocked(true)} title="Lock Console">
             <Lock className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="outline" size="sm" onClick={onExit} title="Exit to App" className="ml-2 gap-2 text-slate-400 hover:text-white">
             <LogOut className="w-4 h-4" /> Exit
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout} title="Log Out" className="ml-2 gap-2 text-red-400 hover:text-red-300 border-red-900/30 hover:bg-red-900/10">
             <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <TabsList className="bg-slate-900 p-1 w-full md:w-auto overflow-x-auto justify-start border border-slate-800">
          {(['overview', 'payouts', 'police', 'users', 'security'] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab} activeValue={activeTab} onClick={setActiveTab}>
              <span className="capitalize">{tab}</span>
              {tab === 'payouts' && payouts.some(p => p.status === 'PENDING') && (
                <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              {tab === 'security' && (
                <Lock className="ml-2 w-3 h-3 text-slate-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {[
              { title: "Platform Revenue", value: MOCK_ADMIN_STATS.platform_revenue, icon: DollarSign, change: "+12.5%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { title: "Liabilities (Held)", value: MOCK_ADMIN_STATS.liabilities, icon: Activity, change: "Pending", color: "text-blue-500", bg: "bg-blue-500/10" },
              { title: "Active Users", value: "1,204", icon: Users, change: "+45 this week", color: "text-purple-500", bg: "bg-purple-500/10" },
              { title: "Active Disputes", value: MOCK_ADMIN_STATS.active_disputes, icon: AlertCircle, change: "Action Req.", color: "text-red-500", bg: "bg-red-500/10" }
            ].map((stat, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <span className="text-sm font-medium text-slate-400">{stat.title}</span>
                  <div className={`p-2 rounded-full ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                  </div>
                  <p className={`text-xs ${stat.color} mt-1 font-medium`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {/* Quick Actions Card */}
            <Card className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-slate-900 to-slate-900 border-emerald-900/30">
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button variant="outline" className="gap-2" onClick={handleExportLogs}>
                        <Download className="h-4 w-4" /> Export Logs
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleCheckLatency}>
                        <Activity className="h-4 w-4" /> View API Latency
                    </Button>
                </CardContent>
            </Card>
          </div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <Card className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <CardHeader>
              <CardTitle>Pending Withdrawals</CardTitle>
              <p className="text-sm text-slate-400">Review and approve B2C M-Pesa transactions.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {payouts.map(payout => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-xs text-slate-500">{payout.id}</TableCell>
                      <TableCell>{payout.user_id}</TableCell>
                      <TableCell className="font-bold text-emerald-400">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className="text-slate-400">{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {payout.status === 'PENDING' ? (
                          <Badge variant="outline" className="bg-amber-950/30 text-amber-500 border-amber-900/50">Processing</Badge>
                        ) : (
                          <Badge variant="success">Paid</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {payout.status === 'PENDING' && (
                          <Button size="sm" onClick={() => handleApprovePayout(payout.id, payout.amount)} disabled={platformFrozen}>
                            <Check className="mr-2 h-3 w-3" /> Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* POLICE TAB */}
        {activeTab === 'police' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="rounded-lg bg-amber-900/10 border border-amber-900/30 p-4 flex gap-4 text-amber-200">
              <ShieldAlert className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                 <h4 className="font-bold text-sm text-amber-400">Moderation Queue</h4>
                 <p className="text-xs opacity-80 mt-1">
                   These notes have been flagged by the AI engine or reported by users. 
                   Deleting a note will automatically trigger refunds to recent buyers.
                 </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reportedNotes.map(note => (
                <Card key={note.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="h-32 md:h-auto md:w-32 bg-slate-800 relative">
                       <img src={note.preview_image} className="w-full h-full object-cover opacity-60 mix-blend-overlay" alt="Preview" />
                    </div>
                    
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">Reported: Blank File</Badge>
                        <span className="text-xs text-slate-500 font-mono">{note.id}</span>
                      </div>
                      <h4 className="font-bold text-white text-lg">{note.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        Seller: <span className="text-slate-200">{note.seller_name}</span> • 
                        Unit: <span className="text-slate-200">{note.unit_code}</span>
                      </p>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <Button variant="secondary" size="sm">
                          <Eye className="mr-2 h-3 w-3" /> View Content
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="mr-2 h-3 w-3" /> Ban & Refund
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <Card className="animate-in slide-in-from-bottom-2 fade-in duration-300">
             <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                 <CardTitle>User Management</CardTitle>
                 <p className="text-sm text-slate-400">Verify sellers or ban violators.</p>
               </div>
               
               <div className="relative w-full md:w-72">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                 <Input 
                   type="text" 
                   placeholder="Search phone or username..."
                   value={userSearch}
                   onChange={(e) => setUserSearch(e.target.value)}
                   className="pl-9"
                 />
               </div>
             </CardHeader>

             <CardContent>
               <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>User</TableHead>
                       <TableHead>Phone (M-Pesa)</TableHead>
                       <TableHead>Stats</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <tbody>
                     {filteredUsers.map(user => (
                       <TableRow key={user.id}>
                         <TableCell>
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                                   <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                               </div>
                               <div>
                                 <p className="font-medium text-white flex items-center">
                                   {user.username}
                                   {user.is_verified_seller && <ShieldCheck className="text-emerald-400 ml-1 h-3 w-3" />}
                                 </p>
                                 <p className="text-xs text-slate-500">{user.university}</p>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="font-mono text-slate-400 text-xs">
                           {user.mpesa_number || 'N/A'}
                         </TableCell>
                         <TableCell>
                            <div className="text-xs text-slate-400">
                               Reputation: <span className={user.reputation_score < 0 ? 'text-red-400' : 'text-slate-300'}>{user.reputation_score}</span>
                            </div>
                         </TableCell>
                         <TableCell>
                            {user.is_banned ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                            {user.is_verified_seller && <Badge variant="outline" className="ml-2 border-emerald-500/20 text-emerald-500/80">Verified</Badge>}
                         </TableCell>
                         <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleVerify(user.id, user.is_verified_seller)}
                                  title={user.is_verified_seller ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
                               >
                                 {user.is_verified_seller ? <XCircle className="h-4 w-4 text-amber-500" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                               </Button>

                               <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleBan(user.id, user.is_banned)}
                                  title={user.is_banned ? 'Unban User' : 'Ban User'}
                               >
                                 {user.is_banned ? <Check className="h-4 w-4 text-slate-400" /> : <Ban className="h-4 w-4 text-red-500" />}
                               </Button>
                            </div>
                         </TableCell>
                       </TableRow>
                     ))}
                     {filteredUsers.length === 0 && (
                       <TableRow>
                         <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                            No users found matching "{userSearch}"
                         </TableCell>
                       </TableRow>
                     )}
                   </tbody>
                </Table>
             </CardContent>
          </Card>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-red-900/30 bg-red-950/10">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-red-200">
                     <Siren className="text-red-500" /> Emergency Controls
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-red-200/60 mb-4">
                     In case of a security breach or API failure, use this switch to immediately halt all M-Pesa payouts and withdrawals.
                   </p>
                   <div className="flex items-center justify-between bg-red-950/30 p-4 rounded-lg border border-red-900/30">
                     <span className="font-bold text-red-100">Freeze Platform Transactions</span>
                     <Button 
                       variant={platformFrozen ? "default" : "destructive"} 
                       onClick={togglePlatformFreeze}
                       className={platformFrozen ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                     >
                       {platformFrozen ? "Resume Operations" : "FREEZE NOW"}
                     </Button>
                   </div>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Key className="text-emerald-500" /> Session Security
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                     <span className="text-slate-400">Authentication Method</span>
                     <span className="font-mono text-emerald-400">PIN (Level 2)</span>
                   </div>
                   <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                     <span className="text-slate-400">Session Timeout</span>
                     <span className="text-white">15 Minutes</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400">IP Whitelist</span>
                     <span className="text-white">Active (Kenya)</span>
                   </div>
                   <Button variant="outline" className="w-full mt-2" onClick={() => setIsLocked(true)}>
                     Force Lock Session
                   </Button>
                 </CardContent>
               </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="text-blue-500" /> Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-medium text-white text-xs">
                          {log.action}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {log.details}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={log.status === 'SUCCESS' ? 'success' : log.status === 'FAILURE' ? 'destructive' : 'warning'}
                            className="text-[10px] h-5"
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
