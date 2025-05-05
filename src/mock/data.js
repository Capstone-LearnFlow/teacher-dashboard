// Mock data for API responses

// Students data
export const studentsData = {
  students: [
    { id: 0, name: "김민준" },
    { id: 1, name: "이서연" },
    { id: 2, name: "박지호" },
    { id: 3, name: "최예은" },
    { id: 4, name: "정현우" },
    { id: 5, name: "강수빈" },
    { id: 6, name: "조도윤" },
    { id: 7, name: "윤하은" },
    { id: 8, name: "임태민" },
    { id: 9, name: "신지우" }
  ]
};

// Assignments data
export const assignmentsData = [
  {
    id: 1,
    subject: "수학",
    chapter: "2. 미분과 적분",
    topic: "미분계수의 개념 이해하기",
    student_count: 5,
    created_at: "2025-04-01T10:20:00"
  },
  {
    id: 2,
    subject: "영어",
    chapter: "5. 영어 에세이 작성하기",
    topic: "서론, 본론, 결론 구조 학습",
    student_count: 8,
    created_at: "2025-04-02T14:30:00"
  },
  {
    id: 3,
    subject: "과학",
    chapter: "3. 전기와 자기",
    topic: "전자기 유도 법칙 이해하기",
    student_count: 6,
    created_at: "2025-04-03T09:15:00"
  }
];

// User data for authentication
export const userData = {
  name: "김선생"
};

// Helper function to set cookies
export const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + '; expires=' + expires + '; path=/';
};

// Helper function to get cookie value
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop().split(';').shift();
    try {
      return JSON.parse(decodeURIComponent(cookieValue));
    } catch (e) {
      return cookieValue;
    }
  }
  return null;
};