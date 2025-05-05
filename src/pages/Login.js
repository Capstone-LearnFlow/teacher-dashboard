import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../App';
import { authAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';

const Login = () => {
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!number.trim()) {
      setError('교사 번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(number);
      
      if (response.status === 'success') {
        // Parse user info from cookie
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const userCookie = cookies.find(cookie => cookie.startsWith('user='));
        
        if (userCookie) {
          const userValue = userCookie.substring(5); // remove 'user='
          try {
            const userData = JSON.parse(decodeURIComponent(userValue));
            login(userData);
            navigate('/dashboard');
          } catch (e) {
            console.error('Failed to parse user cookie:', e);
            setError('로그인 중 오류가 발생했습니다.');
          }
        } else {
          setError('로그인 중 오류가 발생했습니다.');
        }
      } else {
        setError('교사 번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoSection>
          <AppTitle>교사용 과제 관리 시스템</AppTitle>
          <Subtitle>선생님들을 위한 효과적인 과제 관리 플랫폼</Subtitle>
        </LogoSection>
        
        <FormSection>
          <LoginForm onSubmit={handleSubmit}>
            <FormTitle>교사 로그인</FormTitle>
            
            <Input
              label="교사 번호"
              id="teacherId"
              type="text"
              placeholder="교사 번호를 입력하세요"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              fullWidth
              required
              error={error}
              disabled={loading}
            />
            
            <Button 
              type="submit" 
              primary 
              fullWidth
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </LoginForm>
        </FormSection>
      </LoginCard>
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 1rem;
`;

const LoginCard = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LogoSection = styled.div`
  background-color: #4361ee;
  color: white;
  padding: 2rem;
  text-align: center;
`;

const AppTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  opacity: 0.9;
`;

const FormSection = styled.div`
  padding: 2rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 1rem;
  text-align: center;
`;

export default Login;