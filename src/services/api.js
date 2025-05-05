import {
  studentsData,
  assignmentsData,
  userData,
  setCookie
} from '../mock/data';

// Mock implementation of API service
// Local state to store mock data that can be modified
let mockAssignments = [...assignmentsData];
let assignmentIdCounter = assignmentsData.length + 1;

// Authentication API
export const authAPI = {
  login: async (number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a mock environment, we'll accept any non-empty number as valid
    if (!number.trim()) {
      return { status: 'fail' };
    }
    
    // Set user cookie as the API would
    setCookie('user', userData);
    
    return { status: 'success' };
  },
};

// Teacher API
export const teacherAPI = {
  // Get list of students
  getStudents: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock students data
    return studentsData;
  },

  // Create a new assignment
  createAssignment: async (assignmentData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Create new assignment with mock ID
    const newAssignment = {
      id: assignmentIdCounter++,
      subject: assignmentData.subject,
      chapter: assignmentData.chapter,
      topic: assignmentData.topic,
      student_count: assignmentData.student_ids.length,
      created_at: new Date().toISOString()
    };
    
    // Add to mock assignments
    mockAssignments.push(newAssignment);
    
    return {
      assignment_id: newAssignment.id,
      message: "과제가 성공적으로 생성되었습니다."
    };
  },

  // Get list of assignments
  getAssignments: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Return mock assignments
    return mockAssignments;
  },
};

const apiServices = {
  auth: authAPI,
  teacher: teacherAPI,
};

export default apiServices;