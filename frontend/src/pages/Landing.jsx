import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight, User, FileSearch, Scale, Gavel, CheckCircle, Info, ChevronDown, Lock, Sliders, BadgeCheck, MessageSquare, BarChart3, GitBranch, FileText } from 'lucide-react'
import FAQChatbot from '../components/FAQChatbot'

// Static FAQ data - no backend, no LLM, deterministic
const faqData = [
    {
        question: "Is this system fully automated?",
        answer: "No. LoanOps AI assists with loan operations. Final decisions follow predefined rules and support human review."
    },
    {
        question: "Is AI approving loans?",
        answer: "No. AI is used only for explanations and orchestration. Eligibility and approval follow deterministic lending rules."
    },
    {
        question: "How do you prevent fake data?",
        answer: "This demo uses mock verification. In production, identity verification can integrate with DigiLocker."
    },
    {
        question: "What loan amounts are supported?",
        answer: "Automated processing is designed for micro and small-ticket loans between ₹5,000 and ₹50,000."
    },
    {
        question: "Is this production-ready?",
        answer: "This is a hackathon prototype designed to demonstrate system orchestration, not a production deployment."
    }
]

// FAQ Item component with accordion behavior
function FAQItem({ question, answer, isOpen, onToggle }) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors"
            >
                <span className="text-sm font-medium text-slate-800">{question}</span>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    )
}

export default function Landing() {
    const [openFaq, setOpenFaq] = useState(null)

    return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* Header */}
            <header className="w-full px-6 py-4 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            LOAN<span className="text-blue-600">OPS</span>
                        </span>
                    </div>
                    <Link
                        to="/login"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Login →
                    </Link>
                </div>
            </header>

            {/* Hero Section — Two Column Layout */}
            <section className="w-full px-6 py-20 md:py-28 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">

                        {/* Left Column — Messaging (60%) */}
                        <div className="lg:col-span-3 text-center lg:text-left">

                            {/* Eyebrow Tag */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                    AI-Assisted Micro-Loan Processing
                                </span>
                            </div>

                            {/* Primary Headline */}
                            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-tight tracking-tight mb-5">
                                <span className="block">AI-Orchestrated Loan</span>
                                <span className="block">Processing for <span className="text-blue-600">Real-World</span> Micro-Loans</span>
                            </h1>

                            {/* Supporting Description */}
                            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                                From KYC to underwriting and sanctioning, LoanOps AI coordinates multiple agents with human-in-the-loop safeguards.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Link
                                    to="/signup"
                                    className="group inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    Try Live Demo
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center gap-2 px-7 py-3.5 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                                >
                                    View How It Works
                                </a>
                            </div>
                        </div>

                        {/* Right Column — Product Visual (40%) */}
                        <div className="lg:col-span-2 relative">
                            <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-200/50 p-6 backdrop-blur-sm">

                                {/* Visual Header */}
                                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    <span className="ml-3 text-xs font-medium text-slate-500">Agent Orchestration</span>
                                </div>

                                {/* Agent Flow Visual */}
                                <div className="space-y-3">
                                    {/* Agent 1 - Sales */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                            <User size={16} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800">Sales Agent</p>
                                            <p className="text-xs text-slate-500 truncate">Collecting loan intent...</p>
                                        </div>
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                    </div>

                                    {/* Connector */}
                                    <div className="flex justify-center">
                                        <div className="w-0.5 h-4 bg-gradient-to-b from-slate-200 to-blue-200"></div>
                                    </div>

                                    {/* Agent 2 - Verification */}
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 ring-2 ring-blue-200/50">
                                        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                                            <FileSearch size={16} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">Verification Agent</p>
                                            <p className="text-xs text-blue-600">Processing KYC...</p>
                                        </div>
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                                    </div>

                                    {/* Connector */}
                                    <div className="flex justify-center">
                                        <div className="w-0.5 h-4 bg-gradient-to-b from-blue-200 to-slate-200"></div>
                                    </div>

                                    {/* Agent 3 - Underwriting */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Scale size={16} className="text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-500">Underwriting Agent</p>
                                            <p className="text-xs text-slate-400">Waiting...</p>
                                        </div>
                                    </div>

                                    {/* Connector */}
                                    <div className="flex justify-center">
                                        <div className="w-0.5 h-4 bg-slate-100"></div>
                                    </div>

                                    {/* Agent 4 - Sanction */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-40">
                                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Gavel size={16} className="text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-400">Sanction Agent</p>
                                            <p className="text-xs text-slate-300">Pending</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Glow */}
                                <div className="absolute -z-10 inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-indigo-100/30 rounded-2xl blur-xl"></div>
                            </div>

                            {/* Background Decorative Elements */}
                            <div className="absolute -z-20 -top-8 -right-8 w-32 h-32 bg-blue-100/60 rounded-full blur-3xl"></div>
                            <div className="absolute -z-20 -bottom-8 -left-8 w-24 h-24 bg-indigo-100/60 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works — Agent Flow */}
            <section id="how-it-works" className="w-full px-6 py-20 bg-white scroll-mt-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">How LoanOps AI Works</h2>
                        <p className="text-slate-600 max-w-xl mx-auto">
                            A step-by-step, agent-driven loan processing flow
                        </p>
                    </div>

                    {/* Desktop: Horizontal Flow with Arrows */}
                    <div className="hidden lg:flex items-stretch justify-between gap-3">

                        {/* Step 1 — Sales Agent */}
                        <div className="group flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-200">
                            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                <MessageSquare size={20} className="text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Sales Agent</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Understands customer intent, loan amount, and tenure requirements.
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center w-8 shrink-0">
                            <ArrowRight size={18} className="text-slate-300" />
                        </div>

                        {/* Step 2 — Verification Agent (ACTIVE) */}
                        <div className="group flex-1 bg-white border-2 border-blue-300 rounded-xl p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative">
                            <div className="absolute -top-2.5 left-4">
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wide">Active</span>
                            </div>
                            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Verification Agent</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Performs KYC checks including PAN, documents, and optional Video KYC.
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center w-8 shrink-0">
                            <ArrowRight size={18} className="text-slate-300" />
                        </div>

                        {/* Step 3 — Risk & Credit Agent */}
                        <div className="group flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-200">
                            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                                <BarChart3 size={20} className="text-amber-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Risk & Credit Agent</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Evaluates risk score and eligibility using predefined lending rules.
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center w-8 shrink-0">
                            <ArrowRight size={18} className="text-slate-300" />
                        </div>

                        {/* Step 4 — Decision Engine */}
                        <div className="group flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-200">
                            <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                <GitBranch size={20} className="text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Decision Engine</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Automatically approves small loans or routes larger amounts for human review.
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center w-8 shrink-0">
                            <ArrowRight size={18} className="text-slate-300" />
                        </div>

                        {/* Step 5 — Sanction Generator */}
                        <div className="group flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-200">
                            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                                <FileText size={20} className="text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Sanction Generator</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Generates a loan sanction summary and downloadable letter.
                            </p>
                        </div>
                    </div>

                    {/* Mobile/Tablet: Vertical Flow */}
                    <div className="lg:hidden space-y-4">

                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                    <MessageSquare size={20} className="text-blue-600" />
                                </div>
                                <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>
                            </div>
                            <div className="flex-1 pb-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-1">Sales Agent</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Understands customer intent, loan amount, and tenure requirements.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 (Active) */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-blue-200">
                                    <ShieldCheck size={20} className="text-white" />
                                </div>
                                <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>
                            </div>
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-slate-800">Verification Agent</h3>
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-semibold rounded uppercase">Active</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Performs KYC checks including PAN, documents, and optional Video KYC.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                    <BarChart3 size={20} className="text-amber-600" />
                                </div>
                                <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>
                            </div>
                            <div className="flex-1 pb-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-1">Risk & Credit Agent</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Evaluates risk score and eligibility using predefined lending rules.
                                </p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                    <GitBranch size={20} className="text-indigo-600" />
                                </div>
                                <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>
                            </div>
                            <div className="flex-1 pb-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-1">Decision Engine</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Automatically approves small loans or routes larger amounts for human review.
                                </p>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText size={20} className="text-emerald-600" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-800 mb-1">Sanction Generator</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Generates a loan sanction summary and downloadable letter.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why This Exists */}
            <section className="w-full px-6 py-16 bg-slate-50 border-y border-slate-100">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-start gap-3 mb-6">
                        <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
                        <h2 className="text-xl font-bold text-slate-900">Why This Exists</h2>
                    </div>

                    <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <p>
                            <strong className="text-slate-800">Loan sanctioning is sensitive.</strong> Credit decisions affect real lives and carry regulatory scrutiny. Full automation is not appropriate for most loan products.
                        </p>
                        <p>
                            <strong className="text-slate-800">Micro-loans are different.</strong> Small-ticket loans (₹5,000 – ₹50,000) have simpler eligibility criteria and lower risk profiles. This makes them suitable for AI-assisted operations with human oversight.
                        </p>
                        <p>
                            <strong className="text-slate-800">This is not full automation.</strong> AI handles data collection, conversation flow, and explanation generation. All eligibility decisions are made by deterministic policy rules. Final sanctions are subject to human review.
                        </p>
                    </div>
                </div>
            </section>

            {/* Trust & Credibility */}
            <section className="w-full px-6 py-20 bg-slate-50/50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Built for Trust</h2>
                        <p className="text-slate-600 max-w-xl mx-auto">
                            Responsible AI design with real-world fintech constraints in mind
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                        {/* Card 1 — Human-in-the-Loop */}
                        <div className="group bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                <User size={24} className="text-blue-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800 mb-2">Human-in-the-Loop</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                AI assists the process. Final decisions can be reviewed by humans for safety and compliance.
                            </p>
                        </div>

                        {/* Card 2 — Secure by Design */}
                        <div className="group bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                                <Lock size={24} className="text-emerald-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800 mb-2">Secure by Design</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Sensitive data is encrypted and handled with audit-ready controls.
                            </p>
                        </div>

                        {/* Card 3 — Realistic Automation */}
                        <div className="group bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                                <Sliders size={24} className="text-amber-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800 mb-2">Realistic Automation</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Designed for micro-loans where automation is practical and responsible.
                            </p>
                        </div>

                        {/* Card 4 — Compliance Aware */}
                        <div className="group bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                <BadgeCheck size={24} className="text-indigo-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800 mb-2">Compliance Aware</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Built with awareness of KYC, DigiLocker, and regulatory workflows.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Common Questions - FAQ */}
            <section className="w-full px-6 py-16 bg-slate-50 border-t border-slate-100">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">Common Questions</h2>
                    <p className="text-sm text-slate-500 mb-8 text-center">Addressing expected concerns about this system</p>

                    <div className="space-y-3">
                        {faqData.map((faq, index) => (
                            <FAQItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFaq === index}
                                onToggle={() => setOpenFaq(openFaq === index ? null : index)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full px-6 py-8 bg-slate-900 mt-auto">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <ShieldCheck className="text-white" size={16} />
                        <span className="text-sm font-semibold text-white">LoanOps AI</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        AI-Orchestrated Micro-Loan Processing
                    </p>
                </div>
            </footer>
            {/* FAQ Chatbot Widget */}
            <FAQChatbot />

        </div>
    )
}
