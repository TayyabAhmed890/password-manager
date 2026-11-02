import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../features/landing/pages/HomePage'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import CreatePasswordPage from '../features/vault/pages/CreatePasswordPage'
import PasswordPage from '../features/vault/pages/PasswordPage'
import VaultLayout from '../features/vault/components/VaultLayout'
import VaultToastProvider from '../features/vault/components/VaultToastContext.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { GuestOnly, RequireAuth } from './RouteGuards'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <VaultToastProvider>
          <Routes>
            <Route path="/" element={<GuestOnly><HomePage /></GuestOnly>} />
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<RequireAuth><VaultLayout /></RequireAuth>}>
              <Route path="/passwords" element={<PasswordPage />} />
              <Route path="/passwords/create" element={<CreatePasswordPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </VaultToastProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
