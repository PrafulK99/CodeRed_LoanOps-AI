import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    ShieldCheck,
    Download,
    ChevronDown,
    ChevronUp,
    User,
    Video,
    FileCheck,
    Scale,
    Info
} from 'lucide-react'

// Status badge component with color coding
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Initiated': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Clock },
        'Verified': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertCircle },
        'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
        'Sanctioned': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
        'Rejected': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
        'Pending Review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertCircle },
        'Under Human Review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: User },
    }

    const config = statusConfig[status] || statusConfig['Initiated']
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
            <Icon size={12} />
            {status}
        </span>
    )
}

// Decision mode badge
const DecisionModeBadge = ({ mode }) => {
    const isAI = mode === 'AI-Assisted' || mode === 'Automated'
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${isAI
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
            {isAI ? 'AI-Assisted' : 'Human Review'}
        </span>
    )
}

// Verification level badge
const VerificationBadge = ({ level }) => {
    const config = {
        'BASIC': { bg: 'bg-slate-100', text: 'text-slate-600' },
        'STANDARD': { bg: 'bg-blue-50', text: 'text-blue-600' },
        'ENHANCED': { bg: 'bg-emerald-50', text: 'text-emerald-600' }
    }
    const c = config[level] || config['STANDARD']
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${c.bg} ${c.text}`}>
            {level || 'STANDARD'}
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

// Expandable Row Component
const ApplicationRow = ({ app, index }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    // Derive decision mode from status/risk
    const decisionMode = app.risk_score > 70 || app.status === 'Pending Review'
        ? 'Human Review'
        : 'AI-Assisted'

    // Derive verification level
    const verificationLevel = app.verification_level || (app.video_kyc_completed ? 'ENHANCED' : 'STANDARD')

    return (
        <>
            <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-800">{app.application_id}</span>
                    </div>
                </td>
                <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800">{formatAmount(app.loan_amount)}</span>
                </td>
                <td className="px-5 py-4">
                    <VerificationBadge level={verificationLevel} />
                </td>
                <td className="px-5 py-4">
                    <StatusBadge status={app.status} />
                </td>
                <td className="px-5 py-4">
                    <DecisionModeBadge mode={decisionMode} />
                </td>
                <td className="px-5 py-4">
                    <span className="text-sm text-slate-500">{formatDateTime(app.created_at)}</span>
                </td>
                <td className="px-5 py-4">
                    {app.status === 'Sanctioned' && app.sanction_letter ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                window.open(`http://localhost:8000/files/${app.sanction_letter}`, '_blank')
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-medium text-blue-700 transition-colors"
                        >
                            <Download size={12} />
                            Download PDF
                        </button>
                    ) : (
                        <span className="text-xs text-slate-400">—</span>
                    )}
                </td>
                <td className="px-5 py-4">
                    <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>
                </td>
            </motion.tr>

            {/* Expanded Details Row */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <td colSpan={8} className="px-5 py-0">
                            <div className="py-4 pl-4 border-l-2 border-slate-200 ml-2 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Risk Assessment */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Assessment</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Risk Score</span>
                                                <span className={`text-sm font-semibold ${app.risk_score <= 40 ? 'text-emerald-600' :
                                                    app.risk_score <= 70 ? 'text-amber-600' : 'text-red-600'
                                                    }`}>
                                                    {app.risk_score || '—'}/100
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Risk Level</span>
                                                <span className={`text-sm font-medium px-2 py-0.5 rounded ${app.risk_level === 'Low' ? 'bg-emerald-50 text-emerald-700' :
                                                    app.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {app.risk_level || '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Credit Score (Simulated)</span>
                                                <span className="text-sm font-medium text-slate-700">{app.credit_score || '650-750'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Signals */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Verification Signals</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FileCheck size={14} className={app.pan_verified ? 'text-emerald-500' : 'text-slate-300'} />
                                                <span className="text-sm text-slate-600">PAN Verification</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${app.pan_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {app.pan_verified ? 'Verified' : 'Simulated'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Video size={14} className={app.video_kyc_completed ? 'text-emerald-500' : 'text-slate-300'} />
                                                <span className="text-sm text-slate-600">Video KYC</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${app.video_kyc_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {app.video_kyc_completed ? 'Completed' : 'Not Completed'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Scale size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-600">Eligibility Check</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Rule-Based</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decision Reason */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Decision Summary</h4>
                                        <div className="space-y-2 text-sm text-slate-600">
                                            {app.status === 'Sanctioned' || app.status === 'Approved' ? (
                                                <>
                                                    <div className="flex items-start gap-2">
                                                        <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <span>Within micro-loan limit</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <span>Risk score within acceptable range</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <span>Identity verification passed</span>
                                                    </div>
                                                </>
                                            ) : app.status === 'Rejected' ? (
                                                <>
                                                    <div className="flex items-start gap-2">
                                                        <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                                        <span>Did not meet eligibility criteria</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                        <span>Decision logged for audit</span>
                                                    </div>
                                                </>
                                            ) : app.status === 'Pending Review' ? (
                                                <>
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                                        <span>Forwarded for manual approval</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                        <span>Requires human review</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">Processing in progress</span>
                                            )}
                                        </div>

                                        {/* Download if sanctioned */}
                                        {app.status === 'Sanctioned' && app.sanction_letter && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(`http://localhost:8000/files/${app.sanction_letter}`, '_blank')
                                                }}
                                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-medium text-slate-700 transition-colors"
                                            >
                                                <Download size={12} />
                                                Download Sanction Letter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    )
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
        <div className="min-h-screen bg-slate-50">
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
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Loan Applications <span className="text-slate-400 font-normal">(Audit Log)</span>
                                </h1>
                                <p className="text-xs text-slate-500">Read-only record of all loan processing decisions</p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total Applications</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <p className="text-2xl font-bold text-emerald-600">
                            {applications.filter(a => a.status === 'Sanctioned' || a.status === 'Approved').length}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Approved</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <p className="text-2xl font-bold text-amber-600">
                            {applications.filter(a => a.status === 'Initiated' || a.status === 'Verified' || a.status === 'Pending Review').length}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">In Progress</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <p className="text-2xl font-bold text-red-600">
                            {applications.filter(a => a.status === 'Rejected').length}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Rejected</p>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <XCircle size={40} className="text-red-400 mb-3" />
                            <p className="text-slate-600 font-medium">Failed to load applications</p>
                            <p className="text-sm text-slate-400 mb-4">{error}</p>
                            <button
                                onClick={fetchApplications}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FileText size={40} className="text-slate-300 mb-3" />
                            <p className="text-slate-600 font-medium">No applications recorded</p>
                            <p className="text-sm text-slate-400">Start a loan conversation to create an application</p>
                            <Link
                                to="/app"
                                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                            >
                                Start New Application
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Application ID</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loan Amount</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verification</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Decision Mode</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                        <th className="px-5 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {applications.map((app, index) => (
                                        <ApplicationRow key={app.application_id} app={app} index={index} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Compliance Footer */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="text-center space-y-2">
                        <p className="text-xs text-slate-500">
                            This is a demo system. All decisions are logged and reviewable.
                        </p>
                        <p className="text-xs text-slate-400">
                            In production, final approval may require manual verification.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
