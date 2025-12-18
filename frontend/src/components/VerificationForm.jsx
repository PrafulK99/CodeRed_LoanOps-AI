import React, { useState } from 'react'

export default function VerificationForm({ sessionId, onComplete }) {
  const [form, setForm] = useState({
    name: '',
    dob: '',
    id_type: 'PAN',
    id_number: '',
    address: '',
    phone: '',
    email: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://localhost:8000/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, details: form })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Verification failed')
      if (onComplete) onComplete(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="font-bold mb-2">Identity Verification</h3>

      <div className="grid grid-cols-2 gap-2">
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} className="p-2 border rounded" />
        <input name="dob" placeholder="Date of birth (YYYY-MM-DD)" value={form.dob} onChange={handleChange} className="p-2 border rounded" />
        <select name="id_type" value={form.id_type} onChange={handleChange} className="p-2 border rounded">
          <option>PAN</option>
          <option>AADHAAR</option>
          <option>DRIVER_LICENSE</option>
          <option>PASSPORT</option>
        </select>
        <input name="id_number" placeholder="ID number" value={form.id_number} onChange={handleChange} className="p-2 border rounded" />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="p-2 border rounded" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-2 border rounded" />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="p-2 border rounded col-span-2" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Submitting...' : 'Submit & Verify'}</button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    </form>
  )
}
