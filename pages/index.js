// pages/index.js
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

// ===================================
// API ROUTES
// ===================================

// pages/api/profit-data.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date parameter required' });
  }

  try {
    // Fetch data from all sources in parallel
    const [shopifyData, metaData, tiktokData] = await Promise.all([
      fetchShopifyData(date),
      fetchMetaData(date),
      fetchTikTokData(date)
    ]);

    const result = {
      revenue: shopifyData.revenue,
      orders: shopifyData.orders,
      metaAdSpend: metaData.spend,
      tiktokAdSpend: tiktokData.spend
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching profit data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

// Shopify API function
async function fetchShopifyData(date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const response = await fetch(
    `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10/orders.json?` +
    `created_at_min=${startDate.toISOString()}&` +
    `created_at_max=${endDate.toISOString()}&` +
    `financial_status=paid`,
    {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Shopify data');
  }

  const data = await response.json();
  
  const revenue = data.orders.reduce((sum, order) => {
    return sum + parseFloat(order.total_price);
  }, 0);

  return {
    revenue,
    orders: data.orders.length
  };
}

// Meta API function
async function fetchMetaData(date) {
  const formattedDate = date.replace(/-/g, '');
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${process.env.META_AD_ACCOUNT_ID}/insights?` +
    `time_range={'since':'${formattedDate}','until':'${formattedDate}'}&` +
    `fields=spend&` +
    `access_token=${process.env.META_ACCESS_TOKEN}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Meta data');
  }

  const data = await response.json();
  
  const spend = data.data.length > 0 ? parseFloat(data.data[0].spend) : 0;

  return { spend };
}

// TikTok API function
async function fetchTikTokData(date) {
  const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', {
    method: 'POST',
    headers: {
      'Access-Token': process.env.TIKTOK_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      advertiser_id: process.env.TIKTOK_ADVERTISER_ID,
      report_type: 'BASIC',
      data_level: 'ADVERTISER_LEVEL',
      start_date: date,
      end_date: date,
      metrics: ['spend'],
      dimensions: ['advertiser_id']
    })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch TikTok data');
  }

  const data = await response.json();
  
  const spend = data.data?.list?.[0]?.metrics?.spend || 0;

  return { spend: parseFloat(spend) };
}

// ===================================
// ENVIRONMENT VARIABLES (.env.local)
// ===================================

/*
Create a .env.local file with:

SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token

META_AD_ACCOUNT_ID=your_ad_account_id
META_ACCESS_TOKEN=your_access_token

TIKTOK_ACCESS_TOKEN=your_access_token
TIKTOK_ADVERTISER_ID=your_advertiser_id
*/

// ===================================
// PACKAGE.JSON
// ===================================

/*
{
  "name": "profit-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "lucide-react": "^0.263.1"
  }
}
*/
