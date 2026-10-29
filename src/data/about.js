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
        title: 'Notre histoire',
        intro:
          'Diwane Kiram est né de l’initiative d’un disciple de Dahiratoul Kiram Thiaroye Gare, qui a voulu offrir à tous un espace pour lire, apprendre et approfondir sa foi.',
        howTitle: 'Comment fonctionne Dahiratoul Kiram Thiaroye Gare',
        howText:
          'Dahiratoul Kiram Thiaroye Gare rassemble ses disciples autour de rendez-vous réguliers, pour prier ensemble, apprendre et mieux connaître leur deen. Son fonctionnement repose sur trois temps forts :',
        howItems: [
          'Guddi Al Jumma, chaque jeudi : la veillée hebdomadaire, rythmée par les chants religieux. Elle se poursuit par un discours de l’Oustaz, qui transmet un enseignement aux disciples.',
          'Les mardis : des séances de formation, avec l’apprentissage du Coran et d’Al-Akhdari, des obligations en islam et des sunnah.',
          'Les Jamiya : un grand rassemblement chaque mois, qui réunit tous les disciples.',
        ],
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
        title: 'تاريخنا',
        intro:
          'وُلد ديوان كرام من مبادرة أحد مريدي دائرة الكرام تياروي غار، أراد أن يوفّر للجميع فضاءً للقراءة والتعلّم وتعميق الإيمان.',
        howTitle: 'كيف تعمل دائرة الكرام تياروي غار',
        howText:
          'تجمع دائرة الكرام تياروي غار مريديها حول مواعيد منتظمة، للصلاة معًا والتعلّم ومعرفة دينهم على نحو أفضل. ويقوم عملها على ثلاثة مواعيد أساسية:',
        howItems: [
          'غودي الجمعة، كل خميس: السهرة الأسبوعية التي تُحييها الأناشيد الدينية، وتُختتم بخطاب من الأستاذ ينقل فيه تعليمًا إلى المريدين.',
          'أيام الثلاثاء: حصص تكوينية تشمل تعلّم القرآن والأخضري، وفرائض الإسلام والسنن.',
          'الجمعية: تجمّع كبير كل شهر يجمع جميع المريدين.',
        ],
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
