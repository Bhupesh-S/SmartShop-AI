
import React, { useState, useRef, useEffect } from 'react';
//import { sendMessageToBotStream } from '../services/geminiService.js';
import { ChatIcon, CloseIcon, SendIcon, UserIcon } from './Icons.jsx';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I'm SmartShop AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await sendMessageToBotStream(input);
      let botResponse = '';
      setMessages(prev => [...prev, { sender: 'bot', text: '' }]);
      
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        botResponse += chunkText;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = botResponse;
            return newMessages;
        });
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Toggle Chatbot"
        >
          {isOpen ? <CloseIcon className="h-8 w-8" /> : <ChatIcon className="h-8 w-8" />}
        </button>
      </div>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
          <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">SmartShop AI</h3>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <ChatIcon className="h-5 w-5" />
                  </div>
                )}
                <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\\n/g, '<br />') }} />
                </div>
                {msg.sender === 'user' && (
                   <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length -1].sender === 'user' && (
               <div className="flex items-start gap-3">
                   <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <ChatIcon className="h-5 w-5" />
                  </div>
                   <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                      <div className="flex items-center justify-center space-x-1">
                          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
                      </div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="w-full pr-12 py-2 pl-4 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-200"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300"
                disabled={isLoading}
                aria-label="Send message"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;