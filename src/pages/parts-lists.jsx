import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Heart } from 'lucide-react';

const PartsList = () => {
    const navigate = useNavigate();
    const [allBuilds, setAllBuilds] = useState([]);
    const [currentBuildIndex, setCurrentBuildIndex] = useState(0);
    const [parts, setParts] = useState([]);

    const [zoomedImage, setZoomedImage] = useState(null);
    const [likedBuilds, setLikedBuilds] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [buildsCount, setBuildsCount] = useState({ current: 1, total: 0 });
    const [selectedPart, setSelectedPart] = useState(null);
    const [showPartModal, setShowPartModal] = useState(false);
    const [partDetails, setPartDetails] = useState(null);
    const [isLikedCurrent, setIsLikedCurrent] = useState(false);
    const [activeTab, setActiveTab] = useState('parts'); // 'parts' or 'description'

    // Base API URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    // Loading state for regenerating builds
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [budgetNote, setBudgetNote] = useState(null);
    const [budgetRange, setBudgetRange] = useState({ min: 0, max: 100000 });
    const [showBudgetEdit, setShowBudgetEdit] = useState(false);
    const [editBudget, setEditBudget] = useState({ min: 0, max: 0 });
    const [budgetWarningAcknowledged, setBudgetWarningAcknowledged] = useState(false);

    // Fix image URLs by adding https: prefix if needed
    const fixImageUrl = (url) => {
        if (!url) return '';
        url = url.replace('&width=1', '');
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        return url;
    };

    // Format part type for consistent display
    const formatPartType = (partType) => {
        const typeMap = {
            'Processors': 'CPU',
            'Motherboards': 'Motherboard',
            'Memory': 'RAM',
            'Graphics Cards': 'GPU',
            'Cooling': 'CPU Cooler',
            'Storage': 'Storage',
            'Power Supply': 'Power Supply',
            'Cases': 'Case'
        };
        return typeMap[partType] || partType;
    };

    // Format price in Philippine Peso
    const formatPrice = (price) => {
        if (typeof price === 'string') {
            price = parseFloat(price);
        }
        return `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format total price in Philippine Peso
    const formatTotalPrice = () => {
        return formatPrice(totalPrice);
    };

    // Render basic part information
    const renderPartInfo = () => {
        if (!partDetails) return [];
        
        return [
            { label: 'Type', value: partDetails.type },
            { label: 'Vendor', value: partDetails.vendor },
            { label: 'External ID', value: partDetails.external_id }
        ].filter(spec => spec.value);
    };

    // Check if current build is liked
    const checkIfCurrentBuildIsLiked = () => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const likedBuildsData = user ? JSON.parse(localStorage.getItem(`${user.id}favoriteBuilds`) || '[]') : [];
            const currentBuild = allBuilds[currentBuildIndex];

            if (!currentBuild || !likedBuildsData.length) return false;
            return likedBuildsData.some(build =>
                build.buildId === currentBuildIndex &&
                build.total_price === currentBuild.total_price
            );
        } catch (error) {
            console.error('Error checking liked builds:', error);
            return false;
        }
    };

    const handleHeartToggle = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const currentBuild = allBuilds[currentBuildIndex];

            if (!currentBuild) {
                console.error('No current build found');
                return;
            }

            if (!user || user.isGuest || !user.id) {
                console.log('User not logged in, redirecting to login');
                navigate('/login');
                return;
            }
            
            const category = JSON.parse(sessionStorage.getItem('category'));
            
            // Get user's needs from buildRequest
            const buildRequest = sessionStorage.getItem('buildRequest');
            let userNeeds = '';
            if (buildRequest) {
                const request = JSON.parse(buildRequest);
                userNeeds = request.description || '';
            }
            
            const buildData = {
                buildId: Number(currentBuildIndex),
                total_price: Number(currentBuild.total_price) || 0,
                category: category,
                needs: userNeeds,
                description: currentBuild.description || '',
                parts: (currentBuild.parts || []).map(part => {
                    // Normalize uppercase/lowercase fields
                    const type = part.Type || part.partType || part.type || 'Unknown';
                    const title = part.Title || part.name || 'Unnamed Part';
                    const vendor = part.Vendor || part.vendor || '';
                    const price = part.Price !== undefined ? part.Price : (part.price || 0);
                    const image = part.Image || part.image || '';
                    const link = part.Link || part.product || '';
                    const id = part.ID || part.id || 0;
                    const external_id = part.external_id || '';
                    
                    return {
                        id: Number(id),
                        external_id: external_id,
                        partType: type,
                        name: title,
                        vendor: vendor,
                        price: Number(price),
                        image: image,
                        product: link
                    };
                }),
                timestamp: new Date().toISOString()
            };

            const requestBody = {
                user_id: Number(user.id),
                build_data: buildData
            };

            const response = await fetch(`${API_BASE_URL}/favorites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                saveBuildToLocalStorage(buildData);
                setIsLikedCurrent(!isLikedCurrent);
            } else {
                const errorData = await response.json();
                console.error('Error details:', errorData);

                if (errorData.errors) {
                    console.error('Validation errors:', errorData.errors);
                    const errorMessages = Object.values(errorData.errors).flat().join(', ');
                    alert(`Validation error: ${errorMessages}`);
                } else {
                    alert(errorData.message || 'Failed to save favorite');
                }
            }
        } catch (error) {
            console.error('Error in handleHeartToggle:', error);
        }
    };

    // Save build to localStorage
    const saveBuildToLocalStorage = (buildData) => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const likedBuildsData = JSON.parse(localStorage.getItem(`${user.id}favoriteBuilds`) || '[]');

            const existingIndex = likedBuildsData.findIndex(build =>
                build.buildId === buildData.buildId &&
                build.total_price === buildData.total_price
            );

            if (existingIndex >= 0) {
                likedBuildsData.splice(existingIndex, 1);
            } else {
                likedBuildsData.push(buildData);
            }

            localStorage.setItem(`${user.id}favoriteBuilds`, JSON.stringify(likedBuildsData));
            setLikedBuilds(likedBuildsData.map(build => build.buildId));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    // Render basic specifications
    const renderSpecifications = () => {
        if (!partDetails) return [];
        return [];
    };

    useEffect(() => {
        try {
            const storedData = sessionStorage.getItem('builds');
            console.log('Stored data:', storedData);

            if (storedData) {
                const data = JSON.parse(storedData);
                console.log('Parsed data:', data);

                // Handle both array format [build, build] and object format {builds: [build, build]}
                const builds = Array.isArray(data) ? data : (data && data.builds ? data.builds : []);
                
                // Extract budget note and range if available
                if (!Array.isArray(data)) {
                    if (data.budget_note) {
                        setBudgetNote(data.budget_note);
                        setBudgetWarningAcknowledged(false);
                    }
                    if (data.budget_range) {
                        setBudgetRange(data.budget_range);
                        setEditBudget(data.budget_range);
                    }
                }
                
                if (builds && Array.isArray(builds) && builds.length > 0) {
                    setAllBuilds(builds);
                    setBuildsCount({
                        current: 1,
                        total: builds.length
                    });

                    const firstBuild = builds[0];
                    if (firstBuild && firstBuild.parts && Array.isArray(firstBuild.parts)) {
                        const formattedParts = firstBuild.parts.map(part => {
                            const type = part.Type || part.partType;
                            const title = part.Title || part.name;
                            const vendor = part.Vendor || part.vendor;
                            const price = part.Price !== undefined ? part.Price : part.price;
                            const image = part.Image || part.image;
                            const link = part.Link || part.product;
                            const externalId = part.external_id || part.externalId || part.ID || part.id;
                            const id = part.ID || part.id || externalId || 0;
                            return {
                                ...part,
                                id,
                                external_id: externalId,
                                type,
                                partType: formatPartType(type),
                                name: title,
                                vendor: vendor,
                                price: Number(price) || 0,
                                image: fixImageUrl(image),
                                product: link
                            };
                        });
                        setParts(formattedParts);
                        setTotalPrice(firstBuild.total_price);
                    }
                } else {
                    console.log('Invalid data format in session storage:', data);
                }
            } else {
                console.log('No builds found in session storage');
            }

            // Automatically open Budget Edit modal if flagged by automate.jsx
            const showBudgetEditModalFlag = sessionStorage.getItem('showBudgetEditModal');
            if (showBudgetEditModalFlag === 'true') {
                setShowBudgetEdit(true);
                sessionStorage.removeItem('showBudgetEditModal');
            }
        } catch (error) {
            console.error('Error in useEffect:', error);
        }
    }, []);

    // Update isLikedCurrent when currentBuildIndex changes
    useEffect(() => {
        setIsLikedCurrent(checkIfCurrentBuildIsLiked());
    }, [currentBuildIndex, allBuilds]);

    const handleAskAI = async () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const category = JSON.parse(sessionStorage.getItem('category'));
        sessionStorage.setItem('category', JSON.stringify(category));
        console.log(user);
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Get user's needs from buildRequest
        const buildRequest = sessionStorage.getItem('buildRequest');
        if (buildRequest) {
            const request = JSON.parse(buildRequest);
            sessionStorage.setItem('userNeeds', request.description || '');
        }
        
        const currentBuild = allBuilds[currentBuildIndex];
        sessionStorage.setItem('currentBuild', JSON.stringify(currentBuild));
        navigate('/ask');
    }

    const generateNewBuilds = async () => {
        // Get the original build request from sessionStorage
        const buildRequest = sessionStorage.getItem('buildRequest');
        
        if (!buildRequest) {
            alert('Build request data not found. Please go back to create a new build.');
            navigate('/automate');
            return;
        }

        try {
            const requestData = JSON.parse(buildRequest);
            console.log('Regenerating build with:', requestData);

            setIsRegenerating(true);

            const response = await fetch(`${API_BASE_URL}/min-price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate build');
            }

            console.log('New builds generated:', data);

            // Extract payload from wrapped response
            const payload = data.data || data;
            const builds = payload.builds || [];
            const budgetNote = payload.budget_note || null;
            const budgetRange = payload.budget_range || null;

            // Extract budget note and range
            if (budgetNote) {
                setBudgetNote(budgetNote);
                setBudgetWarningAcknowledged(false);
            } else {
                setBudgetNote(null);
            }
            
            if (budgetRange) {
                setBudgetRange(budgetRange);
            }
            
            if (builds && Array.isArray(builds) && builds.length > 0) {
                setAllBuilds(builds);
                setBuildsCount({
                    current: 1,
                    total: builds.length
                });
                setCurrentBuildIndex(0);

                const firstBuild = builds[0];
                if (firstBuild && firstBuild.parts && Array.isArray(firstBuild.parts)) {
                    const formattedParts = firstBuild.parts.map(part => {
                        const type = part.Type || part.partType;
                        const title = part.Title || part.name;
                        const vendor = part.Vendor || part.vendor;
                        const price = part.Price !== undefined ? part.Price : part.price;
                        const image = part.Image || part.image;
                        const link = part.Link || part.product;
                        const externalId = part.external_id || part.externalId || part.ID || part.id;
                        const id = part.ID || part.id || externalId || 0;
                        return {
                            ...part,
                            id,
                            external_id: externalId,
                            type,
                            partType: formatPartType(type),
                            name: title,
                            vendor: vendor,
                            price: Number(price) || 0,
                            image: fixImageUrl(image),
                            product: link
                        };
                    });
                    setParts(formattedParts);
                    setTotalPrice(firstBuild.total_price);
                }

                // Update sessionStorage with new builds
                sessionStorage.setItem('builds', JSON.stringify(builds));
                if (payload.recommendation) {
                    sessionStorage.setItem('aiRecommendation', payload.recommendation);
                }
            } else {
                throw new Error('No builds returned from API');
            }

        } catch (error) {
            console.error('Error regenerating builds:', error);
            alert(error.message || 'Failed to generate new builds. Please try again.');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleBudgetUpdate = async () => {
        const buildRequest = sessionStorage.getItem('buildRequest');
        
        if (!buildRequest) {
            alert('Build request data not found.');
            return;
        }

        try {
            const requestData = JSON.parse(buildRequest);
            requestData.min = editBudget.min || 0;
            requestData.max = editBudget.max || 100000;
            
            // Update sessionStorage
            sessionStorage.setItem('buildRequest', JSON.stringify(requestData));
            
            // Hide modal and regenerate
            setShowBudgetEdit(false);
            
            // Call generateNewBuilds with updated budget
            await generateNewBuilds();
        } catch (error) {
            console.error('Error updating budget:', error);
            alert('Failed to update budget. Please try again.');
        }
    };

    const generateNextBuild = () => {
        if (allBuilds.length === 0) return;

        const nextIndex = (currentBuildIndex + 1) % allBuilds.length;
        setCurrentBuildIndex(nextIndex);

        const nextBuild = allBuilds[nextIndex];
        const formattedParts = nextBuild.parts.map(part => {
            const type = part.Type || part.partType;
            const title = part.Title || part.name;
            const vendor = part.Vendor || part.vendor;
            const price = part.Price !== undefined ? part.Price : part.price;
            const image = part.Image || part.image;
            const link = part.Link || part.product;
            const externalId = part.external_id || part.externalId || part.ID || part.id;
            const id = part.ID || part.id || externalId || 0;
            return {
                ...part,
                id,
                external_id: externalId,
                type,
                partType: formatPartType(type),
                name: title,
                vendor: vendor,
                price: Number(price) || 0,
                image: fixImageUrl(image),
                product: link
            };
        });
        setParts(formattedParts);
        setTotalPrice(nextBuild.total_price);

        setBuildsCount(prev => ({
            ...prev,
            current: nextIndex + 1
        }));
    };

    const handlePartClick = (part) => {
        setSelectedPart(part);
        setPartDetails(part);
        setShowPartModal(true);
    };

    const handleBuyClick = (productUrl) => {
        if (productUrl) {
            window.open(`https://pcx.com.ph${productUrl}`, '_blank', 'noopener,noreferrer');
        }
    };

    const generatePDF = () => {
        if (!parts || parts.length === 0) {
            alert("No parts to download!");
            return;
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const currentBuild = allBuilds[currentBuildIndex];

        // Title
        pdf.setFontSize(22);
        pdf.setFont(undefined, 'bold');
        pdf.text("AutoBuild PC", 105, 20, { align: "center" });

        // Build info
        pdf.setFontSize(12);
        pdf.text(`Build #${buildsCount.current} of ${buildsCount.total}`, 105, 30, { align: "center" });

        // Build description if available
        let startY = 40;
        if (currentBuild?.description) {
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            const descLines = pdf.splitTextToSize(currentBuild.description, 180);
            pdf.text(descLines, 15, startY);
            startY = startY + (descLines.length * 5) + 5;
        }

        // Table
        const tableColumn = ["Part Type", "Component Name", "Price (₱)"];
        const tableRows = parts.map(part => [
            part.partType,
            part.name,
            `₱${part.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);

        autoTable(pdf, {
            startY: startY,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 0 },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 100 },
                2: { cellWidth: 35, halign: 'right' }
            }
        });

        // Total price
        const finalY = pdf.lastAutoTable.finalY + 10;
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Total Price: ${formatPrice(totalPrice)}`, 15, finalY);

        // Save PDF
        pdf.save("AutoBuildPC_Build.pdf");
    };

    return (
        <div className="h-screen bg-black text-white p-8 overflow-hidden flex flex-col">
            <Logo />
            
            {/* Budget Warning */}
            {budgetNote && !budgetWarningAcknowledged && (
                <div className="max-w-7xl w-full mx-auto mb-4 bg-yellow-500/20 border border-yellow-600 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-yellow-200 font-medium mb-3">{budgetNote}</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { setEditBudget(budgetRange); setShowBudgetEdit(true); }}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                                >
                                    Edit Budget
                                </button>
                                <button
                                    onClick={() => setBudgetWarningAcknowledged(true)}
                                    className="bg-transparent border border-yellow-600 text-yellow-200 hover:bg-yellow-600 hover:text-black px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {budgetNote && budgetWarningAcknowledged && (
                <div className="max-w-7xl w-full mx-auto mb-4 bg-yellow-500/10 border border-yellow-700 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1 flex items-start justify-between gap-3">
                            <p className="text-yellow-200 text-sm">{budgetNote}</p>
                            <button
                                onClick={() => { setEditBudget(budgetRange); setShowBudgetEdit(true); }}
                                className="bg-yellow-600 hover:bg-yellow-700 text-black px-3 py-1.5 rounded-md transition-colors text-xs font-semibold"
                            >
                                Edit Budget
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Container */}
            <div className="flex-1 max-w-7xl w-full mx-auto border border-gray-600 rounded-lg p-6 flex flex-col overflow-hidden">



                {/* Parts List Container */}
                <div className="flex-1 border border-gray-700 rounded-lg mb-6 overflow-hidden flex flex-col">
                    {/* Header with Tabs */}
                    <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('parts')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                        activeTab === 'parts'
                                            ? 'bg-pink-500 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-semibold">Parts List</span>
                                </button>
                                {allBuilds[currentBuildIndex]?.description && (
                                    <button
                                        onClick={() => setActiveTab('description')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                            activeTab === 'description'
                                                ? 'bg-pink-500 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-semibold">Build Description</span>
                                    </button>
                                )}
                            </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={generateNextBuild}
                                disabled={allBuilds.length <= 1}
                                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cycle through current builds"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="font-regular">Next Build</span>
                            </button>
                            <button
                                onClick={generateNewBuilds}
                                disabled={isRegenerating}
                                className="bg-pink-500 hover:bg-pink-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Generate new builds with same criteria"
                            >
                                {isRegenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span className="font-regular">Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span className="font-regular">Generate New</span>
                                    </>
                                )}
                            </button>
                        </div>
                        </div>
                    </div>

                    {/* Tab Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto parts-scrollbar">
                        {/* Parts List Tab */}
                        {activeTab === 'parts' && (
                            <>
                            {parts.map((part, index) => (
                                <div
                                    key={`${part.id}-${index}`}
                                    className="flex items-center justify-between px-2 sm:px-4 py-3 border-b border-gray-800 hover:bg-gray-900 transition-colors cursor-pointer gap-2"
                                    onClick={() => handlePartClick(part)}
                                >
                                {/* Left group: PartType + Image + Name */}
                                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                    <span className="bg-gray-700 text-white px-2 sm:px-3 py-2 rounded w-24 sm:w-32 text-center text-xs sm:text-sm shrink-0">
                                        {part.partType}
                                    </span>

                                    {part.image ? (
                                        <img
                                            src={part.image}
                                            alt={part.name}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setZoomedImage(part.image);
                                            }}
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-gray-600 cursor-pointer hover:border-pink-500 transition-colors shrink-0"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : null}

                                    <span className="text-gray-300 text-sm sm:text-base truncate min-w-0" title={part.name}>{part.name}</span>
                                </div>

                                {/* Right group: Price */}
                                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                    <span className="text-green-400 font-medium text-sm sm:text-base">
                                        {formatPrice(part.price)}
                                    </span>
                                    {part.product && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBuyClick(part.product);
                                            }}
                                            className="text-gray-400 hover:text-pink-500 transition-colors p-1"
                                            title="View product"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        </>
                        )}

                        {/* Build Description Tab */}
                        {activeTab === 'description' && allBuilds[currentBuildIndex]?.description && (
                            <div className="flex-1 overflow-y-auto flex flex-col">
                                <div className="p-6 md:p-8">
                                    <div className="max-w-4xl mx-auto">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                                                <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-bold text-white">Build Overview</h2>
                                                <p className="text-gray-400 text-sm mt-1">AI-generated recommendations for your PC</p>
                                            </div>
                                        </div>

                                        {/* Description Content - Scrollable */}
                                        <div className="bg-gradient-to-br from-gray-900/80 via-gray-900/50 to-gray-800/80 border border-gray-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm h-96 overflow-y-auto parts-scrollbar">
                                            <div className="space-y-6 pr-2">
                                                {/* Description Text with flexible formatting */}
                                                <div className="prose prose-sm prose-invert max-w-none">
                                                    <div className="text-gray-200 leading-relaxed tracking-wide space-y-4">
                                                        {allBuilds[currentBuildIndex].description.split('\n').map((line, idx) => {
                                                            const trimmedLine = line.trim();
                                                            
                                                            // Skip empty lines
                                                            if (!trimmedLine) return null;
                                                            
                                                            // Bullet points
                                                            const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-');
                                                            if (isBullet) {
                                                                const bulletText = trimmedLine.substring(1).trim();
                                                                const isSubBullet = line.startsWith('  •') || line.startsWith('  -') || line.startsWith('    •') || line.startsWith('    -');
                                                                
                                                                return (
                                                                    <div key={idx} className={`flex items-start gap-3 ${isSubBullet ? 'ml-6' : ''}`}>
                                                                        <span className="text-pink-400 font-bold mt-1 flex-shrink-0">•</span>
                                                                        <span className="text-gray-300">
                                                                            {bulletText.split('**').map((text, i) => 
                                                                                i % 2 === 1 ? (
                                                                                    <strong key={i} className="font-semibold text-white">{text}</strong>
                                                                                ) : (
                                                                                    <span key={i}>{text}</span>
                                                                                )
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                            
                                                            // Section headers (===...===)
                                                            if (trimmedLine.match(/^===.*===/)) {
                                                                const headerText = trimmedLine.replace(/=/g, '').trim();
                                                                return (
                                                                    <div key={idx} className="my-6">
                                                                        <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                                                                            <h4 className="text-lg font-bold text-center bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                                                {headerText}
                                                                            </h4>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            
                                                            // Numbered lists (1. 2. 3.)
                                                            const isNumberedList = trimmedLine.match(/^\d+\./);
                                                            if (isNumberedList) {
                                                                const numberMatch = trimmedLine.match(/^\d+\./);
                                                                const listText = trimmedLine.substring(numberMatch[0].length).trim();
                                                                
                                                                return (
                                                                    <div key={idx} className="flex gap-3">
                                                                        <span className="text-pink-400 font-bold flex-shrink-0">{numberMatch[0]}</span>
                                                                        <span className="text-gray-300 flex-1">
                                                                            {listText.split('**').map((text, i) => 
                                                                                i % 2 === 1 ? (
                                                                                    <strong key={i} className="font-semibold text-white">{text}</strong>
                                                                                ) : (
                                                                                    <span key={i}>{text}</span>
                                                                                )
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                            
                                                            // Bold headers (text followed by colon)
                                                            if (trimmedLine.endsWith(':') && !trimmedLine.includes('•')) {
                                                                return (
                                                                    <h5 key={idx} className="text-lg font-semibold text-pink-400 mt-4 mb-2">
                                                                        {trimmedLine}
                                                                    </h5>
                                                                );
                                                            }
                                                            
                                                            // Regular paragraphs
                                                            return (
                                                                <p key={idx} className="text-base text-gray-300 leading-relaxed">
                                                                    {trimmedLine.split('**').map((text, i) => 
                                                                        i % 2 === 1 ? (
                                                                            <strong key={i} className="font-semibold text-white">{text}</strong>
                                                                        ) : (
                                                                            <span key={i}>{text}</span>
                                                                        )
                                                                    )}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6">

                    {/* Action Buttons and Total Price */}
                    <div className="flex items-center justify-between">
                        {/* Left group: Download button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={generatePDF}
                                className="bg-transparent border border-white text-white font-semibold px-4 sm:px-6 py-2 rounded hover:bg-white hover:text-black transition-colors duration-200 h-[46px] text-sm sm:text-base whitespace-nowrap"
                            >
                                Download List
                            </button>
                            <button
                                onClick={handleHeartToggle}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                title={isLikedCurrent ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart
                                    size={24}
                                    className={isLikedCurrent ? "fill-pink-500 text-pink-500" : "text-gray-400 hover:text-pink-500"}
                                />
                            </button>
                        </div>

                        {/* Total Price */}
                        <div className="border border-green-500 text-green-400 px-4 sm:px-6 py-2 rounded text-lg sm:text-xl font-semibold h-[46px] flex items-center justify-center">
                            {formatTotalPrice()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between gap-3 mt-4 max-w-7xl w-full mx-auto">
                <button
                    onClick={() => navigate('/automate')}
                    className="bg-transparent border border-white text-white font-semibold px-6 sm:px-8 py-3 rounded-lg hover:bg-white hover:text-pink-500 transition-colors duration-200">
                    Back
                </button>
                <button
                    onClick={handleAskAI}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 sm:px-8 py-3 rounded-lg transition-colors duration-200">
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
                        className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto parts-scrollbar"
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
                            {selectedPart && partDetails && (
                                <>
                                    {/* Part Image */}
                                    {selectedPart.image && (
                                        <div className="mb-4 flex justify-center">
                                            <img
                                                src={selectedPart.image}
                                                alt={selectedPart.name}
                                                className="max-w-full h-48 object-contain rounded border border-gray-600 cursor-pointer"
                                                onClick={() => {
                                                    setShowPartModal(false);
                                                    setZoomedImage(selectedPart.image);
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
                                            <div className="text-lg font-medium">{selectedPart.name}</div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-400">Price</div>
                                            <div className="text-2xl font-bold text-green-400">
                                                {formatPrice(selectedPart.price)}
                                            </div>
                                        </div>

                                        {/* Part Info */}
                                        {renderPartInfo().length > 0 && (
                                            <div className="mt-6">
                                                <div className="text-sm text-gray-400 mb-3">Information</div>
                                                <div className="space-y-2">
                                                    {renderPartInfo().map((spec, index) => (
                                                        <div key={index} className="flex justify-between items-center border-b border-gray-800 pb-2">
                                                            <span className="text-gray-400 text-sm">{spec.label}:</span>
                                                            <span className="text-gray-300 font-medium text-sm break-words text-right">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
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
                            {selectedPart?.product && (
                                <button
                                    onClick={() => {
                                        handleBuyClick(selectedPart.product);
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

            {/* Budget Edit Modal */}
            {showBudgetEdit && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowBudgetEdit(false)}
                >
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">Adjust Your Budget Range</h3>
                            <button
                                onClick={() => setShowBudgetEdit(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Minimum Budget (₱)
                                </label>
                                <input
                                    type="number"
                                    value={editBudget.min}
                                    onChange={(e) => setEditBudget({ ...editBudget, min: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Maximum Budget (₱)
                                </label>
                                <input
                                    type="number"
                                    value={editBudget.max}
                                    onChange={(e) => setEditBudget({ ...editBudget, max: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                                    placeholder="100000"
                                    min="0"
                                />
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <p className="text-sm text-gray-400">
                                    Current Build Price: <span className="text-green-400 font-medium">{formatPrice(totalPrice)}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowBudgetEdit(false)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBudgetUpdate}
                                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Apply & Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PartsList;
