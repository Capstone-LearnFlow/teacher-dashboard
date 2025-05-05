import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { teacherAPI } from '../services/api';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import MultiSelect from '../components/MultiSelect';

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    chapter: '',
    topic: '',
    student_ids: []
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    subject: '',
    chapter: '',
    topic: '',
    student_ids: ''
  });

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await teacherAPI.getStudents();
        if (response && response.students) {
          setStudents(response.students);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setFormError('학생 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleStudentSelection = (selectedIds) => {
    setFormData({
      ...formData,
      student_ids: selectedIds
    });
    
    // Clear error when selection changes
    if (errors.student_ids) {
      setErrors({
        ...errors,
        student_ids: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    if (!formData.subject.trim()) {
      newErrors.subject = '과목을 입력해주세요.';
      isValid = false;
    }
    
    if (!formData.chapter.trim()) {
      newErrors.chapter = '단원을 입력해주세요.';
      isValid = false;
    }
    
    if (!formData.topic.trim()) {
      newErrors.topic = '주제를 입력해주세요.';
      isValid = false;
    }
    
    if (formData.student_ids.length === 0) {
      newErrors.student_ids = '적어도 한 명의 학생을 선택해주세요.';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    
    try {
      const response = await teacherAPI.createAssignment(formData);
      if (response && response.assignment_id) {
        setSuccess(true);
        // Reset form after successful submission
        setFormData({
          subject: '',
          chapter: '',
          topic: '',
          student_ids: []
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setFormError('과제 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      setFormError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Header />
      
      <main className="container">
        <PageHeader>
          <h1>새 과제 생성</h1>
          <Button secondary onClick={() => navigate('/dashboard')}>
            대시보드로 돌아가기
          </Button>
        </PageHeader>
        
        {loading ? (
          <LoadingMessage>학생 정보를 불러오는 중...</LoadingMessage>
        ) : (
          <FormContainer>
            {success ? (
              <SuccessMessage>
                과제가 성공적으로 생성되었습니다! 대시보드로 이동합니다...
              </SuccessMessage>
            ) : (
              <FormCard>
                {formError && <ErrorMessage>{formError}</ErrorMessage>}
                
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <Input
                      label="과목"
                      id="subject"
                      name="subject"
                      placeholder="예: 수학, 영어, 과학"
                      value={formData.subject}
                      onChange={handleInputChange}
                      error={errors.subject}
                      required
                      fullWidth
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Input
                      label="단원"
                      id="chapter"
                      name="chapter"
                      placeholder="예: 1. 함수의 극한"
                      value={formData.chapter}
                      onChange={handleInputChange}
                      error={errors.chapter}
                      required
                      fullWidth
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Input
                      label="주제"
                      id="topic"
                      name="topic"
                      placeholder="예: 함수의 연속성 이해하기"
                      value={formData.topic}
                      onChange={handleInputChange}
                      error={errors.topic}
                      required
                      fullWidth
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <MultiSelect
                      label="학생 선택"
                      options={students}
                      selectedValues={formData.student_ids}
                      onChange={handleStudentSelection}
                      error={errors.student_ids}
                      required
                    />
                  </FormGroup>
                  
                  <ButtonGroup>
                    <Button 
                      type="button" 
                      outlined 
                      onClick={() => navigate('/dashboard')}
                      disabled={submitting}
                    >
                      취소
                    </Button>
                    <Button 
                      type="submit" 
                      primary 
                      disabled={submitting}
                    >
                      {submitting ? '생성 중...' : '과제 생성'}
                    </Button>
                  </ButtonGroup>
                </Form>
              </FormCard>
            )}
          </FormContainer>
        )}
      </main>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
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

const FormContainer = styled.div`
  margin: 1.5rem 0 3rem;
`;

const FormCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  
  @media (max-width: 576px) {
    padding: 1.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  width: 100%;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  font-size: 1.125rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 1.125rem;
`;

export default CreateAssignment;