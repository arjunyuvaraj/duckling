import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GetStarted from './pages/GetStarted';
import AuthPage from './pages/AuthPage';
import Account from './pages/Account';
import Library from './pages/Library';
import ProblemEditor from './pages/ProblemEditor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/account" element={<Account />} />
        <Route path="/library" element={<Library />} />
        <Route path="/problem/:id" element={<ProblemEditor />} />
      </Routes>
    </BrowserRouter>
  );
}
