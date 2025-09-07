import React, { useState } from 'react'
import { IoSendSharp } from "react-icons/io5";
import { IoMdMic } from "react-icons/io";

const TypingBox = ({ saveAiMessage, saveUserMessage }) => {
  const [message, setMessage] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const SILENCE_THRESHOLD = 5000; // 5 seconds

  const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handelSend = async () => {
    if (!message.trim()) return;

    // Show user message in UI
    saveUserMessage(message);

    try {
      const resp = await fetch(`${backendBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await resp.json();
      const reply = data?.reply || "Sorry, I couldn't get a response.";
      saveAiMessage(reply);
    } catch (err) {
      console.error("Chat API error:", err);
      saveAiMessage("Sorry, I'm having trouble responding right now.");
    }

    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handelSend();
    }
  };

  const startSpeechRecognition = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setMessage(transcript);
      resetSilenceTimer(transcript);
    };

    recognition.start();
    setRecognition(recognition);
  };

  const stopSpeechRecognition = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
  };

  const resetSilenceTimer = (transcript) => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }

    setSilenceTimer(setTimeout(() => {
      if (transcript.trim() !== '') {
        saveUserMessage(transcript);
        handelSend();
      }
    }, SILENCE_THRESHOLD));
  };

  const handelVoice = () => {
    if (recognition) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  return (
    <div className=''>
      <div className='w-full bg-white max-w-screen-xl flex border-2 my-5 p-2 rounded-lg fixed bottom-0'>
        <input
          type="text"
          className='focus:ring-0 w-11/12 rounded-xl border-none'
          placeholder='Type a message'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className='flex justify-space'>
          {/* Toggle speech input if needed */}
          {/* <i className='my-auto text-xl m-3 hover:bg-gray-200 p-3 rounded-lg' onClick={handelVoice}><IoMdMic /></i> */}
          <i
            className='my-auto text-xl m-3 hover:bg-gray-200 p-3 rounded-lg'
            onClick={handelSend}
          >
            <IoSendSharp />
          </i>
        </div>
      </div>
    </div>
  );
};

export default TypingBox;
