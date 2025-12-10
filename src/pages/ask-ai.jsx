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
        
        // GOOD keywords
        if (lowerText.includes("good") || lowerText.includes("great") || lowerText.includes("excellent") || lowerText.includes("fast") || lowerText.includes("awesome") || lowerText.includes("solid") || lowerText.includes("compatible") || lowerText.includes("recommend")) {
            return 'good';
        }
        // BAD keywords
        else if (lowerText.includes("bad") || lowerText.includes("terrible") || lowerText.includes("poor") || lowerText.includes("problem") || lowerText.includes("slow") || lowerText.includes("incompatible") || lowerText.includes("bottleneck")) {
            return 'bad';
        }
       
        // Everything else is neutral
        else {
            return 'neutral';
        }
    };

    // Extract YouTube video IDs from text
    const extractYouTubeLinks = (text) => {
        console.log('DEBUG: Extracting YouTube links from:', text.substring(0, 200));
        
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
        const matches = [];
        let match;
        
        while ((match = youtubeRegex.exec(text)) !== null) {
            const videoId = match[1];
            console.log('DEBUG: Found YouTube video ID:', videoId);
            
            // Check if it's a valid YouTube video ID format
            if (videoId && videoId.length === 11) {
                const alreadyCaptured = matches.some(m => m.id === videoId);
                if (!alreadyCaptured) {
                    matches.push({
                        id: videoId,
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        title: 'YouTube Tutorial'
                    });
                }
            }
        }
        
        // Also check for "Video Tutorials:" section
        if (text.includes('Video Tutorials:')) {
            const videoSection = text.split('Video Tutorials:')[1];
            if (videoSection) {
                const videoUrls = videoSection.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g);
                if (videoUrls) {
                    videoUrls.forEach(url => {
                        const id = url.split('v=')[1];
                        if (id && !matches.some(m => m.id === id)) {
                            matches.push({
                                id: id,
                                url: `https://www.youtube.com/watch?v=${id}`,
                                title: 'PC Building Tutorial'
                            });
                        }
                    });
                }
            }
        }
        
        console.log('DEBUG: Total YouTube links found:', matches.length);
        return matches;
    };

    // Fix image URLs
    const fixImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        if (!url.startsWith('http')) {
            return `https://${url}`;
        }
        return url;
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

        // Transform the build data with images and category
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
                transformedBuild[backendKey] = {
                    name: part.name,
                    image: part.image ? fixImageUrl(part.image) : null
                };
            });

            // Add category to the transformed build
            transformedBuild.category = buildData.category || 'Custom';

            return transformedBuild;
        };
        let category = JSON.parse(sessionStorage.getItem('category'));
        if (Array.isArray(category)) {
            category = category.join(',');
        }
        // Prepare request data
        const requestData = {
            question: inputValue,
            build: transformBuildFormat(currentBuild),
            category: category 
        };

        console.log('Sending to backend with category:', requestData);

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
                let youtubeLinks = [];

                if (result.success && result.message) {
                    const message = result.message;
                    
                    // Handle different response formats
                    if (typeof message === 'object') {
                        if (message.format === 'bulleted' || message.has_bullets) {
                            aiResponse = message.content;
                            hasBullets = true;
                            youtubeLinks = extractYouTubeLinks(message.content);
                        } else if (message.format === 'qa' && message.direct_answer) {
                            // For Q&A format
                            aiResponse = `${message.direct_answer}\n\n${message.detailed_answer}`;
                            hasBullets = message.has_bullets || false;
                            youtubeLinks = extractYouTubeLinks(message.detailed_answer);
                        } else if (message.content) {
                            aiResponse = message.content;
                            hasBullets = message.has_bullets || false;
                            youtubeLinks = extractYouTubeLinks(message.content);
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
                                    message.includes('Value Assessment:') ||
                                    message.includes('PC ASSEMBLY GUIDE:') ||
                                    message.includes('LEARNING PATH:') ||
                                    message.includes('Video Tutorials:');
                        
                        // Extract YouTube links
                        youtubeLinks = extractYouTubeLinks(message);
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
                    youtubeLinks: youtubeLinks,
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
                youtubeLinks: [],
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

    // Render YouTube video iframes
    const renderYouTubeVideos = (youtubeLinks) => {
        if (!youtubeLinks || youtubeLinks.length === 0) return null;
        
        return (
            <div className="mt-4 space-y-3">
                <div className="text-sm font-semibold text-pink-400 mb-2">
                    🎬 Helpful Tutorials
                </div>
                <div className="space-y-3">
                    {youtubeLinks.map((link, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                            <div className="relative pb-[56.25%]">
                                <iframe
                                    src={`https://www.youtube.com/embed/${link.id}`}
                                    title={link.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full"
                                ></iframe>
                            </div>
                            <div className="p-3">
                                <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1"
                                >
                                    <span>Watch on YouTube</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render message content with bullet formatting and YouTube videos
    const renderMessageContent = (content, hasBullets, youtubeLinks = []) => {
        return (
            <div className="space-y-3">
                {/* Text content */}
                <div>
                    {!hasBullets ? (
                        <p className="whitespace-pre-wrap">{content}</p>
                    ) : (
                        renderBulletedContent(content)
                    )}
                </div>
                
                {/* YouTube videos */}
                {renderYouTubeVideos(youtubeLinks)}
            </div>
        );
    };

    // Helper function to render bulleted content
    const renderBulletedContent = (content) => {
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
                                     trimmed.includes('Assessment:') || trimmed.includes('ASSEMBLY GUIDE:') ||
                                     trimmed.includes('LEARNING PATH:') || trimmed.includes('Video Tutorials:'));
                    
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
                    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                        // Bold text (like YES/NO answers)
                        const boldText = trimmed.substring(2, trimmed.length - 2);
                        return (
                            <div key={index} className="text-xl font-bold text-green-400 my-2">
                                {boldText}
                            </div>
                        );
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

    // Render build summary with images when no messages yet
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
                            {currentBuild.category && (
                                <div className="mt-2">
                                    <span className="inline-block bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                                        {currentBuild.category} Build
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            Build loaded from Parts List
                        </div>
                    </div>

                    {/* Parts List with Images */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 parts-scrollbar">
                        {currentBuild.parts.map((part, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Component Image */}
                                    {part.image ? (
                                        <div className="relative">
                                            <img
                                                src={fixImageUrl(part.image)}
                                                alt={part.name}
                                                className="w-10 h-10 object-cover rounded border border-gray-600"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `
                                                        <div class="w-10 h-10 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                                                            <span class="text-xs text-gray-400">${part.partType.charAt(0)}</span>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                            <span className="text-xs text-gray-400">
                                                {part.partType.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{part.name}</p>
                                        <p className="text-xs text-gray-500">{part.partType}</p>
                                    </div>
                                </div>
                                <div className="text-green-400 font-medium ml-2">${part.price}</div>
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
            {/* Header - Smaller */}
            <div className="px-8 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/">
                        <h1 className="text-pink-500 text-2xl font-bold">AutoBuild PC</h1>
                    </Link>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/lists')}
                            className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Back to Build
                        </button>
                        <button
                            onClick={handleStartOver}
                            className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area - More space for chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {messages.length === 1 ? (
                    // Initial State - Centered with Build Summary
                    <div className="flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500 ease-in-out">
                        <h2 className="text-2xl font-semibold text-center mb-8">
                            Ask me about your build!
                        </h2>
                        {renderBuildSummary()}
                    </div>
                ) : (
                    // Chat State - Optimized for more chat view
                    <>
                        {/* Chat Area - Made larger */}
                        <div className="flex-1 overflow-y-auto px-6 py-2 parts-scrollbar">
                            <div className="max-w-6xl mx-auto space-y-4">
                                {messages.slice(1).map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] rounded-xl p-5 relative ${
                                            message.role === 'user'
                                            ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
                                            : 'bg-gradient-to-r from-gray-900 to-black text-gray-200 border border-gray-800'
                                        }`}
                                        >
                                            {/* Message Content */}
                                            <div className="mb-2">
                                                {renderMessageContent(message.content, message.hasBullets, message.youtubeLinks)}
                                            </div>

                                            {/* Sentiment Badge - Smaller */}
                                            {message.sentiment && (
                                                <div className="mt-3 pt-3 border-t border-gray-700/50">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                        message.sentiment === 'good' ? 'bg-green-500/10 text-green-400' :
                                                        message.sentiment === 'neutral' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-red-500/10 text-red-400'
                                                    }`}>
                                                        {message.sentiment === 'good' ? '✅ Positive' :
                                                            message.sentiment === 'neutral' ? '⚪ Neutral' :
                                                            '⚠️ Concerns'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                                            <div className="flex space-x-2">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-2">Thinking...</p>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Suggested Questions - Smaller and more compact */}
                        <div className="px-6 py-3 border-t border-gray-800">
                            <div className="max-w-6xl mx-auto">
                                <div className="text-xs text-gray-500 mb-2">Quick Questions:</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                        "Compatibility Score",
                                        "Software recommendations",
                                        "Hidden issues?",
                                        "Assembly guide",
                                        "Upgrade path",
                                        "Power efficiency",
                                        "Overclocking tips",
                                        "Performance"
                                    ].map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setInputValue(question)}
                                            className="bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-xs transition-colors border border-gray-700 truncate"
                                            title={question}
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Input Area - More compact */}
                        <div className="px-6 py-4 border-t border-gray-800 bg-black/50">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex items-center gap-3 bg-gray-800/50 rounded-2xl px-5 py-3 border border-gray-700">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask AI about your build..."
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium px-5 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send
                                            </>
                                        )}
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