"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { processVoiceCommand } from "@/lib/voice/commandProcessor";
import { motion, AnimatePresence } from "framer-motion";

type SpeechRecognitionEventResult = {
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: SpeechRecognitionEventResult;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function VoiceCommandManager({ workspaceId }: { workspaceId: string }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = ((window as Record<string, unknown>).SpeechRecognition || (window as Record<string, unknown>).webkitSpeechRecognition) as SpeechRecognitionConstructor;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    let active = true;

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript.toLowerCase();
      setTranscript(text);

      const actionResult = processVoiceCommand(workspaceId, text);
      if (actionResult) {
        setFeedback(actionResult);
        setTimeout(() => setFeedback(null), 3000);
        setTranscript("");
        recognition.stop();
      }
    };

    recognition.onerror = () => {
      if (isListening && active) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      if (isListening && active) {
        try { recognition.start(); } catch {}
      }
    };

    if (isListening) {
      try { recognition.start(); } catch {}
    } else {
      recognition.stop();
    }

    return () => {
      active = false;
      recognition.stop();
    };
  }, [isListening, workspaceId]);

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
