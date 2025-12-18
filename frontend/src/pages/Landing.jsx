import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight, Zap, Users, FileCheck, Award } from 'lucide-react'

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* Header */}
            <header className="w-full px-6 py-4 bg-white border-b border-slate-100">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="text-white" size={20} />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            LOAN<span className="text-blue-600">OPS.</span>
                        </span>
                    </div>
                    <Link
                        to="/app"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        Go to App →
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center px-6 py-20">
                <div className="max-w-3xl mx-auto text-center">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-8">
                        <Zap size={14} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                            AI-Powered Loan Processing
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                        Agentic Loan Orchestrator
                        <span className="block text-blue-600">(LoanOps AI)</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                        AI-orchestrated personal loan processing for NBFCs
                    </p>

                    {/* Flow Diagram */}
                    <div className="flex items-center justify-center gap-2 md:gap-4 mb-12 flex-wrap">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Users size={16} className="text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Sales</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-400" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <FileCheck size={16} className="text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Verification</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-400" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Zap size={16} className="text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Underwriting</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-400" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Award size={16} className="text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Sanction</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                        to="/app"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300/50"
                    >
                        Try Live Demo
                        <ArrowRight size={20} />
                    </Link>

                    {/* Footer Note */}
                    <p className="mt-8 text-sm text-slate-400">
                        Built for CodeRed Hackathon • React + FastAPI + AI Agents
                    </p>
                </div>
            </main>

        </div>
    )
}
