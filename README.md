# Caisse bar & snack — version 1.0

Application de caisse pour bar, snack et restaurant. Un seul fichier HTML, sans dépendance externe : elle fonctionne aussi sans connexion une fois chargée.

## Utilisation

Ouvrir `GestionBar-app.html` dans un navigateur, ou déployer tel quel (c'est ce que fait `vercel.json`).

Connexion de démonstration : Awa / Serge / Gérant, code PIN `1234`. Code d'invitation par défaut : `BAOBAB`. Les deux se changent dans Réglages.

## Fonctionnalités

- **Salle** : plan de tables (libre / occupée, montant dû, durée), indicateurs du service, liste de tous les tickets en cours, y compris ceux sans table.
- **Tickets** : carte par catégories, quantités, « offrir à une table », changement de table, avance, **remise** (en % ou en montant), **note**, impression et **envoi du ticket par WhatsApp**.
- **Encaissement** : espèces (compte juste, montants suggérés, monnaie à rendre), carte ou mobile money avec référence de transaction.
- **Prix jour / nuit** par produit, avec heures de début et de fin réglables.
- **Stock** : niveaux, alertes de stock bas et de rupture, valeur du stock, produits « à la demande » sans suivi, import CSV, **commande fournisseur** (copier, imprimer, WhatsApp).
- **Journal** : tickets réglés par période, recherche, export pour Excel (CSV), activité de la caisse avec le nom de l'employé.
- **Bilan** (gérant) : chiffre d'affaires, panier moyen, marge estimée, remises, ventes sur 7 jours, par moyen de paiement, par employé et par produit.
- **Réglages** (gérant) : nom, adresse, téléphone, devise, message du ticket et couleur de la marque ; équipe (rôles et codes PIN) ; tables ; sauvegarde et restauration.
- **Rôles** : seul le rôle « Gérant » accède au bilan, aux réglages, aux prix et aux corrections de stock.
- Thème clair ou sombre, affichage téléphone ou ordinateur (automatique ou forcé).

## Mises à jour

La version installée est affichée dans la barre latérale, sur l'écran de connexion et dans Réglages → Mises à jour. La caisse vérifie toute seule s'il existe une nouvelle version (au démarrage et toutes les 15 minutes) et affiche « Mise à jour disponible » avec un bouton pour l'installer. Après l'installation, une fenêtre présente les nouveautés. Les données ne sont jamais effacées.

Pour publier une nouvelle version (ex. 1.1), dans `GestionBar-app.html` :

1. changer le numéro dans `<meta name="app-version" content="…">` (en haut) **et** dans `APP_VERSION` ;
2. ajouter une entrée en tête de `CHANGELOG` avec la liste des nouveautés ;
3. si le format des données change, ajouter une étape dans `MIGRATIONS` ;
4. publier sur la branche `main` : Vercel met l'adresse à jour, et les caisses ouvertes proposent la mise à jour.

## Limites à connaître

Les données sont enregistrées uniquement dans le navigateur de l'appareil utilisé (`localStorage`). Il n'y a pas de synchronisation entre un téléphone et un ordinateur : utiliser Réglages → Données pour sauvegarder et restaurer. Les codes PIN protègent l'usage courant, pas contre une personne qui a accès au navigateur. Pour une synchronisation en temps réel et de vrais comptes, il faut une base de données partagée (ex. Supabase).
