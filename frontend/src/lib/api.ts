import api from './axios';

export const fetcher = (url: string) => api.get(url).then(res => res.data);

// Accounts
export const getUserProfile = async () => {
  const response = await api.get('/accounts/me/');
  return response.data;
};

// Onboarding
export const submitOnboarding = async (data: { role: string; age_group?: string; exact_age?: number }) => {
  const response = await api.post('/accounts/onboard/', data);
  return response.data;
};

// Learning
export const getCourses = async () => {
  const response = await api.get('/courses/');
  return response.data;
};

// Quizzes
export const getQuizzes = async () => {
  const response = await api.get('/quizzes/');
  return response.data;
};

export const getResults = async () => {
  const response = await api.get('/results/');
  return response.data;
};

// Live Sessions
export const getLiveSessions = async () => {
  const response = await api.get('/sessions/');
  return response.data;
};

// Support
export const getTickets = async () => {
  const response = await api.get('/support/');
  return response.data;
};

export const submitTicket = async (data: { subject: string; category: string; description: string }) => {
  const response = await api.post('/support/', data);
  return response.data;
};

// Chat
export const getChatRooms = async () => {
  const response = await api.get('/community/');
  return response.data;
};

export const getMessages = async (roomId: string) => {
  const response = await api.get(`/messages/?room_id=${roomId}`);
  return response.data;
};

export const sendMessage = async (roomId: string, content: string) => {
  const response = await api.post('/messages/', { room: roomId, content });
  return response.data;
};

// Phase 3: Milestones (Evaluation Timeline)
export const getMilestones = async (courseId: string) => {
  const response = await api.get(`/milestones/?course=${courseId}`);
  return response.data;
};

// Phase 3: Resources
export const getResources = async () => {
  const response = await api.get('/resources/');
  return response.data;
};

// Phase 3: Private Chat Rooms
export const getPrivateChatRooms = async () => {
  const response = await api.get('/community/?room_type=PRIVATE');
  return response.data;
};
