import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Memory from './pages/Memory';
import Skills from './pages/Skills';
import Settings from './pages/Settings';
import Jobs from './pages/Jobs';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat/:sessionId?" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
