import FactureSequence from '../models/FactureSequence.model.js';

// Generate invoice number with shop ID to avoid collisions
export const generateFactureNumero = async (Facture, shopId) => {
  const year = new Date().getFullYear();

  // Find or create sequence for this shop/year
  const sequence = await FactureSequence.findOneAndUpdate(
    { shop: shopId, year },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  // Use 6 digits for 999999 factures per year (much safer)
  const numero = `FACT-${year}-${String(sequence.count).padStart(6, '0')}`;
  console.log(`[GENERATOR] Shop: ${shopId}, Year: ${year}, New Count: ${sequence.count}, Result: ${numero}`);

  return numero;
};

// Generate bon commande number
export const generateBonCommandeNumero = async (BonCommande) => {
  const year = new Date().getFullYear();
  const count = await BonCommande.countDocuments({
    numero: new RegExp(`^BC-${year}`)
  });
  return `BC-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Generate bon livraison number
export const generateBonLivraisonNumero = async (BonLivraison) => {
  const year = new Date().getFullYear();
  const count = await BonLivraison.countDocuments({
    numero: new RegExp(`^BL-${year}`)
  });
  return `BL-${year}-${String(count + 1).padStart(6, '0')}`;
};

