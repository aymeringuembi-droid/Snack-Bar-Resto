/* =====================================================================
   CATALOGUE SOBRAGA — produits créés automatiquement dans tout nouveau commerce
   =====================================================================

   C'est le SEUL fichier à modifier pour corriger les prix.

   Pour chaque produit :
     nom      : nom affiché sur la carte et le ticket
     cat      : catégorie (Bières, Sodas, Eaux…)
     prix     : prix de vente homologué à l'unité, en FCFA.
                null = PRIX À CONFIRMER : le produit est créé mais ne peut pas
                être vendu tant que le gérant n'a pas saisi son prix
                (badge « Prix à confirmer » dans la caisse et le stock).
     casier   : nombre de bouteilles par casier / pack pour la commande
                fournisseur (null = achat à l'unité).
     aVerifier: remarque affichée seulement ici, pour savoir quoi vérifier.

   Quand un prix est confirmé : remplacer null par le prix (ex. prix: 500),
   puis publier. Les nouveaux commerces auront ce prix. Les commerces déjà
   créés gardent leurs prix (à changer dans Stock › Modifier le produit).

   Sources :
   - Régab : réajustement tarifaire annoncé par la SOBRAGA en janvier 2026,
     prix de vente homologués 600 FCFA (65 cl) et 350 FCFA (33 cl).
   - Liste des marques : marques citées comme produites ou distribuées par
     la SOBRAGA (bières, sodas, eaux). La liste, les formats et les tailles de
     casier sont à vérifier avec la grille officielle SOBRAGA.
   ===================================================================== */
window.CATALOGUE_SOBRAGA = {
  version: "2026-01",
  produits: [
    /* ---------- Bières ---------- */
    { nom: "Régab 65 cl",          cat: "Bières", prix: 600,  casier: 12, aVerifier: "Prix confirmé (janvier 2026). Taille du casier à vérifier." },
    { nom: "Régab 33 cl",          cat: "Bières", prix: 350,  casier: 24, aVerifier: "Prix confirmé (janvier 2026). Taille du casier à vérifier." },
    { nom: "Castel Beer 65 cl",    cat: "Bières", prix: null, casier: 12, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "33 Export 65 cl",      cat: "Bières", prix: null, casier: 12, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "Beaufort 65 cl",       cat: "Bières", prix: null, casier: 12, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "Beaufort Light",       cat: "Bières", prix: null, casier: 24, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "Guinness",             cat: "Bières", prix: null, casier: 24, aVerifier: "Prix, format et casier à confirmer." },

    /* ---------- Sodas ---------- */
    { nom: "Coca-Cola",            cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "Fanta",                cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, parfums et casier à confirmer." },
    { nom: "Sprite",               cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "D'jino",               cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, parfums et casier à confirmer." },
    { nom: "Top",                  cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, parfums et casier à confirmer." },
    { nom: "World Cola",           cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format et casier à confirmer." },
    { nom: "Orangina",             cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, casier et présence dans la gamme actuelle à confirmer." },
    { nom: "Schweppes",            cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, casier et présence dans la gamme actuelle à confirmer." },
    { nom: "Vimto",                cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, casier et présence dans la gamme actuelle à confirmer." },
    { nom: "Sumol",                cat: "Sodas",  prix: null, casier: 24, aVerifier: "Prix, format, casier et présence dans la gamme actuelle à confirmer." },

    /* ---------- Eaux ---------- */
    { nom: "Andza",                cat: "Eaux",   prix: null, casier: 12, aVerifier: "Prix, format et taille du pack à confirmer." },
    { nom: "Akewa",                cat: "Eaux",   prix: null, casier: 12, aVerifier: "Prix, format et taille du pack à confirmer." },
    { nom: "Aning'eau",            cat: "Eaux",   prix: null, casier: 12, aVerifier: "Prix, format, pack et présence dans la gamme actuelle à confirmer." },
    { nom: "Vitale",               cat: "Eaux",   prix: null, casier: 12, aVerifier: "Prix, format, pack et présence dans la gamme actuelle à confirmer." }
  ]
};
