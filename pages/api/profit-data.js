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
