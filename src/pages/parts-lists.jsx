import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const PartsList = () => {
    const navigate = useNavigate();

    const [parts, setParts] = useState([
        { id: 1, partType: 'Case', name: 'NZXT H510', price: 1000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnoGTqcU2xyHXEhxyFY3Q_g9lnCheENYmzSQ&s' },
        { id: 2, partType: 'CPU', name: 'Intel i7-12700K', price: 8400, image: 'https://joebz.com/cdn/shop/products/Intel_Core_I7-12700K_1024x1024.png?v=1644287813' },
        { id: 3, partType: 'Motherboard', name: 'ASUS ROG Strix', price: 4600, image: 'https://dlcdnwebimgs.asus.com/gain/87C03001-78CC-4C5D-866A-9FC7199B6AF5/w717/h525' },
        { id: 4, partType: 'GPU', name: 'NVIDIA RTX 4070', price: 12130, image: '' },
        { id: 5, partType: 'RAM', name: 'Corsair Vengeance 16GB', price: 1250, image: '' },
        { id: 6, partType: 'CPU Cooler', name: 'Cooler Master Hyper 212', price: 1000, image: '' },
        { id: 7, partType: 'Storage', name: 'Samsung 970 EVO 1TB', price: 3460, image: '' },
        { id: 8, partType: 'Power Supply', name: 'EVGA 650W Gold', price: 3500, image: '' },
        { id: 9, partType: 'Case Fan', name: 'Noctua NF-A12', price: 1000, image: '' }
    ]);

    const [zoomedImage, setZoomedImage] = useState(null);

    const totalPrice = parts.reduce((sum, part) => sum + part.price, 0);

    const [liked, setLiked] = useState(false);

    return (
        <div className="h-screen bg-black text-white p-8 overflow-hidden flex flex-col">
            <Logo />
            {/* Main Container */}
            <div className="flex-1 max-w-7xl w-full mx-auto border border-gray-600 rounded-lg p-6 flex flex-col overflow-hidden">
                {/* Parts List Container */}
                <div className="flex-1 border border-gray-700 rounded-lg mb-6 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-semibold">Parts List</span>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="font-regular">Generate Again</span>
                        </button>
                    </div>

                    {/* Parts List - Scrollable */}
                    <div className="flex-1 overflow-y-auto parts-scrollbar">
                        {parts.map((part) => (
                            <div
                                key={part.id}
                                className="flex items-center justify-between px-4 py-3 border-b border-gray-800 hover:bg-gray-900 transition-colors"
                            >
                                {/* Left group: PartType + Image + Name */}
                                <div className="flex items-center gap-4">
                                    {/* Fixed width badge for alignment */}
                                    <span className="bg-gray-700 text-white px-3 py-2 rounded w-32 text-center text-sm">
                                        {part.partType}
                                    </span>

                                    {/* Image - Always in same position */}
                                    {part.image ? (
                                        <img
                                            src={part.image}
                                            alt={part.name}
                                            onClick={() => setZoomedImage(part.image)}
                                            className="w-12 h-12 object-cover rounded border border-gray-600 cursor-pointer hover:border-pink-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-12 h-12" /> // Placeholder to maintain spacing
                                    )}

                                    <span className="text-gray-300">{part.name}</span>
                                </div>

                                {/* Right group: Price */}
                                <div className="flex items-center gap-4">
                                    <span className="text-green-400 font-medium">₱ {part.price.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="flex items-center justify-between mb-6">
                    {/* Left group: Download + Heart */}
                    <div className="flex items-center gap-4">
                        <button
                            className="bg-transparent border border-white text-white font-semibold px-6 py-2 rounded hover:bg-white hover:text-black transition-colors duration-200 h-[46px]"
                        >
                            Download List
                        </button>

                        {/* Simple Heart Button */}
                        <button
                            onClick={() => setLiked(!liked)}
                            className="w-8 h-8 flex items-center justify-center transition-all duration-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={liked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-7 h-7 text-pink-500"
                            >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </button>

                    </div>

                    {/* Total Price */}
                    <div className="border border-green-500 text-green-400 px-6 py-2 rounded text-xl font-semibold h-[46px] flex items-center">
                        ₱ {totalPrice.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-4 max-w-7xl w-full mx-auto">
                <button
                    onClick={() => navigate('/automate')}
                    className="bg-transparent border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-pink-500 transition-colors duration-200">
                    Back
                </button>
                <button
                    onClick={() => navigate('/ask', { state: { parts: parts } })}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200">
                    Ask AI
                </button>
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-3xl max-h-screen">
                        <img
                            src={zoomedImage}
                            alt="Zoomed part"
                            className="max-w-full max-h-screen object-contain rounded-lg"
                        />
                        <button
                            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                            onClick={() => setZoomedImage(null)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PartsList;
