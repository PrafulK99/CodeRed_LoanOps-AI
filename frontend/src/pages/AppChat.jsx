import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import KYCForm from '../components/KYCForm'
import {
    Send,
    ShieldCheck,
    Download,
    Bot,
    User,
    Zap,
    Activity,
    Sparkles,
    Command,
    CheckCircle2,
    Clock,
    FileSearch,
    Scale,
    Gavel,
    Cpu,
    Loader2,
    ArrowRight,
    ClipboardList,
    LogOut,
    UserCircle,
    Info,
    Users,
    AlertTriangle,
    TrendingUp
} from 'lucide-react'

// --- TYPEWRITER COMPONENT ---
const Typewriter = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('')

    useEffect(() => {
        let index = 0
        const intervalId = setInterval(() => {
            setDisplayedText((prev) => prev + text.charAt(index))
            index++
            if (index === text.length) {
                clearInterval(intervalId)
                if (onComplete) onComplete()
            }
        }, 15)
        return () => clearInterval(intervalId)
    }, [text])

    return <span>{displayedText}</span>
}

// --- AGENT ROLE MAPPING ---
const getAgentInfo = (stage) => {
    const agents = {
        sales: { name: 'Sales Agent', icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
        credit: { name: 'Verification Agent', icon: FileSearch, color: 'text-amber-600', bg: 'bg-amber-100' },
        risk: { name: 'Underwriting Agent', icon: Scale, color: 'text-purple-600', bg: 'bg-purple-100' },
        sanction: { name: 'Sanction Agent', icon: Gavel, color: 'text-emerald-600', bg: 'bg-emerald-100' }
    }
    return agents[stage] || agents.sales
}

// --- UPDATED AGENT VISUALIZER (COMPACT & CONNECTED) ---
const AgentVisualizer = ({ currentStage }) => {
    const steps = [
        { id: 'sales', label: 'Sales Agent', icon: User, sub: 'Data Collection' },
        { id: 'credit', label: 'Credit Analyst', icon: FileSearch, sub: 'Identity & Bureau' },
        { id: 'risk', label: 'Risk Engine', icon: Scale, sub: 'Policy Rules' },
        { id: 'sanction', label: 'Sanctioning', icon: Gavel, sub: 'Final Approval' }
    ]

    const activeIndex = steps.findIndex(s => s.id === currentStage) >= 0
        ? steps.findIndex(s => s.id === currentStage)
        : 0

    return (
        <div className="relative w-full max-w-md mx-auto">

            {/* Background Connector Lines */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 hidden md:block" />
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/5 -translate-x-1/2 hidden md:block" />

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4 relative z-10">
                {steps.map((step, index) => {
                    const isActive = index === activeIndex
                    const isCompleted = index < activeIndex

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                relative h-36 rounded-2xl p-4 border flex flex-col justify-between overflow-hidden group
                ${isActive
                                    ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                    : isCompleted
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-[#1a202c]/40 border-white/5'}
              `}
                        >
                            {/* Header: Icon & Indicator */}
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-lg 
                  ${isActive ? 'bg-blue-500 text-white'
                                        : isCompleted ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-white/5 text-slate-500'}`}>
                                    <step.icon size={18} strokeWidth={2} />
                                </div>

                                {/* Status Dot */}
                                {isActive && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">Run</span>
                                    </div>
                                )}
                                {isCompleted && <CheckCircle2 size={16} className="text-emerald-500 opacity-80" />}
                            </div>

                            {/* Content */}
                            <div>
                                <h3 className={`text-sm font-bold tracking-tight mb-0.5
                  ${isActive ? 'text-white' : isCompleted ? 'text-emerald-100/80' : 'text-slate-500'}`}>
                                    {step.label}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                    {step.sub}
                                </p>
                            </div>

                            {/* Progress Line */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: isCompleted ? "100%" : isActive ? "60%" : "0%" }}
                                    className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                />
                            </div>

                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

export default function AppChat() {
    const { user, token, logout } = useAuth()

    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'System initialized. Loan Operations Orchestrator is ready. Please provide borrower details to begin the application process.', timestamp: new Date(), stage: 'sales' }
    ])
    const [inputText, setInputText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentStage, setCurrentStage] = useState('sales')
    const [sanctionLetter, setSanctionLetter] = useState(null)
    const [applicationStatus, setApplicationStatus] = useState('Initiated')
    const [riskAssessment, setRiskAssessment] = useState(null) // { score, level, factors }
    const [decisionInfo, setDecisionInfo] = useState(null) // { type, reason, source, policy }

    // Agent Playback State
    const [isOrchestrating, setIsOrchestrating] = useState(false)
    const [orchestrationStep, setOrchestrationStep] = useState(null) // 'credit' | 'risk' | 'sanction' | null
    const [pendingResponse, setPendingResponse] = useState(null) // Store full backend response for delayed reveal

    const sessionIdRef = useRef(`LOAN-${Math.floor(1000 + Math.random() * 9000)}`)
    const messagesEndRef = useRef(null)
    const [showEntryBanner, setShowEntryBanner] = useState(true)
    const [showKYCForm, setShowKYCForm] = useState(false) // Show structured KYC form

    // Agent-specific messages for orchestration playback
    // DEMO: Descriptive messages to help observers understand what each agent does
    const orchestrationMessages = {
        credit: "Analyzing identity documents and credit history...",
        risk: "Evaluating eligibility against policy rules...",
        sanction: "Generating final sanction decision..."
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading, orchestrationStep])

    // Orchestration Playback Effect - runs when we have a pending response
    useEffect(() => {
        if (!pendingResponse || !isOrchestrating) return

        const runOrchestration = async () => {
            const steps = ['credit', 'risk', 'sanction']

            for (const step of steps) {
                setOrchestrationStep(step)
                setCurrentStage(step === 'credit' ? 'credit' : step === 'risk' ? 'risk' : 'sanction')

                // Add orchestration message
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: orchestrationMessages[step],
                    timestamp: new Date(),
                    stage: step,
                    isOrchestrationStep: true
                }])

                // Wait for effect
                await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 300))
            }

            // After all steps complete, show the final response
            const data = pendingResponse

            setMessages(prev => [...prev, {
                sender: 'bot',
                text: data.reply,
                timestamp: new Date(),
                stage: data.stage || 'sanction'
            }])

            if (data.stage) setCurrentStage(data.stage)
            if (data.application_status) setApplicationStatus(data.application_status)
            if (data.sanction_letter) setSanctionLetter(data.sanction_letter)

            if (data.risk_score !== null && data.risk_score !== undefined) {
                setRiskAssessment({
                    score: data.risk_score,
                    level: data.risk_level,
                    factors: data.risk_factors || []
                })
            }

            // Store decision metadata
            if (data.decision_type) {
                setDecisionInfo({
                    type: data.decision_type,
                    reason: data.decision_reason,
                    source: data.decision_source,
                    policy: data.policy_applied
                })
            }

            // Cleanup
            setOrchestrationStep(null)
            setIsOrchestrating(false)
            setPendingResponse(null)
            setIsLoading(false)
        }

        runOrchestration()
    }, [pendingResponse, isOrchestrating])

    const handleSendMessage = async () => {
        if (!inputText.trim()) return
        const userMessage = inputText

        setMessages(prev => [...prev, { sender: 'user', text: userMessage, timestamp: new Date() }])
        setInputText('')
        setIsLoading(true)

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: sessionIdRef.current,
                    message: userMessage
                })
            })

            const data = await response.json()


            // ================================================================
            // CRITICAL: Check halt_agents flag FIRST
            // If halted, do NOT advance stages or trigger orchestration
            // ================================================================
            if (data.halt_agents) {
                console.log('[FRONTEND] halt_agents=true - freezing agent visualization')
                // Display the message but do NOT advance stages or trigger orchestration
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: data.reply,
                    timestamp: new Date(),
                    stage: 'verification',
                    isWarning: true  // Mark as warning for styling
                }])
                // Keep stage frozen at verification
                setCurrentStage('verification')
                if (data.application_status) setApplicationStatus(data.application_status)
                setIsLoading(false)
                return  // STOP - do not continue with orchestration
            }

            // Check if this is a stage that triggers orchestration playback
            // Trigger orchestration when moving to underwriting/sanction/rejected from verification
            const shouldOrchestrate = (
                data.stage === 'sanction' ||
                data.stage === 'rejected' ||
                (data.stage === 'underwriting' && currentStage === 'verification')
            )

            if (shouldOrchestrate && data.risk_score !== undefined) {
                // Store response for orchestrated reveal
                setPendingResponse(data)
                setIsOrchestrating(true)
                // isLoading stays true during orchestration
            } else {
                // Normal flow - display immediately
                setMessages(prev => [...prev, { sender: 'bot', text: data.reply, timestamp: new Date(), stage: data.stage || currentStage }])

                if (data.stage) setCurrentStage(data.stage)
                if (data.application_status) setApplicationStatus(data.application_status)
                if (data.sanction_letter) setSanctionLetter(data.sanction_letter)

                // Show KYC form when entering verification stage
                if (data.stage === 'verification' && !showKYCForm) {
                    setShowKYCForm(true)
                }

                if (data.risk_score !== null && data.risk_score !== undefined) {
                    setRiskAssessment({
                        score: data.risk_score,
                        level: data.risk_level,
                        factors: data.risk_factors || []
                    })
                }

                // Store decision metadata
                if (data.decision_type) {
                    setDecisionInfo({
                        type: data.decision_type,
                        reason: data.decision_reason,
                        source: data.decision_source,
                        policy: data.policy_applied
                    })
                }
                setIsLoading(false)
            }
        } catch {
            setMessages(prev => [
                ...prev,
                { sender: 'bot', text: 'System Error: Orchestrator connection failed. Please verify the backend service is running.', timestamp: new Date(), stage: currentStage }
            ])
            setIsLoading(false)
        }
    }

    const formatTime = (date) => {
        if (!date) return 'Just now'
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="h-screen w-full bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-[50%_50%] overflow-hidden font-sans text-slate-800">

            {/* --- LEFT PANEL: CHAT --- */}
            <div className="flex flex-col relative bg-[#F8FAFC] h-full overflow-hidden border-r border-slate-200">

                <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}>
                </div>

                <header className="h-20 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm"></div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-300/50">
                            <ShieldCheck className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                LOAN<span className="text-blue-600">OPS.</span>
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 hidden sm:flex items-center gap-2">
                        {/* User indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <UserCircle size={14} className="text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700 max-w-[120px] truncate">{user?.email}</span>
                        </div>
                        <Link
                            to="/applications"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            <ClipboardList size={14} className="text-slate-500" />
                            <span className="text-xs font-medium text-slate-600">View Applications</span>
                        </Link>
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">ID</span>
                            <span className="text-xs font-mono font-semibold text-slate-700">{sessionIdRef.current}</span>
                            <span className="text-slate-300">|</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${applicationStatus === 'Sanctioned' || applicationStatus === 'Approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : applicationStatus === 'Rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>{applicationStatus}</span>
                            <span className="text-[9px] text-slate-400 ml-1" title="Decision generated by policy rules with AI-assisted explanations">ⓘ</span>
                        </div>
                        {/* Logout button */}
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                {/* AI-Assisted Decision Mode Banner */}
                <div className="mx-6 md:mx-8 mt-2 mb-0 z-20 relative">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/80 border border-blue-100 rounded-xl flex-wrap">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-blue-500" />
                            <span className="text-xs font-semibold text-blue-700">Decision Mode: AI-Assisted</span>
                        </div>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5">
                            <Users size={12} className="text-slate-400" />
                            <span className="text-[11px] text-slate-500">Final sanction subject to human review</span>
                        </div>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span className="text-[11px] text-slate-500">Loans up to ₹50,000</span>
                    </div>
                </div>

                {/* Entry Context Banner - Dismissible */}
                {showEntryBanner && (
                    <div className="mx-6 md:mx-8 mt-2 z-20 relative">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                            <span className="text-xs text-slate-600">
                                You're now inside the <strong>LoanOps Workspace</strong>. Start by requesting a loan to see the complete flow.
                            </span>
                            <button
                                onClick={() => setShowEntryBanner(false)}
                                className="text-slate-400 hover:text-slate-600 text-xs ml-3"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-6 pb-32 space-y-8 z-10 scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, index) => {
                            const isUser = msg.sender === 'user';
                            const isLast = index === messages.length - 1;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>

                                        <div className={`flex items-center gap-2 mb-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isUser && (() => {
                                                const agentInfo = getAgentInfo(msg.stage || currentStage)
                                                return (
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${agentInfo.color}`}>
                                                        {agentInfo.name}
                                                    </span>
                                                )
                                            })()}
                                            {isUser && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Applicant
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> {formatTime(msg.timestamp)}
                                            </span>
                                        </div>

                                        <div className={`group relative px-6 py-5 shadow-sm transition-all duration-200
                      ${isUser
                                                ? 'bg-slate-900 text-white rounded-[24px] rounded-tr-sm hover:shadow-lg hover:shadow-slate-500/20'
                                                : 'bg-white border border-slate-100 text-slate-700 rounded-[24px] rounded-tl-sm hover:shadow-lg hover:shadow-slate-200/50'
                                            }`}
                                        >
                                            {!isUser && (() => {
                                                const agentInfo = getAgentInfo(msg.stage || currentStage)
                                                const AgentIcon = agentInfo.icon
                                                return (
                                                    <div className="absolute -left-3 -top-3 bg-white p-1 rounded-full border border-slate-100 shadow-sm">
                                                        <div className={`${agentInfo.bg} p-1.5 rounded-full`}>
                                                            <AgentIcon size={14} className={agentInfo.color} />
                                                        </div>
                                                    </div>
                                                )
                                            })()}

                                            <div className="text-[15px] leading-7 font-medium">
                                                {!isUser && isLast ? (
                                                    <Typewriter text={msg.text} />
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>

                                            {isUser && (
                                                <Sparkles className="absolute -right-2 -top-2 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" size={16} />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {isLoading && (() => {
                        const agentInfo = getAgentInfo(orchestrationStep || currentStage)
                        const stepLabels = {
                            credit: 'Credit Analyst',
                            risk: 'Risk Engine',
                            sanction: 'Sanction Agent'
                        }
                        const displayName = isOrchestrating && orchestrationStep
                            ? stepLabels[orchestrationStep]
                            : agentInfo.name

                        return (
                            <motion.div
                                key={orchestrationStep || 'loading'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-start w-full"
                            >
                                <div className="bg-white/80 backdrop-blur-sm border border-slate-200 px-6 py-4 rounded-[24px] rounded-tl-sm shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex space-x-1.5">
                                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                                        </div>
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${agentInfo.color}`}>
                                            {displayName} {isOrchestrating ? 'Active' : 'Processing'}
                                        </span>
                                    </div>
                                    {isOrchestrating && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <div className="flex gap-1">
                                                {['credit', 'risk', 'sanction'].map((step, idx) => (
                                                    <div
                                                        key={step}
                                                        className={`w-8 h-1 rounded-full transition-colors duration-300 ${orchestrationStep === step
                                                            ? 'bg-blue-500'
                                                            : ['credit', 'risk', 'sanction'].indexOf(orchestrationStep) > idx
                                                                ? 'bg-emerald-400'
                                                                : 'bg-slate-200'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-400 ml-1">
                                                Step {['credit', 'risk', 'sanction'].indexOf(orchestrationStep) + 1}/3
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })()}

                    {/* KYC Form - Appears during verification stage */}
                    {showKYCForm && currentStage === 'verification' && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex justify-start pl-2 w-full max-w-md"
                        >
                            <KYCForm
                                sessionId={sessionIdRef.current}
                                onComplete={async (data) => {
                                    setShowKYCForm(false)
                                    // Add verification success message
                                    setMessages(prev => [...prev, {
                                        sender: 'bot',
                                        text: data.reply || '✅ KYC Verification Complete. Now proceeding to credit evaluation...',
                                        timestamp: new Date(),
                                        stage: 'verification'
                                    }])
                                    // Proceed to underwriting by sending a message
                                    setIsLoading(true)
                                    try {
                                        const response = await fetch('http://localhost:8000/chat', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                session_id: sessionIdRef.current,
                                                message: 'proceed to underwriting'
                                            })
                                        })
                                        const result = await response.json()

                                        // CRITICAL: Check halt_agents before advancing
                                        if (result.halt_agents) {
                                            console.log('[FRONTEND] halt_agents after KYC - freezing')
                                            setMessages(prev => [...prev, {
                                                sender: 'bot',
                                                text: result.reply,
                                                timestamp: new Date(),
                                                stage: 'verification',
                                                isWarning: true
                                            }])
                                            setCurrentStage('verification')
                                            setIsLoading(false)
                                            return
                                        }

                                        if (result.stage) setCurrentStage(result.stage)
                                        if (result.application_status) setApplicationStatus(result.application_status)

                                        // Check for orchestration
                                        const shouldOrchestrate = (
                                            result.stage === 'sanction' ||
                                            result.stage === 'rejected' ||
                                            result.risk_score !== undefined
                                        )

                                        if (shouldOrchestrate && result.risk_score !== undefined) {
                                            setPendingResponse(result)
                                            setIsOrchestrating(true)
                                        } else {
                                            setMessages(prev => [...prev, {
                                                sender: 'bot',
                                                text: result.reply,
                                                timestamp: new Date(),
                                                stage: result.stage
                                            }])
                                            setIsLoading(false)
                                        }
                                    } catch (err) {
                                        console.error('Post-KYC error:', err)
                                        setIsLoading(false)
                                    }
                                }}
                            />
                        </motion.div>
                    )}

                    {/* Risk Assessment Card - Appears after underwriting */}
                    {riskAssessment && !sanctionLetter && (currentStage === 'sanction' || currentStage === 'rejected') && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex justify-start pl-2"
                        >
                            <div className="w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={18} className="text-slate-600" />
                                    <h3 className="text-sm font-bold text-slate-800">Automated Risk Assessment</h3>
                                </div>

                                {/* Risk Score Display */}
                                <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risk Score</p>
                                        <p className="text-2xl font-bold text-slate-800">{riskAssessment.score}<span className="text-sm text-slate-400 font-normal"> / 100</span></p>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${riskAssessment.level === 'Low'
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : riskAssessment.level === 'Medium'
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                            : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {riskAssessment.level}
                                    </span>
                                </div>

                                {/* Risk Factors */}
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Key Factors</p>
                                    <div className="space-y-1.5">
                                        {riskAssessment.factors.map((factor, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                                {factor.startsWith('✓') ? (
                                                    <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                                ) : (
                                                    <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                                )}
                                                <span>{factor.replace(/^[✓⚠]\s*/, '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <p className="text-[9px] text-slate-400 mt-4 pt-3 border-t border-slate-100 text-center">
                                    Rule-based assessment for transparency. Does not determine approval.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {sanctionLetter && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="flex justify-start pl-2"
                        >
                            <div className="relative group w-80">
                                <div className="absolute inset-0 bg-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                                <div className="relative bg-white border border-emerald-100 rounded-3xl p-6 shadow-xl overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                            <Activity className="text-emerald-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Loan Sanctioned</h3>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Application Complete</p>
                                        </div>
                                    </div>

                                    {/* Policy Decision Badge */}
                                    {decisionInfo && (
                                        <div className={`mb-4 p-3 rounded-xl border ${decisionInfo.type === 'AUTOMATED'
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-amber-50 border-amber-200'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${decisionInfo.type === 'AUTOMATED'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {decisionInfo.type === 'AUTOMATED' ? 'Auto-Approved' : 'Human Review'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-600">
                                                {decisionInfo.type === 'AUTOMATED'
                                                    ? 'This loan falls within the automated approval policy and has been approved.'
                                                    : 'This loan exceeds the automated approval limit and has been forwarded for manual review.'}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-1">
                                                Source: {decisionInfo.source}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            <span className="text-xs text-slate-500">Identity Verification Complete</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            <span className="text-xs text-slate-500">Credit & Risk Assessment Passed</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            <span className="text-xs text-slate-500">Sanction Letter Generated</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(`http://localhost:8000/files/${sanctionLetter}`, '_blank')}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-black transition-colors flex items-center justify-center gap-2 group/btn mb-3"
                                    >
                                        <Download size={16} className="group-hover/btn:animate-bounce" />
                                        Download Sanction Letter
                                    </button>
                                    {/* End-of-Flow Closure */}
                                    <div className="text-center pt-3 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-500 mb-2">
                                            This application is complete and recorded.
                                        </p>
                                        <Link
                                            to="/applications"
                                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                            View All Applications →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} className="h-4" />
                </div>

                <div className="absolute bottom-6 left-0 w-full px-6 md:px-12 z-20">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-2 rounded-[28px] shadow-2xl shadow-slate-300/40 flex items-center gap-2 ring-1 ring-slate-100 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:scale-[1.01]">
                        <div className="pl-4">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                <Zap className="text-blue-600" size={16} />
                            </div>
                        </div>
                        <input
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Enter applicant information or loan request..."
                            className="flex-1 bg-transparent px-2 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium text-[15px]"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputText.trim()}
                            className={`p-3.5 rounded-[20px] transition-all duration-300 flex items-center justify-center transform
                ${inputText.trim()
                                    ? 'bg-blue-600 text-white rotate-0 shadow-lg shadow-blue-300 hover:scale-110 active:scale-95'
                                    : 'bg-slate-100 text-slate-300 rotate-0 cursor-not-allowed'}`}
                        >
                            <Send size={18} className={inputText.trim() ? "ml-0.5" : ""} />
                        </button>
                    </div>
                    <p className="text-center mt-3 text-[10px] text-slate-400 font-medium tracking-wide">
                        Loan Operations Platform • Rule-Based Processing
                    </p>
                </div>
            </div>

            {/* --- RIGHT PANEL: AGENT VISUALIZATION --- */}
            <div className="hidden lg:flex flex-col h-full bg-[#0B0F19] relative overflow-hidden">

                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="flex flex-col h-full relative z-10 p-8 md:p-12">

                    <div className="shrink-0 mb-10 flex items-center justify-between border-b border-white/5 pb-6">
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                <Cpu size={20} className="text-blue-500" />
                                Orchestration Layer
                            </h2>
                            <p className="text-slate-400 text-xs">Real-time agent execution pipeline</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                                <span className="text-green-500 font-mono text-[10px] font-bold tracking-widest">LIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Visualizer Container - Centered */}
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <AgentVisualizer currentStage={currentStage} />
                    </div>

                    <div className="shrink-0 pt-6 border-t border-white/5 mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Agents</span>
                            <span className="text-white font-mono text-lg">4</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Success</span>
                            <span className="text-emerald-400 font-mono text-lg">99.9%</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Security</span>
                            <span className="text-blue-400 font-mono text-lg">TLS 1.3</span>
                        </div>
                    </div>

                    {/* AI Governance & Compliance Note */}
                    <div className="shrink-0 mt-4 px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                        <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                            <span className="text-blue-400 font-semibold">AI Governance:</span> AI assists in data collection & explanation. All credit decisions follow predefined lending rules.
                        </p>
                        <p className="text-[9px] text-slate-600 leading-relaxed text-center">
                            Identity verification in production can be integrated with <span className="text-slate-400">DigiLocker</span> for secure, government-backed document validation.
                        </p>
                    </div>

                </div>
            </div>

        </div>
    )
}
