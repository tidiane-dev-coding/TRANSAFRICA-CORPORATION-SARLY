// Generate invoice number
export const generateFactureNumero = async (Facture) => {
  const year = new Date().getFullYear();
  const count = await Facture.countDocuments({
    numero: new RegExp(`^FACT-${year}`)
  });
  return `FACT-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Generate bon commande number
export const generateBonCommandeNumero = async (BonCommande) => {
  const year = new Date().getFullYear();
  const count = await BonCommande.countDocuments({
    numero: new RegExp(`^BC-${year}`)
  });
  return `BC-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Generate bon livraison number
export const generateBonLivraisonNumero = async (BonLivraison) => {
  const year = new Date().getFullYear();
  const count = await BonLivraison.countDocuments({
    numero: new RegExp(`^BL-${year}`)
  });
  return `BL-${year}-${String(count + 1).padStart(4, '0')}`;
};

