import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import GetStarted from './pages/GetStarted';
import AuthPage from './pages/AuthPage';
import Account from './pages/Account';
import Library from './pages/Library';
import ProblemEditor from './pages/ProblemEditor';
import Classroom from './pages/Classroom';
import { readSession } from './utils/user';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = readSession();
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/classroom" element={<ProtectedRoute><Classroom /></ProtectedRoute>} />
        <Route path="/problem/:id" element={<ProtectedRoute><ProblemEditor /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
