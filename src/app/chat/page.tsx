
"use client";
import type { FC } from 'react'; // Added FC for ClientTimeRenderer type
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircle, Mic, Send, User, Volume2, VolumeX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { InteractiveLLMChatInput, InteractiveLLMChatOutput } from '@/ai/flows/interactive-llm-chat';
import { interactiveLLMChat } from '@/ai/flows/interactive-llm-chat';
import { useSTT } from '@/hooks/use-stt';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string; // Changed to ISO string
}

// Client-side renderer for timestamps to avoid hydration issues
const ClientTimeRenderer: FC<{ timestamp: string; formatter: (ts: string) => string | JSX.Element }> = ({ timestamp, formatter }) => {
  const [renderedTime, setRenderedTime] = useState<string | JSX.Element | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    setRenderedTime(formatter(timestamp));
  }, [timestamp, formatter]);

  // Render a placeholder or basic format until client-side rendering kicks in
  return <>{renderedTime || new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }</>;
};


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { isListening, transcript, startListening, stopListening, error: sttError } = useSTT();

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (sttError) {
      toast({ title: "STT Error", description: sttError, variant: "destructive" });
    }
  }, [sttError, toast]);

  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if(scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speak = (text: string) => {
    if (!isTTSEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const currentInput = inputValue.trim();
    if (!currentInput) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentInput,
      sender: 'user',
      timestamp: new Date().toISOString(), // Use ISO string
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: InteractiveLLMChatInput = { query: currentInput };
      const result: InteractiveLLMChatOutput = await interactiveLLMChat(input);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'ai',
        timestamp: new Date().toISOString(), // Use ISO string
      };
      setMessages((prev) => [...prev, aiMessage]);
      speak(result.response);

    } catch (err) {
      console.error("Error in LLM chat:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive",
      });
       const aiErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date().toISOString(), // Use ISO string
      };
      setMessages((prev) => [...prev, aiErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-primary" /> Interactive LLM Chat
        </h1>
        <div className="flex items-center space-x-2">
          <Button variant={isTTSEnabled ? "secondary" : "outline"} size="icon" onClick={() => setIsTTSEnabled(!isTTSEnabled)} aria-label="Toggle Text-to-Speech">
            {isTTSEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
           <span className="text-sm text-muted-foreground hidden sm:inline">TTS</span>
        </div>
      </div>
      
      <Card className="flex-1 flex flex-col shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Chat with PFsense</CardTitle>
          <CardDescription>Ask about network status, security posture, or potential improvements.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'}`}>
                       <ClientTimeRenderer 
                          timestamp={msg.timestamp} 
                          formatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                       />
                    </p>
                  </div>
                  {msg.sender === 'user' && (
                     <Avatar className="h-8 w-8">
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isLoading && messages[messages.length -1]?.sender === 'user' && (
                <div className="flex items-end gap-2 justify-start">
                   <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                  <div className="max-w-[70%] rounded-lg px-4 py-2 bg-muted text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Button type="button" variant={isListening ? "destructive" : "outline"} size="icon" onClick={handleToggleListen} aria-label={isListening ? "Stop Listening" : "Start Listening"} disabled={isLoading}>
              <Mic className={isListening ? "animate-pulse" : ""} />
            </Button>
            <Input
              type="text"
              placeholder="Type your message or use microphone..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || isListening}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" aria-label="Send message">
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
