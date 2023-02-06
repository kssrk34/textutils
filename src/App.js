import logo from './logo.svg';
import './App.css';
import Navbar from './components/Navbar';
import Textform from './components/Textform';
// import About from './components/About';
import React,{useState} from 'react';

function App() {
  const [mode, setMode] = useState("light");

  const togglemode=()=>{
    if(mode==='light'){
      setMode('dark');
      document.body.style.backgroundColor="#03133a";
    }
    else{
      setMode('light');
      document.body.style.backgroundColor="white";

    }
  }
  return (
    <>
    <Navbar Title="TextUtils" About="About" mode={mode} toggle={togglemode}/>
    <div className="container">
    <Textform mode={mode}/>
    {/* <About/> */}
    </div>
    </>
  );
}

export default App;
