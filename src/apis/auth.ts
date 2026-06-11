import request from '@/lib/request';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: boolean;
  avatar: string;
}

const me = async () => {
  return request.get<User>('/api/auth/me');
};

const login = async (email: string, code: string) => {
  return request.post<User>(
    '/api/auth/login',
    { email, code },
    { showErrorToast: true }
  );
};

const sendCode = async (email: string) => {
  return request.post(
    '/api/auth/send-code',
    { email },
    { showErrorToast: true, showSuccessToast: true }
  );
};

const logout = () => {
  return request.post('/api/auth/logout');
};

export { me, login, sendCode, logout, type User };
