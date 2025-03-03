import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(""); // Optional session id state
  const [messages, setMessages] = useState([]); // Conversation history
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const redisKey = localStorage.getItem("redis_key");
    if (!redisKey) {
      toast.error("Redis key not found. Please upload a file first.");
      navigate("/");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    // Append the user's message to the chat
    const userMessage = { sender: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    setMessage(""); // Clear the input

    const payload = new FormData();
    payload.append("redis_key", redisKey);
    payload.append("message", message);
    if (sessionId) {
      payload.append("session_id", sessionId);
    }

    try {
      const response = await fetch("https://zingapi.agino.tech/chat", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // Create a reader to process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedText = "";

      // Add a placeholder for the bot's response
      setMessages((prev) => [...prev, { sender: "bot", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });

        // Remove all "data:" tokens and extra whitespace
        const cleanedChunk = chunk.replace(/data:\s*/g, "");
        accumulatedText += cleanedChunk;

        // Check if the final marker "FINAL_ANSWER" is present
        if (accumulatedText.includes("FINAL_ANSWER")) {
          // Split the accumulated text at the marker
          const [_, afterMarker] = accumulatedText.split("FINAL_ANSWER");
          try {
            // Parse the JSON part that comes after the marker
            const finalData = JSON.parse(afterMarker.trim());
            if (finalData.session_id) {
              setSessionId(finalData.session_id);
            }
            // Update the bot's message with only the "final_response"
            setMessages((prev) => {
              const updated = [...prev];
              if (
                updated.length &&
                updated[updated.length - 1].sender === "bot"
              ) {
                updated[updated.length - 1].content =
                  finalData.final_response || "";
              }
              return updated;
            });
            console.log("Final JSON data:", finalData);
          } catch (e) {
            console.error("Error parsing final JSON:", e);
          }
          break;
        } else {
          // Incrementally update the bot's message with the streamed content
          setMessages((prev) => {
            const updated = [...prev];
            if (
              updated.length &&
              updated[updated.length - 1].sender === "bot"
            ) {
              updated[updated.length - 1].content = accumulatedText;
            }
            return updated;
          });
        }
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(`Chat failed: ${err.message}`, { autoClose: 3000 });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-900 text-white">
      {/* Fixed-top section with Redis key and buttons in one line */}
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
              className={`rounded-lg p-3 max-w-xs break-words ${
                msg.sender === "user" ? "bg-blue-500" : "bg-gray-700"
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
            onClick={handleSendMessage}
            disabled={loading}
            className="px-4 py-2 rounded-r-lg bg-[#1ED760] font-bold text-white tracking-widest uppercase hover:bg-[#21e065] transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
