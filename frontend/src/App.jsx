import React, { useState, useRef, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link
} from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'

import Landing from './pages/Landing'
import AppChat from './pages/AppChat'
import Applications from './pages/Applications'
import Login from './pages/Login'
import Signup from './pages/Signup'

import {
  Loader2,
  Video,
  AlertCircle,
  Play,
  Square,
  LogOut,
  MessageSquare,
  FileText
} from 'lucide-react'

/* ======================================================
   Navigation Bar
====================================================== */
function Navigation() {
  const location = useLocation()
  const { logout } = useAuth()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">LoanOps AI</h1>

        <div className="flex items-center gap-4">
          <Link
            to="/app"
            className={`flex items-center px-3 py-2 rounded-lg ${isActive('/app') ? 'bg-blue-100 text-blue-700' : 'text-slate-700'
              }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Link>

          <Link
            to="/video-kyc"
            className={`flex items-center px-3 py-2 rounded-lg ${isActive('/video-kyc') ? 'bg-blue-100 text-blue-700' : 'text-slate-700'
              }`}
          >
            <Video className="w-4 h-4 mr-2" />
            Video KYC
          </Link>

          <Link
            to="/applications"
            className={`flex items-center px-3 py-2 rounded-lg ${isActive('/applications') ? 'bg-blue-100 text-blue-700' : 'text-slate-700'
              }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Applications
          </Link>

          <button
            onClick={logout}
            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ======================================================
   Video KYC (Demo-safe, stores metadata only)
   
   IMPORTANT: This component stores verification metadata
   in sessionStorage for the KYCForm to include in submission.
   No actual video is stored or sent to backend.
====================================================== */
function VideoKYC() {
  const navigate = useNavigate()
  const [recording, setRecording] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef(null)

  // Check if already completed
  useEffect(() => {
    const stored = sessionStorage.getItem('videoKYCData')
    if (stored) {
      setCompleted(true)
    }
  }, [])

  const startRecording = () => {
    setRecording(true)
    setDuration(0)
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)

    // Store complete Video KYC metadata (deterministic for demo)
    // All values are fixed to ensure consistent demo behavior
    const videoKycData = {
      submitted: true,
      duration: duration,
      size: 2048000, // Simulated file size in bytes
      faceDetected: true,
      livenessCheck: true,
      lightingScore: 0.92, // Fixed deterministic value
      faceMatchScore: 0.95, // Fixed deterministic value (above 0.75 threshold)
      timestamp: new Date().toISOString()
    }

    sessionStorage.setItem('videoKYCData', JSON.stringify(videoKycData))
    sessionStorage.setItem('videoKYCCompleted', 'true')

    setRecording(false)
    setCompleted(true)

    // Redirect after brief success display
    setTimeout(() => navigate('/app'), 1500)
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
          <Video className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Video KYC (Demo)</h2>
          <p className="text-sm text-slate-600 mb-6">
            Optional verification for enhanced confidence
          </p>

          {completed ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-600 font-semibold">Video KYC Completed</p>
              <p className="text-sm text-slate-500">Redirecting to application...</p>
            </div>
          ) : !recording ? (
            <button
              onClick={startRecording}
              className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Recording
            </button>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2 animate-pulse" />
                Recording… {duration}s
              </div>
              <button
                onClick={stopRecording}
                disabled={duration < 5}
                className="w-full bg-slate-900 text-white py-3 rounded-lg disabled:opacity-50"
              >
                <Square className="w-4 h-4 inline mr-2" />
                Stop & Submit (5s min)
              </button>
            </>
          )}

          <p className="text-xs text-slate-400 mt-4">
            Demo only • No real biometric data stored
          </p>
        </div>
      </div>
    </>
  )
}

/* ======================================================
   Route Guards
====================================================== */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AuthRoute({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    )
  }

  // Always show login/signup pages (don't auto-redirect to /app)
  // This allows demo users to see the authentication flow
  return children
}

/* ======================================================
   Routes
====================================================== */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />

      <Route path="/signup" element={
        <AuthRoute>
          <Signup />
        </AuthRoute>
      } />

      <Route path="/app" element={
        <ProtectedRoute>
          <>
            <Navigation />
            <AppChat />
          </>
        </ProtectedRoute>
      } />

      <Route path="/applications" element={
        <ProtectedRoute>
          <>
            <Navigation />
            <Applications />
          </>
        </ProtectedRoute>
      } />

      <Route path="/video-kyc" element={
        <ProtectedRoute>
          <VideoKYC />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

/* ======================================================
   App Root
====================================================== */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
