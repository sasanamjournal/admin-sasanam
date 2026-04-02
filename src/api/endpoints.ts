import api from './axios'

// Auth
export const loginAdmin = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

// Permissions
export const getMyPermissions = () => api.get('/admin/me/permissions')

// Roles
export const getRoles = () => api.get('/admin/roles')
export const updateRole = (id: string, data: object) =>
  api.put(`/admin/roles/${id}`, data)

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

export const createNews = (data: FormData) =>
  api.post('/admin/news', data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateNews = (id: string, data: FormData) =>
  api.put(`/admin/news/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteNews = (id: string) =>
  api.delete(`/admin/news/${id}`)

// Team
export const getTeam = () => api.get('/admin/team')
export const createTeamMember = (data: FormData) =>
  api.post('/admin/team', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateTeamMember = (id: string, data: FormData) =>
  api.put(`/admin/team/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteTeamMember = (id: string) =>
  api.delete(`/admin/team/${id}`)

// Sections (Journal Headers)
export const getSections = () => api.get('/admin/sections')
export const createSection = (data: { name: string }) =>
  api.post('/admin/sections', data)
export const updateSection = (id: string, data: { name: string }) =>
  api.put(`/admin/sections/${id}`, data)
export const deleteSection = (id: string) =>
  api.delete(`/admin/sections/${id}`)

// Books
export const getBooks = (params: Record<string, string | number>) =>
  api.get('/admin/books', { params })
export const createBook = (data: FormData) =>
  api.post('/admin/books', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateBook = (id: string, data: FormData) =>
  api.put(`/admin/books/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteBook = (id: string) =>
  api.delete(`/admin/books/${id}`)

// Authors
export const getAuthors = () => api.get('/admin/authors')
export const createAuthor = (data: FormData) =>
  api.post('/admin/authors', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateAuthor = (id: string, data: FormData) =>
  api.put(`/admin/authors/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteAuthor = (id: string) =>
  api.delete(`/admin/authors/${id}`)

// Contact Messages
export const getContacts = (params: Record<string, string | number>) =>
  api.get('/admin/contacts', { params })
export const markContactRead = (id: string) =>
  api.put(`/admin/contacts/${id}/read`)
export const replyContact = (id: string, reply: string) =>
  api.post(`/admin/contacts/${id}/reply`, { reply })
export const deleteContact = (id: string) =>
  api.delete(`/admin/contacts/${id}`)
