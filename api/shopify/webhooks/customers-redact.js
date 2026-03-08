export default function handler(req, res) {
  // Shopify sends this when a customer requests deletion of their data.
  // Askio does not store any customer data from Shopify stores,
  // so we simply acknowledge the request.
  console.log('Customer redact request received:', JSON.stringify(req.body));
  res.status(200).json({ message: 'Customer redact request acknowledged. Askio does not store customer data.' });
}
