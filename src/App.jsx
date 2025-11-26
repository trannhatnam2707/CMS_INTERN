import React, { useEffect, useState } from 'react'
import { auth } from './firebase'
import Login from './page/Login'
import Products from "./page/Products"
import Layout from "./components/Layout"
import { onAuthStateChanged } from 'firebase/auth'
import { BrowserRouter, Navigate, Routes, Route} from 'react-router-dom'
import Orders from './page/Orders'
import  User  from './page/Users'
import Appointments from './page/Appointments'
import FAQs from './page/FAQs'
import Analytics from './page/Analytics'

// components bảo vệ, chưa login thì đẩy về trang Login 
const ProtectedRoute = ({children}) => { 
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    });
    return () => unsubcribe();
  }, []);

  if (loading) return <div className='p-10'>Loading .... </div>;
  if (!user)  return <Navigate to = "/login" />;
  return children
}

const PublicRoute = ({children}) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    });
    return () => unsubcribe();
  }, []);
  
  
  if (loading) return <div className='h-screen flex items-center justify-center'>Đang kiểm tra ... </div>

  // nếu đã có user => đá về trang chủ
  if (user) return <Navigate to = '/' replace/>

  return children
}
const App = () => {
    return (
      <BrowserRouter>
        <Routes>
            {/* Áp dụng cho PublicRoute cho trang login  */}
            <Route path='/login' element={
              <PublicRoute>
                <Login/>
              </PublicRoute>
              }
            />
            {/* Các route cần được đăng nhập mới check được */}
            <Route path='/' element={<ProtectedRoute><Layout/></ProtectedRoute>}>
              <Route index element={<Analytics/>} />  
              <Route path='/products' element={<Products/>}/>
              <Route path = '/orders' element={<Orders/>}/>
              <Route path = '/users' element={<User/>}/>
              <Route path = '/appointments' element={<Appointments/>}/>
              <Route path = '/faqs' element={<FAQs/>}/>
            </Route>
        </Routes>
      </BrowserRouter>
    )
}

export default App
