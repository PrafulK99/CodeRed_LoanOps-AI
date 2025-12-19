import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User,
    CreditCard,
    Briefcase,
    FileText,
    Upload,
    CheckCircle2,
    ChevronRight,
    AlertCircle,
    Shield,
    Info
} from 'lucide-react'

export default function KYCForm({ sessionId, onComplete }) {
    // Form state organized by sections
    const [personalDetails, setPersonalDetails] = useState({
        fullName: '',
        dateOfBirth: '',
        mobileNumber: '',
        email: ''
    })

    const [identityDetails, setIdentityDetails] = useState({
        panNumber: '',
        aadhaarLast4: '',
        city: '',
        state: '',
        pincode: ''
    })

    const [employmentDetails, setEmploymentDetails] = useState({
        employmentType: 'Salaried',
        monthlyIncome: '',
        employerName: ''
    })

    const [documents, setDocuments] = useState({
        panCard: null,
        idProof: null,
        incomeProof: null
    })

    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [submitted, setSubmitted] = useState(false)
    const [verificationResult, setVerificationResult] = useState(null) // Store API response with PAN verification

    const steps = [
        { id: 1, title: 'Personal Details', icon: User },
        { id: 2, title: 'Identity Details', icon: CreditCard },
        { id: 3, title: 'Employment', icon: Briefcase },
        { id: 4, title: 'Documents', icon: FileText }
    ]

    const handleDocumentUpload = (field, file) => {
        if (file) {
            setDocuments(prev => ({
                ...prev,
                [field]: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                }
            }))
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)

        try {
            // Read full Video KYC metadata from sessionStorage (stored by VideoKYC component)
            // This includes all verification fields: duration, faceDetected, faceMatchScore, etc.
            const videoKycDataStr = sessionStorage.getItem('videoKYCData')
            let videoKycPayload = null

            if (videoKycDataStr) {
                try {
                    videoKycPayload = JSON.parse(videoKycDataStr)
                    // STEP 1: Log Video KYC data being sent to backend
                    console.log("[VIDEO KYC SUBMIT]", videoKycPayload)
                } catch (e) {
                    console.warn('[KYCForm] Could not parse videoKYCData')
                }
            }

            // Prepare KYC payload matching backend expectations
            const kycPayload = {
                personal: personalDetails,
                identity: identityDetails,
                employment: employmentDetails,
                documents: {
                    panCard: documents.panCard?.name || null,
                    idProof: documents.idProof?.name || null,
                    incomeProof: documents.incomeProof?.name || null
                },
                // Include full Video KYC metadata if completed
                // Backend expects: submitted, duration, faceDetected, livenessCheck, 
                // lightingScore, faceMatchScore, timestamp
                videoKyc: videoKycPayload,
                submittedAt: new Date().toISOString(),
                verificationMode: 'DEMO_SIMULATED'
            }

            const res = await fetch('http://localhost:8000/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    details: {
                        name: personalDetails.fullName,
                        kyc_data: kycPayload
                    }
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Verification failed')

            // Store verification result including PAN verification status
            setVerificationResult(data)
            setSubmitted(true)

            // Delay callback to show success state
            setTimeout(() => {
                if (onComplete) onComplete(data)
            }, 1500)

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const canProceedFromStep = (step) => {
        switch (step) {
            case 1:
                return personalDetails.fullName && personalDetails.mobileNumber
            case 2:
                return identityDetails.panNumber || identityDetails.aadhaarLast4
            case 3:
                return employmentDetails.monthlyIncome
            case 4:
                return true // Documents optional for demo
            default:
                return false
        }
    }

    // Render verification summary after submission
    if (submitted) {
        // Extract kyc_summary from verification result
        const kycSummary = verificationResult?.kyc_summary || {}
        const isPanVerified = kycSummary.pan_verification_status === true
        const isPanFormatValid = kycSummary.pan_format_valid !== false
        const isInvalidFormat = kycSummary.verification_mode === 'INVALID_FORMAT'
        const panSource = kycSummary.pan_verification_source || 'Demo Mode'

        // Determine PAN status display
        const getPanStatusDisplay = () => {
            if (isPanVerified) {
                return { label: '✔ Verified (Sandbox)', bgColor: 'bg-emerald-200', textColor: 'text-emerald-800' }
            } else if (isInvalidFormat) {
                return { label: 'Invalid Format', bgColor: 'bg-red-200', textColor: 'text-red-800' }
            } else {
                return { label: 'Format Valid (Simulated)', bgColor: 'bg-amber-200', textColor: 'text-amber-800' }
            }
        }

        const panStatus = getPanStatusDisplay()

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="text-emerald-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">KYC Verification Complete</h3>
                    <p className="text-sm text-slate-500">Your details have been recorded</p>
                </div>

                <div className="space-y-3 mb-6">
                    {/* PAN Verification Status - Primary Display */}
                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${isPanVerified
                        ? 'bg-emerald-50 border-emerald-100'
                        : isInvalidFormat
                            ? 'bg-red-50 border-red-100'
                            : 'bg-amber-50 border-amber-100'
                        }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPanVerified ? 'bg-emerald-200' : isInvalidFormat ? 'bg-red-200' : 'bg-amber-200'
                            }`}>
                            {isPanVerified ? (
                                <CheckCircle2 size={14} className="text-emerald-700" />
                            ) : isInvalidFormat ? (
                                <AlertCircle size={14} className="text-red-700" />
                            ) : (
                                <Info size={14} className="text-amber-700" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-slate-700">PAN Verification:</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${panStatus.bgColor} ${panStatus.textColor}`}>
                                    {panStatus.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Source: {panSource}
                            </p>
                            {isInvalidFormat && (
                                <p className="text-xs text-red-600 mt-1">
                                    Note: PAN must follow standard format (ABCDE1234F)
                                </p>
                            )}
                            {kycSummary.pan_name_on_record && (
                                <p className="text-xs text-slate-600 mt-1">
                                    Name on PAN: {kycSummary.pan_name_on_record}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="text-sm text-slate-700">Personal details received</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="text-sm text-slate-700">Identity details submitted</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="text-sm text-slate-700">Employment information recorded</span>
                    </div>
                    {(documents.panCard || documents.idProof || documents.incomeProof) && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span className="text-sm text-slate-700">Documents uploaded</span>
                        </div>
                    )}
                </div>

                {/* Compliance & Transparency Notice (MANDATORY) */}
                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                    <Shield size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500">
                        This demo validates PAN structure locally.
                        Identity verification is simulated.
                        Production systems verify PAN using authorized APIs with user consent.
                    </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600">
                        <span className="font-semibold text-blue-700">Demo Mode:</span> Real-time PAN verification supported in production.
                        Identity documents would be verified using DigiLocker/Setu APIs.
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Shield className="text-amber-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">KYC Verification</h3>
                        <p className="text-xs text-slate-500">Complete your Know Your Customer details</p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => setCurrentStep(step.id)}
                                className={`flex flex-col items-center gap-1 ${currentStep === step.id
                                    ? 'opacity-100'
                                    : currentStep > step.id
                                        ? 'opacity-70'
                                        : 'opacity-40'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step.id
                                    ? 'bg-blue-600 text-white'
                                    : currentStep > step.id
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {currentStep > step.id ? (
                                        <CheckCircle2 size={16} />
                                    ) : (
                                        <step.icon size={14} />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-slate-600">{step.title}</span>
                            </button>
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-emerald-300' : 'bg-slate-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Personal Details */}
                    {currentStep === 1 && (
                        <motion.div
                            key="personal"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold text-slate-800 mb-4">Personal Details</h4>

                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name *</label>
                                <input
                                    type="text"
                                    value={personalDetails.fullName}
                                    onChange={(e) => setPersonalDetails(p => ({ ...p, fullName: e.target.value }))}
                                    placeholder="Enter your full name as per documents"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={personalDetails.dateOfBirth}
                                        onChange={(e) => setPersonalDetails(p => ({ ...p, dateOfBirth: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        value={personalDetails.mobileNumber}
                                        onChange={(e) => setPersonalDetails(p => ({ ...p, mobileNumber: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Email Address</label>
                                <input
                                    type="email"
                                    value={personalDetails.email}
                                    onChange={(e) => setPersonalDetails(p => ({ ...p, email: e.target.value }))}
                                    placeholder="your.email@example.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Identity Details */}
                    {currentStep === 2 && (
                        <motion.div
                            key="identity"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold text-slate-800 mb-4">Identity Details</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">PAN Number</label>
                                    <input
                                        type="text"
                                        value={identityDetails.panNumber}
                                        onChange={(e) => setIdentityDetails(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Aadhaar (Last 4 digits)</label>
                                    <input
                                        type="text"
                                        value={identityDetails.aadhaarLast4}
                                        onChange={(e) => setIdentityDetails(p => ({ ...p, aadhaarLast4: e.target.value }))}
                                        placeholder="1234"
                                        maxLength={4}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">City</label>
                                    <input
                                        type="text"
                                        value={identityDetails.city}
                                        onChange={(e) => setIdentityDetails(p => ({ ...p, city: e.target.value }))}
                                        placeholder="Mumbai"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">State</label>
                                    <select
                                        value={identityDetails.state}
                                        onChange={(e) => setIdentityDetails(p => ({ ...p, state: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Select</option>
                                        <option>Maharashtra</option>
                                        <option>Karnataka</option>
                                        <option>Delhi</option>
                                        <option>Tamil Nadu</option>
                                        <option>Gujarat</option>
                                        <option>Rajasthan</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Pincode</label>
                                    <input
                                        type="text"
                                        value={identityDetails.pincode}
                                        onChange={(e) => setIdentityDetails(p => ({ ...p, pincode: e.target.value }))}
                                        placeholder="400001"
                                        maxLength={6}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Employment Details */}
                    {currentStep === 3 && (
                        <motion.div
                            key="employment"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold text-slate-800 mb-4">Employment Details</h4>

                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Employment Type</label>
                                <select
                                    value={employmentDetails.employmentType}
                                    onChange={(e) => setEmploymentDetails(p => ({ ...p, employmentType: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option>Salaried</option>
                                    <option>Self-Employed</option>
                                    <option>Business Owner</option>
                                    <option>Professional</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Monthly Income (₹) *</label>
                                    <input
                                        type="number"
                                        value={employmentDetails.monthlyIncome}
                                        onChange={(e) => setEmploymentDetails(p => ({ ...p, monthlyIncome: e.target.value }))}
                                        placeholder="50000"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Employer / Business Name</label>
                                    <input
                                        type="text"
                                        value={employmentDetails.employerName}
                                        onChange={(e) => setEmploymentDetails(p => ({ ...p, employerName: e.target.value }))}
                                        placeholder="Company name"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Document Upload */}
                    {currentStep === 4 && (
                        <motion.div
                            key="documents"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold text-slate-800 mb-4">Document Upload</h4>
                            <p className="text-xs text-slate-500 mb-4">Upload supporting documents (optional for demo)</p>

                            {/* PAN Card */}
                            <div className="border border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <CreditCard size={18} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">PAN Card</p>
                                            {documents.panCard ? (
                                                <p className="text-xs text-emerald-600">✓ {documents.panCard.name}</p>
                                            ) : (
                                                <p className="text-xs text-slate-400">PDF or Image</p>
                                            )}
                                        </div>
                                    </div>
                                    <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
                                        <Upload size={14} className="inline mr-1" />
                                        Upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentUpload('panCard', e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* ID Proof */}
                            <div className="border border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <FileText size={18} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">ID Proof (Aadhaar / Passport)</p>
                                            {documents.idProof ? (
                                                <p className="text-xs text-emerald-600">✓ {documents.idProof.name}</p>
                                            ) : (
                                                <p className="text-xs text-slate-400">PDF or Image</p>
                                            )}
                                        </div>
                                    </div>
                                    <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
                                        <Upload size={14} className="inline mr-1" />
                                        Upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentUpload('idProof', e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Income Proof */}
                            <div className="border border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <Briefcase size={18} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">Salary Slip / Bank Statement</p>
                                            {documents.incomeProof ? (
                                                <p className="text-xs text-emerald-600">✓ {documents.incomeProof.name}</p>
                                            ) : (
                                                <p className="text-xs text-slate-400">PDF or Image</p>
                                            )}
                                        </div>
                                    </div>
                                    <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
                                        <Upload size={14} className="inline mr-1" />
                                        Upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentUpload('incomeProof', e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* DigiLocker Note */}
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 mt-4">
                                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600">
                                    In production, identity documents would be verified using <span className="font-semibold text-blue-700">DigiLocker APIs</span> for secure, government-backed validation.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-xs text-red-600">{error}</span>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    {currentStep > 1 ? (
                        <button
                            onClick={() => setCurrentStep(s => s - 1)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            ← Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {currentStep < 4 ? (
                        <button
                            onClick={() => setCurrentStep(s => s + 1)}
                            disabled={!canProceedFromStep(currentStep)}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            Continue
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Submit & Verify
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
