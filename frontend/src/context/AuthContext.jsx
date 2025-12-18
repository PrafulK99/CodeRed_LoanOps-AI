import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
    const [loading, setLoading] = useState(true)

    // Check if user is authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('auth_token')
            if (storedToken) {
                try {
                    const response = await fetch(`${API_URL}/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    })
                    if (response.ok) {
                        const userData = await response.json()
                        setUser(userData)
                        setToken(storedToken)
                    } else {
                        // Token invalid, clear it
                        localStorage.removeItem('auth_token')
                        setToken(null)
                    }
                } catch (error) {
                    console.error('Auth check failed:', error)
                    localStorage.removeItem('auth_token')
                    setToken(null)
                }
            }
            setLoading(false)
        }
        checkAuth()
    }, [])

    // Email-only signup
    const signup = async (email) => {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Signup failed')
        }

        const data = await response.json()
        localStorage.setItem('auth_token', data.token)
        setToken(data.token)
        setUser({ user_id: data.user_id, email: data.email })
        return data
    }

    // Email-only login
    const login = async (email) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Login failed')
        }

        const data = await response.json()
        localStorage.setItem('auth_token', data.token)
        setToken(data.token)
        setUser({ user_id: data.user_id, email: data.email })
        return data
    }

    const logout = async () => {
        try {
            if (token) {
                await fetch(`${API_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            localStorage.removeItem('auth_token')
            setToken(null)
            setUser(null)
        }
    }

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        signup,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
