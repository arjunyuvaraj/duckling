import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import ProblemEditor from './pages/ProblemEditor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/problem/:id" element={<ProblemEditor />} />
      </Routes>
    </BrowserRouter>
  );
}
