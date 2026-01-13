# Configuration de l'environnement

## Créer le fichier .env

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/commerce_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456789
JWT_EXPIRE=7d
NODE_ENV=development
BOUTIQUE_NAME=Nom de votre boutique
```

## Instructions

1. Copiez le contenu ci-dessus
2. Créez un fichier nommé `.env` dans le dossier `backend/`
3. Collez le contenu
4. **IMPORTANT** : 
   - Changez `JWT_SECRET` par une clé secrète forte et unique en production
   - Modifiez `BOUTIQUE_NAME` avec le nom de votre boutique (ce nom apparaîtra sur tous les PDF générés)

## Vérification

Assurez-vous que :
- MongoDB est en cours d'exécution
- Le fichier `.env` existe dans `backend/`
- Toutes les variables sont définies

