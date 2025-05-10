// API service connecting to the real API server
const API_BASE_URL = 'http://100.65.217.64:8080/api';

// Authentication API
export const authAPI = {
  login: async (number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number }),
        credentials: 'include', // Important for handling cookies
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  },
};

// Teacher API
export const teacherAPI = {
  // Get list of students
  getStudents: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/students`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      return data.data; // Extract the data field from the response
    } catch (error) {
      console.error('Get students API error:', error);
      throw error;
    }
  },

  // Create a new assignment
  createAssignment: async (assignmentData) => {
    try {
      // Restructure the data according to API spec
      const requestData = {
        subject: assignmentData.subject,
        chapter: assignmentData.chapter,
        topic: assignmentData.topic,
        studentIds: assignmentData.student_ids,
        phases: assignmentData.phases || []
      };
      
      const response = await fetch(`${API_BASE_URL}/teacher/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      
      const data = await response.json();
      return data.data; // Extract the data field from the response
    } catch (error) {
      console.error('Create assignment API error:', error);
      throw error;
    }
  },

  // Get list of assignments
  getAssignments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/assignments`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      return data.data; // Extract the data field from the response
    } catch (error) {
      console.error('Get assignments API error:', error);
      throw error;
    }
  },
};

const apiServices = {
  auth: authAPI,
  teacher: teacherAPI,
};

export default apiServices;