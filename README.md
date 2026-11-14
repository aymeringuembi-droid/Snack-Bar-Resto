# Caisse bar & snack — version 1.1

Application de caisse pour bar, snack et restaurant. Un seul fichier HTML, sans bibliothèque externe, reliée à Supabase : chaque commerce a son compte, ses utilisateurs et ses données en ligne. Une copie reste sur chaque appareil pour continuer à encaisser sans connexion.

## Utilisation

Déployer le dépôt tel quel (c'est ce que fait `vercel.json`) : `GestionBar-app.html` + `catalogue-sobraga.js`.

- **Connexion** : nom du commerce, nom d'utilisateur, mot de passe (majuscules, accents et espaces ne comptent pas dans les noms).
- **Créer un nouveau commerce** : bouton sur l'écran de connexion. Crée le commerce et son premier utilisateur (gérant). Si l'appareil contient des données de l'ancienne caisse (version 1.0), elles peuvent être reprises.
- **Employés** : le gérant crée leurs comptes dans Réglages › Équipe (nom d'utilisateur + mot de passe).

### Catalogue SOBRAGA

Tout nouveau commerce démarre avec les boissons SOBRAGA définies dans **`catalogue-sobraga.js`** — le seul fichier à modifier pour corriger les prix. `prix: null` signifie « prix à confirmer » : le produit est signalé dans la caisse et le stock, et ne peut pas être vendu tant que le gérant n'a pas saisi son prix. Seuls les prix de la Régab sont confirmés (janvier 2026 : 600 FCFA la 65 cl, 350 FCFA la 33 cl). Le bouton « Catalogue SOBRAGA » (Stock) ajoute les boissons manquantes à un commerce existant.

### Supabase

- `supabase/migrations/20261114120000_bar_commerces.sql` : tables `bar_commerces`, `bar_membres`, `bar_donnees` (séparées des tables de BIG Gestion), règles RLS, fonctions `bar_email_connexion`, `bar_nom_disponible`, `bar_enregistrer`.
- `supabase/functions/bar-comptes` : création des commerces et des comptes (clé service côté serveur). Déploiement : `supabase functions deploy bar-comptes --no-verify-jwt`.

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

Les données d'un commerce sont enregistrées en un seul bloc. Quand deux appareils modifient en même temps, la caisse fusionne les deux versions (tickets un par un, ventes et entrées de stock additionnées) ; pour un même ticket modifié des deux côtés, la version encaissée l'emporte. Les autres appareils voient les changements en 15 secondes environ. Deux tickets créés au même moment sur deux appareils peuvent recevoir le même numéro. Tout utilisateur du commerce peut techniquement lire toutes les données du commerce (les droits « gérant » sont appliqués dans l'application).
