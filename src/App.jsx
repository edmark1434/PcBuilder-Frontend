import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
// Routes Import
import Home from './pages/home'
import Automate from './pages/automate'
import PartsList from './pages/parts-lists' 
import AskAI from './pages/ask-ai'

function App() {

  // Routes
  return (
    <Routes>
      <Route path="/" element={<Home/>} /> 
      <Route path="/automate" element={<Automate/>} />
      <Route path="/lists" element={<PartsList/>} />
      <Route path="/ask" element={<AskAI/>} />
    </Routes>
  )
}

export default App
