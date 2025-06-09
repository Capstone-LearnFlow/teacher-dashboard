import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateAssignment from './pages/CreateAssignment';
import AssignmentDetail from './pages/AssignmentDetail';
import StudentTreeView from './pages/StudentTreeView';
import TreeVisualizationTest from './components/TreeVisualizationTest';

// Create Authentication Context
export const AuthContext = createContext();

function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if there's user info in cookies
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const userCookie = cookies.find(cookie => cookie.startsWith('user='));
        
        if (userCookie) {
          const userValue = userCookie.substring(5); // remove 'user='
          try {
            const userData = JSON.parse(decodeURIComponent(userValue));
            setUser(userData);
            setIsAuthenticated(true);
          } catch (e) {
            console.error('Failed to parse user cookie:', e);
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Auth functions
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear user cookie
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return <LoadingScreen>로딩 중...</LoadingScreen>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <AppContainer>
        {/* 
        <MockBanner>
          현재 Mock 데이터로 실행 중입니다. 실제 API 서버가 연결되어 있지 않습니다.
        </MockBanner>
        */}
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
            />
            <Route 
              path="/create-assignment" 
              element={isAuthenticated ? <CreateAssignment /> : <Navigate to="/" />} 
            />
            <Route 
              path="/assignment/:assignmentId" 
              element={isAuthenticated ? <AssignmentDetail /> : <Navigate to="/" />} 
            />
            <Route 
              path="/assignment/:assignmentId/student/:studentId/tree" 
              element={isAuthenticated ? <StudentTreeView /> : <Navigate to="/" />} 
            />
            {/* Test route for tree visualization - no auth check for easier testing */}
            <Route 
              path="/tree-test" 
              element={<TreeVisualizationTest />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AppContainer>
    </AuthContext.Provider>
  );
}

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #555;
`;

const MockBanner = styled.div`
  background-color: #fff3cd;
  color: #856404;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #ffeeba;
`;

export default App;