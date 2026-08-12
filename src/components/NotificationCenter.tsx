import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, Clock, DollarSign, ClipboardList } from 'lucide-react';
import { useAppSelector } from '../hooks/useAppSelector';
import { leaveApi, payrollApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'leave' | 'loan' | 'payroll' | 'general';
    time: string;
    read: boolean;
    actionUrl?: string;
}

const NotificationCenter = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const notifs: Notification[] = [];

        try {
            if (user?.role === 'Admin') {
                // Pending leave requests
                const leaveRes = await leaveApi.get('/api/leave/all');
                const pendingLeaves = leaveRes.data.filter((l: any) => l.status === 'Pending');
                if (pendingLeaves.length > 0) {
                    notifs.push({
                        id: 'pending-leaves',
                        title: 'Pending Leave Requests',
                        message: `${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? 's' : ''} waiting for review`,
                        type: 'leave',
                        time: 'Now',
                        read: false,
                        actionUrl: '/admin/leaves',
                    });
                }

                // Pending HR loans
                const loanRes = await payrollApi.get('/api/loan/pending-hr');
                if (loanRes.data.length > 0) {
                    notifs.push({
                        id: 'pending-hr-loans',
                        title: 'Pending Loan Applications',
                        message: `${loanRes.data.length} loan application${loanRes.data.length > 1 ? 's' : ''} need HR review`,
                        type: 'loan',
                        time: 'Now',
                        read: false,
                        actionUrl: '/admin/loans',
                    });
                }

                // Pending CFO loans
                const cfoRes = await payrollApi.get('/api/loan/pending-cfo');
                if (cfoRes.data.length > 0) {
                    notifs.push({
                        id: 'pending-cfo-loans',
                        title: 'Loans Awaiting CFO Approval',
                        message: `${cfoRes.data.length} loan${cfoRes.data.length > 1 ? 's' : ''} approved by Manager — need CFO final approval`,
                        type: 'loan',
                        time: 'Now',
                        read: false,
                        actionUrl: '/admin/loans',
                    });
                }
            }

            if (user?.role === 'Manager') {
                // Pending manager loans
                const loanRes = await payrollApi.get('/api/loan/pending-manager');
                if (loanRes.data.length > 0) {
                    notifs.push({
                        id: 'pending-manager-loans',
                        title: 'Loan Approvals Needed',
                        message: `${loanRes.data.length} loan${loanRes.data.length > 1 ? 's' : ''} from your team need your approval`,
                        type: 'loan',
                        time: 'Now',
                        read: false,
                        actionUrl: '/manager/loans',
                    });
                }

                // Pending leave approvals
                const leaveRes = await leaveApi.get('/api/leave/pending');
                if (leaveRes.data.length > 0) {
                    notifs.push({
                        id: 'pending-team-leaves',
                        title: 'Team Leave Requests',
                        message: `${leaveRes.data.length} leave request${leaveRes.data.length > 1 ? 's' : ''} from your team`,
                        type: 'leave',
                        time: 'Now',
                        read: false,
                        actionUrl: '/manager/leaves',
                    });
                }
            }

            if (user?.role === 'Employee') {
                // My loan status
                const loanRes = await payrollApi.get('/api/loan/my');
                const activeLoan = loanRes.data.find(
                    (l: any) => l.status === 'Approved' && !l.isSettled
                );
                if (activeLoan) {
                    notifs.push({
                        id: 'active-loan',
                        title: 'Active Loan',
                        message: `Remaining balance: ${activeLoan.remainingBalance.toLocaleString()} — Monthly deduction: ${activeLoan.monthlyDeduction.toLocaleString()}`,
                        type: 'loan',
                        time: 'Now',
                        read: false,
                        actionUrl: '/employee/loans',
                    });
                }

                // My leave status
                const leaveRes = await leaveApi.get('/api/leave/my');
                const recentLeave = leaveRes.data.find(
                    (l: any) => l.status === 'Approved' || l.status === 'Rejected'
                );
                if (recentLeave) {
                    notifs.push({
                        id: 'recent-leave',
                        title: `Leave ${recentLeave.status}`,
                        message: `Your ${recentLeave.leaveType} leave request has been ${recentLeave.status.toLowerCase()}`,
                        type: 'leave',
                        time: recentLeave.startDate.split('T')[0],
                        read: false,
                        actionUrl: '/employee/leave',
                    });
                }
            }
        } catch {
            // ignore errors
        }

        setNotifications(notifs);
        setLoading(false);
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleClick = (notif: Notification) => {
        setNotifications((prev) =>
            prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
        );
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
            setOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'leave': return <ClipboardList size={16} className="text-blue-500" />;
            case 'loan': return <DollarSign size={16} className="text-green-500" />;
            case 'payroll': return <CheckCircle size={16} className="text-indigo-500" />;
            default: return <Bell size={16} className="text-gray-500" />;
        }
    };

    const getBg = (type: string) => {
        switch (type) {
            case 'leave': return 'bg-blue-50';
            case 'loan': return 'bg-green-50';
            case 'payroll': return 'bg-indigo-50';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-gray-800 transition"
            >
                <Bell size={20} className="text-gray-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}>
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center">
                                <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-gray-400 text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleClick(notif)}
                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition ${!notif.read ? 'bg-indigo-50/30' : ''
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getBg(notif.type)}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {notif.title}
                                            </p>
                                            {!notif.read && (
                                                <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 ml-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {notif.time}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-100 text-center">
                        <button
                            onClick={fetchNotifications}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;