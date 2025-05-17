"use client";

import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string; // Typically SpeechRecognitionErrorCode but simplified to string
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

type UseSTTReturn = {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
};

export const useSTT = (): UseSTTReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsSupported(true);
        const recogInstance = new SpeechRecognitionAPI() as SpeechRecognition; // Type assertion
        recogInstance.continuous = true;
        recogInstance.interimResults = true;
        recogInstance.lang = 'en-US';
        setRecognition(recogInstance);
      } else {
        setIsSupported(false);
        setError("Speech recognition is not supported in this browser.");
      }
    }
  }, []);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    setTranscript(finalTranscript || interimTranscript); // Prefer final, fallback to interim
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(`Speech recognition error: ${event.error} - ${event.message}`);
    setIsListening(false);
  }, []);

  const handleEnd = useCallback(() => {
    // Only set isListening to false if it wasn't manually stopped
    // This handles cases where listening stops due to no speech or errors
    // If startListening is called again, it will restart.
    // For continuous listening, we might not want to setIsListening(false) here
    // but the current design is start/stop button.
    // setIsListening(false);
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd; // Called when speech recognition service has disconnected.

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (isListening) { // ensure stop if component unmounts while listening
        recognition.stop();
      }
    };
  }, [recognition, handleResult, handleError, handleEnd, isListening]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      setError(null);
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
         // Handle cases like "recognition already started"
        console.error("Error starting recognition:", e);
        setError(e instanceof Error ? e.message : String(e));
        setIsListening(false);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return { isListening, transcript, startListening, stopListening, error, isSupported };
};
