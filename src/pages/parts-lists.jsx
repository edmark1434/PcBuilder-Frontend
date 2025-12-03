import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const PartsList = () => {
    const navigate = useNavigate();
    const [allBuilds, setAllBuilds] = useState([]);
    const [currentBuildIndex, setCurrentBuildIndex] = useState(0);
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
    const [likedBuilds, setLikedBuilds] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [buildsCount, setBuildsCount] = useState({ current: 1, total: 0 });

    // Fix image URLs by adding https: prefix if needed
    const fixImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        return url;
    };

    // Format part type for consistent display
    const formatPartType = (partType) => {
        const typeMap = {
            'Cpu': 'CPU',
            'cpu': 'CPU',
            'Motherboard': 'Motherboard',
            'motherboard': 'Motherboard',
            'Ram': 'RAM',
            'ram': 'RAM',
            'Gpu': 'GPU',
            'gpu': 'GPU',
            'Cpu Cooler': 'CPU Cooler',
            'cpu_cooler': 'CPU Cooler',
            'Storage': 'Storage',
            'storage': 'Storage',
            'Psu': 'Power Supply',
            'psu': 'Power Supply',
            'Pc Case': 'Case',
            'pc_case': 'Case',
            'Case': 'Case'
        };
        return typeMap[partType] || partType;
    };

    useEffect(() => {
        const storedData = sessionStorage.getItem('builds');
        console.log('Stored data:', storedData); // Debug log

        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                console.log('Parsed data:', data); // Debug log

                // Check if we have the full response with builds array
                if (data && data.builds && Array.isArray(data.builds)) {
                    setAllBuilds(data.builds);
                    setBuildsCount({
                        current: 1,
                        total: data.builds.length
                    });

                    // Display first build
                    if (data.builds.length > 0) {
                        const firstBuild = data.builds[0];
                        // Directly use the parts array from the response
                        const formattedParts = firstBuild.parts.map(part => ({
                            ...part,
                            partType: formatPartType(part.partType),
                            image: fixImageUrl(part.image)
                        }));
                        setParts(formattedParts);
                        setTotalPrice(firstBuild.total_price);
                    }
                } else {
                    console.log('Invalid data format in session storage:', data);
                }
            } catch (error) {
                console.log('Error parsing session storage data:', error);
            }
        } else {
            console.log('No builds found in session storage');
        }
    }, []);
    const handleAskAI = async () => {
        const currentBuild = allBuilds[currentBuildIndex];
        sessionStorage.setItem('currentBuild', JSON.stringify(currentBuild));
        navigate('/ask');
    }
    const generateNextBuild = () => {
        if (allBuilds.length === 0) return;

        const nextIndex = (currentBuildIndex + 1) % allBuilds.length;
        setCurrentBuildIndex(nextIndex);

        const nextBuild = allBuilds[nextIndex];
        // Directly use the parts array from the response
        const formattedParts = nextBuild.parts.map(part => ({
            ...part,
            partType: formatPartType(part.partType),
            image: fixImageUrl(part.image)
        }));
        setParts(formattedParts);
        setTotalPrice(nextBuild.total_price);

        setBuildsCount(prev => ({
            ...prev,
            current: nextIndex + 1
        }));
    };

    const toggleLike = () => {
        const buildId = currentBuildIndex;

        if (likedBuilds.includes(buildId)) {
            setLikedBuilds(likedBuilds.filter(id => id !== buildId));
        } else {
            setLikedBuilds([...likedBuilds, buildId]);
        }
    };

    const handleDownload = () => {
        const currentBuild = allBuilds[currentBuildIndex];
        if (!currentBuild) return;

        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Part Type,Component Name,Price,Product Link\n";

        currentBuild.parts.forEach(part => {
            csvContent += `${formatPartType(part.partType)},"${part.name}",$${part.price},"${part.product}"\n`;
        });

        csvContent += `\nTotal Price,$${currentBuild.total_price}\n`;
        csvContent += `Build ${currentBuildIndex + 1} of ${allBuilds.length}\n`;

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pc-build-${currentBuildIndex + 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isLiked = likedBuilds.includes(currentBuildIndex);

    return (
        <div className="h-screen bg-black text-white p-8 overflow-hidden flex flex-col">
            <Logo />
            {/* Main Container */}
            <div className="flex-1 max-w-7xl w-full mx-auto border border-gray-600 rounded-lg p-6 flex flex-col overflow-hidden">
                {/* Build Counter */}
                <div className="mb-4 flex justify-between items-center">
                    {likedBuilds.length > 0 && (
                        <div className="text-pink-500 text-sm">
                            ❤️ {likedBuilds.length} build{likedBuilds.length !== 1 ? 's' : ''} liked
                        </div>
                    )}
                </div>

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
                            onClick={generateNextBuild}
                            disabled={allBuilds.length <= 1}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="font-regular">Generate Again</span>
                        </button>
                    </div>

                    {/* Parts List - Scrollable */}
                    <div className="flex-1 overflow-y-auto parts-scrollbar">
                        {parts.map((part, index) => (
                            <div
                                key={`${part.id}-${index}`}
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
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="w-12 h-12"></div>';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-12 h-12" /> // Placeholder to maintain spacing
                                    )}

                                    <span className="text-gray-300">{part.name}</span>
                                </div>

                                {/* Right group: Price */}
                                <div className="flex items-center gap-4">
                                    <span className="text-green-400 font-medium">$ {part.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    {/* Left group: Download + Heart */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDownload}
                            className="bg-transparent border border-white text-white font-semibold px-6 py-2 rounded hover:bg-white hover:text-black transition-colors duration-200 h-[46px]"
                        >
                            Download List
                        </button>

                        {/* Simple Heart Button */}
                        <button
                            onClick={toggleLike}
                            className="w-8 h-8 flex items-center justify-center transition-all duration-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={isLiked ? 'currentColor' : 'none'}
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
                        $ {totalPrice.toLocaleString()}
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
                    onClick={handleAskAI}
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
                    <button
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        onClick={() => setZoomedImage(null)}
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative max-w-3xl max-h-screen">
                        <img
                            src={zoomedImage}
                            alt="Zoomed part"
                            className="max-w-full max-h-screen object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PartsList;