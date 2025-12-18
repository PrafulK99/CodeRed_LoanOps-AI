import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    FileText,
    Clock,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    DollarSign,
    ShieldCheck,
    Download
} from 'lucide-react'

// Status badge component with color coding
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Initiated': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', icon: Clock },
        'Verified': { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', icon: AlertCircle },
        'Approved': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', icon: CheckCircle2 },
        'Sanctioned': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', icon: CheckCircle2 },
        'Rejected': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig['Initiated']
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
            <Icon size={12} />
            {status}
        </span>
    )
}

// Format currency
const formatAmount = (amount) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount)
}

// Format datetime
const formatDateTime = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function Applications() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchApplications = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('http://localhost:8000/applications')
            if (!response.ok) throw new Error('Failed to fetch applications')
            const data = await response.json()
            setApplications(data.applications || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [])

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/app"
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                                <ShieldCheck className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                    LOAN<span className="text-blue-600">OPS.</span>
                                </h1>
                                <p className="text-xs text-slate-500">Application Registry</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchApplications}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <FileText size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Applications</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {applications.filter(a => a.status === 'Sanctioned' || a.status === 'Approved').length}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Approved</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Clock size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {applications.filter(a => a.status === 'Initiated' || a.status === 'Verified').length}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">In Progress</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {applications.filter(a => a.status === 'Rejected').length}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Rejected</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-base font-semibold text-slate-900">Loan Applications</h2>
                        <p className="text-sm text-slate-500">Read-only audit log of all loan applications</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <XCircle size={40} className="text-red-400 mb-3" />
                            <p className="text-slate-600 font-medium">Failed to load applications</p>
                            <p className="text-sm text-slate-400 mb-4">{error}</p>
                            <button
                                onClick={fetchApplications}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FileText size={40} className="text-slate-300 mb-3" />
                            <p className="text-slate-600 font-medium">No applications yet</p>
                            <p className="text-sm text-slate-400">Start a loan conversation to create an application</p>
                            <Link
                                to="/app"
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Start New Application
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Application ID</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loan Amount</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {applications.map((app, index) => (
                                        <motion.tr
                                            key={app.application_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                        <FileText size={14} className="text-blue-600" />
                                                    </div>
                                                    <span className="font-mono text-sm font-semibold text-slate-900">{app.application_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign size={14} className="text-slate-400" />
                                                    <span className="font-medium text-slate-700">{formatAmount(app.loan_amount)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Clock size={14} />
                                                    {formatDateTime(app.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {app.status === 'Sanctioned' && app.sanction_letter ? (
                                                    <button
                                                        onClick={() => window.open(`http://localhost:8000/files/${app.sanction_letter}`, '_blank')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 transition-colors"
                                                    >
                                                        <Download size={12} />
                                                        Download PDF
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Note with AI Disclaimer */}
                <div className="text-center mt-6 space-y-1">
                    <p className="text-xs text-slate-400">
                        This is a read-only audit log. Applications are created automatically when loan conversations start.
                    </p>
                    <p className="text-[10px] text-slate-400">
                        <span className="font-medium text-blue-500">AI-Assisted:</span> Decisions generated by policy rules with AI-assisted explanations. Final sanction subject to human review.
                    </p>
                </div>
            </main>
        </div>
    )
}
