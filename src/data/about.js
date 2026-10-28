/* Données centralisées de la page À propos : liens, contact, partage et
   textes FR/AR. */

// Éléments de contenu
export const aboutMeta = {
  title: 'À propos',
  subtitle:
    'Diwane Kiram — bibliothèque numérique dédiée à la confrérie tidiane et à Tivaouane.',
};

// Liens des réseaux sociaux
export const socialLinks = [
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/i_am_cheikh_obs/', icon: 'instagram' },
  { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com/@i_am_cheikh_', icon: 'tiktok' },
  { id: 'x', name: 'X', url: 'https://x.com/666_laden', icon: 'x' },
  /* L'URL WhatsApp est calculée depuis `contactData.whatsappNumber` :
     elle ouvre directement la conversation avec ce numéro. */
  { id: 'whatsapp', name: 'WhatsApp', url: '', icon: 'whatsapp' },
];

// Données de contact
export const contactData = {
  email: 'mbayec035@gmail.com',
  whatsappNumber: '+221 78 384 11 47',
};

// Partage
export const shareData = {
  title: 'Diwane Kiram',
  text: 'Diwane Kiram — bibliothèque numérique dédiée à la confrérie tidiane et à Tivaouane.',
  url: 'https://diwanekiram.vercel.app/',
};

// Formulaire de suggestion (endpoint à configurer dans .env)
export const suggestionConfig = {
  endpointEnvKey: 'VITE_FORMSPREE_ENDPOINT', // ou VITE_EMAILJS_ENDPOINT selon le service choisi
};

// Clés de traduction (à ajouter dans le système de traduction existant si besoin)
// Les textes sont centralisés ici, le composant les utilisera directement avec la logique FR/AR
export const aboutTranslations = {
  fr: {
    pageTitle: 'À propos',
    pageSubtitle:
      'Diwane Kiram — bibliothèque numérique dédiée à la confrérie tidiane et à Tivaouane.',

    sections: {
      whoWeAre: {
        id: 'qui-sommes-nous',
        title: 'Qui sommes-nous',
        intro:
          'Diwane Kiram est une bibliothèque numérique dédiée à la confrérie tidiane et à Tivaouane, regroupant livres, qasidas et un espace d\'apprentissage.',
        body1:
          'Elle rassemble des œuvres liées à l\'enseignement et à la transmission : du Tariqa Tidjaniya. Les textes sont proposés avec texte arabe, traduction française,et même dans le futur en wolof (selon l\'œuvre) et transcription phonétique.',
        missionTitle: 'Mission',
        missionParagraphs: [
          'Notre mission est de rendre notre héritage spirituel, intellectuel et culturel accessible à tous, en arabe, en français et en wolof, afin de faciliter l’étude, la mémorisation et la transmission du savoir. À travers les œuvres des grands maîtres de la tradition tidiane, les textes religieux, les traductions et les podcasts, nous souhaitons permettre à chacun d’approfondir ses connaissances, de se rapprocher de la spiritualité tidiane et de découvrir la richesse du patrimoine religieux de Tivaouane.',
          'Notre ambition est également de faire évoluer cette plateforme en un véritable espace d’apprentissage du dîn en islam, en intégrant progressivement le Saint Coran, des ouvrages fondamentaux de l’école malikite, tels qu’Al-Akhdarî et Al-Ashmâwiyya, ainsi que d’autres ressources éducatives et spirituelles. Grâce aux livres numériques, aux contenus audio et aux podcasts, nous voulons rendre le savoir religieux plus accessible, accompagner les apprenants à leur rythme et transmettre cet héritage aux générations futures.',
        ],
        whatYouFindTitle: 'Ce que vous trouverez',
        whatYouFindItems: [
          'Bibliothèque et recherche',
          'Favoris',
          'Apprentissage',
          'Guides pratiques',
        ],
        valuesTitle: 'Nos valeurs',
        valuesItems: [
          'Fidélité aux sources',
          'Sobriété',
          'Accessibilité',
          'Transmission',
        ],
      },
      history: {
        id: 'histoire',
        title: 'Histoire de Dahiratoul Kiram',
        intro:
          'Née à Dakar en 1927, la Dahiratoul Kiram prolonge l’œuvre de Serigne Babacar Sy et structure la vie spirituelle des disciples tidianes.',
        creation: 'Création',
        creationText: 'Année : 1927 — Lieu : Dakar — Fondateurs : Serigne Babacar Sy',
        context: 'Contexte et motivation',
        contextText:
          'Après le rappel à Dieu d’El Hadji Malick Sy en 1922, Serigne Babacar Sy lui succède comme premier khalife général des Tidianes. Soucieux de renforcer la foi des disciples et de préserver leur attachement aux enseignements de l’islam, il encourage le regroupement des fidèles autour de la prière, de l’éducation religieuse, de la solidarité et de la discipline spirituelle. C’est dans ce contexte qu’est créée, en 1927 à Dakar, la Dahiratoul Kiram, une organisation religieuse destinée notamment à rassembler des disciples, parmi lesquels figuraient des personnes exerçant des fonctions dans l’administration, afin qu’ils puissent entretenir leur pratique religieuse malgré leurs obligations professionnelles.',
        objectives: 'Objectifs',
        objectivesText:
          'Renforcer les liens entre les talibés, développer leur connaissance de la religion, favoriser les prières collectives et maintenir une relation étroite avec leur guide spirituel à Tivaouane. La Dahiratoul Kiram contribue également à promouvoir les valeurs de fraternité, d’entraide, de respect et de solidarité entre les membres.',
        activities: 'Activités',
        activitiesText:
          'Dans le prolongement de cette dynamique, la Ziarra générale de Tivaouane est organisée à partir de 1930. Ce rendez-vous permet aux disciples de se réunir auprès de leur guide religieux, de recevoir ses conseils et de renouveler leur engagement spirituel. Au fil des années, il est devenu un événement important de la vie religieuse tidiane au Sénégal. La Dahiratoul Kiram a ainsi joué un rôle important dans le développement du mouvement des dahiras, en offrant un cadre organisé pour la pratique religieuse, l’apprentissage des enseignements de la Tijaniyya et le renforcement des liens entre les disciples.',
        link: 'Lien avec Diwane Kiram',
        linkText:
          'À travers les générations, la Dahiratoul Kiram demeure associée à la transmission des valeurs islamiques, à la fidélité aux enseignements des guides religieux et à la préservation de l’héritage spirituel de Tivaouane. Diwane Kiram prolonge cette transmission en rendant cet héritage accessible sous forme numérique.',
      },
      social: {
        id: 'reseaux-sociaux',
        title: 'Réseaux sociaux',
        intro: 'Suivez Diwane Kiram sur les réseaux sociaux.',
      },
      contact: {
        id: 'contact',
        title: 'Contact',
        intro: 'Pour nous contacter, utilisez les moyens ci-dessous.',
        email: 'Email',
        whatsapp: 'WhatsApp',
      },
      share: {
        id: 'partager',
        title: "Partager l'application",
        intro: "Partagez Diwane Kiram avec d'autres.",
        shareButton: 'Partager',
        copyButton: 'Copier le lien',
        copySuccess: 'Lien copié',
      },
      suggestion: {
        id: 'suggestion',
        title: 'Suggestion aux créateurs',
        intro: 'Envoyez vos suggestions, remarques ou signalements.',
        nameLabel: 'Nom (facultatif)',
        emailLabel: 'Email (facultatif)',
        typeLabel: 'Type',
        typeOptions: [
          { value: 'suggestion', label: 'Suggestion' },
          { value: 'erreur', label: 'Erreur dans un texte' },
          { value: 'nouveau_livre', label: 'Nouveau livre' },
          { value: 'autre', label: 'Autre' },
        ],
        messageLabel: 'Message (obligatoire)',
        submit: 'Envoyer',
        sending: 'Envoi en cours...',
        success: 'Message envoyé avec succès.',
        error: 'Une erreur est survenue lors de l\'envoi.',
        required: 'Le message est obligatoire.',
      },
      legal: {
        id: 'legal',
        title: 'Légal',
        intro: 'Consultez nos documents juridiques.',
        privacy: 'Politique de confidentialité',
        terms: 'Conditions d\'utilisation',
      },
    },
  },
  ar: {
    pageTitle: 'حول',
    pageSubtitle: 'ديوان كرام — مكتبة رقمية مخصصة للطريقة التجانية ومدينة تيفوان.',

    sections: {
      whoWeAre: {
        id: 'qui-sommes-nous',
        title: 'من نحن',
        intro: 'ديوان كرام مكتبة رقمية مخصصة للطريقة التجانية ومدينة تيفوان، تجمع الكتب والقصائد وفضاء للتعلم.',
        body1:
          'تجمع المكتبة الأعمال المرتبطة بالتعليم والنقل: القرآن والحديث والفقه والعقيدة والتصوف والطريقة. تُعرض النصوص بالعربية والترجمة الفرنسية والولوفية (حسب العمل) مع النسخ الصوتي.',
        missionTitle: 'المهمة',
        missionParagraphs: [
          'مهمتنا هي جعل تراثنا الروحي والفكري والثقافي متاحًا للجميع، بالعربية والفرنسية والولوفية، لتسهيل الدراسة والحفظ ونقل المعرفة. ومن خلال أعمال كبار شيوخ الطريقة التجانية والنصوص الدينية والترجمات والبودكاست، نرغب في تمكين كل شخص من تعميق معارفه، والاقتراب من الروحانية التجانية، واكتشاف ثراء التراث الديني لتيفوان.',
          'كما تطمح منصتنا إلى أن تصبح فضاءً حقيقيًا لتعلّم الدين في الإسلام، من خلال إدماج القرآن الكريم تدريجيًا، وكتب أساسية من المدرسة المالكية مثل الأخضري والأشموني، وغيرها من الموارد التربوية والروحية. وبفضل الكتب الرقمية والمحتوى الصوتي والبودكاست، نريد جعل المعرفة الدينية أكثر سهولة، ومواكبة المتعلمين حسب وتيرتهم، ونقل هذا التراث إلى الأجيال القادمة.',
        ],
        whatYouFindTitle: 'ما ستجدونه',
        whatYouFindItems: ['المكتبة والبحث', 'المفضلة', 'التعلم', 'أدلة عملية'],
        valuesTitle: 'قيمنا',
        valuesItems: ['الوفاء للمصادر', 'البساطة', 'إمكانية الوصول', 'النقل'],
      },
      history: {
        id: 'histoire',
        title: 'تاريخ دائرة الكرام',
        intro:
          'تأسست دائرة الكرام في داكار عام 1927، وهي تواصل عمل الشيخ بابكر سي وتنظّم الحياة الروحية للمريدين التجانيين.',
        creation: 'التأسيس',
        creationText: 'السنة: 1927 — المكان: داكار — المؤسسون: الشيخ بابكر سي',
        context: 'السياق والدوافع',
        contextText:
          'بعد وفاة الشيخ الحاج مالك سي عام 1922، خلفه الشيخ بابكر سي كأول خليفة عام للتجانيين. وحرصًا على تقوية إيمان المريدين والحفاظ على تمسكهم بتعاليم الإسلام، شجّع على تجمّع المؤمنين حول الصلاة والتربية الدينية والتضامن والانضباط الروحي. وفي هذا السياق تأسست دائرة الكرام عام 1927 في داكار، وهي منظمة دينية تهدف بشكل خاص إلى جمع المريدين، ومن بينهم أشخاص يعملون في الإدارة، حتى يتمكنوا من مواصلة ممارستهم الدينية رغم التزاماتهم المهنية.',
        objectives: 'الأهداف',
        objectivesText:
          'تقوية الروابط بين المريدين، وتنمية معرفتهم بالدين، وتشجيع الصلوات الجماعية، والحفاظ على علاقة وثيقة بمرشدهم الروحي في تيفوان. كما تساهم دائرة الكرام في تعزيز قيم الأخوة والتعاون والاحترام والتضامن بين الأعضاء.',
        activities: 'الأنشطة',
        activitiesText:
          'في امتداد هذه الدينامية، انتظمت الزيارة العامة لتيفوان ابتداءً من عام 1930. ويتيح هذا الموعد للمريدين الاجتماع حول مرشدهم الديني وتلقي نصائحه وتجديد التزامهم الروحي. وعلى مر السنين أصبح حدثًا مهمًا في الحياة الدينية التجانية في السنغال. وهكذا أدّت دائرة الكرام دورًا مهمًا في تطوير حركة الدوائر، من خلال توفير إطار منظم للممارسة الدينية وتعلّم تعاليم الطريقة التجانية وتعزيز الروابط بين المريدين.',
        link: 'الصلة بديوان كرام',
        linkText:
          'عبر الأجيال، تظل دائرة الكرام مرتبطة بنقل القيم الإسلامية والوفاء بتعاليم المرشدين الدينيين والحفاظ على التراث الروحي لتيفوان. ويواصل ديوان كرام هذه الرسالة بجعل هذا التراث متاحًا رقميًا.',
      },
      social: {
        id: 'reseaux-sociaux',
        title: 'وسائل التواصل الاجتماعي',
        intro: 'تابع ديوان كرام على وسائل التواصل الاجتماعي.',
      },
      contact: {
        id: 'contact',
        title: 'الاتصال',
        intro: 'للاتصال بنا، استخدم الوسائل أدناه.',
        email: 'البريد الإلكتروني',
        whatsapp: 'واتساب',
      },
      share: {
        id: 'partager',
        title: 'مشاركة التطبيق',
        intro: 'شارك ديوان كرام مع الآخرين.',
        shareButton: 'مشاركة',
        copyButton: 'نسخ الرابط',
        copySuccess: 'تم نسخ الرابط',
      },
      suggestion: {
        id: 'suggestion',
        title: 'اقتراح للمبدعين',
        intro: 'أرسل اقتراحاتك أو ملاحظاتك أو بلاغاتك.',
        nameLabel: 'الاسم (اختياري)',
        emailLabel: 'البريد الإلكتروني (اختياري)',
        typeLabel: 'النوع',
        typeOptions: [
          { value: 'suggestion', label: 'اقتراح' },
          { value: 'erreur', label: 'خطأ في نص' },
          { value: 'nouveau_livre', label: 'كتاب جديد' },
          { value: 'autre', label: 'آخر' },
        ],
        messageLabel: 'الرسالة (إلزامية)',
        submit: 'إرسال',
        sending: 'جاري الإرسال...',
        success: 'تم إرسال الرسالة بنجاح.',
        error: 'حدث خطأ أثناء الإرسال.',
        required: 'الرسالة إلزامية.',
      },
      legal: {
        id: 'legal',
        title: 'قانوني',
        intro: 'اطلع على وثائقنا القانونية.',
        privacy: 'سياسة الخصوصية',
        terms: 'شروط الاستخدام',
      },
    },
  },
};
