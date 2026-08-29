'use client';

import React from 'react';
import { LoginForm } from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <LoginForm showRegisterLink={true} />
    </div>
  );
};

export default LoginPage;
