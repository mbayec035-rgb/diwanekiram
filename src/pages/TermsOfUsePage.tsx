import { Link } from 'react-router-dom';

export function TermsOfUsePage() {
  return (
    <div className="page-stack legal-page">
      <header className="page-head">
        <p className="eyebrow">Informations légales</p>
        <h1>Conditions d’utilisation</h1>
        <p className="legal-updated">Dernière mise à jour : 28 octobre 2026 — version 1.0</p>
      </header>

      <section className="panel">
        <div className="legal-content">
          <p className="legal-summary">
            <strong>L’essentiel.</strong> DiwaneKiram est une bibliothèque numérique gratuite
            consacrée aux xassidas et à l’héritage spirituel de la Tijaniyya. Le site est destiné à
            un usage personnel, familial, pédagogique et non commercial. Les textes, traductions,
            transcriptions et portraits doivent être respectés et crédités. Toute reproduction
            importante ou exploitation commerciale nécessite une autorisation.
          </p>

          <p>
            Les présentes conditions définissent les règles d’accès et d’utilisation de DiwaneKiram.
            En consultant le site, vous acceptez ces conditions dans leur version en vigueur. Si
            vous ne les acceptez pas, nous vous invitons à ne pas utiliser le site.
          </p>

          <section className="legal-block">
            <h2>1. Objet du site</h2>
            <p>
              DiwaneKiram est une bibliothèque numérique consacrée à la confrérie tidiane et à
              Tivaouane. Elle met à disposition des œuvres religieuses, notamment des xassidas, des
              qasidas et des textes d’enseignement, accompagnés selon les cas de traductions, de
              transcriptions phonétiques et d’outils de lecture, de recherche et d’apprentissage.
            </p>
            <p>
              Le site poursuit un objectif éducatif, culturel et spirituel. Il ne propose aucun
              service payant, aucune formation diplômante et aucune consultation religieuse
              personnalisée.
            </p>
          </section>

          <section className="legal-block">
            <h2>2. Accès au site</h2>
            <p>
              Le site est accessible gratuitement depuis un navigateur compatible. Certaines
              fonctionnalités, comme la lecture hors ligne ou l’installation de l’application,
              dépendent de votre appareil et de votre navigateur. Aucun compte utilisateur n’est
              nécessaire.
            </p>
            <p>
              Vous êtes responsable de votre connexion, de votre équipement et de la sécurité de
              votre appareil. L’usage du site par un mineur se fait sous la responsabilité de son
              parent ou de son tuteur légal.
            </p>
          </section>

          <section className="legal-block">
            <h2>3. Nature des contenus</h2>
            <p>
              Les contenus sont proposés à des fins d’étude, de mémorisation, de transmission et de
              découverte. Malgré le soin apporté à leur sélection et à leur mise en forme, ils
              peuvent contenir des erreurs, des omissions, des variantes orthographiques ou des
              différences entre éditions.
            </p>
            <p>
              Les traductions et transcriptions sont des aides à la lecture. Elles ne remplacent pas
              le texte arabe de référence et peuvent présenter des limites, notamment lorsque
              plusieurs versions ou interprétations existent. Pour une question religieuse
              particulière, il convient de consulter un guide ou un savant qualifié.
            </p>
            <p>
              Les contenus publiés ne constituent ni une fatwa, ni un avis juridique, ni une
              consultation médicale ou psychologique.
            </p>
          </section>

          <section className="legal-block">
            <h2>4. Propriété intellectuelle</h2>
            <p>
              Le nom DiwaneKiram, l’identité visuelle, l’interface, la structure du site, les bases
              de données et les éléments originaux créés pour le site sont protégés par le droit de
              la propriété intellectuelle. Ils ne peuvent pas être reproduits ou exploités sans
              autorisation, hormis les usages autorisés ci-dessous.
            </p>
            <p>
              Les œuvres littéraires, poèmes, traductions, transcriptions, portraits et autres
              contenus peuvent être protégés par des droits appartenant à leurs auteurs,
              traducteurs, éditeurs ou ayants droit. Leur présence sur DiwaneKiram ne signifie pas
              qu’ils appartiennent au domaine public. Les crédits, sources et licences connus sont
              indiqués sur les pages concernées lorsqu’ils sont disponibles.
            </p>
            <p>
              Les portraits provenant de Wikimedia Commons sont utilisés conformément à leur licence
              libre, dont les mentions sont affichées sur la fiche de l’auteur concerné.
            </p>
            <p>
              Sauf mention contraire, vous pouvez consulter le site et reproduire de courts extraits
              à des fins personnelles, familiales, pédagogiques ou de citation, à condition de
              mentionner clairement le titre de l’œuvre, son auteur et DiwaneKiram. Toute
              reproduction substantielle, redistribution, publication, vente, location ou
              exploitation commerciale nécessite une autorisation écrite préalable.
            </p>
          </section>

          <section className="legal-block">
            <h2>5. Utilisation autorisée</h2>
            <p>Dans le respect des présentes conditions, vous pouvez notamment :</p>
            <ul>
              <li>consulter, lire et rechercher les contenus du site ;</li>
              <li>utiliser les favoris, l’historique et la progression de lecture ;</li>
              <li>installer l’application et consulter les contenus mis en cache hors ligne ;</li>
              <li>partager un lien vers une page du site ;</li>
              <li>
                imprimer ou enregistrer un court extrait pour votre usage personnel, familial ou
                pédagogique, sans le modifier ni le présenter comme une œuvre originale ;
              </li>
              <li>signaler une erreur, une coquille ou une amélioration possible.</li>
            </ul>
            <p>
              Toute utilisation doit préserver l’intégrité des textes, les crédits et les mentions
              légales. Vous ne devez pas attribuer à DiwaneKiram une position, une déclaration ou
              une affiliation qu’elle ne revendique pas.
            </p>
          </section>

          <section className="legal-block">
            <h2>6. Utilisations interdites</h2>
            <p>Il est notamment interdit :</p>
            <ul>
              <li>
                d’extraire de manière massive ou automatisée tout ou partie du site, de sa base de
                données ou de ses contenus, notamment au moyen de robots, de scripts ou de
                collecteurs de données ;
              </li>
              <li>
                de reproduire, redistribuer, revendre ou exploiter commercialement les contenus sans
                autorisation ;
              </li>
              <li>
                de contourner les mesures techniques de protection, de limitation d’accès ou de
                sécurité du site ;
              </li>
              <li>
                d’introduire un virus, un code malveillant ou tout dispositif susceptible de
                perturber, surcharger ou endommager le site ou les appareils des utilisateurs ;
              </li>
              <li>
                de tenter d’accéder sans autorisation à des systèmes, serveurs ou données liés au
                site ;
              </li>
              <li>
                de se faire passer pour DiwaneKiram, son éditeur ou un auteur, ou de suggérer une
                affiliation inexacte ;
              </li>
              <li>
                d’utiliser le site à des fins illégales, haineuses, discriminatoires, violentes ou
                portant atteinte à la dignité, aux droits ou à la sécurité d’autrui ;
              </li>
              <li>de supprimer, masquer ou modifier les crédits, sources et mentions légales.</li>
            </ul>
          </section>

          <section className="legal-block">
            <h2>7. Contributions, suggestions et signalements</h2>
            <p>
              Lorsque vous nous envoyez une suggestion, une correction ou un signalement, vous
              garantissez que votre contribution est exacte, qu’elle ne porte pas atteinte aux droits
              d’un tiers et qu’elle ne contient pas de contenu illicite. Vous acceptez que
              DiwaneKiram utilise librement votre contribution pour améliorer, corriger ou enrichir
              le site, sans obligation de publication ni de rémunération.
            </p>
            <p>
              Nous pouvons modérer, refuser ou retirer une contribution, notamment si elle est
              inexacte, injurieuse, hors sujet ou contraire aux présentes conditions. Les données
              personnelles transmises à cette occasion sont traitées conformément à notre{' '}
              <Link to="/politique-de-confidentialite">politique de confidentialité</Link>.
            </p>
          </section>

          <section className="legal-block">
            <h2>8. Contenus de tiers et liens externes</h2>
            <p>
              Le site peut contenir des liens vers des services externes, notamment Instagram,
              TikTok, X, WhatsApp et votre logiciel de messagerie. Ces services sont exploités par
              des tiers et disposent de leurs propres conditions et politiques de confidentialité.
              Nous ne contrôlons ni leur contenu ni leurs pratiques.
            </p>
            <p>
              L’ouverture d’un lien externe se fait sous votre responsabilité. La présence d’un lien
              ne constitue pas une approbation de l’ensemble des contenus ou des pratiques du
              service concerné.
            </p>
          </section>

          <section className="legal-block">
            <h2>9. Données personnelles et stockage local</h2>
            <p>
              DiwaneKiram ne crée pas de compte utilisateur et n’utilise pas de cookie publicitaire
              ni d’outil de mesure d’audience. Les favoris, l’historique, la progression de lecture et
              les préférences d’affichage sont stockés localement dans votre navigateur.
            </p>
            <p>
              Le traitement des données personnelles, les durées de conservation et l’exercice de vos
              droits sont détaillés dans la{' '}
              <Link to="/politique-de-confidentialite">politique de confidentialité</Link>.
            </p>
          </section>

          <section className="legal-block">
            <h2>10. Disponibilité et maintenance</h2>
            <p>
              Nous cherchons à maintenir le site accessible et à jour, sans pouvoir garantir une
              disponibilité permanente. L’accès peut être interrompu, limité ou modifié pour des
              raisons de maintenance, de sécurité, d’hébergement ou d’évolution du service.
            </p>
            <p>
              Le contenu du catalogue peut évoluer : ajout, correction, remplacement ou retrait
              d’une œuvre. Nous ne garantissons pas que chaque contenu restera disponible de manière
              permanente ni que le cache hors ligne contiendra toujours la totalité du catalogue.
            </p>
          </section>

          <section className="legal-block">
            <h2>11. Garanties et responsabilité</h2>
            <p>
              Le site et ses contenus sont fournis « en l’état », dans les limites permises par la
              loi. Nous ne garantissons pas l’exhaustivité, l’exactitude absolue ou l’actualité de
              chaque information, ni l’absence d’erreur dans les textes, traductions,
              transcriptions ou métadonnées.
            </p>
            <p>
              Dans les mêmes limites, l’éditeur ne peut être tenu responsable des dommages indirects
              résultant de l’utilisation ou de l’impossibilité d’utiliser le site, notamment d’une
              perte de données stockées localement, d’une interruption de service ou du contenu d’un
              site tiers accessible par un lien.
            </p>
            <p>
              Cette limitation ne s’applique pas en cas de faute lourde ou intentionnelle, de
              dommage corporel, de fraude ou lorsque la loi impose une responsabilité qui ne peut
              être exclue. Vous restez responsable de l’usage que vous faites des contenus et des
              décisions que vous prenez sur leur base.
            </p>
          </section>

          <section className="legal-block">
            <h2>12. Retrait d’un contenu</h2>
            <p>
              Si vous êtes auteur, traducteur, éditeur ou titulaire de droits et que vous estimez
              qu’un contenu publié sur DiwaneKiram porte atteinte à vos droits, écrivez-nous à{' '}
              <a href="mailto:mbayec035@gmail.com">mbayec035@gmail.com</a> en précisant le contenu
              concerné, la nature du droit invoqué et les éléments permettant de vérifier votre
              demande. Nous examinerons la demande et procéderons, si nécessaire, à la correction, au
              retrait ou à la suspension du contenu.
            </p>
          </section>

          <section className="legal-block">
            <h2>13. Modification des conditions</h2>
            <p>
              Ces conditions peuvent être modifiées pour tenir compte de l’évolution du site, des
              services utilisés ou de la réglementation. La date de dernière mise à jour figure en
              tête de page. En cas de changement important, une information sera affichée sur le
              site.
            </p>
            <p>
              La poursuite de l’utilisation du site après une mise à jour vaut acceptation des
              nouvelles conditions. Si une clause est jugée invalide ou inapplicable, les autres
              clauses restent en vigueur.
            </p>
          </section>

          <section className="legal-block">
            <h2>14. Droit applicable et juridiction</h2>
            <p>
              Les présentes conditions sont régies par le droit sénégalais. En cas de litige, et
              sous réserve des règles impératives qui protègent les utilisateurs dans leur pays de
              résidence, les tribunaux compétents du ressort de Dakar seront saisis.
            </p>
            <p>
              Les présentes conditions et la politique de confidentialité forment l’ensemble des
              règles applicables à l’utilisation du site.
            </p>
          </section>

          <section className="legal-block">
            <h2>15. Contact</h2>
            <p>
              Pour toute question relative aux présentes conditions, à un contenu ou à un
              signalement :
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
              Vous pouvez également utiliser la section Contact de la page À propos ou consulter la{' '}
              <Link to="/politique-de-confidentialite">politique de confidentialité</Link> pour
              exercer vos droits sur vos données personnelles.
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
