import { Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Account from './pages/Account'
import { AztecWalletProvider } from './Context/AztecWalletContext'

function App() {

  return (
    <AztecWalletProvider>
      <div className='h-full flex flex-col bg-base-200'>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </div>
    </AztecWalletProvider >
  )
}

export default App
