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
                            '\n\nYou can ask me questions about this build, suggest alternatives, compatibility concerns, or performance expectations. I\'ll provide bulleted responses when appropriate.',
                        hasBullets: true
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
        if (lowerText.includes("bad") || lowerText.includes("terrible") || lowerText.includes("poor") || lowerText.includes("problem") || lowerText.includes("slow") || lowerText.includes("incompatible") || lowerText.includes("bottleneck")) {
            return 'bad';
        }
        // GOOD keywords
        else if (lowerText.includes("good") || lowerText.includes("great") || lowerText.includes("excellent") || lowerText.includes("fast") || lowerText.includes("awesome") || lowerText.includes("solid") || lowerText.includes("compatible") || lowerText.includes("recommend")) {
            return 'good';
        }
        // Everything else is neutral
        else {
            return 'neutral';
        }
    };

    // Format AI response with bullet points
    const formatAIResponse = (response) => {
        // Check if response contains bullet points or needs formatting
        const lines = response.split('\n');
        let hasBullets = false;
        
        // Check for bullet indicators
        for (const line of lines) {
            if (line.trim().startsWith('•') || 
                line.trim().startsWith('-') || 
                line.includes('Compatibility Score:') ||
                line.includes('GUIDE:') ||
                line.includes('Upgrade Priority:') ||
                line.includes('Value Assessment:')) {
                hasBullets = true;
                break;
            }
        }
        
        if (!hasBullets) {
            // Check for JSON-like response
            try {
                const parsed = JSON.parse(response);
                if (parsed.detailed_answer) {
                    // Format JSON response with bullets
                    let formatted = '';
                    if (parsed.direct_answer && parsed.direct_answer !== 'N/A') {
                        formatted += `**${parsed.direct_answer}**\n\n`;
                    }
                    if (parsed.detailed_answer) {
                        const detailedLines = parsed.detailed_answer.split('\n');
                        formatted += detailedLines.map(line => {
                            if (line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
                                return '• ' + line.trim().replace(/^-|\d+\./, '').trim();
                            }
                            return line;
                        }).join('\n');
                    }
                    return { content: formatted, hasBullets: true };
                }
            } catch (e) {
                // Not JSON, continue with regular formatting
            }
        }
        
        // Format bullets properly
        const formattedLines = lines.map(line => {
            let trimmed = line.trim();
            
            // Convert various bullet styles to consistent •
            if (trimmed.startsWith('- ')) {
                return '• ' + trimmed.substring(2);
            } else if (/^\d+\.\s/.test(trimmed)) {
                return '• ' + trimmed.replace(/^\d+\.\s/, '');
            } else if (trimmed.startsWith('* ')) {
                return '• ' + trimmed.substring(2);
            }
            
            return line;
        });
        
        return { 
            content: formattedLines.join('\n'), 
            hasBullets: hasBullets || response.includes('•') || response.includes('- ')
        };
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { 
            role: 'user', 
            content: inputValue,
            hasBullets: false
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Transform the build data
        const transformBuildFormat = (buildData) => {
            if (!buildData || !buildData.parts) return {};

            const transformedBuild = {};
            buildData.parts.forEach(part => {
                const partTypeKey = part.partType.toLowerCase().replace(' ', '_');
                const typeMap = {
                    'cpu': 'cpu', 'motherboard': 'motherboard', 'ram': 'ram', 'gpu': 'gpu',
                    'cpu_cooler': 'cpu_cooler', 'cpu cooler': 'cpu_cooler', 'storage': 'storage',
                    'psu': 'psu', 'power supply': 'psu', 'pc_case': 'pc_case', 'case': 'pc_case'
                };
                const backendKey = typeMap[partTypeKey] || partTypeKey;
                transformedBuild[backendKey] = part.name;
            });

            return transformedBuild;
        };

        // Prepare request data
        const requestData = {
            question: inputValue,
            build: transformBuildFormat(currentBuild)
        };

        console.log('Sending to backend:', requestData);

        try {
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

                let aiResponse = '';
                let hasBullets = false;

                if (result.success && result.message) {
                    const message = result.message;
                    
                    // Handle different response formats
                    if (typeof message === 'object') {
                        if (message.format === 'bulleted' || message.has_bullets) {
                            aiResponse = message.content;
                            hasBullets = true;
                        } else if (message.format === 'qa' && message.direct_answer) {
                            // For Q&A format
                            aiResponse = `${message.direct_answer}\n\n${message.detailed_answer}`;
                            hasBullets = message.has_bullets || false;
                        } else if (message.content) {
                            aiResponse = message.content;
                            hasBullets = message.has_bullets || false;
                        }
                    } else if (typeof message === 'string') {
                        aiResponse = message;
                        // Check for bullet points in string
                        hasBullets = message.includes('•') || 
                                    message.includes('- ') || 
                                    /^\s*\d+\.\s+/m.test(message) ||
                                    message.includes('Compatibility Score:') ||
                                    message.includes('GUIDE:') ||
                                    message.includes('Upgrade Priority:') ||
                                    message.includes('Value Assessment:');
                    }
                } else {
                    aiResponse = "I couldn't process your question. Please try again.";
                }

                // Fallback if no response
                if (!aiResponse) {
                    aiResponse = "I've processed your question about the PC build.";
                }

                const aiMessage = {
                    role: 'assistant',
                    content: aiResponse,
                    hasBullets: hasBullets,
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
            // Fallback response with bullets
            const aiMessage = {
                role: 'assistant',
                content: "I'm having trouble connecting to the AI service. Based on your components:\n\n" +
                        "• This appears to be a well-balanced build\n" +
                        "• Components seem compatible on paper\n" +
                        "• Consider checking specific compatibility details\n" +
                        "• For gaming, expect good 1440p performance",
                hasBullets: true,
                sentiment: 'neutral'
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

    // Render message content with bullet formatting
    const renderMessageContent = (content, hasBullets) => {
        if (!hasBullets) {
            return <p className="whitespace-pre-wrap">{content}</p>;
        }

        const lines = content.split('\n');
        return (
            <div className="space-y-1">
                {lines.map((line, index) => {
                    const trimmed = line.trim();
                    
                    // Check if line is a bullet point
                    const isBullet = trimmed.startsWith('•');
                    const isHeader = trimmed.includes(':') && !trimmed.startsWith('•') && 
                                    (trimmed.endsWith(':') || trimmed.includes('Score:') || 
                                     trimmed.includes('GUIDE:') || trimmed.includes('Priority:') ||
                                     trimmed.includes('Assessment:'));
                    
                    if (isHeader) {
                        return (
                            <div key={index} className="font-semibold text-lg text-pink-400 mt-3 mb-1">
                                {trimmed}
                            </div>
                        );
                    } else if (isBullet) {
                        const bulletText = trimmed.substring(1).trim();
                        // Check for sub-bullets (indented bullets)
                        const isSubBullet = line.startsWith('  •') || line.startsWith('    •');
                        
                        return (
                            <div key={index} className={`flex items-start ${isSubBullet ? 'ml-6' : ''}`}>
                                <span className="text-pink-400 mr-2 mt-1">•</span>
                                <span className="flex-1">{bulletText}</span>
                            </div>
                        );
                    } else if (trimmed === '') {
                        return <div key={index} className="h-3"></div>; // Empty line spacing
                    } else {
                        return (
                            <div key={index} className="whitespace-pre-wrap">
                                {line}
                            </div>
                        );
                    }
                })}
            </div>
        );
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
                                            {/* Message Content */}
                                            {renderMessageContent(message.content, message.hasBullets)}

                                            {/* Sentiment Badge */}
                                            {message.sentiment && (
                                                <div className="mt-3 pt-2 border-t border-gray-700">
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${message.sentiment === 'good' ? 'bg-green-500/20 text-green-400' :
                                                        message.sentiment === 'neutral' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {message.sentiment === 'good' ? 'Positive' :
                                                            message.sentiment === 'neutral' ? 'Neutral' :
                                                            'Concerns'}
                                                    </span>
                                                </div>
                                            )}
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

                        {/* Suggested Questions */}
                        <div className="flex flex-wrap justify-between gap-3 px-8 py-4">
                            {[
                                "Compatibity Score and Performance Score for this build",
                                "Software applications that is highly supported on this build?",
                                "Any compatibility issues?",
                                "How to improve performance?",
                                "Step-by-step assembly guide",
                                "Upgrade recommendations"
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
                                        placeholder="Ask AI about your build (I'll provide bulleted responses)..."
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