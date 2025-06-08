import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { teacherAPI } from '../services/api';
import Header from '../components/Header';
import Button from '../components/Button';

const Dashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await teacherAPI.getAssignments();
        setAssignments(data || []);
        setError('');
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setError('과제 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <DashboardContainer>
      <Header />
      
      <main className="container">
        <DashboardHeader>
          <h1>과제 목록</h1>
          <Button primary as={Link} to="/create-assignment">
            새 과제 생성
          </Button>
        </DashboardHeader>
        
        {loading ? (
          <LoadingMessage>과제 목록을 불러오는 중...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : assignments.length === 0 ? (
          <EmptyState>
            <p>아직 생성된 과제가 없습니다.</p>
            <Button primary as={Link} to="/create-assignment">
              첫 과제 생성하기
            </Button>
          </EmptyState>
        ) : (
          <AssignmentGrid>
            {assignments.map((assignment) => (
              <AssignmentCard 
                key={assignment.id}
                onClick={() => navigate(`/assignment/${assignment.id}`)}
              >
                <SubjectBadge>{assignment.subject}</SubjectBadge>
                <AssignmentTitle>{assignment.chapter}</AssignmentTitle>
                <AssignmentTopic>{assignment.topic}</AssignmentTopic>
                <AssignmentMeta>
                  <AssignmentStudents>
                    학생 {assignment.studentCount || assignment.student_count}명
                  </AssignmentStudents>
                  {/*}
                  <AssignmentDate>
                    {formatDate(assignment.createdAt || assignment.created_at)}
                  </AssignmentDate>
                  */}
                  <AssignmentPhase>
                    현재 단계: {assignment.currentPhase || 1}
                  </AssignmentPhase>
                </AssignmentMeta>
                <ViewButton>상세 보기</ViewButton>
              </AssignmentCard>
            ))}
          </AssignmentGrid>
        )}
      </main>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0 1.5rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #212529;
  }
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    
    h1 {
      font-size: 1.5rem;
    }
  }
`;

const AssignmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const AssignmentCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const SubjectBadge = styled.span`
  display: inline-block;
  background-color: #e6f2ff;
  color: #0066cc;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  align-self: flex-start;
`;

const AssignmentTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.5rem;
`;

const AssignmentTopic = styled.p`
  font-size: 0.875rem;
  color: #495057;
  margin-bottom: 1rem;
  flex-grow: 1;
`;

const AssignmentMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.75rem;
`;

const AssignmentStudents = styled.span`
  display: flex;
  align-items: center;
  color: #6c757d;
  
  &:before {
    content: '👥';
    margin-right: 0.25rem;
  }
`;

const AssignmentDate = styled.span`
  color: #6c757d;
`;

const AssignmentPhase = styled.span`
  display: flex;
  align-items: center;
  color: #6c757d;
  font-weight: 600;
  
  &:before {
    content: '🔄';
    margin-right: 0.25rem;
  }
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
  margin: 2rem 0;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
  
  p {
    margin-bottom: 1.5rem;
    color: #6c757d;
    font-size: 1.125rem;
  }
`;

const ViewButton = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #e6f2ff;
  color: #0066cc;
  text-align: center;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  ${AssignmentCard}:hover & {
    opacity: 1;
  }
`;

export default Dashboard;