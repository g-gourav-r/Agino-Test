import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShootingStars } from "./ui/shooting-stars";
import { StarsBackground } from "./ui/stars-background";
import { toast } from "react-toastify";

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const FileUploadAPI = (data) =>
    fetch("https://zingapi.agino.tech/upload", {
      method: "POST",
      body: data.body,
    }).then(async (response) => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]; // Only allow one file
    const allowedTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!selectedFile) {
      setError("Please select a file.");
      setFile(null);
      return;
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only CSV and XLSX files are allowed.");
      setFile(null);
    } else {
      setError("");
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    console.log("clicked");
    if (!file) {
      setError("No file selected.");
      return;
    }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    FileUploadAPI({ body: formData })
      .then((response) => {
        setUploading(false);
        // Store the redis_key in localStorage
        localStorage.setItem("redis_key", response.redis_key);
        toast.success("File processed successfully!", { autoClose: 3000 });
        // Redirect to the /chat page
        navigate("/chat");
      })
      .catch((error) => {
        setUploading(false);
        let errorMessage = "An unknown error occurred";

        if (error instanceof Response) {
          error
            .json()
            .then((errorResponse) => {
              errorMessage = errorResponse.message || errorMessage;
              toast.error(`Upload failed: ${errorMessage}`, {
                autoClose: 3000,
              });
            })
            .catch((e) => {
              console.error("Failed to parse error response:", e);
              toast.error(`Upload failed: ${errorMessage}`, {
                autoClose: 3000,
              });
            });
        } else {
          errorMessage = error.message || errorMessage;
          toast.error(`Upload failed: ${errorMessage}`, { autoClose: 3000 });
        }
      });
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-neutral-900 text-white p-6">
      <h2 className="text-3xl md:text-5xl text-center font-semibold mb-4">
        Upload Your File
      </h2>
      <p className="text-gray-400 mb-6">
        Only .csv and .xlsx files are allowed.
      </p>

      <div className="z-20 bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md flex flex-col items-center">
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1ED760] file:text-white hover:file:bg-[#21e065] cursor-pointer"
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {file && (
          <div className="mt-3 p-3 bg-gray-700 rounded w-full text-center">
            <p className="text-green-400">Selected File:</p>
            <p className="text-gray-300 text-sm">{file.name}</p>
          </div>
        )}

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-6 py-2 rounded-full bg-[#1ED760] font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        )}
      </div>

      <button
        onClick={() => navigate("/")}
        className="z-20 px-6 py-2 rounded-full bg-[#1ED760] mt-6 font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition duration-200"
      >
        Go Back
      </button>

      <ShootingStars minDelay={1000} maxDelay={3000} />
      <StarsBackground />
    </div>
  );
};

export default Upload;
