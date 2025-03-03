import React from "react";
import { useNavigate } from "react-router-dom";
import { ShootingStars } from "./ui/shooting-stars";
import { StarsBackground } from "./ui/stars-background";

const Hero = () => {
  const navigate = useNavigate(); // ✅ Initialize navigate

  return (
    <div className="w-screen h-screen rounded-md bg-neutral-900 flex flex-col items-center justify-center relative">
      <h2 className="relative flex flex-col md:flex-row z-10 text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white gap-2 md:gap-8">
        <span>Agino</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28a745] to-[#6ddf7e]">
          Zing
        </span>
      </h2>
      <p className="mt-5">
        Experience lightning-fast, intuitive solutions at your fingertips.
      </p>
      <button
        onClick={() => navigate("/upload")} // ✅ Navigate to /upload
        className="z-20 px-8 py-2 rounded-full bg-[#1ED760] mt-5 font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200"
      >
        Get Started
      </button>
      <ShootingStars minDelay={1000} maxDelay={3000} />
      <StarsBackground />
    </div>
  );
};

export default Hero;
