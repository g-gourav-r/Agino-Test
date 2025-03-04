import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(""); // Optional session id state
  const [messages, setMessages] = useState([]); // Conversation history (each message is a bubble)
  const [streamingText, setStreamingText] = useState(""); // For accumulating streaming data
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll when messages or streamingText change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSendMessage = async (userInput) => {
    if (!userInput.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    // Append user's message to conversation
    const userMsg = { sender: "user", content: userInput };
    setMessages((prev) => [...prev, userMsg]);

    // Start the streaming bubble (for live updates)
    setStreamingText("Thinking...");
    setLoading(true);
    setMessage(""); // Clear input

    try {
      // Build FormData payload with redis_key, message, and session_id if available
      const payload = new FormData();
      const redisKey = localStorage.getItem("redis_key");
      payload.append("redis_key", redisKey);
      payload.append("message", userInput);
      if (sessionId) {
        payload.append("session_id", sessionId);
      }

      const response = await fetch("http://16.171.197.51:8000/chat", {
        method: "POST",
        body: payload,
      });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let accumulatedText = "";
      let isFinalResponse = false;
      let newSessionId = sessionId; // Use existing session id unless updated

      while (!isFinalResponse) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode and clean chunk: remove "data:" and newlines
        const chunk = decoder.decode(value, { stream: true });
        const cleanedChunk = chunk.replace(/data:\s*/g, "").replace(/\n/g, " ");
        accumulatedText += cleanedChunk;

        // Update the streaming bubble with accumulating text on the same line
        setStreamingText(accumulatedText);

        // Check if FINAL_ANSWER marker is present
        if (accumulatedText.includes("FINAL_ANSWER")) {
          // Split the text at the marker
          let [streamingPart, jsonPart] = accumulatedText.split("FINAL_ANSWER");
          streamingPart = streamingPart.trim();
          // Update the streaming bubble to show only text before FINAL_ANSWER
          setStreamingText(streamingPart);

          try {
            const finalData = JSON.parse(jsonPart.trim());
            // Append a new bubble for the final answer with a different background
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                content: finalData.final_response,
                isFinal: true,
              },
            ]);
            isFinalResponse = true; // Stop reading further
          } catch (e) {
            // JSON might be incomplete, continue accumulating
            console.log("Incomplete JSON, continuing accumulation...", e);
          }
        }
      }

      // Update session id state if new one was extracted
      setSessionId(newSessionId);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: "Error occurred." },
      ]);
      setStreamingText("");
      setLoading(false);
      toast.error(`Chat failed: ${error.message}`, { autoClose: 3000 });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-900 text-white">
      {/* Fixed-top section with Redis key and navigation buttons */}
      <div className="fixed-top bg-slate-800 p-3">
        <div className="flex items-center justify-between">
          <div>Redis Key: {localStorage.getItem("redis_key")}</div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                setSessionId("");
                setMessages([]);
              }}
              className="px-4 py-2 bg-red-500 rounded hover:bg-red-300 text-white"
            >
              Create new instance of chat
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("redis_key", "");
                navigate("/upload");
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-300 rounded text-white"
            >
              Add new File
            </button>
          </div>
        </div>
      </div>

      {/* Chat messages container */}
      <div className="flex-1 overflow-auto p-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg p-3 max-w-lg break-words ${
                msg.sender === "user"
                  ? "bg-blue-500"
                  : msg.isFinal
                  ? "bg-green-500"
                  : "bg-gray-700"
              }`}
            >
              {msg.sender === "bot" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Streaming bubble: shows live accumulated text on the same line */}
        {streamingText && (
          <div className="mb-4 flex justify-start">
            <div className="rounded-lg p-3 max-w-lg break-words bg-gray-700">
              <ReactMarkdown>{streamingText}</ReactMarkdown>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom input bar */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your query here..."
            className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white resize-none"
            rows="2"
          />
          <button
            onClick={() => handleSendMessage(message)}
            disabled={loading}
            className="px-4 py-2 rounded-r-lg bg-[#1ED760] font-bold text-white tracking-widest uppercase hover:bg-[#21e065] transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
      {/* Uncomment below if you have ShootingStars and StarsBackground components */}
      {/* <ShootingStars minDelay={1000} maxDelay={3000} />
      <StarsBackground /> */}
    </div>
  );
};

export default Chat;
