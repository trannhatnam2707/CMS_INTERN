import React from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Login from './page/Login';
import Layout from "./components/Layout";
import Products from "./page/Products";
import Orders from './page/Orders';
import Users from './page/Users';
import Analytics from './page/Analytics';

// Hàm kiểm tra đăng nhập nhanh
const isAuthenticated = () => {
  return !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token"));
};

// 1. Bảo vệ trang Admin (Chưa login -> Đá về /login)
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. Bảo vệ trang Login (Đã login -> Đá về Dashboard /)
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang Login */}
        <Route path='/login' element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Các trang Admin (Cần đăng nhập) */}
        <Route path='/' element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Analytics />} />
          <Route path='products' element={<Products />} />
          <Route path='orders' element={<Orders />} />
          <Route path='users' element={<Users />} />
        </Route>

        {/* Catch all - Gõ linh tinh thì về login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;