import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AskAI = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentBuild, setCurrentBuild] = useState(null);
    const messagesEndRef = useRef(null);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    // Load the saved build from session storage on component mount
    useEffect(() => {
        const savedBuild = sessionStorage.getItem('currentBuild');
        if (savedBuild) {
            try {
                const buildData = JSON.parse(savedBuild);
                setCurrentBuild(buildData);

                // Add initial system message with build details
                if (buildData.parts && buildData.total_price) {
                    const initialMessage = {
                        role: 'assistant',
                        content: `I've loaded your PC build (Total: $${buildData.total_price}). Here are the components:\n\n` +
                            buildData.parts.map(part =>
                                `• ${part.partType}: ${part.name} - $${part.price}`
                            ).join('\n') +
                            '\n\nYou can ask me questions about this build, suggest alternatives, compatibility concerns, or performance expectations.'
                    };
                    setMessages([initialMessage]);
                }
            } catch (error) {
                console.error('Error parsing saved build:', error);
            }
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStartOver = () => {
        navigate('/automate');
    };

    const determineSentiment = (text) => {
        const lowerText = text.toLowerCase();

        // BAD keywords
        if (lowerText.includes("bad") || lowerText.includes("terrible") || lowerText.includes("poor") || lowerText.includes("problem") || lowerText.includes("slow")) {
            return 'bad';
        }
        // GOOD keywords
        else if (lowerText.includes("good") || lowerText.includes("great") || lowerText.includes("excellent") || lowerText.includes("fast") || lowerText.includes("awesome") || lowerText.includes("solid")) {
            return 'good';
        }
        // Everything else is neutral
        else {
            return 'neutral';
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Transform the build data to match backend format
        const transformBuildFormat = (buildData) => {
            if (!buildData || !buildData.parts) return {};

            const transformedBuild = {};

            // Map each part type to its name
            buildData.parts.forEach(part => {
                const partTypeKey = part.partType.toLowerCase().replace(' ', '_');

                // Handle special cases for part type mapping
                const typeMap = {
                    'cpu': 'cpu',
                    'motherboard': 'motherboard',
                    'ram': 'ram',
                    'gpu': 'gpu',
                    'cpu_cooler': 'cpu_cooler',
                    'cpu cooler': 'cpu_cooler',
                    'storage': 'storage',
                    'psu': 'psu',
                    'power supply': 'psu',
                    'pc_case': 'pc_case',
                    'case': 'pc_case'
                };

                const backendKey = typeMap[partTypeKey] || partTypeKey;
                transformedBuild[backendKey] = part.name;
            });

            return transformedBuild;
        };

        // Prepare the data in the format your backend expects
        const requestData = {
            question: inputValue,
            build: transformBuildFormat(currentBuild)
        };

        console.log('Sending to backend:', requestData);

        try {
            // Send message to your API endpoint
            const response = await fetch(`${BASE_URL}/askAI`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('API response:', result);

                // Handle different response formats
                let aiResponse = "I've processed your question about the PC build.";

                if (result.message) {
                    // If response has a message object with short_sentence_answer and detailed_answer
                    if (typeof result.message === 'object' && result.message.detailed_answer) {
                        aiResponse = result.message.detailed_answer;
                        // You could also show both: aiResponse = `${result.message.short_sentence_answer}\n\n${result.message.detailed_answer}`;
                    }
                    // If message is a string
                    else if (typeof result.message === 'string') {
                        aiResponse = result.message;
                    }
                } else if (result.response) {
                    aiResponse = result.response;
                } else if (result.answer) {
                    aiResponse = result.answer;
                } else if (result.detailed_answer) {
                    aiResponse = result.detailed_answer;
                } else if (result.short_sentence_answer) {
                    aiResponse = result.short_sentence_answer;
                }

                const aiMessage = {
                    role: 'assistant',
                    content: aiResponse,
                    sentiment: determineSentiment(aiResponse)
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                const errorText = await response.text();
                console.error('API error:', errorText);
                throw new Error('API request failed');
            }
        } catch (err) {
            console.log('Error:', err);
            // Fallback to simulated response if API fails
            const aiMessage = {
                role: 'assistant',
                content: "I'm having trouble connecting to the AI service. Based on your components, this looks like a solid build. The RTX 3060 should handle 1440p gaming well, but for 4K gaming you might need to lower settings in demanding titles.",
                sentiment: determineSentiment("I'm having trouble connecting to the AI service. Based on your components, this looks like a solid build. The RTX 3060 should handle 1440p gaming well, but for 4K gaming you might need to lower settings in demanding titles.")
            };
            setMessages(prev => [...prev, aiMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Render build summary when no messages yet
    const renderBuildSummary = () => {
        if (!currentBuild) {
            return (
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-8">
                        No build data found
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Please generate a PC build first from the Parts List page.
                    </p>
                    <button
                        onClick={() => navigate('/lists')}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                        Go to Parts List
                    </button>
                </div>
            );
        }

        return (
            <div className="w-full max-w-2xl space-y-6">
                {/* Build Summary Card */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Your PC Build</h3>
                            <p className="text-gray-400">Total: <span className="text-green-400 font-semibold">${currentBuild.total_price}</span></p>
                        </div>
                        <div className="text-sm text-gray-500">
                            Build loaded from Parts List
                        </div>
                    </div>

                    {/* Parts List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 parts-scrollbar">
                        {currentBuild.parts.map((part, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                            {part.partType.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{part.name}</p>
                                        <p className="text-xs text-gray-500">{part.partType}</p>
                                    </div>
                                </div>
                                <div className="text-green-400 font-medium">${part.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ask AI Input */}
                <div className="flex items-center gap-4 bg-gray-800 rounded-full px-6 py-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about this build, alternatives, compatibility..."
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
        );
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col">
            {/* Header - Always Fixed */}
            <div className="p-8">
                <div className="flex items-center justify-between">
                    <Link to="/">
                        <h1 className="text-pink-500 text-3xl font-bold">AutoBuild PC</h1>
                    </Link>
                    <div className="flex items-center gap-6">
                        {/* {currentBuild && (
                            <div className="text-sm text-gray-400">
                                Build Total: <span className="text-green-400 font-semibold">${currentBuild.total_price}</span>
                            </div>
                        )} */}
                        <button
                            onClick={handleStartOver}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {messages.length === 0 ? (
                    // Initial State - Centered with Build Summary
                    <div className="flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500 ease-in-out">
                        <h2 className="text-2xl font-semibold text-center mb-8">
                            Ask me about your build!
                        </h2>

                        {renderBuildSummary()}
                    </div>
                ) : (
                    // Chat State - Messages + Input at Bottom
                    <>
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto px-8 py-4 parts-scrollbar transition-all duration-500 ease-in-out">
                            <div className="max-w-7xl mx-auto space-y-6">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                    >
                                        <div className={`max-w-3xl rounded-lg p-4 relative ${message.role === 'user'
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-gray-900 text-gray-200'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>

                                            <div className="flex flex-col">
                                                {message.sentiment && (
                                                    <span className={`mt-2 text-sm font-semibold ${message.sentiment === 'good' ? 'text-green-500' :
                                                        message.sentiment === 'neutral' ? 'text-yellow-400' :
                                                            'text-red-500'
                                                        }`}>
                                                        {message.sentiment === 'good' ? 'Good' :
                                                            message.sentiment === 'neutral' ? 'Neutral' :
                                                                'Bad'}
                                                    </span>
                                                )}
                                            </div>
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

                        {/* Suggested Questions - Move here */}
                        <div className="flex flex-wrap justify-between gap-3 px-8 py-4">
                            {[
                                "Is this build good for gaming?",
                                "Suggest cheaper alternatives",
                                "Any compatibility issues?",
                                "How to improve performance?"
                            ].map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInputValue(question)}
                                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-sm transition-colors border border-gray-700 text-left flex-1 min-w-[calc(50%-0.375rem)] lg:min-w-0"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>

                        {/* Input Area - Bottom */}
                        <div className="p-8 border-t border-gray-800 transition-all duration-500 ease-in-out">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center gap-4 bg-gray-800 rounded-full px-6 py-4">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask AI about your build..."
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