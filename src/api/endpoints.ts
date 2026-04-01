import api from './axios'

// Auth
export const loginAdmin = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

// Dashboard
export const getDashboard = () => api.get('/admin/dashboard')

// Users
export const getUsers = (params: Record<string, string | number>) =>
  api.get('/admin/users', { params })

export const updateUser = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/users/${id}`, data)

export const deleteUser = (id: string) =>
  api.delete(`/admin/users/${id}`)

// Subscription Payments
export const getSubscriptionPayments = (params: Record<string, string | number>) =>
  api.get('/admin/payments/subscriptions', { params })

// Donation Payments
export const getDonationPayments = (params: Record<string, string | number>) =>
  api.get('/admin/payments/donations', { params })

// Failed Payments
export const getFailedPayments = (params: Record<string, string | number>) =>
  api.get('/admin/payments/failed', { params })

// Payment Detail
export const getPaymentDetail = (type: string, id: string) =>
  api.get(`/admin/payments/${type}/${id}`)

// Refund
export const refundPayment = (paymentId: string, type: string, amount?: number) =>
  api.post(`/admin/payments/refund/${paymentId}`, { type, amount })

// Donation List
export const getDonationList = (params: Record<string, string | number>) =>
  api.get('/admin/donation-list', { params })

export const deleteDonation = (id: string) =>
  api.delete(`/admin/donation-list/${id}`)

// News
export const getNews = (params: Record<string, string | number>) =>
  api.get('/admin/news', { params })

export const createNews = (data: Record<string, unknown>) =>
  api.post('/admin/news', data)

export const updateNews = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/news/${id}`, data)

export const deleteNews = (id: string) =>
  api.delete(`/admin/news/${id}`)

// Team
export const getTeam = () => api.get('/admin/team')
export const createTeamMember = (data: Record<string, unknown>) =>
  api.post('/admin/team', data)
export const updateTeamMember = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/team/${id}`, data)
export const deleteTeamMember = (id: string) =>
  api.delete(`/admin/team/${id}`)

// Authors
export const getAuthors = () => api.get('/admin/authors')
export const createAuthor = (data: Record<string, unknown>) =>
  api.post('/admin/authors', data)
export const updateAuthor = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/authors/${id}`, data)
export const deleteAuthor = (id: string) =>
  api.delete(`/admin/authors/${id}`)
