import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { teacherAPI } from '../services/api';
import { AuthContext } from '../App';
import Button from '../components/Button';
import StudentTreeProgress from '../components/StudentTreeProgress';
import '../styles/TreeStyles.css';

const StudentTreeView = () => {
  const { assignmentId, studentId } = useParams();
  const navigate = useNavigate();
  
  const [treeLogData, setTreeLogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch tree log data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tree log data - this now includes assignment and student info
        const treeData = await teacherAPI.getStudentTreeLogs(assignmentId, studentId);
        console.log('Fetched tree data:', treeData);
        
        // Ensure the response has the correct structure (with status and data fields)
        if (treeData) {
          // Keep the full response structure intact
          setTreeLogData(treeData);
          setError('');
        } else {
          setError('트리 데이터를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, studentId]);

  const handleBack = () => {
    navigate(`/assignment/${assignmentId}`);
  };

  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorMessage>{error}</ErrorMessage>
          <Button onClick={handleBack}>돌아가기</Button>
        </ContentContainer>
      </PageContainer>
    );
  }

  // Get assignment and student info from tree data for header display
  // Use a safe way to access nested properties
  const assignment = treeLogData && treeLogData.data ? treeLogData.data.assignment : null;
  const student = treeLogData && treeLogData.data ? treeLogData.data.student : null;

  return (
    <PageContainer>
      <ContentContainer>
        <PageHeader>
          <HeaderLeftSection>
            <BackButton onClick={handleBack}>← 과제 상세로 돌아가기</BackButton>
            {assignment && student && (
              <h1>{student.name}의 트리 진행 과정 - {assignment.chapter}</h1>
            )}
          </HeaderLeftSection>
          <UserSection>
            {user && (
              <>
                <UserName>{user.name} 선생님</UserName>
                <LogoutButton secondary small onClick={handleLogout}>
                  로그아웃
                </LogoutButton>
              </>
            )}
          </UserSection>
        </PageHeader>
        
        {treeLogData ? (
          <FullPageTreeContainer>
            {/* Pass the full response object without modifying it */}
            <StudentTreeProgress treeLogData={treeLogData} fullPage={true} />
          </FullPageTreeContainer>
        ) : (
          <EmptyState>트리 로그 데이터가 없습니다.</EmptyState>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: white;
`;

const ContentContainer = styled.main`
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
`;

const PageHeader = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #212529;
    margin: 0.5rem 0;
  }
`;

const HeaderLeftSection = styled.div`
  flex: 1;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #495057;
`;

const LogoutButton = styled(Button)`
  background-color: #6c757d;
  color: #fff;
  border: none;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  cursor: pointer;
  
  &:hover {
    background-color: #5a6268;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  padding: 0;
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  
  &:hover {
    color: #0066cc;
    text-decoration: underline;
  }
`;

const FullPageTreeContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
  background-color: white;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 1.125rem;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
`;

export default StudentTreeView;