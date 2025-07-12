export default async function handler(req, res) {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date parameter required' });
  }

  try {
    // Fetch both Shopify and Meta data
    const [shopifyData, metaData] = await Promise.all([
      fetchShopifyData(date),
      fetchMetaData(date)
    ]);
    
    const result = {
      revenue: shopifyData.revenue,
      orders: shopifyData.orders,
      metaAdSpend: metaData.spend,
      tiktokAdSpend: 0 // Still hardcoded for now
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

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
    throw new Error(`Shopify API error: ${response.status}`);
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

async function fetchMetaData(date) {
  // Meta API needs date format without dashes
  const formattedDate = date.replace(/-/g, '');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.META_AD_ACCOUNT_ID}/insights?` +
    `time_range={"since":"${formattedDate}","until":"${formattedDate}"}&` +
    `fields=spend&` +
    `access_token=${process.env.META_ACCESS_TOKEN}`;
    
  console.log('Meta API URL:', url);
  
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Meta API error:', response.status, errorText);
    throw new Error(`Meta API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Meta API response:', data);
  
  const spend = data.data && data.data.length > 0 ? parseFloat(data.data[0].spend) : 0;

  return { spend };
}
