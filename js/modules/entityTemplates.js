const DEFAULT_HERO_ACCENT = "#b98a4b";

function normalizeKind(kind) {
  const value = String(kind || "").trim().toLowerCase();
  if (["faction", "fractions", "guild", "order", "cult", "фракция", "орден", "культ"].includes(value)) return "faction";
  if (["city", "state", "country", "region", "realm", "город", "регион", "земли"].includes(value)) return "city";
  if (["authority", "power", "council", "institution", "власть", "совет", "палата"].includes(value)) return "authority";
  return "general";
}

const ARCHIVE_GROUP_TEMPLATES = Object.freeze({
  faction: {
    ru: { title: "Фракции" },
    en: { title: "Factions" },
  },
  city: {
    ru: { title: "Города и регионы" },
    en: { title: "Cities and Regions" },
  },
  authority: {
    ru: { title: "Органы власти" },
    en: { title: "Seats of Power" },
  },
  general: {
    ru: { title: "Новая глава" },
    en: { title: "New chapter" },
  },
});

const ARCHIVE_ITEM_TEMPLATES = Object.freeze({
  faction: {
    ru: {
      title: "Новая фракция",
      imageLabel: "Герб, эмблема или символ фракции",
      expandedImageLabel: "Большой баннер, сцена или портрет лидера",
      symbolLabel: "Герб, логотип или символ фракции",
      description: "Кто они, где держат влияние и чем известны на карте Серконии.",
      fullDescription:
        "Кто они такие.\nКакие у них цели и интересы.\nГде они действуют и кого поддерживают.\nЧем могут быть полезны или опасны для игроков.",
    },
    en: {
      title: "New faction",
      imageLabel: "Faction crest, emblem, or symbol",
      expandedImageLabel: "A larger banner, scene, or portrait of a leader",
      symbolLabel: "Faction crest, logo, or symbol",
      description: "Who they are, where their influence reaches, and what they are known for across Serkonia.",
      fullDescription:
        "Who they are.\nWhat goals and interests drive them.\nWhere they operate and whom they support.\nWhy they might help or threaten the party.",
    },
  },
  city: {
    ru: {
      title: "Новый город",
      imageLabel: "Вид города или герб",
      expandedImageLabel: "Большая иллюстрация места",
      description: "Чем живёт этот город или регион и почему он важен для кампании.",
      fullDescription:
        "Краткая история места.\nЧто здесь правит и работает.\nЧем город славится.\nКакие проблемы или зацепки ждут игроков.",
    },
    en: {
      title: "New city",
      imageLabel: "City view or crest",
      expandedImageLabel: "Large illustration of the location",
      description: "What this city or region lives by and why it matters to the campaign.",
      fullDescription:
        "A short history of the place.\nWhat rules or thrives here.\nWhat the city is known for.\nWhich problems or hooks await the party.",
    },
  },
  authority: {
    ru: {
      title: "Новый орган власти",
      imageLabel: "Печать, символ или зал заседаний",
      expandedImageLabel: "Большая сцена власти или символа",
      description: "Кто принимает решения и как этот институт влияет на мир.",
      fullDescription:
        "Кто входит в этот орган.\nКак он принимает решения.\nКакие ресурсы и рычаги влияния у него есть.\nЧем он важен для текущей хроники.",
    },
    en: {
      title: "New authority",
      imageLabel: "Seal, symbol, or council hall",
      expandedImageLabel: "A larger scene of power or symbol",
      description: "Who makes the decisions here and how this institution shapes the world.",
      fullDescription:
        "Who belongs to this authority.\nHow it makes decisions.\nWhat resources and leverage it commands.\nWhy it matters to the current chronicle.",
    },
  },
  general: {
    ru: {
      title: "Новая запись",
      imageLabel: "Иллюстрация карточки",
      expandedImageLabel: "Иллюстрация раскрытого вида",
      description: "Коротко опиши, что это за запись и почему на неё стоит обратить внимание.",
      fullDescription:
        "Подробное описание записи.\nОсновные детали.\nСвязи с миром.\nЧто игрокам важно знать в первую очередь.",
    },
    en: {
      title: "New record",
      imageLabel: "Card illustration",
      expandedImageLabel: "Expanded illustration",
      description: "Briefly describe what this record is and why it matters.",
      fullDescription:
        "Detailed record description.\nCore details.\nConnections to the world.\nWhat players should notice first.",
    },
  },
});

export function inferArchiveTemplateKind(group) {
  const explicitKind = normalizeKind(group?.kind);
  if (explicitKind !== "general") return explicitKind;

  const title = String(group?.title || "").trim().toLowerCase();
  if (
    title.includes("фракц")
    || title.includes("гильд")
    || title.includes("орден")
    || title.includes("культ")
    || title.includes("faction")
    || title.includes("guild")
    || title.includes("order")
    || title.includes("cult")
  ) return "faction";

  if (
    title.includes("город")
    || title.includes("регион")
    || title.includes("земл")
    || title.includes("city")
    || title.includes("region")
    || title.includes("realm")
  ) return "city";

  if (
    title.includes("власт")
    || title.includes("совет")
    || title.includes("палат")
    || title.includes("authority")
    || title.includes("council")
    || title.includes("institution")
  ) return "authority";

  return "general";
}

export function createTimelineEventTemplate(previousEvent) {
  return {
    year: "NOW",
    title: "Новый поворот хроники",
    description: "Что именно произошло, кто в этом участвовал и почему событие важно для мира прямо сейчас.",
    fullDescription: "Подробно опиши само событие, последствия, участников и какие нити оно оставляет на кампанию.",
    imageUrl: "",
    imageText: "Иллюстрация, карта, портрет участников или кадр события.",
    markerId: "",
    actId: previousEvent?.actId || "",
    facts: ["", "", ""],
    position: previousEvent?.position === "up" ? "down" : "up",
    sidebarShortcut: false,
    sidebarShortcutLabel: "",
    translations: {
      en: {
        title: "New turn of the chronicle",
        description: "What happened, who was involved, and why this event matters to the world right now.",
        fullDescription: "Describe the event in full: its consequences, participants, and the threads it leaves for the campaign.",
        imageText: "An illustration, map, portrait of the participants, or a scene from the event.",
      },
    },
  };
}

export function createTimelineActTemplate(order = 0) {
  return {
    id: "",
    title: `Акт ${order + 1}`,
    description: "Отдельная арка хроники для крупной истории, фронта или важной кампанийной линии.",
    backgroundImageUrl: "",
    sortOrder: order,
    translations: {
      en: {
        title: `Act ${order + 1}`,
        description: "A separate chronicle arc for a major story, front, or campaign line.",
      },
    },
  };
}

export function createArchiveGroupTemplate(kind = "general") {
  const normalizedKind = normalizeKind(kind);
  const template = ARCHIVE_GROUP_TEMPLATES[normalizedKind] || ARCHIVE_GROUP_TEMPLATES.general;

  return {
    id: "",
    kind: normalizedKind,
    title: template.ru.title,
    items: [],
    translations: {
      en: {
        title: template.en.title,
      },
    },
  };
}

export function createArchiveItemTemplate(kind = "general", sortOrder = 0) {
  const normalizedKind = normalizeKind(kind);
  const template = ARCHIVE_ITEM_TEMPLATES[normalizedKind] || ARCHIVE_ITEM_TEMPLATES.general;

  return {
    id: "",
    title: template.ru.title,
    imageLabel: template.ru.imageLabel,
    expandedImageLabel: template.ru.expandedImageLabel,
    symbolLabel: template.ru.symbolLabel || "",
    description: template.ru.description,
    fullDescription: template.ru.fullDescription,
    sortOrder,
    translations: {
      en: {
        title: template.en.title,
        imageLabel: template.en.imageLabel,
        expandedImageLabel: template.en.expandedImageLabel,
        symbolLabel: template.en.symbolLabel || "",
        description: template.en.description,
        fullDescription: template.en.fullDescription,
      },
    },
  };
}

export function createHeroGroupTemplate() {
  return {
    id: "",
    title: "Новая партия",
    subtitle: "Опиши, кто входит в эту группу, чем она связана и какую роль играет в хронике Серконии.",
    items: [],
    translations: {
      en: {
        title: "New party",
        subtitle: "Describe who belongs to this group, what binds them together, and what role they play in Serkonia's chronicle.",
      },
    },
  };
}

export function createHeroCardTemplate(sortOrder = 0) {
  return {
    id: "",
    title: "Новый герой",
    role: "Роль в хронике",
    imageLabel: "Добавь портрет героя",
    imageUrl: "",
    accentColor: DEFAULT_HERO_ACCENT,
    accentColorOverride: "",
    description: "Кто это, чем он запомнился отряду и почему на него стоит смотреть в первую очередь.",
    fullDescription: "Происхождение и характер.\nЦели и внутренние конфликты.\nСвязи с отрядом, фракциями и миром.\nВажные сцены, тайны и зацепки на будущее.",
    sortOrder,
    links: [],
    translations: {
      en: {
        title: "New hero",
        role: "Role in the chronicle",
        imageLabel: "Add a hero portrait",
        description: "Who this is, what made them memorable to the party, and why they deserve attention first.",
        fullDescription: "Origin and personality.\nGoals and inner conflicts.\nConnections to the party, factions, and the world.\nImportant scenes, secrets, and hooks for the future.",
      },
    },
  };
}

export function createHomebrewCategoryTemplate(sortOrder = 0) {
  return {
    id: "",
    title: `Категория ${sortOrder + 1}`,
    description: "",
    sortOrder,
    translations: {
      en: {
        title: `Category ${sortOrder + 1}`,
        description: "",
      },
    },
  };
}

export function createHomebrewArticleTemplate(sortOrder = 0, type = "change") {
  return {
    id: "",
    type,
    title: "Новая статья",
    summary: "Коротко опиши, что именно меняется, добавляется или уточняется.",
    content: "Здесь можно подробно расписать изменение, новое правило или домашний материал.",
    imageUrl: "",
    sourceUrl: "",
    categoryIds: [],
    sortOrder,
    translations: {
      en: {
        title: "New article",
        summary: "Briefly describe what changes, what is new, or what this rule clarifies.",
        content: "Use this space for the full homebrew text, changelog entry, or rule explanation.",
      },
    },
  };
}
