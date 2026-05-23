import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function GetStarted() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <Navbar showHome />
      <Navigate to="/register" replace />
    </div>
  );
}
