export default function handler(req, res) {
  // Shopify sends this when a customer requests their data.
  // Askio does not store any customer data from Shopify stores,
  // so we simply acknowledge the request.
  console.log('Customer data request received:', JSON.stringify(req.body));
  res.status(200).json({ message: 'Customer data request acknowledged. Askio does not store customer data.' });
}
