import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { AdminLayout } from './layouts/AdminLayout';
import { AnimatedLayout } from './layouts/AnimatedLayout';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminPlaceholderPage } from './pages/admin/AdminPlaceholderPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { GoogleOAuthCallbackPage } from './pages/auth/GoogleOAuthCallbackPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { RequireAuth } from './routes/RequireAuth';
import { RootRedirect } from './routes/RootRedirect';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AnimatedLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/google/callback" element={<GoogleOAuthCallbackPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminHomePage />} />
              <Route
                path="users"
                element={<AdminPlaceholderPage title="Users" description="Manage accounts, roles, and invitations." />}
              />
              <Route
                path="api-keys"
                element={<AdminPlaceholderPage title="API keys" description="Create and rotate API keys for integrations." />}
              />
              <Route
                path="settings"
                element={<AdminPlaceholderPage title="Settings" description="Workspace and security preferences." />}
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
