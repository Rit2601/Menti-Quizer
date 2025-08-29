import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Admin from './pages/Admin'
import Participant from './pages/Participant'
import Results from './pages/Results'
import './main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Admin/>} />
        <Route path="/q/:quizId" element={<Participant/>} />
        <Route path="/results/:quizId" element={<Results/>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
