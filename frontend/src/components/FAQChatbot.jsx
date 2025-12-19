import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// FAQ Chatbot - Informational Only
// ============================================================================
// This chatbot answers questions about the product using keyword matching.
// NO backend calls, NO loan processing, NO personal data collection.
// ============================================================================

// Predefined FAQ responses with keyword matching
const faqResponses = [
    {
        keywords: ["what", "loanops", "product", "this", "does", "about"],
        answer: "LoanOps AI is an agentic loan orchestration system designed for responsible automation of small-ticket loans (₹5,000 – ₹50,000). It uses AI to assist with conversation and data collection, while decisions follow deterministic rules."
    },
    {
        keywords: ["automated", "automatic", "fully", "human", "review"],
        answer: "Loan decisions are AI-assisted, not fully automated. The system uses predefined eligibility rules, and higher-value loans are routed for human review before final approval."
    },
    {
        keywords: ["secure", "security", "safe", "data", "privacy"],
        answer: "The system follows a secure, step-based process with identity verification and audit logging. All loan applications are tracked in an auditable registry."
    },
    {
        keywords: ["amount", "loan", "range", "limit", "how much", "minimum", "maximum"],
        answer: "Automated processing is designed for micro-loans between ₹5,000 and ₹50,000. Loans above ₹50,000 are forwarded for human review."
    },
    {
        keywords: ["work", "how", "process", "steps"],
        answer: "The process has four steps: 1) Loan request via chat, 2) Identity verification, 3) Rule-based underwriting, and 4) Sanction letter generation. Each step is transparent and auditable."
    },
    {
        keywords: ["verify", "verification", "kyc", "identity", "digilocker"],
        answer: "This demo uses mock verification. In production, identity verification can integrate with DigiLocker for secure document validation."
    },
    {
        keywords: ["approve", "approval", "decision", "eligibility", "criteria"],
        answer: "Eligibility is determined by predefined policy rules (like EMI-to-income ratio), not AI predictions. The rules are transparent and the same for everyone."
    },
    {
        keywords: ["hackathon", "demo", "production", "prototype"],
        answer: "This is a hackathon prototype built for the CodeRed Hackathon. It demonstrates AI-assisted loan orchestration concepts, not a production deployment."
    },
    {
        keywords: ["try", "start", "apply", "begin", "demo"],
        answer: "To explore the loan flow, click 'Try Live Demo' on this page. You'll be guided through the complete application process step by step."
    }
]

// Fallback for out-of-scope questions
const OUT_OF_SCOPE_RESPONSE = "This assistant can answer questions about the product. To apply for a loan, please use the live demo."

// Detect if user is trying to apply or provide personal info
const BLOCKED_KEYWORDS = ["my pan", "my aadhaar", "my salary", "my income", "approve my", "give me loan", "i want loan", "i need loan", "process my"]

function findBestMatch(userInput) {
    const input = userInput.toLowerCase()

    // Check for blocked patterns (loan requests, personal info)
    if (BLOCKED_KEYWORDS.some(keyword => input.includes(keyword))) {
        return "This assistant is for information only. To explore the loan flow, please use the live demo."
    }

    // Find best matching FAQ
    let bestMatch = null
    let maxScore = 0

    for (const faq of faqResponses) {
        const score = faq.keywords.filter(keyword => input.includes(keyword)).length
        if (score > maxScore) {
            maxScore = score
            bestMatch = faq
        }
    }

    return maxScore > 0 ? bestMatch.answer : OUT_OF_SCOPE_RESPONSE
}

export default function FAQChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hi! I can help answer questions about LoanOps AI. What would you like to know?" }
    ])
    const [inputText, setInputText] = useState('')
    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = () => {
        if (!inputText.trim()) return

        const userMessage = inputText.trim()
        setInputText('')

        // Add user message
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }])

        // Get bot response (pure frontend, no API)
        setTimeout(() => {
            const response = findBestMatch(userMessage)
            setMessages(prev => [...prev, { sender: 'bot', text: response }])
        }, 300)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* Chat Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 transition-colors z-50"
                    >
                        <MessageCircle className="text-white" size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                                    <Bot className="text-white" size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Ask about LoanOps AI</h3>
                                    <p className="text-[10px] text-slate-400">Product information only</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="text-slate-400" size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-slate-700'
                                        }`}>
                                        {msg.sender === 'user'
                                            ? <User className="text-white" size={14} />
                                            : <Bot className="text-white" size={14} />
                                        }
                                    </div>
                                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${msg.sender === 'user'
                                            ? 'bg-blue-500 text-white rounded-tr-sm'
                                            : 'bg-white text-slate-700 rounded-tl-sm border border-slate-200'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 bg-white border-t border-slate-100">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setInputText("What is LoanOps AI?")}
                                    className="shrink-0 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                                >
                                    What is this?
                                </button>
                                <button
                                    onClick={() => setInputText("Is this fully automated?")}
                                    className="shrink-0 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                                >
                                    Is it automated?
                                </button>
                                <button
                                    onClick={() => setInputText("What loan amounts are supported?")}
                                    className="shrink-0 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                                >
                                    Loan range
                                </button>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask a question..."
                                className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>

                        {/* Demo CTA */}
                        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                            <Link
                                to="/signup"
                                className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                                Try the live demo
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
