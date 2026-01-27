import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { Home } from './components/Home';
import { FrameworkDetails } from './components/FrameworkDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/framework/:framework" element={<FrameworkDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
