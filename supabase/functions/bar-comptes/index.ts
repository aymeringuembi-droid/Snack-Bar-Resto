// Edge Function « bar-comptes » — comptes de la caisse bar & snack.
//
// Actions :
//   creer_commerce   (sans connexion) : crée un commerce et son premier utilisateur, gérant.
//   ajouter_membre   (gérant)         : ajoute un utilisateur au commerce du gérant.
//   modifier_membre  (gérant)         : nom, rôle, droits gérant, nouveau mot de passe.
//   supprimer_membre (gérant)         : supprime un utilisateur (pas soi-même).
//
// Les utilisateurs sont de vrais comptes Supabase Auth, créés avec la clé service
// (jamais exposée au navigateur) et une adresse e-mail technique, jamais affichée
// ni utilisée pour envoyer des messages. On se connecte avec :
//   nom du commerce + nom d'utilisateur + mot de passe.
// app_metadata.app = 'bar' : le déclencheur de BIG Gestion ignore ces utilisateurs.
//
// Déploiement (sans vérification JWT par la plateforme : creer_commerce est appelée
// sans être connecté ; les autres actions vérifient le jeton ci-dessous) :
//   supabase functions deploy bar-comptes --no-verify-jwt
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const EMAIL_DOMAIN = 'caisse-bar.invalid';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function checkCommerce(nom: string): string | null {
  if (nom.length < 2) return 'Le nom du commerce doit contenir au moins 2 caractères.';
  if (!/[\p{L}\p{N}]/u.test(nom)) return 'Le nom du commerce doit contenir des lettres ou des chiffres.';
  return null;
}
function checkIdentifiant(id: string): string | null {
  if (id.length < 2) return "Le nom d'utilisateur doit contenir au moins 2 caractères.";
  if (!/[\p{L}\p{N}]/u.test(id)) return "Le nom d'utilisateur doit contenir des lettres ou des chiffres.";
  return null;
}
function checkPassword(pw: string): string | null {
  if (pw.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (pw.length > 72) return 'Le mot de passe est trop long (72 caractères maximum).';
  return null;
}
const isUnique = (e: { code?: string } | null) => e?.code === '23505';

async function createAuthUser(admin: SupabaseClient, password: string, commerceId: string) {
  const email = `${crypto.randomUUID()}@${EMAIL_DOMAIN}`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { app: 'bar', commerce_id: commerceId },
  });
  if (error || !data?.user) throw new Error('Création du compte impossible : ' + (error?.message ?? 'erreur inconnue'));
  return { id: data.user.id, email };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Méthode non autorisée.' });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? '');

    // ---------- Création d'un commerce (ouverte à tous, comme une inscription) ----------
    if (action === 'creer_commerce') {
      const commerce = clean(body.commerce, 60);
      const identifiant = clean(body.identifiant, 30);
      const nom = clean(body.nom, 40) || identifiant;
      const password = String(body.mot_de_passe ?? '');
      const bad = checkCommerce(commerce) ?? checkIdentifiant(identifiant) ?? checkPassword(password);
      if (bad) return reply({ error: bad });

      const { data: c, error: ce } = await admin.from('bar_commerces').insert({ nom: commerce }).select('id, nom').single();
      if (ce || !c) {
        if (isUnique(ce)) return reply({ error: 'Ce nom de commerce est déjà utilisé. Choisissez un autre nom, ou connectez-vous.' });
        return reply({ error: 'Création du commerce impossible : ' + (ce?.message ?? '') });
      }
      let userId: string | null = null;
      try {
        const u = await createAuthUser(admin, password, c.id);
        userId = u.id;
        const { error: me } = await admin.from('bar_membres').insert({
          commerce_id: c.id, user_id: u.id, identifiant, nom, role: 'Admin', est_admin: true, email: u.email,
        });
        if (me) throw new Error(me.message);
        const { error: de } = await admin.from('bar_donnees').insert({ commerce_id: c.id, payload: {}, version: 0 });
        if (de) throw new Error(de.message);
        await admin.from('bar_commerces').update({ cree_par: u.id }).eq('id', c.id);
        return reply({ ok: true, commerce_id: c.id, commerce: c.nom });
      } catch (e) {
        // Annulation : rien ne doit rester à moitié créé.
        if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
        await admin.from('bar_commerces').delete().eq('id', c.id);
        return reply({ error: e instanceof Error ? e.message : String(e) });
      }
    }

    // ---------- Actions du gérant : connexion obligatoire ----------
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: who } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    const caller = who?.user;
    if (!caller) return reply({ error: 'Session expirée. Reconnectez-vous.' });
    const { data: me } = await admin.from('bar_membres')
      .select('commerce_id, est_admin, bar_commerces!inner(actif)')
      .eq('user_id', caller.id).eq('bar_commerces.actif', true).maybeSingle();
    if (!me) return reply({ error: "Ce compte n'appartient à aucun commerce actif." });
    if (!me.est_admin) return reply({ error: 'Réservé au gérant.' });
    const commerceId = me.commerce_id as string;

    const adminCount = async () => {
      const { count } = await admin.from('bar_membres').select('user_id', { count: 'exact', head: true })
        .eq('commerce_id', commerceId).eq('est_admin', true);
      return count ?? 0;
    };
    const target = async (userId: string) => {
      const { data } = await admin.from('bar_membres').select('user_id, est_admin, nom')
        .eq('commerce_id', commerceId).eq('user_id', userId).maybeSingle();
      return data;
    };

    if (action === 'ajouter_membre') {
      const identifiant = clean(body.identifiant, 30);
      const nom = clean(body.nom, 40) || identifiant;
      const role = clean(body.role, 30) || 'Employé';
      const estAdmin = role === 'Admin';
      const password = String(body.mot_de_passe ?? '');
      const bad = checkIdentifiant(identifiant) ?? checkPassword(password);
      if (bad) return reply({ error: bad });
      const u = await createAuthUser(admin, password, commerceId);
      const { error: me2 } = await admin.from('bar_membres').insert({
        commerce_id: commerceId, user_id: u.id, identifiant, nom, role, est_admin: estAdmin, email: u.email,
      });
      if (me2) {
        await admin.auth.admin.deleteUser(u.id).catch(() => {});
        if (isUnique(me2)) return reply({ error: "Ce nom d'utilisateur existe déjà dans votre commerce." });
        return reply({ error: 'Ajout impossible : ' + me2.message });
      }
      return reply({ ok: true, user_id: u.id });
    }

    if (action === 'modifier_membre') {
      const userId = String(body.user_id ?? '');
      const t = await target(userId);
      if (!t) return reply({ error: 'Utilisateur introuvable dans votre commerce.' });
      const patch: Record<string, unknown> = {};
      if (body.nom != null) {
        const nom = clean(body.nom, 40);
        if (!nom) return reply({ error: 'Le nom est obligatoire.' });
        patch.nom = nom;
      }
      if (body.role != null) {
        const role = clean(body.role, 30) || 'Employé';
        patch.role = role;
        patch.est_admin = role === 'Admin';
        if (t.est_admin && !patch.est_admin && (await adminCount()) <= 1) {
          return reply({ error: 'Il doit rester au moins un gérant.' });
        }
      }
      const password = String(body.mot_de_passe ?? '');
      if (password) {
        const bad = checkPassword(password);
        if (bad) return reply({ error: bad });
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) return reply({ error: 'Changement du mot de passe impossible : ' + error.message });
      }
      if (Object.keys(patch).length) {
        const { error } = await admin.from('bar_membres').update(patch).eq('commerce_id', commerceId).eq('user_id', userId);
        if (error) return reply({ error: 'Modification impossible : ' + error.message });
      }
      return reply({ ok: true });
    }

    if (action === 'supprimer_membre') {
      const userId = String(body.user_id ?? '');
      if (userId === caller.id) return reply({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
      const t = await target(userId);
      if (!t) return reply({ error: 'Utilisateur introuvable dans votre commerce.' });
      if (t.est_admin && (await adminCount()) <= 1) return reply({ error: 'Il doit rester au moins un gérant.' });
      const { error } = await admin.auth.admin.deleteUser(userId); // supprime aussi la ligne bar_membres (cascade)
      if (error) return reply({ error: 'Suppression impossible : ' + error.message });
      return reply({ ok: true });
    }

    return reply({ error: 'Action inconnue.' });
  } catch (e) {
    return reply({ error: 'Erreur serveur : ' + (e instanceof Error ? e.message : String(e)) });
  }
});
