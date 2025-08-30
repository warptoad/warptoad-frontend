import { Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Account from './pages/Account'
import { AzguardProvider } from './Context/AzguardContext'

function App() {

  return (
    <AzguardProvider>
      <div className='h-full flex flex-col bg-base-200'>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </AzguardProvider >
  )
}

export default App
