import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div className="page-stack legal-page">
      <header className="page-head">
        <p className="eyebrow">Informations légales</p>
        <h1>Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : 28 octobre 2026 — version 1.0</p>
      </header>

      <section className="panel">
        <div className="legal-content">
          <p className="legal-summary">
            <strong>L’essentiel.</strong> DiwaneKiram ne demande aucune inscription et n’utilise
            ni cookie publicitaire ni outil de suivi. Vos favoris, votre historique de lecture et
            vos préférences restent dans votre navigateur. Les informations que vous nous envoyez
            servent uniquement à vous répondre ou à traiter votre signalement.
          </p>

          <p>
            La présente politique explique quelles données peuvent être traitées lorsque vous
            consultez DiwaneKiram, pourquoi elles le sont, combien de temps elles sont conservées
            et comment exercer vos droits.
          </p>

          <section className="legal-block">
            <h2>1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement est l’éditeur du site <strong>DiwaneKiram</strong>,
              accessible à l’adresse{' '}
              <a href="https://diwanekiram.vercel.app/">https://diwanekiram.vercel.app</a>.
            </p>
            <p>
              Pour toute question relative à vos données personnelles, vous pouvez écrire à{' '}
              <a href="mailto:mbayec035@gmail.com">mbayec035@gmail.com</a>. Aucun délégué à la
              protection des données n’a été désigné : les demandes sont traitées directement par
              l’éditeur du site.
            </p>
          </section>

          <section className="legal-block">
            <h2>2. Données susceptibles d’être traitées</h2>

            <h3>Données techniques de consultation</h3>
            <p>
              Comme tout site internet, DiwaneKiram est hébergé sur des serveurs qui peuvent
              enregistrer automatiquement des données techniques : adresse IP, date et heure de la
              requête, page demandée, type et version du navigateur, système d’exploitation,
              éventuels messages d’erreur. Ces données servent à faire fonctionner le site, à
              assurer sa sécurité et à prévenir les abus.
            </p>

            <h3>Données enregistrées dans votre navigateur</h3>
            <p>
              Certaines fonctionnalités reposent sur le stockage local de votre appareil
              (<em>localStorage</em>). Ces informations ne sont pas transmises à nos serveurs.
              Elles comprennent notamment :
            </p>
            <ul>
              <li>vos favoris et votre historique de lecture, limité aux 60 dernières œuvres ;</li>
              <li>votre position de lecture dans chaque œuvre ;</li>
              <li>
                vos préférences d’affichage : thème, police arabe, taille des textes, couches
                visibles, langue et mode grille ou liste.
              </li>
            </ul>

            <h3>Données que vous nous transmettez volontairement</h3>
            <p>
              Lorsque vous nous contactez par email ou WhatsApp, nous recevons votre adresse, votre
              numéro le cas échéant et le contenu de votre message. Le formulaire de suggestion,
              lorsqu’il est utilisé, peut transmettre votre nom, votre adresse email, le type de
              demande et votre message.
            </p>

            <h3>Données que nous ne collectons pas</h3>
            <p>
              DiwaneKiram ne propose pas de compte utilisateur et ne traite aucun paiement. Nous ne
              collectons pas votre localisation précise, vos contacts téléphoniques, vos données
              bancaires ni de données de santé. Nous ne vous demandons pas de renseigner de données
              sensibles.
            </p>
          </section>

          <section className="legal-block">
            <h2>3. Pourquoi ces données sont-elles traitées ?</h2>
            <ul>
              <li>
                <strong>Fournir le service :</strong> afficher la bibliothèque, conserver vos
                favoris, votre progression et vos préférences de lecture.
              </li>
              <li>
                <strong>Assurer la sécurité :</strong> détecter les erreurs, prévenir les abus et
                maintenir la disponibilité du site.
              </li>
              <li>
                <strong>Répondre à vos messages :</strong> traiter vos questions, signalements,
                corrections et suggestions.
              </li>
              <li>
                <strong>Respecter nos obligations :</strong> répondre aux demandes légitimes des
                autorités compétentes lorsque la loi l’exige.
              </li>
            </ul>
            <p>
              Selon le cas, ces traitements reposent sur l’exécution du service que vous demandez,
              votre consentement lorsque vous nous contactez, notre intérêt légitime à sécuriser et
              améliorer le site, ou une obligation légale. Nous n’utilisons pas vos données pour de
              la prospection commerciale.
            </p>
          </section>

          <section className="legal-block">
            <h2>4. Cookies, stockage local et cache</h2>
            <p>
              DiwaneKiram n’utilise pas de cookies publicitaires, de cookies de réseaux sociaux ni
              d’outils de mesure d’audience. Aucun profil publicitaire n’est constitué et aucune
              donnée n’est revendue.
            </p>
            <p>
              Le stockage local et le cache de l’application servent uniquement à mémoriser vos
              choix et à permettre la consultation hors ligne. Ils peuvent contenir les pages, les
              textes, les images et les polices nécessaires au fonctionnement de la bibliothèque.
              Vous pouvez les supprimer à tout moment dans les réglages de votre navigateur ou en
              désinstallant l’application installée. Cette suppression réinitialise vos favoris,
              votre historique et vos préférences, sans vous empêcher de consulter le site.
            </p>
          </section>

          <section className="legal-block">
            <h2>5. Durées de conservation</h2>
            <ul>
              <li>
                <strong>Données locales</strong> (favoris, historique, progression, préférences) :
                conservées sur votre appareil jusqu’à leur suppression par vos soins.
              </li>
              <li>
                <strong>Messages et demandes</strong> : conservés pendant trois ans à compter du
                dernier échange, puis supprimés, sauf obligation légale contraire.
              </li>
              <li>
                <strong>Données transmises par le formulaire de suggestion</strong> : conservées
                pendant vingt-quatre mois après leur réception, sauf demande de suppression
                anticipée.
              </li>
              <li>
                <strong>Journaux techniques de l’hébergeur</strong> : conservés pour la durée
                nécessaire à la sécurité et au bon fonctionnement du site, selon les paramètres de
                l’hébergeur, et au maximum douze mois sauf obligation légale.
              </li>
            </ul>
          </section>

          <section className="legal-block">
            <h2>6. Destinataires des données</h2>
            <p>
              Vos données ne sont ni vendues, ni louées, ni échangées à des fins commerciales. Elles
              peuvent être accessibles uniquement :
            </p>
            <ul>
              <li>à l’éditeur du site et aux personnes qu’il autorise expressément ;</li>
              <li>
                à l’hébergeur du site, qui traite les données techniques nécessaires à la mise en
                ligne et à la sécurité ;
              </li>
              <li>
                au prestataire technique chargé d’acheminer le formulaire de suggestion, lorsque
                celui-ci est activé ;
              </li>
              <li>
                aux services de messagerie ou de messagerie instantanée utilisés lorsque vous nous
                écrivez, notamment votre fournisseur d’email ou WhatsApp ;
              </li>
              <li>
                aux autorités administratives ou judiciaires compétentes, lorsque la loi nous y
                oblige.
              </li>
            </ul>
          </section>

          <section className="legal-block">
            <h2>7. Transferts hors du Sénégal</h2>
            <p>
              Certains prestataires techniques, notamment l’hébergeur ou le service d’acheminement
              des formulaires, peuvent être établis ou stocker des données en dehors du Sénégal.
              Nous veillons à ce que ces prestataires présentent des garanties appropriées pour la
              protection des données. Vous pouvez nous écrire pour obtenir davantage d’informations
              sur ces transferts.
            </p>
          </section>

          <section className="legal-block">
            <h2>8. Sécurité</h2>
            <p>
              Le site est diffusé en HTTPS. Nous limitons la collecte au strict nécessaire,
              conservons les données locales sur votre appareil et restreignons l’accès aux
              informations que nous recevons. Aucun système n’étant infaillible, nous ne pouvons
              toutefois garantir une sécurité absolue. Évitez de nous transmettre des informations
              confidentielles ou sensibles par email ou WhatsApp.
            </p>
          </section>

          <section className="legal-block">
            <h2>9. Vos droits</h2>
            <p>
              Conformément à la réglementation applicable, vous disposez des droits suivants sur
              les données vous concernant :
            </p>
            <ul>
              <li>droit d’accès et d’information ;</li>
              <li>droit de rectification des données inexactes ou incomplètes ;</li>
              <li>droit à l’effacement de vos données ;</li>
              <li>droit à la limitation du traitement ;</li>
              <li>droit d’opposition, notamment pour des raisons tenant à votre situation ;</li>
              <li>droit à la portabilité des données que vous avez fournies ;</li>
              <li>droit de retirer votre consentement à tout moment, sans effet rétroactif.</li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez à{' '}
              <a href="mailto:mbayec035@gmail.com">mbayec035@gmail.com</a> en précisant l’objet de
              votre demande. Un justificatif d’identité pourra être demandé en cas de doute
              raisonnable sur votre identité. Nous répondons dans un délai raisonnable, en principe
              un mois. La suppression des données stockées localement peut être effectuée
              directement depuis les réglages de votre navigateur.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l’autorité
              de contrôle compétente. Au Sénégal, il s’agit de la Commission de protection des
              données personnelles (CDP). Si vous résidez dans l’Union européenne, vous pouvez
              également vous adresser à l’autorité de contrôle de votre pays.
            </p>
          </section>

          <section className="legal-block">
            <h2>10. Mineurs</h2>
            <p>
              DiwaneKiram est un site éducatif et spirituel qui ne crée pas de compte utilisateur.
              Nous ne cherchons pas à collecter sciemment des données concernant des mineurs. Si un
              parent ou tuteur constate qu’un mineur nous a transmis des informations personnelles
              et souhaite les faire supprimer, il peut nous contacter à l’adresse indiquée ci-dessus.
            </p>
          </section>

          <section className="legal-block">
            <h2>11. Liens vers des services externes</h2>
            <p>
              Le site contient des liens vers Instagram, TikTok, X, WhatsApp et votre logiciel de
              messagerie. Ces services sont exploités par des tiers et disposent de leurs propres
              politiques de confidentialité. Nous ne contrôlons pas leurs pratiques : nous vous
              invitons à les consulter avant d’utiliser ces services. Un lien externe ne s’ouvre
              qu’après votre action.
            </p>
          </section>

          <section className="legal-block">
            <h2>12. Modification de cette politique</h2>
            <p>
              Cette politique peut être mise à jour pour tenir compte de l’évolution du site, des
              services utilisés ou de la réglementation. La date de dernière mise à jour figure en
              tête de page. En cas de changement important, une information sera affichée sur le
              site.
            </p>
          </section>

          <section className="legal-block">
            <h2>13. Contact</h2>
            <p>
              Pour toute question, demande d’exercice de vos droits ou signalement relatif à vos
              données personnelles :
            </p>
            <ul>
              <li>
                Email : <a href="mailto:mbayec035@gmail.com">mbayec035@gmail.com</a>
              </li>
              <li>
                WhatsApp :{' '}
                <a href="https://wa.me/221783841147" target="_blank" rel="noopener noreferrer">
                  +221 78 384 11 47
                </a>
              </li>
            </ul>
            <p>
              La présente politique est régie par le droit sénégalais. Elle ne limite pas les droits
              impératifs dont vous pouvez bénéficier dans votre pays de résidence.
            </p>
          </section>

          <p className="legal-back">
            <Link to="/a-propos">← Retour à la page À propos</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
