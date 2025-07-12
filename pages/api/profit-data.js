export default async function handler(req, res) {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date parameter required' });
  }

  try {
    const shopifyData = await fetchShopifyData(date);
    
    const result = {
      revenue: shopifyData.revenue,
      orders: shopifyData.orders,
      metaAdSpend: 0,
      tiktokAdSpend: 0
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
