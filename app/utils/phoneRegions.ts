// Утилита для определения региона по номеру телефона
export interface PhoneRegion {
  region: string;
  operator?: string;
}

// Коды регионов России по номерам телефонов
const russianRegions: Record<string, PhoneRegion> = {
  // Москва
  "495": { region: "Москва", operator: "Москва" },
  "499": { region: "Москва", operator: "Москва" },

  // Санкт-Петербург
  "812": { region: "Санкт-Петербург", operator: "Санкт-Петербург" },

  // Московская область
  "496": { region: "Московская область" },
  "498": { region: "Московская область" },

  // Краснодарский край
  "861": { region: "Краснодарский край" },
  "862": { region: "Краснодарский край" },

  // Свердловская область (Екатеринбург)
  "343": { region: "Свердловская область" },

  // Новосибирская область
  "383": { region: "Новосибирская область" },

  // Нижегородская область
  "831": { region: "Нижегородская область" },

  // Самарская область
  "846": { region: "Самарская область" },

  // Ростовская область
  "863": { region: "Ростовская область" },

  // Татарстан (Казань)
  "843": { region: "Республика Татарстан" },

  // Челябинская область
  "351": { region: "Челябинская область" },

  // Волгоградская область
  "844": { region: "Волгоградская область" },

  // Воронежская область
  "473": { region: "Воронежская область" },

  // Пермский край
  "342": { region: "Пермский край" },

  // Красноярский край
  "391": { region: "Красноярский край" },

  // Башкортостан (Уфа)
  "347": { region: "Республика Башкортостан" },

  // Омская область
  "381": { region: "Омская область" },

  // Иркутская область
  "395": { region: "Иркутская область" },

  // Тюменская область
  "345": { region: "Тюменская область" },

  // Кемеровская область
  "384": { region: "Кемеровская область" },

  // Алтайский край
  "385": { region: "Алтайский край" },

  // Приморский край (Владивосток)
  "423": { region: "Приморский край" },

  // Хабаровский край
  "421": { region: "Хабаровский край" },

  // Ярославская область
  "485": { region: "Ярославская область" },

  // Тверская область
  "482": { region: "Тверская область" },

  // Тульская область
  "487": { region: "Тульская область" },

  // Рязанская область
  "491": { region: "Рязанская область" },

  // Калужская область
  "484": { region: "Калужская область" },

  // Владимирская область
  "492": { region: "Владимирская область" },

  // Брянская область
  "483": { region: "Брянская область" },

  // Смоленская область
  "481": { region: "Смоленская область" },

  // Орловская область
  "486": { region: "Орловская область" },

  // Курская область
  "471": { region: "Курская область" },

  // Белгородская область
  "472": { region: "Белгородская область" },

  // Липецкая область
  "474": { region: "Липецкая область" },

  // Тамбовская область
  "475": { region: "Тамбовская область" },
};

// Мобильные операторы
const mobileOperators: Record<string, PhoneRegion> = {
  "900": { region: "Россия", operator: "МТС" },
  "901": { region: "Россия", operator: "МТС" },
  "902": { region: "Россия", operator: "МТС" },
  "903": { region: "Россия", operator: "МТС" },
  "904": { region: "Россия", operator: "МТС" },
  "905": { region: "Россия", operator: "МТС" },
  "906": { region: "Россия", operator: "МТС" },
  "908": { region: "Россия", operator: "МТС" },
  "909": { region: "Россия", operator: "МТС" },
  "910": { region: "Россия", operator: "МТС" },
  "911": { region: "Россия", operator: "МТС" },
  "912": { region: "Россия", operator: "МТС" },
  "913": { region: "Россия", operator: "МТС" },
  "914": { region: "Россия", operator: "МТС" },
  "915": { region: "Россия", operator: "МТС" },
  "916": { region: "Россия", operator: "МТС" },
  "917": { region: "Россия", operator: "МТС" },
  "918": { region: "Россия", operator: "МТС" },
  "919": { region: "Россия", operator: "МТС" },
  "980": { region: "Россия", operator: "МТС" },
  "981": { region: "Россия", operator: "МТС" },
  "982": { region: "Россия", operator: "МТС" },
  "983": { region: "Россия", operator: "МТС" },
  "984": { region: "Россия", operator: "МТС" },
  "985": { region: "Россия", operator: "МТС" },
  "986": { region: "Россия", operator: "МТС" },
  "987": { region: "Россия", operator: "МТС" },
  "988": { region: "Россия", operator: "МТС" },
  "989": { region: "Россия", operator: "МТС" },

  "920": { region: "Россия", operator: "МегаФон" },
  "921": { region: "Россия", operator: "МегаФон" },
  "922": { region: "Россия", operator: "МегаФон" },
  "923": { region: "Россия", operator: "МегаФон" },
  "924": { region: "Россия", operator: "МегаФон" },
  "925": { region: "Россия", operator: "МегаФон" },
  "926": { region: "Россия", operator: "МегаФон" },
  "927": { region: "Россия", operator: "МегаФон" },
  "928": { region: "Россия", operator: "МегаФон" },
  "929": { region: "Россия", operator: "МегаФон" },
  "930": { region: "Россия", operator: "МегаФон" },
  "931": { region: "Россия", operator: "МегаФон" },
  "932": { region: "Россия", operator: "МегаФон" },
  "933": { region: "Россия", operator: "МегаФон" },
  "934": { region: "Россия", operator: "МегаФон" },
  "936": { region: "Россия", operator: "МегаФон" },
  "937": { region: "Россия", operator: "МегаФон" },
  "938": { region: "Россия", operator: "МегаФон" },
  "939": { region: "Россия", operator: "МегаФон" },

  "950": { region: "Россия", operator: "Билайн" },
  "951": { region: "Россия", operator: "Билайн" },
  "952": { region: "Россия", operator: "Билайн" },
  "953": { region: "Россия", operator: "Билайн" },
  "960": { region: "Россия", operator: "Билайн" },
  "961": { region: "Россия", operator: "Билайн" },
  "962": { region: "Россия", operator: "Билайн" },
  "963": { region: "Россия", operator: "Билайн" },
  "964": { region: "Россия", operator: "Билайн" },
  "965": { region: "Россия", operator: "Билайн" },
  "966": { region: "Россия", operator: "Билайн" },
  "967": { region: "Россия", operator: "Билайн" },
  "968": { region: "Россия", operator: "Билайн" },
  "969": { region: "Россия", operator: "Билайн" },

  "977": { region: "Россия", operator: "Tele2" },
  "978": { region: "Россия", operator: "Tele2" },
  "990": { region: "Россия", operator: "Tele2" },
  "991": { region: "Россия", operator: "Tele2" },
  "992": { region: "Россия", operator: "Tele2" },
  "993": { region: "Россия", operator: "Tele2" },
  "994": { region: "Россия", operator: "Tele2" },
  "995": { region: "Россия", operator: "Tele2" },
  "996": { region: "Россия", operator: "Tele2" },
  "997": { region: "Россия", operator: "Tele2" },
  "998": { region: "Россия", operator: "Tele2" },
  "999": { region: "Россия", operator: "Tele2" },
};

export function getPhoneRegion(phone: string): PhoneRegion | null {
  if (!phone) return null;

  // Очищаем номер от лишних символов
  const cleanPhone = phone.replace(/[^\d]/g, "");

  // Если номер начинается с 8, заменяем на 7
  const normalizedPhone = cleanPhone.startsWith("8")
    ? "7" + cleanPhone.slice(1)
    : cleanPhone;

  // Проверяем российские номера (11 цифр, начинаются с 7)
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith("7")) {
    const code = normalizedPhone.slice(1, 4); // Берем код после 7

    // Сначала проверяем мобильные операторы
    if (mobileOperators[code]) {
      return mobileOperators[code];
    }

    // Затем проверяем региональные коды
    if (russianRegions[code]) {
      return russianRegions[code];
    }
  }

  // Проверяем 10-значные номера (начинающиеся с 9 - мобильные)
  if (normalizedPhone.length === 10 && normalizedPhone.startsWith("9")) {
    const code = normalizedPhone.slice(0, 3);
    if (mobileOperators[code]) {
      return mobileOperators[code];
    }
  }

  return { region: "Неизвестный регион" };
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  const cleanPhone = phone.replace(/[^\d]/g, "");

  if (cleanPhone.length === 11 && cleanPhone.startsWith("7")) {
    return `+7 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(
      4,
      7
    )}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9)}`;
  }

  if (cleanPhone.length === 10 && cleanPhone.startsWith("9")) {
    return `+7 (${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(
      3,
      6
    )}-${cleanPhone.slice(6, 8)}-${cleanPhone.slice(8)}`;
  }

  return phone;
}
