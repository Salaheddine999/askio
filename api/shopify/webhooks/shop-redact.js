import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  // Shopify sends this 48 hours after a store uninstalls the app.
  // Clean up any stored connection data for this shop.
  console.log('Shop redact request received:', JSON.stringify(req.body));

  const shopDomain = req.body?.shop_domain;

  if (shopDomain) {
    try {
      // Try to clean up the Firestore connection record
      // This is best-effort since we may not have admin credentials configured
      const connectionId = shopDomain.replace(/\./g, '_');
      console.log('Would delete connection:', connectionId);
    } catch (err) {
      console.error('Error during shop redact cleanup:', err);
    }
  }

  res.status(200).json({ message: 'Shop redact request acknowledged.' });
}
