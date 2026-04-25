"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { processVoiceCommand } from "@/lib/voice/commandProcessor";
import { motion, AnimatePresence } from "framer-motion";

export function VoiceCommandManager() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    let active = true;

    recognition.onresult = (event: any) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript.toLowerCase();
      setTranscript(text);

      const actionResult = processVoiceCommand(text);
      if (actionResult) {
        setFeedback(actionResult);
        setTimeout(() => setFeedback(null), 3000);
        setTranscript("");
        recognition.stop();
      }
    };

    recognition.onerror = () => {
      if (isListening && active) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognition.onend = () => {
      if (isListening && active) {
        try { recognition.start(); } catch(e) {}
      }
    };

    if (isListening) {
      try { recognition.start(); } catch (e) {}
    } else {
      recognition.stop();
    }

    return () => {
      active = false;
      recognition.stop();
    };
  }, [isListening]);

  return (
    <div className="fixed bottom-6 right-24 z-[100] flex items-center gap-3">
      <AnimatePresence>
        {transcript && isListening && (
          <motion.div
            key="voice-transcript"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-full bg-slate-800/80 px-3 py-1 text-[10px] text-white/60 backdrop-blur-md"
          >
            {transcript}
          </motion.div>
        )}
        {feedback && (
          <motion.div
            key="voice-feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsListening(!isListening)}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all ${
          isListening 
          ? "bg-rose-500 text-white animate-pulse" 
          : "bg-white/80 text-slate-600 backdrop-blur-md hover:bg-white"
        }`}
      >
        {isListening ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
    </div>
  );
}
