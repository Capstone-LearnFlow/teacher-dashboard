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
    student_ids: [],
    phases: {
      phase2: {
        startDate: '',
        startTime: '00:00',
        endDate: '',
        endTime: '23:59'
      },
      phase3: {
        startDate: '',
        startTime: '00:00',
        endDate: '',
        endTime: '23:59'
      }
    }
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    subject: '',
    chapter: '',
    topic: '',
    student_ids: '',
    phase2Start: '',
    phase2End: '',
    phase3Start: '',
    phase3End: ''
  });

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await teacherAPI.getStudents();
        if (response && Array.isArray(response)) {
          setStudents(response);
        } else {
          console.error('Unexpected students data format:', response);
          setFormError('학생 데이터 형식이 올바르지 않습니다.');
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
    
    // Handle phase date and time inputs
    if (name.startsWith('phase')) {
      const [phase, field] = name.split('_');
      setFormData({
        ...formData,
        phases: {
          ...formData.phases,
          [phase]: {
            ...formData.phases[phase],
            [field]: value
          }
        }
      });
      
      // Clear related error
      const errorField = field.includes('start') ? `${phase}Start` : `${phase}End`;
      if (errors[errorField]) {
        setErrors({
          ...errors,
          [errorField]: ''
        });
      }
    } else {
      // Handle regular inputs
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
    
    // Validate phase 2 dates
    if (!formData.phases.phase2.startDate) {
      newErrors.phase2Start = '주제 탐구 시작일을 입력해주세요.';
      isValid = false;
    }
    
    if (!formData.phases.phase2.endDate) {
      newErrors.phase2End = '주제 탐구 마감일을 입력해주세요.';
      isValid = false;
    }
    
    // Validate phase 3 dates
    if (!formData.phases.phase3.startDate) {
      newErrors.phase3Start = '팀별 토의 시작일을 입력해주세요.';
      isValid = false;
    }
    
    if (!formData.phases.phase3.endDate) {
      newErrors.phase3End = '팀별 토의 마감일을 입력해주세요.';
      isValid = false;
    }
    
    // Check if phase dates are in correct order
    if (formData.phases.phase2.startDate && formData.phases.phase2.endDate) {
      const phase2Start = new Date(`${formData.phases.phase2.startDate}T${formData.phases.phase2.startTime}`);
      const phase2End = new Date(`${formData.phases.phase2.endDate}T${formData.phases.phase2.endTime}`);
      
      if (phase2End < phase2Start) {
        newErrors.phase2End = '마감일은 시작일 이후여야 합니다.';
        isValid = false;
      }
    }
    
    if (formData.phases.phase3.startDate && formData.phases.phase3.endDate) {
      const phase3Start = new Date(`${formData.phases.phase3.startDate}T${formData.phases.phase3.startTime}`);
      const phase3End = new Date(`${formData.phases.phase3.endDate}T${formData.phases.phase3.endTime}`);
      
      if (phase3End < phase3Start) {
        newErrors.phase3End = '마감일은 시작일 이후여야 합니다.';
        isValid = false;
      }
    }
    
    // Check if phase 3 starts after phase 2 ends
    if (formData.phases.phase2.endDate && formData.phases.phase3.startDate) {
      const phase2End = new Date(`${formData.phases.phase2.endDate}T${formData.phases.phase2.endTime}`);
      const phase3Start = new Date(`${formData.phases.phase3.startDate}T${formData.phases.phase3.startTime}`);
      
      if (phase3Start < phase2End) {
        newErrors.phase3Start = '팀별 토의는 주제 탐구 이후에 시작해야 합니다.';
        isValid = false;
      }
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
      // Prepare phase data for API
      const phases = [
        {
          phaseNumber: 2,
          startDate: `${formData.phases.phase2.startDate}T${formData.phases.phase2.startTime}:00`,
          endDate: `${formData.phases.phase2.endDate}T${formData.phases.phase2.endTime}:59`
        },
        {
          phaseNumber: 3,
          startDate: `${formData.phases.phase3.startDate}T${formData.phases.phase3.startTime}:00`,
          endDate: `${formData.phases.phase3.endDate}T${formData.phases.phase3.endTime}:59`
        }
      ];
      
      // Create the submission data object
      const submissionData = {
        subject: formData.subject,
        chapter: formData.chapter,
        topic: formData.topic,
        student_ids: formData.student_ids,
        phases: phases
      };
      
      const response = await teacherAPI.createAssignment(submissionData);
      if (response && response.assignment_id) {
        setSuccess(true);
        // Reset form after successful submission
        setFormData({
          subject: '',
          chapter: '',
          topic: '',
          student_ids: [],
          phases: {
            phase2: {
              startDate: '',
              startTime: '00:00',
              endDate: '',
              endTime: '23:59'
            },
            phase3: {
              startDate: '',
              startTime: '00:00',
              endDate: '',
              endTime: '23:59'
            }
          }
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
                  
                  <PhaseSection>
                    <PhaseSectionTitle>주제 탐구 (Phase 2)</PhaseSectionTitle>
                    
                    <DateTimeGroup>
                      <DateInputGroup>
                        <Label>시작일 <Required>*</Required></Label>
                        <DateInput
                          type="date"
                          name="phase2_startDate"
                          value={formData.phases.phase2.startDate}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.phase2Start && <ErrorText>{errors.phase2Start}</ErrorText>}
                      </DateInputGroup>
                      
                      <TimeInputGroup>
                        <Label>시작 시간</Label>
                        <TimeInput
                          type="time"
                          name="phase2_startTime"
                          value={formData.phases.phase2.startTime}
                          onChange={handleInputChange}
                        />
                      </TimeInputGroup>
                    </DateTimeGroup>
                    
                    <DateTimeGroup>
                      <DateInputGroup>
                        <Label>마감일 <Required>*</Required></Label>
                        <DateInput
                          type="date"
                          name="phase2_endDate"
                          value={formData.phases.phase2.endDate}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.phase2End && <ErrorText>{errors.phase2End}</ErrorText>}
                      </DateInputGroup>
                      
                      <TimeInputGroup>
                        <Label>마감 시간</Label>
                        <TimeInput
                          type="time"
                          name="phase2_endTime"
                          value={formData.phases.phase2.endTime}
                          onChange={handleInputChange}
                        />
                      </TimeInputGroup>
                    </DateTimeGroup>
                  </PhaseSection>
                  
                  <PhaseSection>
                    <PhaseSectionTitle>팀별 토의 (Phase 3)</PhaseSectionTitle>
                    
                    <DateTimeGroup>
                      <DateInputGroup>
                        <Label>시작일 <Required>*</Required></Label>
                        <DateInput
                          type="date"
                          name="phase3_startDate"
                          value={formData.phases.phase3.startDate}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.phase3Start && <ErrorText>{errors.phase3Start}</ErrorText>}
                      </DateInputGroup>
                      
                      <TimeInputGroup>
                        <Label>시작 시간</Label>
                        <TimeInput
                          type="time"
                          name="phase3_startTime"
                          value={formData.phases.phase3.startTime}
                          onChange={handleInputChange}
                        />
                      </TimeInputGroup>
                    </DateTimeGroup>
                    
                    <DateTimeGroup>
                      <DateInputGroup>
                        <Label>마감일 <Required>*</Required></Label>
                        <DateInput
                          type="date"
                          name="phase3_endDate"
                          value={formData.phases.phase3.endDate}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.phase3End && <ErrorText>{errors.phase3End}</ErrorText>}
                      </DateInputGroup>
                      
                      <TimeInputGroup>
                        <Label>마감 시간</Label>
                        <TimeInput
                          type="time"
                          name="phase3_endTime"
                          value={formData.phases.phase3.endTime}
                          onChange={handleInputChange}
                        />
                      </TimeInputGroup>
                    </DateTimeGroup>
                  </PhaseSection>
                  
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
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 576px) {
    padding: 1.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
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

// Date-related styled components
const PhaseSection = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  width: 100%;
`;

const PhaseSectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 1rem;
`;

const DateTimeGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const DateInputGroup = styled.div`
  flex: 2;
`;

const TimeInputGroup = styled.div`
  flex: 1;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #495057;
  display: block;
`;

const Required = styled.span`
  color: #e63946;
  margin-left: 4px;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.25);
  }
`;

const TimeInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.25);
  }
`;

const ErrorText = styled.p`
  color: #e63946;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  margin-bottom: 0;
`;

export default CreateAssignment;