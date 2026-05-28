import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import GetStarted from './pages/GetStarted';
import AuthPage from './pages/AuthPage';
import Account from './pages/Account';
import Library from './pages/Library';
import ProblemEditor from './pages/ProblemEditor';
import Classroom from './pages/Classroom';
import AppLayout from './components/AppLayout';
import { readSession } from './utils/user';

function ProtectedAppLayout() {
  const session = readSession();
  return session ? <AppLayout /> : <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = readSession();
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<ProtectedAppLayout />}>
          <Route path="/home" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/classroom" element={<Classroom />} />
          <Route path="/account" element={<Account />} />
        </Route>
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/problem/:id" element={<ProtectedRoute><ProblemEditor /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}