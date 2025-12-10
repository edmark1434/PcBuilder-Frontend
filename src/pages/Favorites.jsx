import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/logo';
import { Heart, Trash2, Download, Eye, Cpu, HardDrive, MemoryStick, Cpu as MotherboardIcon, Fan, Computer, Zap, Layers, Filter, Archive } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Favorites = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Currency conversion states
  const [conversionRate, setConversionRate] = useState(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [conversionError, setConversionError] = useState(null);
  const [showPHP, setShowPHP] = useState(false); // Toggle between USD and PHP

  // Category list
  const categories = [
    'All',
    'Gaming',
    'School',
    'Office Work',
    'Video Editing',
    'Photo Editing',
    'Graphic Design',
    'Streaming',
    '3D Modeling',
    'Programming',
    'Content Creation',
    'Uncategorized'
  ];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Exchange Rate API
  const EXCHANGE_API_KEY = '391e07669e1a5aa7dd44cc53';
  const EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/pair/USD/PHP`;

  // Fix image URLs
  const fixImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    return url.replace(/\\\//g, '/');
  };

  const handleAskAI = async () => {
    sessionStorage.setItem('currentBuild', JSON.stringify(selectedFavorite));
    navigate('/ask');
  }

  // Format JSON string from database
  const parsePartsData = (partsString) => {
    try {
      if (typeof partsString === 'string') {
        const cleaned = partsString
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        return JSON.parse(cleaned);
      }
      return partsString;
    } catch (e) {
      console.error('Error parsing parts data:', e);
      return [];
    }
  };

  // Get icon for part type
  const getPartIcon = (partType) => {
    const type = partType.toLowerCase();
    switch (type) {
      case 'cpu':
        return <Cpu size={16} className="text-blue-400" />;
      case 'gpu':
        return <Layers size={16} className="text-purple-400" />;
      case 'ram':
        return <MemoryStick size={16} className="text-green-400" />;
      case 'motherboard':
        return <MotherboardIcon size={16} className="text-red-400" />;
      case 'storage':
        return <HardDrive size={16} className="text-yellow-400" />;
      case 'cpu cooler':
      case 'cpu_cooler':
        return <Fan size={16} className="text-pink-400" />;
      case 'case':
      case 'pc case':
        return <Computer size={16} className="text-gray-400" />;
      case 'psu':
      case 'power supply':
        return <Zap size={16} className="text-orange-400" />;
      default:
        return <Cpu size={16} className="text-gray-400" />;
    }
  };

  // Fetch conversion rate
  const fetchConversionRate = async () => {
    try {
      setConversionLoading(true);
      setConversionError(null);

      const response = await fetch(EXCHANGE_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate: ${response.status}`);
      }

      const data = await response.json();

      if (data.result === 'success') {
        setConversionRate(data.conversion_rate);
        // Store in localStorage for caching (valid for 1 hour)
        localStorage.setItem('usd_to_php_rate', JSON.stringify({
          rate: data.conversion_rate,
          timestamp: Date.now()
        }));
      } else {
        throw new Error(data['error-type'] || 'Failed to get conversion rate');
      }
    } catch (error) {
      console.error('Error fetching conversion rate:', error);
      setConversionError(error.message);

      // Try to use cached rate if available
      const cachedRate = JSON.parse(localStorage.getItem('usd_to_php_rate'));
      if (cachedRate && (Date.now() - cachedRate.timestamp) < 3600000) { // 1 hour cache
        setConversionRate(cachedRate.rate);
      }
    } finally {
      setConversionLoading(false);
    }
  };

  // Convert USD to PHP
  const convertToPHP = (usdAmount) => {
    if (!conversionRate || !usdAmount) return 0;
    return usdAmount * conversionRate;
  };

  // Format price based on selected currency
  const formatPrice = (price) => {
    const priceNum = Number(price) || 0;
    if (showPHP && conversionRate) {
      const phpAmount = convertToPHP(priceNum);
      return `₱${phpAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format total price with both currencies
  const formatTotalPrice = (totalPrice) => {
    const totalNum = Number(totalPrice) || 0;
    if (showPHP && conversionRate) {
      const phpAmount = convertToPHP(totalNum);
      return `₱${phpAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${totalNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch user's favorites
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError('');

      let userParam = searchParams.get('user_id');
      let storedUser = JSON.parse(sessionStorage.getItem('user'));
      let finalUserId = userParam || (storedUser && storedUser.id);

      if (!finalUserId) {
        setError('User ID is required. Please provide a user_id parameter.');
        setFavorites([]);
        setFilteredFavorites([]);
        setLoading(false);
        return;
      }

      setUserId(finalUserId);

      const response = await fetch(`${API_BASE_URL}/favorites?user_id=${finalUserId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.favorites) {
        const processedFavorites = data.data.favorites.map(fav => {
          let parts = [];
          let category = '';

          if (fav.build_data) {
            try {
              const parsedBuildData = JSON.parse(fav.build_data);
              category = parsedBuildData.category || '';

              if (parsedBuildData.parts && Array.isArray(parsedBuildData.parts)) {
                parts = parsedBuildData.parts;
              }
            } catch (parseError) {
              console.error('Error parsing build_data JSON:', parseError);
            }
          }

          if (parts.length === 0 && fav.parts_data) {
            parts = parsePartsData(fav.parts_data);
          }

          if (parts.length === 0) {
            parts = [
              fav.cpu_name && { partType: 'CPU', name: fav.cpu_name, price: fav.cpu_price, id: fav.cpu_id },
              fav.gpu_name && { partType: 'GPU', name: fav.gpu_name, price: fav.gpu_price, id: fav.gpu_id },
              fav.ram_name && { partType: 'RAM', name: fav.ram_name, price: fav.ram_price, id: fav.ram_id },
              fav.motherboard_name && { partType: 'Motherboard', name: fav.motherboard_name, price: fav.motherboard_price, id: fav.motherboard_id },
              fav.storage_name && { partType: 'Storage', name: fav.storage_name, price: fav.storage_price, id: fav.storage_id },
              fav.cpu_cooler_name && { partType: 'CPU Cooler', name: fav.cpu_cooler_name, price: fav.cpu_cooler_price, id: fav.cpu_cooler_id },
              fav.case_name && { partType: 'Case', name: fav.case_name, price: fav.case_price, id: fav.case_id },
              fav.psu_name && { partType: 'PSU', name: fav.psu_name, price: fav.psu_price, id: fav.psu_id },
            ].filter(Boolean);
          }

          return {
            id: fav.id,
            build_id: fav.build_id,
            category: category || 'Uncategorized',
            total_price: fav.total_price,
            parts: parts.map(part => ({
              ...part,
              image: part.image ? fixImageUrl(part.image) : '',
              price: Number(part.price) || 0
            })),
            created_at: fav.created_at,
            formatted_date: new Date(fav.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          };
        });

        setFavorites(processedFavorites);
        // Initially show all favorites
        setFilteredFavorites(processedFavorites);
      } else {
        setFavorites([]);
        setFilteredFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorites. Please try again.');
      setFavorites([]);
      setFilteredFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter favorites by category
  const filterByCategory = (category) => {
    setSelectedCategory(category);

    if (category === 'All') {
      setFilteredFavorites(favorites);
    } else if (category === 'Uncategorized') {
      setFilteredFavorites(favorites.filter(fav => !fav.category || fav.category === ''));
    } else {
      setFilteredFavorites(favorites.filter(fav => fav.category === category));
    }
    setShowCategoryFilter(false);
  };

  // Get category stats
  const getCategoryStats = () => {
    const stats = {};
    favorites.forEach(fav => {
      const cat = fav.category || 'Uncategorized';
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  };

  // Delete a favorite
  const handleDeleteFavorite = async (favoriteId, favoriteCategory) => {
    if (!userId) {
      alert('User ID is required');
      return;
    }

    const categoryText = favoriteCategory ? ` (${favoriteCategory})` : '';
    if (!window.confirm(`Are you sure you want to remove this${categoryText} build from favorites?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        // Update both arrays
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        setFilteredFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        alert('Build removed from favorites!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to remove favorite');
      }
    } catch (err) {
      console.error('Error deleting favorite:', err);
      alert('Network error. Please try again.');
    }
  };

  // Generate PDF for a favorite build
  const generatePDF = (favorite) => {
    if (!favorite || !favorite.parts || favorite.parts.length === 0) {
      alert("No parts to download!");
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');

    // Title
    pdf.setFontSize(22);
    pdf.setFont(undefined, 'bold');
    pdf.text("AutoBuild PC", 105, 20, { align: "center" });

    // Currency info if PHP is selected
    if (showPHP && conversionRate) {
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Exchange Rate: 1 USD = ${conversionRate.toFixed(4)} PHP`, 105, 30, { align: "center" });
    }

    // Build info
    pdf.setFontSize(12);
    pdf.text(`Saved: ${favorite.formatted_date}`, 105, showPHP && conversionRate ? 40 : 30, { align: "center" });

    // Category
    if (favorite.category) {
      pdf.text(`Category: ${favorite.category}`, 105, showPHP && conversionRate ? 50 : 40, { align: "center" });
    }

    // Table
    const tableColumn = ["Part Type", "Component Name", "Price (USD)"];
    if (showPHP) {
      tableColumn.push("Price (PHP)");
    }

    const tableRows = favorite.parts.map(part => {
      const row = [
        part.partType,
        part.name,
        `$${part.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
      if (showPHP && conversionRate) {
        const phpPrice = convertToPHP(part.price);
        row.push(`P${phpPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }
      return row;
    });

    const startY = favorite.category ? (showPHP && conversionRate ? 60 : 50) : (showPHP && conversionRate ? 55 : 45);

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
        1: { cellWidth: showPHP ? 75 : 100 },
        2: { cellWidth: 35, halign: 'right' },
        ...(showPHP && { 3: { cellWidth: 40, halign: 'right' } })
      }
    });

    // Total price
    const finalY = pdf.lastAutoTable.finalY + 10;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Total Price (USD): $${favorite.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, finalY);

    if (showPHP && conversionRate) {
      const totalPHP = convertToPHP(favorite.total_price);
      pdf.text(`Total Price (PHP): P${totalPHP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, finalY + 8);
    }

    // Save PDF
    const fileName = favorite.category
      ? `Favorite_Build_${favorite.category}_${favorite.build_id}.pdf`
      : `Favorite_Build_${favorite.build_id}.pdf`;
    pdf.save(fileName);
  };

  // Generate PDF for ALL favorites
  const generateAllFavoritesPDF = () => {
    if (!filteredFavorites || filteredFavorites.length === 0) {
      alert("No favorites to download!");
      return;
    }

    setDownloadingAll(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentPage = 1;

      filteredFavorites.forEach((favorite, index) => {
        if (index > 0) {
          pdf.addPage();
          currentPage++;
        }

        pdf.setFontSize(22);
        pdf.setFont(undefined, 'bold');
        pdf.text("AutoBuild PC", 105, 20, { align: "center" });

        // Currency info if PHP is selected
        if (showPHP && conversionRate) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
          pdf.text(`Exchange Rate: 1 USD = ${conversionRate.toFixed(4)} PHP`, 105, 30, { align: "center" });
        }

        pdf.setFontSize(12);
        pdf.text(`Saved: ${favorite.formatted_date}`, 105, showPHP && conversionRate ? 40 : 30, { align: "center" });

        if (favorite.category) {
          pdf.text(`Category: ${favorite.category}`, 105, showPHP && conversionRate ? 50 : 40, { align: "center" });
        }

        const startY = favorite.category ? (showPHP && conversionRate ? 60 : 50) : (showPHP && conversionRate ? 55 : 45);

        const tableColumn = ["Part Type", "Component Name", "Price (USD)"];
        if (showPHP) {
          tableColumn.push("Price (PHP)");
        }

        const tableRows = favorite.parts.map(part => {
          const row = [
            part.partType,
            part.name,
            `$${part.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ];
          if (showPHP && conversionRate) {
            const phpPrice = convertToPHP(part.price);
            row.push(`P${phpPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          }
          return row;
        });

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
            1: { cellWidth: showPHP ? 75 : 100 },
            2: { cellWidth: 35, halign: 'right' },
            ...(showPHP && { 3: { cellWidth: 40, halign: 'right' } })
          }
        });

        const finalY = pdf.lastAutoTable.finalY + 10;
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Total Price (USD): $${favorite.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, finalY);

        if (showPHP && conversionRate) {
          const totalPHP = convertToPHP(favorite.total_price);
          pdf.text(`Total Price (PHP): P${totalPHP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, finalY + 8);
        }

        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Page ${currentPage} of ${filteredFavorites.length}`, 105, 290, { align: "center" });
      });

      const fileName = selectedCategory === 'All'
        ? `All_Favorite_Builds_${new Date().toISOString().split('T')[0]}.pdf`
        : `Favorite_Builds_${selectedCategory}_${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(fileName);
      alert(`Downloaded ${filteredFavorites.length} builds successfully!`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  // View favorite details
  const handleViewDetails = (favorite) => {
    setSelectedFavorite(favorite);
    setShowDetailModal(true);
  };

  // Load favorites and conversion rate on component mount
  useEffect(() => {
    fetchFavorites();
    fetchConversionRate();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <Logo />
        <div className="max-w-7xl mx-auto mt-8">
          <h1 className="text-3xl font-bold mb-6">Favorites</h1>
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleUserInput = (e) => {
    e.preventDefault();
    const inputId = document.getElementById('userIdInput').value;
    if (inputId) {
      navigate(`/favorites?user_id=${inputId}`);
    }
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Logo />

      <div className="max-w-7xl mx-auto mt-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Favorites</h1>
            <p className="text-gray-400 mt-2">
              {filteredFavorites.length} saved build{filteredFavorites.length !== 1 ? 's' : ''}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Currency Toggle */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setShowPHP(false)}
                className={`px-4 py-2 rounded-md transition-colors ${!showPHP ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                USD
              </button>
              <button
                onClick={() => setShowPHP(true)}
                disabled={!conversionRate || conversionLoading}
                className={`px-4 py-2 rounded-md transition-colors ${showPHP ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                  } ${(!conversionRate || conversionLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {conversionLoading ? 'Loading...' : 'PHP'}
              </button>
            </div>

            {/* Download All Button */}
            {filteredFavorites.length > 0 && (
              <button
                onClick={generateAllFavoritesPDF}
                disabled={downloadingAll}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download all builds as PDF"
              >
                {downloadingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Archive size={18} />
                    Download All ({filteredFavorites.length})
                  </>
                )}
              </button>
            )}

            {/* Category Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Filter size={18} />
                {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                <svg
                  className={`w-4 h-4 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Category Dropdown */}
              {showCategoryFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto parts-scrollbar">
                  <div className="p-2">
                    {categories.map(category => {
                      const count =
                        category === "All"
                          ? favorites.length
                          : category === "Uncategorized"
                            ? categoryStats["Uncategorized"] || 0
                            : categoryStats[category] || 0;

                      return (
                        <button
                          key={category}
                          onClick={() => filterByCategory(category)}
                          className={`w-full flex items-center justify-between px-4 py-2 rounded mb-1 transition-colors ${selectedCategory === category
                            ? "bg-pink-500 text-white"
                            : "hover:bg-gray-800 text-gray-300"
                            }`}
                        >
                          <span>{category}</span>
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Currency Info */}
        {conversionRate && (
          <div className="mb-4 text-sm text-gray-400">
            Exchange Rate: 1 USD = {conversionRate.toFixed(4)} PHP
          </div>
        )}

        {/* User ID Input Form (if needed) */}
        {!userId && error.includes('User ID') && (
          <div className="border border-yellow-700 bg-yellow-900/30 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Enter User ID</h3>
            <form onSubmit={handleUserInput} className="flex gap-3">
              <input
                id="userIdInput"
                type="number"
                placeholder="Enter your user ID"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                min="1"
                required
              />
              <button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Load Favorites
              </button>
            </form>
            <p className="text-gray-400 text-sm mt-3">
              Your user ID should be provided in the URL or from your account.
            </p>
          </div>
        )}

        {error && !error.includes('User ID') ? (
          <div className="border border-red-700 bg-red-900/30 rounded-lg p-6 text-center">
            <Heart size={48} className="mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold mb-2">{error}</h3>
            <button
              onClick={fetchFavorites}
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : filteredFavorites.length === 0 && userId ? (
          <div className="border border-gray-700 bg-gray-900/50 rounded-lg p-12 text-center">
            <Heart size={64} className="mx-auto mb-6 text-gray-500" />
            <h3 className="text-2xl font-semibold mb-3">
              {selectedCategory === 'All' ? 'No Favorites Yet' : `No ${selectedCategory} Builds`}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {selectedCategory === 'All'
                ? 'Save your favorite PC builds by clicking the heart icon on any parts list.'
                : `You haven't saved any ${selectedCategory.toLowerCase()} builds yet.`}
            </p>
            <button
              onClick={() => navigate('/automate')}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Create a Build
            </button>
          </div>
        ) : userId && filteredFavorites.length > 0 ? (
          <>
            {/* Current Filter Info */}
            {selectedCategory !== 'All' && (
              <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-pink-400">
                      Showing {selectedCategory} Builds
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {filteredFavorites.length} build{filteredFavorites.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={generateAllFavoritesPDF}
                      disabled={downloadingAll}
                      className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <Archive size={14} />
                      Download All
                    </button>
                    <button
                      onClick={() => filterByCategory('All')}
                      className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                    >
                      Show all builds
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="border border-gray-700 bg-gray-900/50 rounded-lg p-6 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {favorite.category && (
                          <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                            {favorite.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{favorite.formatted_date}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFavorite(favorite.id, favorite.category)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      title="Remove from favorites"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Parts Preview */}
                  <div className="space-y-3 mb-6">
                    {favorite.parts.slice(0, 4).map((part, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="shrink-0">
                          {getPartIcon(part.partType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{part.name}</p>
                          <p className="text-xs text-gray-400">{part.partType}</p>
                        </div>
                        <div className="text-green-400 font-medium text-sm">
                          {formatPrice(part.price)}
                        </div>
                      </div>
                    ))}
                    {favorite.parts.length > 4 && (
                      <div className="text-center text-gray-400 text-sm">
                        +{favorite.parts.length - 4} more parts
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Total Price</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatTotalPrice(favorite.total_price)}
                        </p>
                        {showPHP && conversionRate && (
                          <p className="text-xs text-gray-400 mt-1">
                            ≈ ${Number(favorite.total_price).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetails(favorite)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                      <button
                        onClick={() => generatePDF(favorite)}
                        className="flex-1 bg-transparent border border-white hover:bg-white hover:text-black text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Favorite Details Modal */}
      {showDetailModal && selectedFavorite && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto parts-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <div className="flex items-center gap-3">
                  {selectedFavorite.category && (
                    <span className="text-sm bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full">
                      {selectedFavorite.category}
                    </span>
                  )}
                  <h3 className="text-xl font-bold">Build Details</h3>
                </div>
                <p className="text-gray-400 mt-1">Saved on {selectedFavorite.formatted_date}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Parts List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Parts List</h4>
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setShowPHP(false)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${!showPHP ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        USD
                      </button>
                      <button
                        onClick={() => setShowPHP(true)}
                        disabled={!conversionRate}
                        className={`px-3 py-1 text-xs rounded transition-colors ${showPHP ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'} ${!conversionRate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        PHP
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedFavorite.parts.map((part, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50"
                      >
                        {part.image && (
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-16 h-16 object-cover rounded border border-gray-600"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                          <div class="w-16 h-16 rounded border border-gray-600 flex items-center justify-center bg-gray-700">
                            ${getPartIcon(part.partType)}
                          </div>
                        `;
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{part.name}</p>
                              <p className="text-sm text-gray-400">{part.partType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-semibold">
                                {formatPrice(part.price)}
                              </p>
                              {showPHP && conversionRate && (
                                <p className="text-xs text-gray-400 mt-1">
                                  ≈ ${Number(part.price).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Build Summary */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Build Summary</h4>
                  <div className="border border-gray-700 rounded-lg p-6">
                    <div className="space-y-6">
                      <div>
                        <p className="text-gray-400 mb-2">Total Price</p>
                        <p className="text-4xl font-bold text-green-400">
                          {formatTotalPrice(selectedFavorite.total_price)}
                        </p>
                        {showPHP && conversionRate && (
                          <p className="text-sm text-gray-400 mt-2">
                            ≈ ${Number(selectedFavorite.total_price).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-gray-400 mb-2">Number of Parts</p>
                        <p className="text-2xl font-semibold">{selectedFavorite.parts.length}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-2">Category</p>
                        <p className="text-xl font-semibold text-pink-400">
                          {selectedFavorite.category || 'Uncategorized'}
                        </p>
                      </div>

                      {conversionRate && (
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Exchange Rate</p>
                          <p className="font-medium">1 USD = {conversionRate.toFixed(4)} PHP</p>
                        </div>
                      )}

                      <div className="pt-6 border-t border-gray-700">
                        <button
                          onClick={() => {
                            generatePDF(selectedFavorite);
                            setShowDetailModal(false);
                          }}
                          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-3"
                        >
                          <Download size={20} />
                          Download as PDF
                        </button>
                        <button
                          onClick={handleAskAI}
                          className="w-full bg-transparent border border-white hover:bg-white hover:text-black text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                        >
                          Ask AI
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;