import React from "react";
import { Routes, Route } from "react-router-dom";
import Hero from "../components/Hero";
import Upload from "../components/Upload";
import Chat from "../components/Chat";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
};

export default App;
