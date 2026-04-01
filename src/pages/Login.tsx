import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { loginAdmin } from '../api/endpoints'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Email and password required')
    setLoading(true)
    try {
      const { data } = await loginAdmin(email, password)
      if (data.user?.role !== 'admin') {
        toast.error('Admin access required')
        setLoading(false)
        return
      }
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      toast.success('Welcome to admin panel!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4ecd8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#8B4513] shadow-xl mb-4">
            <span className="text-white font-serif font-black text-3xl">S</span>
          </div>
          <h1 className="font-serif font-black text-3xl text-[#4A3B32] tracking-wide">Sasanam</h1>
          <p className="text-sm font-bold text-[#8B4513]/60 uppercase tracking-[0.3em] mt-1">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#fdfaf2] rounded-3xl p-8 shadow-[0_8px_32px_rgba(61,37,22,0.15)] border border-white/30">
          <h2 className="text-xl font-bold text-[#4A3B32] mb-6">Sign in to continue</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#8B4513]/15 text-[#4A3B32] font-medium text-sm focus:outline-none focus:border-[#8B4513]/40 focus:ring-2 focus:ring-[#8B4513]/10 transition-all placeholder:text-[#6A5A4A]/40"
                placeholder="admin@sasanam.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#8B4513]/15 text-[#4A3B32] font-medium text-sm focus:outline-none focus:border-[#8B4513]/40 focus:ring-2 focus:ring-[#8B4513]/10 transition-all placeholder:text-[#6A5A4A]/40"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#8B4513] text-white font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-[#a0522d] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
