import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import MeetingsPage from './pages/MeetingsPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import RecordPage from './pages/RecordPage'
import SummaryPage from './pages/SummaryPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
    return (
        <BrowserRouter>
            <div className="container">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/meetings" element={<PrivateRoute><MeetingsPage /></PrivateRoute>} />
                    <Route path="/meeting/:id" element={<PrivateRoute><MeetingDetailPage /></PrivateRoute>} />
                    <Route path="/record/:materialId" element={<PrivateRoute><RecordPage /></PrivateRoute>} />
                    <Route path="/summary/:id" element={<PrivateRoute><SummaryPage /></PrivateRoute>} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
