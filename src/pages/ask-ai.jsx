import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AskAI = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStartOver = () => {
        navigate('/automate');
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        setTimeout(() => {
            const aiMessage = {
                role: 'assistant',
                content: "Here's a recommended PC build tailored to your needs. This setup balances performance, value, and future-proofing, ensuring smooth performance for your chosen tasks. All parts are compatible, and the build can be upgraded easily later on. If you want adjustments—like a lower budget, RGB theme, smaller case, or brand preferences—just let me know!"
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col">
            {/* Header - Always Fixed */}
            <div className="p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-pink-500 text-3xl font-bold">AutoBuild PC</h1>
                    <button 
                        onClick={handleStartOver}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Start Over  
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500 ease-in-out">
                        <h2 className="text-2xl font-semibold text-center mb-8">
                            Ask me about your build!
                        </h2>
                        
                        <div className="w-full max-w-2xl">
                            <div className="flex items-center gap-4 bg-gray-800 rounded-full px-6 py-4">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask AI"
                                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="text-pink-500 hover:text-pink-400 disabled:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-8 py-4 parts-scrollbar transition-all duration-500 ease-in-out">
                            <div className="max-w-7xl mx-auto space-y-6">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                    >
                                        <div
                                            className={`max-w-3xl rounded-lg p-4 ${
                                                message.role === 'user'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-900 text-gray-200'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <div className="flex space-x-2">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-800 transition-all duration-500 ease-in-out">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center gap-4 bg-gray-800 rounded-full px-6 py-4">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask AI"
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="text-pink-500 hover:text-pink-400 disabled:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AskAI;