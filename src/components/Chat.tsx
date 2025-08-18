"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Pause, Play } from "lucide-react";
import {
  Send,
  Bot,
  User,
  Lightbulb,
  BookOpen,
  Shield,
  HelpCircle,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const Chat = () => {
  const OLLAMA_CONFIG = {
    baseUrl: "http://127.0.0.1:11434",
    model: "deepseek-r1:1.5b",
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 200,
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant powered by DeepSeek. I can help you with digital literacy, cybersecurity, and general questions. What would you like to learn about today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [limitMessage, setLimitMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll if last message is not the streaming-temp
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id !== "streaming-temp") {
      scrollToBottom();
    }
  }, [messages]);

  const quickQuestions = [
    "What is cybersecurity?",
    "How do I create a strong password?",
    "What is phishing?",
    "How to stay safe online?",
    "What is digital literacy?",
    "How do I protect my privacy?",
  ];

  const getAIResponse = useCallback(
    async (userMessage: string, abortSignal: AbortSignal): Promise<string> => {
      try {
        const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OLLAMA_CONFIG.model,
            prompt: `You are an AI assistant specialized in digital literacy and cybersecurity education. Please provide helpful, accurate, and educational responses. Focus on being informative while keeping the language accessible.

User question: ${userMessage}

Response:`,
            stream: true, // Enable streaming
            options: {
              temperature: OLLAMA_CONFIG.temperature,
              top_p: OLLAMA_CONFIG.topP,
              max_tokens: OLLAMA_CONFIG.maxTokens,
            },
          }),
          signal: abortSignal,
        });

        if (!response.body) {
          throw new Error("No response body.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let fullResponse = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Ollama sends JSON per line
          for (const line of chunk.trim().split("\n")) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;

                // Optional: live update here if you want typing effect
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.id === "streaming-temp") {
                    return [
                      ...prev.slice(0, -1),
                      { ...last, text: fullResponse },
                    ];
                  } else {
                    return [
                      ...prev,
                      {
                        id: "streaming-temp",
                        text: data.response,
                        sender: "ai",
                        timestamp: new Date(),
                      },
                    ];
                  }
                });
              }
            } catch (err) {
              console.error("Error parsing stream chunk:", err);
            }
          }
        }

        // Replace temp message with final version
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== "streaming-temp"),
          {
            id: Date.now().toString(),
            text: fullResponse,
            sender: "ai",
            timestamp: new Date(),
          },
        ]);

        return fullResponse || "Hmm... I didn't receive any text.";
      } catch (error: any) {
        if (error.name === "AbortError") {
          return "[Response was paused and cancelled.]";
        }
        console.error("Streaming error:", error);
        return "There was a problem generating the response.";
      }
    },
    []
  );

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;
    if (requestCount >= 5) {
      setLimitMessage(
        "You have reached the maximum of 5 requests. Please try again later."
      );
      return;
    }

    if (isPaused) {
      setPendingMessage(inputText);
      setInputText("");
      return;
    }

    setLimitMessage("");
    setRequestCount((prev) => prev + 1);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText("");
    setIsTyping(true);

    // Create a new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // If paused while waiting, do not proceed
      if (isPaused) {
        setIsTyping(false);
        abortController.abort();
        setPendingMessage(currentInput);
        return;
      }
      const aiResponseText = await getAIResponse(
        currentInput,
        abortController.signal
      );

      // If paused after response, do not show
      if (
        isPaused ||
        aiResponseText === "[Response was paused and cancelled.]"
      ) {
        setIsTyping(false);
        setPendingMessage(currentInput);
        return;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I encountered an error while processing your request. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-screen flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Back Button */}
              <button
                onClick={() => window.history.back()}
                className="mr-3 px-2 py-1 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center"
                title="Back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  AI Learning Assistant
                </h1>
              </div>
            </div>
            <button
              onClick={async () => {
                if (isPaused && pendingMessage) {
                  setIsPaused(false);
                  setInputText("");
                  // Resume: send the pending message
                  const userMessage: Message = {
                    id: Date.now().toString(),
                    text: pendingMessage,
                    sender: "user",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, userMessage]);
                  setPendingMessage(null);
                  setIsTyping(true);
                  setRequestCount((prev) => prev + 1);
                  const abortController = new AbortController();
                  abortControllerRef.current = abortController;
                  try {
                    const aiResponseText = await getAIResponse(
                      pendingMessage,
                      abortController.signal
                    );
                    if (
                      !isPaused &&
                      aiResponseText !== "[Response was paused and cancelled.]"
                    ) {
                      const aiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: aiResponseText,
                        sender: "ai",
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, aiResponse]);
                    }
                  } catch (error) {
                    console.error("Error getting AI response:", error);
                    const errorResponse: Message = {
                      id: (Date.now() + 1).toString(),
                      text: "I apologize, but I encountered an error while processing your request. Please try again.",
                      sender: "ai",
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorResponse]);
                  } finally {
                    setIsTyping(false);
                    abortControllerRef.current = null;
                  }
                } else {
                  setIsPaused((prev) => {
                    const newPaused = !prev;
                    if (newPaused && abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }
                    return newPaused;
                  });
                }
              }}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium border transition-colors ${
                isPaused
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
              title={isPaused ? "Resume Chat" : "Pause Chat"}
            >
              {isPaused ? (
                <Play className="h-4 w-4 mr-1" />
              ) : (
                <Pause className="h-4 w-4 mr-1" />
              )}
              {isPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === "ai" && (
                    <Bot className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  )}
                  {message.sender === "user" && (
                    <User className="h-4 w-4 text-white mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              Quick Questions to Get Started
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                >
                  <HelpCircle className="h-4 w-4 inline mr-2 text-blue-600" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask me anything about digital literacy or cybersecurity..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPaused || requestCount >= 5}
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !inputText.trim() || isTyping || isPaused || requestCount >= 5
              }
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {limitMessage && (
            <div className="mt-2 text-sm text-red-600">{limitMessage}</div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center text-xs text-gray-500">
              <BookOpen className="h-3 w-3 mr-1" />
              Powered by DeepSeek via Ollama
            </span>
            <span className="inline-flex items-center text-xs text-gray-500">
              <Shield className="h-3 w-3 mr-1" />
              Running locally for privacy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
