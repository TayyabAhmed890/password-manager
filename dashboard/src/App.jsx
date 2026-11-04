import { Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './features/auth/AdminAuthContext.jsx'
import AdminLoginPage from './features/auth/pages/AdminLoginPage.jsx'
import AdminDashboardPage from './features/dashboard/pages/AdminDashboardPage.jsx'
import AdminChangePasswordPage from './features/auth/pages/AdminChangePasswordPage.jsx'
import AdminForgotPasswordPage from './features/auth/pages/AdminForgotPasswordPage.jsx'
import AdminLayout from './shared/components/AdminLayout.jsx'
import AdminRoute from './shared/components/AdminRoute.jsx'
import ToastProvider from './shared/components/ToastProvider.jsx'
import UsersPage from './features/users/pages/UsersPage.jsx'
import NotFoundPage from './shared/components/NotFoundPage.jsx'

function App() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/access-denied" element={<AdminLoginPage accessDenied />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/change-password" element={<AdminChangePasswordPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AdminAuthProvider>
    </ToastProvider>
  )
}

export default App
