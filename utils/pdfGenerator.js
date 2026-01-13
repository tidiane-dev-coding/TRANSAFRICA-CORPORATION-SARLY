import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-GN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to draw header with colored bar
const drawHeader = (doc, title, numero, date, boutiqueName = 'Gestion Commerciale', logoPath = null) => {
  // Colored header bar (reduced height)
  doc.rect(0, 0, doc.page.width, 60)
     .fillColor('#1e40af')
     .fill()
     .fillColor('#000000');
  
  // Boutique name (more visible, top left)
  doc.fillColor('#ffffff')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text(boutiqueName, 50, 8, { align: 'left' });

  // Logo (top-right) if provided
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const imgWidth = 70;
      const imgX = doc.page.width - imgWidth - 50;
      doc.image(logoPath, imgX, 8, { width: imgWidth, align: 'right' });
    } catch (err) {
      // ignore image errors
    }
  }
  
  // Title (main)
  doc.fillColor('#ffffff')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(title, 50, 25, { align: 'left' });
  
  doc.fillColor('#000000');
  
  // Document info box (compact)
  const infoY = 70;
  doc.rect(350, infoY - 5, 200, 45)
     .fillColor('#f3f4f6')
     .fill()
     .fillColor('#000000');
  
  doc.fontSize(9)
     .fillColor('#6b7280')
     .text('N° Document', 360, infoY);
  doc.fontSize(11)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(numero, 360, infoY + 10);
  
  doc.fontSize(9)
     .fillColor('#6b7280')
     .text('Date', 360, infoY + 25);
  doc.fontSize(10)
     .fillColor('#000000')
     .text(date, 360, infoY + 35);
  
  return 125; // Return Y position after header
};

// Helper function to draw info box (compact)
const drawInfoBox = (doc, title, data, startY) => {
  let y = startY;
  
  // Box background (reduced height)
  doc.rect(50, y - 5, 280, 60)
     .fillColor('#f9fafb')
     .fill()
     .fillColor('#000000');
  
  // Title
  doc.fontSize(10)
     .fillColor('#1e40af')
     .font('Helvetica-Bold')
     .text(title, 60, y);
  
  y += 15;
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica');
  
  if (data.nom) {
    doc.font('Helvetica-Bold').text(data.nom, 60, y);
    y += 12;
    doc.font('Helvetica');
  }
  
  if (data.adresse) {
    doc.text(data.adresse, 60, y);
    y += 10;
  }
  
  if (data.ville) {
    const villeText = `${data.codePostal || ''} ${data.ville}`.trim();
    if (villeText) {
      doc.text(villeText, 60, y);
      y += 10;
    }
  }
  
  if (data.telephone) {
    doc.text(`Tél: ${data.telephone}`, 60, y);
    y += 10;
  }
  
  if (data.email) {
    doc.text(`Email: ${data.email}`, 60, y);
  }
  
  return y + 20;
};

// Helper function to draw table (compact)
const drawTable = (doc, headers, rows, startY) => {
  let y = startY;
  const colWidths = [200, 60, 100, 100];
  const colX = [50, 260, 330, 440];
  
  // Table header with background (reduced height)
  doc.rect(50, y - 3, 500, 18)
     .fillColor('#1e40af')
     .fill()
     .fillColor('#ffffff');
  
  doc.fontSize(9)
     .font('Helvetica-Bold');
  
  headers.forEach((header, i) => {
    doc.text(header, colX[i], y, { 
      width: colWidths[i], 
      align: i >= 2 ? 'right' : 'left' 
    });
  });
  
  y += 18;
  doc.fillColor('#000000');
  
  // Table rows (reduced height)
  doc.font('Helvetica')
     .fontSize(8);
  
  // Limit rows to fit on one page (max 15 rows visible)
  const maxRows = Math.min(rows.length, 15);
  const visibleRows = rows.slice(0, maxRows);
  
  visibleRows.forEach((row, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.rect(50, y - 2, 500, 15)
         .fillColor('#f9fafb')
         .fill()
         .fillColor('#000000');
    }
    
    row.forEach((cell, i) => {
      doc.text(cell, colX[i], y, { 
        width: colWidths[i], 
        align: i >= 2 ? 'right' : 'left' 
      });
    });
    
    y += 15;
  });
  
  // Show message if rows are truncated
  if (rows.length > maxRows) {
    doc.fontSize(7)
       .fillColor('#6b7280')
       .text(`... et ${rows.length - maxRows} autres articles`, 50, y + 5);
    y += 10;
  }
  
  // Bottom border
  doc.moveTo(50, y).lineTo(550, y).stroke();
  
  return y + 10;
};

// Generate PDF for invoice
export const generateFacturePDF = (facture, client, user, boutiqueName = null, settings = null, shop = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0,
        info: {
          Title: `Facture ${facture.numero}`,
          Author: 'Gestion Commerciale',
          Subject: 'Facture',
        }
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Set margins
      doc.page.margins = { top: 0, bottom: 50, left: 50, right: 50 };

      // Header (returns Y position)
      const boutiqueNameToUse = boutiqueName || process.env.BOUTIQUE_NAME || 'Gestion Commerciale';
      // Prepare logo path if shop has logo
      let logoPath = null;
      if (shop && shop.logo) {
        const candidate = path.join(__dirname, '../uploads/logos', shop.logo);
        if (fs.existsSync(candidate)) logoPath = candidate;
      }

      const headerEndY = drawHeader(
        doc, 
        'FACTURE', 
        facture.numero,
        new Date(facture.dateFacture).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        boutiqueNameToUse,
        logoPath
      );

      // Boutique info (if settings provided)
      let currentY = headerEndY;
      if (settings && (settings.adresse || settings.telephone || settings.email || settings.ville)) {
        currentY = drawInfoBox(doc, 'INFORMATIONS BOUTIQUE', {
          nom: boutiqueNameToUse,
          adresse: settings.adresse,
          ville: settings.ville,
          codePostal: settings.codePostal,
          telephone: settings.telephone,
          email: settings.email
        }, headerEndY);
        currentY += 5; // Small gap
      }

      // Client info (compact)
      const clientY = drawInfoBox(doc, 'INFORMATIONS CLIENT', {
        nom: `${client.prenom || ''} ${client.nom}`.trim(),
        adresse: client.adresse,
        ville: client.ville,
        codePostal: client.codePostal,
        telephone: client.telephone,
        email: client.email
      }, currentY);

      // Articles table
      doc.fontSize(10)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('DÉTAIL DES ARTICLES', 50, clientY);
      
      const tableHeaders = ['Produit', 'Qté', 'Prix unit.', 'Montant'];
      const tableRows = facture.articles.map(article => [
        article.product?.nom || 'Produit',
        article.quantite.toString(),
        `${formatCurrency(article.prixUnitaire)} GNF`,
        `${formatCurrency(article.montant)} GNF`
      ]);

      let tableEndY = drawTable(doc, tableHeaders, tableRows, clientY + 15);

      // Totals box (compact)
      const totalsX = 350;
      const totalsHeight = 60;
      doc.rect(totalsX, tableEndY - 3, 200, totalsHeight)
         .fillColor('#f3f4f6')
         .fill()
         .fillColor('#000000');

      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('SOUS-TOTAL', totalsX + 10, tableEndY);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(facture.montantTotal)} GNF`, totalsX + 10, tableEndY + 10, { align: 'right', width: 180 });

      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('MONTANT PAYÉ', totalsX + 10, tableEndY + 22);
      doc.fontSize(10)
         .fillColor('#10b981')
         .text(`${formatCurrency(facture.montantPaye)} GNF`, totalsX + 10, tableEndY + 32, { align: 'right', width: 180 });

      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('MONTANT RESTANT', totalsX + 10, tableEndY + 42);
      doc.fontSize(11)
         .fillColor(facture.montantRestant > 0 ? '#ef4444' : '#10b981')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(facture.montantRestant)} GNF`, totalsX + 10, tableEndY + 52, { align: 'right', width: 180 });

      currentY = tableEndY + totalsHeight + 10;

      // Status badge (compact)
      const statusColors = {
        'paye': '#10b981',
        'partiel': '#f59e0b',
        'non_paye': '#ef4444'
      };
      const statusTexts = {
        'paye': 'PAYÉ',
        'partiel': 'PARTIEL',
        'non_paye': 'NON PAYÉ'
      };
      
      const statusColor = statusColors[facture.statut] || '#6b7280';
      const statusText = statusTexts[facture.statut] || facture.statut.toUpperCase();
      
      doc.rect(50, currentY - 3, 120, 18)
         .fillColor(statusColor)
         .fill()
         .fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(statusText, 50, currentY, { width: 120, align: 'center' });

      currentY += 25;

      // Notes (compact, only if space available)
      if (facture.notes && currentY < 750) {
        doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('NOTES:', 50, currentY);
        const notesText = facture.notes.length > 100 ? facture.notes.substring(0, 100) + '...' : facture.notes;
        doc.font('Helvetica')
           .fillColor('#4b5563')
           .fontSize(8)
           .text(notesText, 50, currentY + 12, { width: 450 });
        currentY += 30;
      }

      // Footer (compact)
      const pageHeight = doc.page.height;
      doc.moveTo(50, pageHeight - 40)
         .lineTo(550, pageHeight - 40)
         .strokeColor('#e5e7eb')
         .stroke();
      
      doc.fontSize(7)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(`Document généré électroniquement - ${boutiqueNameToUse}`, 50, pageHeight - 32, { align: 'center', width: 500 });
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} par ${user?.nom || 'Système'}`, 50, pageHeight - 25, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate PDF for bon de commande
export const generateBonCommandePDF = (bonCommande, fournisseur, user, boutiqueName = null, settings = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0,
        info: {
          Title: `Bon de Commande ${bonCommande.numero}`,
          Author: 'Gestion Commerciale',
          Subject: 'Bon de Commande',
        }
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.page.margins = { top: 0, bottom: 50, left: 50, right: 50 };

      // Header
      const boutiqueNameToUse = boutiqueName || process.env.BOUTIQUE_NAME || 'Gestion Commerciale';
      const headerEndY = drawHeader(
        doc, 
        'BON DE COMMANDE', 
        bonCommande.numero,
        new Date(bonCommande.dateCommande).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        boutiqueNameToUse
      );

      // Boutique info (if settings provided)
      let currentY = headerEndY;
      if (settings && (settings.adresse || settings.telephone || settings.email || settings.ville)) {
        currentY = drawInfoBox(doc, 'INFORMATIONS BOUTIQUE', {
          nom: boutiqueNameToUse,
          adresse: settings.adresse,
          ville: settings.ville,
          codePostal: settings.codePostal,
          telephone: settings.telephone,
          email: settings.email
        }, headerEndY);
        currentY += 5; // Small gap
      }

      // Fournisseur info
      const fournisseurY = drawInfoBox(doc, 'INFORMATIONS FOURNISSEUR', {
        nom: fournisseur.nom,
        adresse: fournisseur.adresse,
        ville: fournisseur.ville,
        codePostal: fournisseur.codePostal,
        telephone: fournisseur.telephone,
        email: fournisseur.email
      }, currentY);

      // Articles table
      doc.fontSize(10)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('DÉTAIL DES ARTICLES', 50, fournisseurY);
      
      const tableHeaders = ['Produit', 'Qté', 'Prix unit.', 'Montant'];
      const tableRows = bonCommande.articles.map(article => [
        article.product?.nom || 'Produit',
        article.quantite.toString(),
        `${formatCurrency(article.prixUnitaire)} GNF`,
        `${formatCurrency(article.montant)} GNF`
      ]);

      let tableEndY = drawTable(doc, tableHeaders, tableRows, fournisseurY + 15);

      // Total box (compact)
      doc.rect(350, tableEndY - 3, 200, 25)
         .fillColor('#f3f4f6')
         .fill()
         .fillColor('#000000');

      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('TOTAL', 360, tableEndY);
      doc.fontSize(12)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(bonCommande.montantTotal)} GNF`, 360, tableEndY + 10, { align: 'right', width: 180 });

      currentY = tableEndY + 35;

      // Status badge (compact)
      const statusColors = {
        'en_attente': '#f59e0b',
        'confirme': '#3b82f6',
        'livre': '#10b981',
        'annule': '#ef4444'
      };
      const statusTexts = {
        'en_attente': 'EN ATTENTE',
        'confirme': 'CONFIRMÉ',
        'livre': 'LIVRÉ',
        'annule': 'ANNULÉ'
      };
      
      const statusColor = statusColors[bonCommande.statut] || '#6b7280';
      const statusText = statusTexts[bonCommande.statut] || bonCommande.statut.toUpperCase();
      
      doc.rect(50, currentY - 3, 120, 18)
         .fillColor(statusColor)
         .fill()
         .fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(statusText, 50, currentY, { width: 120, align: 'center' });

      currentY += 25;

      // Date livraison prévue (compact)
      if (bonCommande.dateLivraisonPrevue && currentY < 750) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .text('Livraison prévue:', 50, currentY);
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(new Date(bonCommande.dateLivraisonPrevue).toLocaleDateString('fr-FR'), 180, currentY);
        currentY += 20;
      }

      // Notes (compact, only if space available)
      if (bonCommande.notes && currentY < 750) {
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('NOTES:', 50, currentY);
        const notesText = bonCommande.notes.length > 100 ? bonCommande.notes.substring(0, 100) + '...' : bonCommande.notes;
        doc.font('Helvetica')
           .fillColor('#4b5563')
           .fontSize(8)
           .text(notesText, 50, currentY + 12, { width: 450 });
        currentY += 30;
      }

      // Footer (compact)
      const pageHeight = doc.page.height;
      doc.moveTo(50, pageHeight - 40)
         .lineTo(550, pageHeight - 40)
         .strokeColor('#e5e7eb')
         .stroke();
      
      doc.fontSize(7)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(`Document généré électroniquement - ${boutiqueNameToUse}`, 50, pageHeight - 32, { align: 'center', width: 500 });
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} par ${user?.nom || 'Système'}`, 50, pageHeight - 25, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate PDF for bon de livraison
export const generateBonLivraisonPDF = (bonLivraison, client, user, boutiqueName = null, settings = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0,
        info: {
          Title: `Bon de Livraison ${bonLivraison.numero}`,
          Author: 'Gestion Commerciale',
          Subject: 'Bon de Livraison',
        }
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.page.margins = { top: 0, bottom: 50, left: 50, right: 50 };

      // Header
      const boutiqueNameToUse = boutiqueName || process.env.BOUTIQUE_NAME || 'Gestion Commerciale';
      const headerEndY = drawHeader(
        doc, 
        'BON DE LIVRAISON', 
        bonLivraison.numero,
        new Date(bonLivraison.dateLivraison).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        boutiqueNameToUse
      );

      // Boutique info (if settings provided)
      let currentY = headerEndY;
      if (settings && (settings.adresse || settings.telephone || settings.email || settings.ville)) {
        currentY = drawInfoBox(doc, 'INFORMATIONS BOUTIQUE', {
          nom: boutiqueNameToUse,
          adresse: settings.adresse,
          ville: settings.ville,
          codePostal: settings.codePostal,
          telephone: settings.telephone,
          email: settings.email
        }, headerEndY);
        currentY += 5; // Small gap
      }

      // Client info
      const clientY = drawInfoBox(doc, 'INFORMATIONS CLIENT', {
        nom: `${client.prenom || ''} ${client.nom}`.trim(),
        adresse: client.adresse,
        ville: client.ville,
        codePostal: client.codePostal,
        telephone: client.telephone,
        email: client.email
      }, currentY);

      // Articles table
      doc.fontSize(10)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('DÉTAIL DES ARTICLES', 50, clientY);
      
      const tableHeaders = ['Produit', 'Qté', 'Prix unit.', 'Montant'];
      const tableRows = bonLivraison.articles.map(article => [
        article.product?.nom || 'Produit',
        article.quantite.toString(),
        `${formatCurrency(article.prixUnitaire)} GNF`,
        `${formatCurrency(article.montant)} GNF`
      ]);

      let tableEndY = drawTable(doc, tableHeaders, tableRows, clientY + 15);

      // Total box (compact)
      doc.rect(350, tableEndY - 3, 200, 25)
         .fillColor('#f3f4f6')
         .fill()
         .fillColor('#000000');

      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('TOTAL', 360, tableEndY);
      doc.fontSize(12)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(bonLivraison.montantTotal)} GNF`, 360, tableEndY + 10, { align: 'right', width: 180 });

      currentY = tableEndY + 35;

      // Transporteur (compact)
      if (bonLivraison.transporteur && currentY < 750) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .text('Transporteur:', 50, currentY);
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(bonLivraison.transporteur, 150, currentY);
        currentY += 20;
      }

      // Notes (compact, only if space available)
      if (bonLivraison.notes && currentY < 750) {
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('NOTES:', 50, currentY);
        const notesText = bonLivraison.notes.length > 100 ? bonLivraison.notes.substring(0, 100) + '...' : bonLivraison.notes;
        doc.font('Helvetica')
           .fillColor('#4b5563')
           .fontSize(8)
           .text(notesText, 50, currentY + 12, { width: 450 });
        currentY += 30;
      }

      // Signature section (compact, only if space available)
      if (currentY < 750) {
        currentY += 15;
        doc.moveTo(50, currentY)
           .lineTo(550, currentY)
           .strokeColor('#e5e7eb')
           .stroke();
        
        currentY += 20;
        doc.fontSize(8)
           .fillColor('#6b7280')
           .text('Signature client', 50, currentY);
        doc.text('Signature expéditeur', 350, currentY);
      }

      // Footer (compact)
      const pageHeight = doc.page.height;
      doc.moveTo(50, pageHeight - 40)
         .lineTo(550, pageHeight - 40)
         .strokeColor('#e5e7eb')
         .stroke();
      
      doc.fontSize(7)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(`Document généré électroniquement - ${boutiqueNameToUse}`, 50, pageHeight - 32, { align: 'center', width: 500 });
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} par ${user?.nom || 'Système'}`, 50, pageHeight - 25, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate PDF for versement receipt
export const generateVersementPDF = (confie, versement, versementIndex, user, boutiqueName = null, settings = null, shop = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0,
        info: {
          Title: `Reçu de Versement - ${confie.beneficiaire}`,
          Author: 'Gestion Commerciale',
          Subject: 'Reçu de Versement',
        }
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.page.margins = { top: 0, bottom: 50, left: 50, right: 50 };

      // Header
      const boutiqueNameToUse = boutiqueName || shop?.nom || process.env.BOUTIQUE_NAME || 'Gestion Commerciale';
      const dateVersement = new Date(versement.dateVersement).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Prepare logo path if shop has logo
      let logoPath = null;
      if (shop && shop.logo) {
        const candidate = path.join(__dirname, '../uploads/logos', shop.logo);
        if (fs.existsSync(candidate)) logoPath = candidate;
      }

      const headerEndY = drawHeader(
        doc, 
        'REÇU DE VERSEMENT', 
        `VERS-${confie._id.toString().slice(-6)}-${versementIndex + 1}`,
        dateVersement,
        boutiqueNameToUse,
        logoPath
      );

      // Boutique info (if settings provided)
      let currentY = headerEndY;
      if (settings && (settings.adresse || settings.telephone || settings.email || settings.ville)) {
        currentY = drawInfoBox(doc, 'INFORMATIONS BOUTIQUE', {
          nom: boutiqueNameToUse,
          adresse: settings.adresse,
          ville: settings.ville,
          codePostal: settings.codePostal,
          telephone: settings.telephone,
          email: settings.email
        }, headerEndY);
        currentY += 5;
      } else if (shop) {
        currentY = drawInfoBox(doc, 'INFORMATIONS BOUTIQUE', {
          nom: shop.nom,
          adresse: shop.adresse,
          ville: shop.ville,
          codePostal: shop.codePostal,
          telephone: shop.telephone,
          email: shop.email
        }, headerEndY);
        currentY += 5;
      }

      // Bénéficiaire info
      const beneficiaireY = drawInfoBox(doc, 'BÉNÉFICIAIRE', {
        nom: confie.beneficiaire
      }, currentY);

      // Versement details box
      const detailsY = beneficiaireY + 10;
      doc.rect(50, detailsY - 5, 500, 120)
         .fillColor('#f9fafb')
         .fill()
         .fillColor('#000000');

      doc.fontSize(12)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('DÉTAILS DU VERSEMENT', 60, detailsY);

      let y = detailsY + 20;

      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Montant confié:', 60, y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(confie.montantConfie)} GNF`, 200, y);
      y += 18;

      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Montant du versement:', 60, y);
      doc.fontSize(14)
         .fillColor('#10b981')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(versement.montant)} GNF`, 200, y);
      y += 20;

      const totalVersements = confie.versements.reduce((sum, v) => sum + v.montant, 0);
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Total versé:', 60, y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(totalVersements)} GNF`, 200, y);
      y += 18;

      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Solde restant:', 60, y);
      doc.fontSize(11)
         .fillColor(confie.soldeRestant > 0 ? '#ef4444' : '#10b981')
         .font('Helvetica-Bold')
         .text(`${formatCurrency(confie.soldeRestant)} GNF`, 200, y);

      // Notes section
      let notesY = detailsY + 130;
      if (versement.notes || confie.motif) {
        doc.fontSize(10)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text('NOTES', 60, notesY);
        notesY += 15;
        
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica');
        
        if (versement.notes) {
          doc.text(`Versement: ${versement.notes}`, 60, notesY, { width: 490 });
          notesY += 15;
        }
        
        if (confie.motif) {
          doc.text(`Motif du confié: ${confie.motif}`, 60, notesY, { width: 490 });
          notesY += 15;
        }
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text(`Document généré électroniquement - ${boutiqueNameToUse}`, 50, pageHeight - 32, { align: 'center', width: 500 });
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} par ${user?.nom || 'Système'}`, 50, pageHeight - 25, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};