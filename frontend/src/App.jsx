import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AppChat from './pages/AppChat'
import Applications from './pages/Applications'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppChat />} />
        <Route path="/applications" element={<Applications />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
