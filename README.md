# Le Baobab — Caisse

Application de caisse pour bar et snack (fichier unique HTML, sans dépendance externe).

## Utilisation

Ouvrir `GestionBar-app.html` dans un navigateur, ou déployer tel quel (c'est ce que fait `vercel.json`).

Connexion de démonstration : Awa / Serge / Gérant, code PIN `1234`. Code d'invitation pour rejoindre le compte : `BAOBAB`.

## Fonctionnalités

- Salle avec plan de tables, tickets par client (avec ou sans table). Plusieurs tickets peuvent être ouverts sur une même table ; un bilan (total, avancé, reste à payer) s'affiche pour toute la table dès qu'elle a plus d'un ticket en cours.
- Catalogue par catégories, ajout au ticket, "offrir" un article à une autre table (l'article reste facturé au ticket d'origine, seul le service change de table).
- "Changer de table" pour relier ou déplacer un ticket.
- Avance client, encaissement (espèces avec calcul de la monnaie, carte, mobile money)
- Déduction du stock à l'encaissement, alertes de stock bas / rupture
- **Prix jour / nuit** par produit : chaque article a un tarif jour et un tarif nuit ; l'heure de bascule vers le tarif nuit se règle dans Salle → ⚙ Réglages (le tarif nuit s'applique jusqu'à 6h du matin).
- **Impression du ticket** (aperçu avant caisse ou reçu final) au format ticket de caisse
- Gestion du stock (ajout/édition/suppression de produits, import CSV, stock optimal par produit)
- **Commande à faire** : dans l'onglet Stock, liste automatique des produits sous leur stock optimal avec la quantité à recommander, copiable en un clic.
- **Bilan** : nouvel onglet avec le total des tickets en cours par employé, et deux camemberts (chiffre d'affaires du jour par employé, boissons les plus rentables du jour).
- Journal des tickets réglés et des mouvements de stock
- **Deux modes d'affichage** : mobile (écrans empilés, plein écran) et bureau/PC (barre latérale + panneaux), avec bascule automatique selon la largeur d'écran ou forçage manuel via le bouton "Auto / PC / Téléphone" dans l'en-tête.
- Réglages (⚙ dans Salle) : heure de bascule jour/nuit, et un champ pour une future clé API d'assistant IA (aucun appel n'est encore envoyé — le champ prépare juste l'intégration).

## Limites à connaître

Les données (produits, tickets, stock) sont stockées uniquement dans le navigateur de l'appareil utilisé (`localStorage`), il n'y a pas de synchronisation automatique entre un téléphone et un PC. Utilisez "Exporter les données" / "Importer" dans l'onglet Journal pour transférer l'état d'un appareil à l'autre. Pour une synchronisation en temps réel entre plusieurs appareils, il faudrait ajouter une base de données partagée (ex. Supabase).
