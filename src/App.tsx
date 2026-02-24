import React from 'react';
import './App.css'
import { RoutePage } from './Router'

function App() {
  React.useEffect(() => {
    console.log("App mounted");
    console.log((atob(window.location.hash.slice(1))),'outer decryption');
  }, []);
  return (
    <RoutePage />
  )
}

export default App
