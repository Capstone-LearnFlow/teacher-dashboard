import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { teacherAPI } from '../services/api';
import Header from '../components/Header';
import Button from '../components/Button';
import StudentTreeProgress from '../components/StudentTreeProgress';
import '../styles/TreeStyles.css';

const AssignmentDetail = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [treeLogData, setTreeLogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch assignment details and students
  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        setLoading(true);
        
        // For this mock version, we'll use the assignments API to get basic info
        const assignments = await teacherAPI.getAssignments();
        const currentAssignment = assignments.find(a => a.id === parseInt(assignmentId));
        
        if (!currentAssignment) {
          setError('과제를 찾을 수 없습니다.');
          return;
        }
        
        setAssignment(currentAssignment);
        
        // Fetch students
        const studentsData = await teacherAPI.getStudents();
        // Filter students who are assigned to this assignment if needed
        setStudents(studentsData);
        
        setError('');
      } catch (error) {
        console.error('Failed to fetch assignment data:', error);
        setError('과제 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentData();
  }, [assignmentId]);

  // Fetch tree logs when a student is selected
  useEffect(() => {
    const fetchTreeLogs = async () => {
      if (!selectedStudentId) return;
      
      try {
        setLoading(true);
        const data = await teacherAPI.getStudentTreeLogs(assignmentId, selectedStudentId);
        setTreeLogData(data);
        setError('');
      } catch (error) {
        console.error('Failed to fetch tree logs:', error);
        setError('학생의 트리 로그를 불러오는데 실패했습니다.');
        setTreeLogData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTreeLogs();
  }, [assignmentId, selectedStudentId]);

  const handleStudentSelect = (studentId) => {
    // Navigate directly to full-page tree view instead of showing embedded view
    navigate(`/assignment/${assignmentId}/student/${studentId}/tree`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading && !assignment) {
    return (
      <PageContainer>
        <Header />
        <ContentContainer className="container">
          <LoadingMessage>과제 정보를 불러오는 중...</LoadingMessage>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error && !assignment) {
    return (
      <PageContainer>
        <Header />
        <ContentContainer className="container">
          <ErrorMessage>{error}</ErrorMessage>
          <Button onClick={handleBack}>대시보드로 돌아가기</Button>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header />
      <ContentContainer className="container">
        {assignment && (
          <>
            <PageHeader>
              <BackButton onClick={handleBack}>← 대시보드로 돌아가기</BackButton>
              <h1>{assignment.topic || '과제 상세'}</h1>
            </PageHeader>
            
            <AssignmentInfo>
              <div>
                <Label>과목</Label>
                <Value>{assignment.subject}</Value>
              </div>
              <div>
                <Label>단원</Label>
                <Value>{assignment.chapter}</Value>
              </div>
              <div>
                <Label>학생 수</Label>
                <Value>{assignment.studentCount || assignment.student_count}명</Value>
              </div>
            </AssignmentInfo>

            <SectionTitle>학생 선택</SectionTitle>
            <StudentList>
              {students.length === 0 ? (
                <EmptyState>학생 정보가 없습니다.</EmptyState>
              ) : (
                students.map((student) => (
                  <StudentCard 
                    key={student.id}
                    selected={selectedStudentId === student.id}
                    onClick={() => handleStudentSelect(student.id)}
                  >
                    <StudentName>{student.name || '이름 없음'}</StudentName>
                    <StudentNumber>{student.number || '-'}</StudentNumber>
                    {selectedStudentId === student.id && (
                      <SelectedIndicator>✓</SelectedIndicator>
                    )}
                  </StudentCard>
                ))
              )}
            </StudentList>

            {/* Tree view is now accessed directly through student selection */}
          </>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.main`
  padding: 2rem 1rem;
  flex: 1;
`;

const PageHeader = styled.div`
  margin-bottom: 1.5rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #212529;
    margin: 0.5rem 0;
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

const AssignmentInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  background-color: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const Label = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
`;

const Value = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
`;

const SectionTitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
`;

const ViewFullTreeButton = styled.button`
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0055aa;
  }
`;

const StudentList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StudentCard = styled.div`
  background-color: ${props => props.selected ? '#e6f2ff' : 'white'};
  border: 1px solid ${props => props.selected ? '#0066cc' : '#dee2e6'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background-color: ${props => props.selected ? '#e6f2ff' : '#f8f9fa'};
    transform: translateY(-2px);
  }
`;

const StudentName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
`;

const StudentNumber = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
`;

const SelectedIndicator = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  background-color: #0066cc;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TreeProgressContainer = styled.div`
  margin-top: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
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

export default AssignmentDetail;