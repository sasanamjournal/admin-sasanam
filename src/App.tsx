import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import SubscriptionPayments from './pages/SubscriptionPayments'
import DonationPayments from './pages/DonationPayments'
import FailedPayments from './pages/FailedPayments'
import DonationList from './pages/DonationList'
import News from './pages/News'
import Team from './pages/Team'
import Authors from './pages/Authors'
import Sections from './pages/Sections'
import BooksPage from './pages/Books'
import Roles from './pages/Roles'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="payments/subscriptions" element={<SubscriptionPayments />} />
        <Route path="payments/donations" element={<DonationPayments />} />
        <Route path="payments/failed" element={<FailedPayments />} />
        <Route path="donation-list" element={<DonationList />} />
        <Route path="news" element={<News />} />
        <Route path="team" element={<Team />} />
        <Route path="authors" element={<Authors />} />
        <Route path="sections" element={<Sections />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="roles" element={<Roles />} />
      </Route>
    </Routes>
  )
}
