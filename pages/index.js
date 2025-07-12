import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Settings, RefreshCw } from 'lucide-react';

const ProfitTracker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const [settings, setSettings] = useState({
    avgCOGS: 12.50,
    shippingCost: 4.30,
    monthlyFixedCosts: 2500
  });

  const fetchData = async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/profit-data?date=${date}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const calculateProfit = () => {
    if (!data) return null;
    
    const totalCOGS = data.orders * settings.avgCOGS;
    const totalShipping = data.orders * settings.shippingCost;
    const totalAdSpend = data.metaAdSpend + data.tiktokAdSpend;
    const dailyFixedCosts = settings.monthlyFixedCosts / 30;
    
    const netProfit = data.revenue - totalCOGS - totalShipping - totalAdSpend - dailyFixedCosts;
    
    return {
      revenue: data.revenue,
      totalCOGS,
      totalShipping,
      totalAdSpend,
      dailyFixedCosts,
      netProfit,
      orders: data.orders
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const profitData = calculateProfit();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading profit data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error loading data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchData(selectedDate)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profitData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No data available</h2>
          <p className="text-gray-600">Try selecting a different date</p>
        </div>
      </div>
    );
  }

  const isProfit = profitData.netProfit > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Daily Profit</h1>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => fetchData(selectedDate)}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Settings */}
        {showSettings && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  COGS per Order
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.avgCOGS}
                  onChange={(e) => setSettings({...settings, avgCOGS: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping per Order
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.shippingCost}
                  onChange={(e) => setSettings({...settings, shippingCost: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Fixed Costs
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.monthlyFixedCosts}
                  onChange={(e) => setSettings({...settings, monthlyFixedCosts: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Profit Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <DollarSign size={40} className={isProfit ? 'text-green-600' : 'text-red-600'} />
            <h2 className={`text-5xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitData.netProfit)}
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Simple Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Revenue ({profitData.orders} orders)</span>
              <span className="font-semibold text-green-600">{formatCurrency(profitData.revenue)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">COGS</span>
              <span className="font-semibold text-red-600">-{formatCurrency(profitData.totalCOGS)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-red-600">-{formatCurrency(profitData.totalShipping)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Meta Ads</span>
              <span className="font-semibold text-red-600">-{formatCurrency(data.metaAdSpend)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">TikTok Ads</span>
              <span className="font-semibold text-red-600">-{formatCurrency(data.tiktokAdSpend)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Fixed Costs</span>
              <span className="font-semibold text-red-600">-{formatCurrency(profitData.dailyFixedCosts)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Net Profit</span>
                <span className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitData.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitTracker;
