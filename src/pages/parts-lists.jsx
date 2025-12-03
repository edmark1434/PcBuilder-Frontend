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
    const [selectedPart, setSelectedPart] = useState(null);
    const [showPartModal, setShowPartModal] = useState(false);
    const [partDetails, setPartDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Base API URL - update this to match your backend
    const API_BASE_URL = 'http://localhost:8000/api';

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

    // Get API endpoint based on part type
    const getApiEndpoint = (partType, id) => {
        const endpoints = {
            'CPU': `/cpu/${id}`,
            'cpu': `/cpu/${id}`,
            'Case': `/pc-case/${id}`,
            'pc_case': `/pc-case/${id}`,
            'Pc Case': `/pc-case/${id}`,
            'CPU Cooler': `/cpu-cooler/${id}`,
            'cpu_cooler': `/cpu-cooler/${id}`,
            'RAM': `/ram/${id}`,
            'ram': `/ram/${id}`,
            'Storage': `/storage/${id}`,
            'storage': `/storage/${id}`,
            'GPU': `/gpu/${id}`,
            'gpu': `/gpu/${id}`,
            'Motherboard': `/motherboard/${id}`,
            'motherboard': `/motherboard/${id}`,
            'Power Supply': `/psu/${id}`,
            'psu': `/psu/${id}`
        };
        return endpoints[partType] || null;
    };

    // Fetch detailed part information
    const fetchPartDetails = async (part) => {
        try {
            setLoading(true);
            const endpoint = getApiEndpoint(part.partType, part.id);
            
            if (!endpoint) {
                console.log('No API endpoint for part type:', part.partType);
                setPartDetails(part); // Use basic part info if no endpoint
                return;
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setPartDetails(data);
        } catch (error) {
            console.error('Error fetching part details:', error);
            // Fallback to basic part info if fetch fails
            setPartDetails(part);
        } finally {
            setLoading(false);
        }
    };

    // Format specifications based on part type
    const renderSpecifications = () => {
        if (!partDetails) return null;

        const specs = [];

        switch (selectedPart?.partType.toLowerCase()) {
            case 'cpu':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Socket', value: partDetails.socket },
                    { label: 'Cores', value: partDetails.core_count },
                    { label: 'Base Clock', value: partDetails.base_clock ? `${partDetails.base_clock} GHz` : null },
                    { label: 'Boost Clock', value: partDetails.boost_clock ? `${partDetails.boost_clock} GHz` : null },
                    { label: 'TDP', value: partDetails.tdp },
                    { label: 'Max Memory', value: partDetails.max_memory },
                    { label: 'RAM Type', value: partDetails.ram_type },
                    { label: 'Integrated Graphics', value: partDetails.integrated_graphics }
                );
                break;

            case 'gpu':
            case 'GPU':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Chipset', value: partDetails.chipset },
                    { label: 'Memory', value: partDetails.memory ? `${partDetails.memory} GB` : null },
                    { label: 'Memory Type', value: partDetails.memory_type },
                    { label: 'Core Clock', value: partDetails.core_clock },
                    { label: 'Boost Clock', value: partDetails.boost_clock },
                    { label: 'TDP', value: partDetails.tdp },
                    { label: 'Interface', value: partDetails.interface },
                    { label: 'Length', value: partDetails.length ? `${partDetails.length} mm` : null }
                );
                break;
            case 'ram':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Speed', value: partDetails.speed },
                    { label: 'Modules', value: partDetails.modules },
                    { label: 'Form Factor', value: partDetails.form_factor },
                    { label: 'CAS Latency', value: partDetails.cas_latency },
                    { label: 'Voltage', value: partDetails.voltage },
                    { label: 'Timing', value: partDetails.timing },
                    { label: 'ECC', value: partDetails.ecc_registered }
                );
                break;

            case 'motherboard':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Socket', value: partDetails.socket_cpu },
                    { label: 'Form Factor', value: partDetails.form_factor },
                    { label: 'Chipset', value: partDetails.chipset },
                    { label: 'Max Memory', value: partDetails.memory_max },
                    { label: 'Memory Type', value: partDetails.memory_type },
                    { label: 'Memory Slots', value: partDetails.memory_slots },
                    { label: 'PCIe x16 Slots', value: partDetails.pcie_x16_slots },
                    { label: 'M.2 Slots', value: partDetails.m2_slots },
                    { label: 'SATA Ports', value: partDetails.sata_6gb_s }
                );
                break;

            case 'storage':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Capacity', value: partDetails.capacity_gb },
                    { label: 'Type', value: partDetails.type },
                    { label: 'Form Factor', value: partDetails.form_factor },
                    { label: 'Interface', value: partDetails.interface },
                    { label: 'NVMe', value: partDetails.is_nvme ? 'Yes' : 'No' },
                    { label: 'Cache', value: partDetails.cache_mb ? `${partDetails.cache_mb} MB` : null }
                );
                break;

            case 'cpu_cooler':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Model', value: partDetails.model },
                    { label: 'Height', value: partDetails.height ? `${partDetails.height} mm` : null },
                    { label: 'Fan RPM', value: partDetails.fan_rpm },
                    { label: 'Noise Level', value: partDetails.noise_level },
                    { label: 'CPU Socket', value: partDetails.cpu_socket },
                    { label: 'Water Cooled', value: partDetails.water_cooled ? 'Yes' : 'No' },
                    { label: 'Fanless', value: partDetails.fanless ? 'Yes' : 'No' }
                );
                break;

            case 'case':
            case 'pc_case':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Type', value: partDetails.type },
                    { label: 'Color', value: partDetails.color },
                    { label: 'Form Factor', value: partDetails.motherboard_form_factor },
                    { label: 'Power Supply', value: partDetails.power_supply },
                    { label: 'Max GPU Length', value: partDetails.maximum_video_card_length },
                    { label: 'Drive Bays', value: partDetails.drive_bays },
                    { label: 'Expansion Slots', value: partDetails.expansion_slots },
                    { label: 'Front Panel USB', value: partDetails.front_panel_usb }
                );
                break;

            case 'power supply':
            case 'psu':
                specs.push(
                    { label: 'Manufacturer', value: partDetails.manufacturer },
                    { label: 'Model', value: partDetails.model },
                    { label: 'Wattage', value: partDetails.wattage ? `${partDetails.wattage}W` : null },
                    { label: 'Efficiency', value: partDetails.efficiency_rating },
                    { label: 'Modular', value: partDetails.modular },
                    { label: 'Form Factor', value: partDetails.type },
                    { label: 'Fanless', value: partDetails.fanless ? 'Yes' : 'No' },
                    { label: 'PCIe Connectors', value: partDetails.pcie_6plus2pin_connectors },
                    { label: 'SATA Connectors', value: partDetails.sata_connectors }
                );
                break;

            default:
                // For unknown part types or fallback
                if (partDetails.manufacturer) {
                    specs.push({ label: 'Manufacturer', value: partDetails.manufacturer });
                }
                if (partDetails.model) {
                    specs.push({ label: 'Model', value: partDetails.model });
                }
                if (partDetails.part_number) {
                    specs.push({ label: 'Part Number', value: partDetails.part_number });
                }
                break;
        }

        return specs.filter(spec => spec.value !== null && spec.value !== undefined && spec.value !== '');
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

    const handlePartClick = async (part) => {
        setSelectedPart(part);
        setShowPartModal(true);
        setPartDetails(null); // Reset details before fetching new ones
        await fetchPartDetails(part);
    };

    const handleBuyClick = (productUrl) => {
        if (productUrl) {
            window.open(productUrl, '_blank', 'noopener,noreferrer');
        }
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
                                className="flex items-center justify-between px-4 py-3 border-b border-gray-800 hover:bg-gray-900 transition-colors cursor-pointer"
                                onClick={() => handlePartClick(part)}
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setZoomedImage(part.image);
                                            }}
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
                                    {/* Shop cart icon for quick buy */}
                                    {part.product && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBuyClick(part.product);
                                            }}
                                            className="text-gray-400 hover:text-pink-500 transition-colors p-1"
                                            title="View product"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
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

            {/* Part Details Modal */}
            {showPartModal && selectedPart && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPartModal(false)}
                >
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold">Part Details</h3>
                            <button
                                onClick={() => setShowPartModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Part Image */}
                                    {(partDetails?.image_url || selectedPart.image) && (
                                        <div className="mb-4 flex justify-center">
                                            <img
                                                src={partDetails?.image_url || selectedPart.image}
                                                alt={partDetails?.name || selectedPart.name}
                                                className="max-w-full h-48 object-contain rounded border border-gray-600 cursor-pointer"
                                                onClick={() => {
                                                    setShowPartModal(false);
                                                    setZoomedImage(partDetails?.image_url || selectedPart.image);
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Part Details */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm text-gray-400">Part Type</div>
                                            <div className="text-lg font-medium">{selectedPart.partType}</div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-400">Component Name</div>
                                            <div className="text-lg font-medium">{partDetails?.name || selectedPart.name}</div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-400">Price</div>
                                            <div className="text-2xl font-bold text-green-400">
                                                $ {partDetails?.price || selectedPart.price}
                                            </div>
                                        </div>

                                        {/* Specifications */}
                                        {renderSpecifications().length > 0 && (
                                            <div className="mt-6">
                                                <div className="text-sm text-gray-400 mb-3">Specifications</div>
                                                <div className="space-y-2">
                                                    {renderSpecifications().map((spec, index) => (
                                                        <div key={index} className="flex justify-between items-center border-b border-gray-800 pb-2">
                                                            <span className="text-gray-400 text-sm">{spec.label}:</span>
                                                            <span className="text-gray-300 font-medium">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Part Number if available */}
                                        {partDetails?.part_number && (
                                            <div className="mt-4">
                                                <div className="text-sm text-gray-400">Part Number</div>
                                                <div className="text-gray-300 font-mono text-sm">{partDetails.part_number}</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowPartModal(false)}
                                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition-colors"
                            >
                                Close
                            </button>
                            {(partDetails?.product_url || selectedPart.product) && (
                                <button
                                    onClick={() => {
                                        handleBuyClick(partDetails?.product_url || selectedPart.product);
                                        setShowPartModal(false);
                                    }}
                                    className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                    </svg>
                                    View Product
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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