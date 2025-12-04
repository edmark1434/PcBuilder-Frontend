import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/home'
import Automate from './pages/automate'
import PartsList from './pages/parts-lists' 
import AskAI from './pages/ask-ai'
import Login from './pages/login'
import SignUp from './pages/signup'
import Favorites from './pages/Favorites'
import History from './pages/History'
import Layout from './components/Layout'

function App() {
  const location = useLocation();
  
  const isLoggedIn = () => {
    const user = sessionStorage.getItem('user');
    return !!user;
  };

  const showSidebar = isLoggedIn();

  return (
    <>
      {showSidebar ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Home/>} /> 
            <Route path="/automate" element={<Automate/>} />
            <Route path="/lists" element={<PartsList/>} />
            <Route path="/ask" element={<AskAI/>} />
            <Route path="/favorites" element={<Favorites/>} />
            <Route path="/history" element={<History/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<Home/>} /> 
          <Route path="/automate" element={<Automate/>} />
          <Route path="/lists" element={<PartsList/>} />
          <Route path="/ask" element={<AskAI/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      )}
    </>
  )
}

export default App