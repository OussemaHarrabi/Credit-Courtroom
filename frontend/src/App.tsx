import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { 
  Landing, 
  Dashboard, 
  NewCase, 
  CaseDetail, 
  Uploads, 
  Decisions, 
  AuditLogs, 
  Settings,
  Policies
} from '@/pages';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          
          {/* Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases/new" element={<NewCase />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/uploads" element={<Uploads />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
