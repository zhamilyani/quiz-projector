export const CATEGORIES = [
  {
    id: 'music',
    name: 'Музыкальный квиз',
    icon: '🎵',
    roundTypes: [
      { id: 'name_the_tune', name: 'Угадай мелодию', desc: 'Играет отрывок — назвать песню и исполнителя', questionType: 'audio', aiHint: 'text: "Прослушайте фрагмент и назовите исполнителя и песню". answer: "Исполнитель - Песня". НЕ упоминай исполнителя/песню в text!' },
      { id: 'lyrics_gap', name: 'Пропущенное слово', desc: 'Текст песни с пропуском — вставить слово', questionType: 'text', aiHint: 'Покажите строчку из песни с пропущенным словом, ответ — пропущенное слово' },
      { id: 'guess_year', name: 'Угадай год', desc: 'По песне или альбому определить год выпуска', questionType: 'text', aiHint: 'В каком году вышла песня/альбом X?' },
      { id: 'artist_by_songs', name: 'Кто исполнитель?', desc: 'По 3 песням угадать общего исполнителя', questionType: 'text', aiHint: 'Три песни: A, B, C — кто их все исполняет?' },
      { id: 'cover_original', name: 'Кавер или оригинал', desc: 'Звучит кавер — назвать оригинального исполнителя', questionType: 'audio', aiHint: 'text: "Прослушайте кавер-версию. Кто оригинальный исполнитель?". answer: "Исполнитель - Песня". НЕ упоминай исполнителя в text!' },
      { id: 'song_by_description', name: 'Песня по описанию', desc: 'Упрощённое описание сюжета песни', questionType: 'text', aiHint: 'Опишите сюжет/содержание песни простыми словами, ответ — название песни' },
      { id: 'album_cover', name: 'Обложка альбома', desc: 'По обложке назвать альбом или группу', questionType: 'image', aiHint: 'text: "Назовите группу и альбом по обложке". answer: "Группа - Альбом". НЕ описывай обложку в text!' },
      { id: 'emoji_song', name: 'Эмодзи-песня', desc: 'Название песни зашифровано эмодзи', questionType: 'text', aiHint: 'Зашифруйте название песни эмодзи, ответ — настоящее название' },
      { id: 'first_letters', name: 'Первые буквы', desc: '5 песен — первые буквы исполнителей складываются в слово', questionType: 'text', aiHint: 'Первые буквы имён исполнителей этих 5 песен складываются в слово. Какое?' },
      { id: 'music_blitz', name: 'Музыкальный блиц', desc: 'Быстрые вопросы по 15 сек — факты о музыке', questionType: 'text', aiHint: 'Короткий вопрос-факт о музыке, ответ 1-2 слова' },
    ],
  },
  {
    id: 'movies',
    name: 'Квиз по фильмам',
    icon: '🎬',
    roundTypes: [
      { id: 'screenshot', name: 'Кадр из фильма', desc: 'По кадру назвать фильм', questionType: 'image', aiHint: 'text: "Угадайте фильм по кадру". answer: "Название фильма". НЕ упоминай название фильма в text!' },
      { id: 'movie_quote', name: 'Цитата из фильма', desc: 'По знаменитой фразе угадать фильм', questionType: 'text', aiHint: 'Знаменитая цитата из фильма, ответ — название фильма' },
      { id: 'emoji_movie', name: 'Эмодзи-фильм', desc: 'Сюжет фильма зашифрован эмодзи', questionType: 'text', aiHint: 'Зашифруйте сюжет/название фильма эмодзи, ответ — название фильма' },
      { id: 'three_movies_one_actor', name: '3 фильма — 1 актёр', desc: 'По трём фильмам угадать общего актёра', questionType: 'text', aiHint: 'Три фильма: A, B, C — кто снялся во всех трёх?' },
      { id: 'simplified_plot', name: 'Упрощённый сюжет', desc: 'Сюжет фильма в одном нелепом предложении', questionType: 'text', aiHint: 'Опишите сюжет фильма максимально упрощённо и смешно в одном предложении' },
      { id: 'movie_year', name: 'Год выхода', desc: 'Назвать год выхода фильма', questionType: 'text', aiHint: 'В каком году вышел фильм X?' },
      { id: 'movie_soundtrack', name: 'Саундтрек', desc: 'По музыке угадать фильм', questionType: 'audio', aiHint: 'text: "Прослушайте саундтрек и назовите фильм". answer: "Композитор - Название (Фильм)". НЕ упоминай фильм в text!' },
      { id: 'movie_blitz', name: 'Кино-блиц', desc: 'Быстрые вопросы о кино по 15 сек', questionType: 'text', aiHint: 'Короткий вопрос-факт о кино, ответ 1-2 слова' },
    ],
  },
  {
    id: 'cartoons',
    name: 'Мультфильмы и аниме',
    icon: '🧸',
    roundTypes: [
      { id: 'cartoon_screenshot', name: 'Кадр из мультфильма', desc: 'По кадру назвать мультфильм', questionType: 'image', aiHint: 'text: "Угадайте мультфильм по кадру". answer: "Название мультфильма". НЕ упоминай название в text!' },
      { id: 'cartoon_quote', name: 'Кто это сказал?', desc: 'Фраза мультперсонажа — назвать персонажа или мультфильм', questionType: 'text', aiHint: 'Знаменитая фраза мультперсонажа, ответ — имя персонажа' },
      { id: 'cartoon_song', name: 'Песня из мультфильма', desc: 'По песне угадать мультфильм', questionType: 'audio', aiHint: 'text: "Прослушайте песню и назовите мультфильм". answer: "Исполнитель - Песня (Мультфильм)". НЕ упоминай мультфильм в text!' },
      { id: 'emoji_cartoon', name: 'Эмодзи-мультфильм', desc: 'Мультфильм зашифрован эмодзи', questionType: 'text', aiHint: 'Зашифруйте мультфильм эмодзи' },
      { id: 'describe_character', name: 'Персонаж по описанию', desc: 'По описанию угадать мультперсонажа', questionType: 'text', aiHint: 'Опишите мультперсонажа не называя имени, ответ — имя персонажа' },
      { id: 'cartoon_blitz', name: 'Мульт-блиц', desc: 'Быстрые вопросы о мультфильмах', questionType: 'text', aiHint: 'Короткий вопрос о мультфильмах, ответ 1-2 слова' },
    ],
  },
  {
    id: 'books',
    name: 'Литературный квиз',
    icon: '📚',
    roundTypes: [
      { id: 'book_by_quote', name: 'Цитата из книги', desc: 'По цитате угадать книгу или автора', questionType: 'text', aiHint: 'Знаменитая цитата из книги, ответ — название книги или автор' },
      { id: 'book_first_line', name: 'Первая строка', desc: 'По первой строке романа угадать книгу', questionType: 'text', aiHint: 'Первая строка романа: "...", ответ — название книги' },
      { id: 'three_books_one_author', name: '3 книги — 1 автор', desc: 'По трём книгам угадать автора', questionType: 'text', aiHint: 'Три книги: A, B, C — кто автор всех трёх?' },
      { id: 'simplified_plot_book', name: 'Упрощённый сюжет', desc: 'Сюжет книги в одном нелепом предложении', questionType: 'text', aiHint: 'Опишите сюжет книги упрощённо и смешно' },
      { id: 'character_by_description', name: 'Персонаж по описанию', desc: 'По описанию угадать литературного персонажа', questionType: 'text', aiHint: 'Опишите литературного персонажа, ответ — имя персонажа' },
      { id: 'book_blitz', name: 'Литературный блиц', desc: 'Быстрые вопросы о книгах и авторах', questionType: 'text', aiHint: 'Короткий вопрос о литературе, ответ 1-2 слова' },
    ],
  },
  {
    id: 'general',
    name: 'Общие знания',
    icon: '🧠',
    roundTypes: [
      { id: 'classic', name: 'Классические вопросы', desc: 'Обычные вопросы на эрудицию', questionType: 'text', aiHint: 'Классический вопрос на общие знания' },
      { id: 'true_false', name: 'Правда или ложь', desc: 'Утверждение — правда или нет', questionType: 'text', aiHint: 'Утверждение: "...". Правда или ложь? Ответ: Правда/Ложь' },
      { id: 'estimation', name: 'Ближе к истине', desc: 'Числовой вопрос — побеждает ближайший ответ', questionType: 'text', aiHint: 'Числовой вопрос, ответ — конкретное число' },
      { id: 'who_am_i', name: 'Кто я?', desc: 'Подсказки по одной — чем раньше угадал, тем больше очков', questionType: 'text', aiHint: 'Подсказка 1 (сложная): ... Подсказка 2 (средняя): ... Подсказка 3 (лёгкая): ... Ответ: ...' },
      { id: 'chronology', name: 'Хронология', desc: 'Расположить события в правильном порядке', questionType: 'text', aiHint: 'Расположите в хронологическом порядке: A, B, C, D' },
      { id: 'connections', name: 'Что общего?', desc: '4 слова/факта — найти общую связь', questionType: 'text', aiHint: 'Что объединяет: A, B, C, D? Ответ — общая связь' },
      { id: 'blitz', name: 'Блиц', desc: 'Быстрые вопросы по 15 сек', questionType: 'text', aiHint: 'Короткий вопрос, ответ 1-2 слова, 15 секунд' },
    ],
  },
  {
    id: 'visual',
    name: 'Визуальный квиз',
    icon: '👁',
    roundTypes: [
      { id: 'logo', name: 'Угадай логотип', desc: 'По логотипу (или его части) назвать бренд', questionType: 'image', aiHint: 'text: "Какой бренд скрывается за этим логотипом?". answer: "Название бренда". НЕ упоминай бренд в text!' },
      { id: 'zoomed_in', name: 'Крупный план', desc: 'Сильно увеличенный фрагмент — что это?', questionType: 'image', aiHint: 'text: "Что изображено на этом крупном плане?". answer: "Название объекта". НЕ описывай объект в text!' },
      { id: 'celebrity_face', name: 'Кто на фото?', desc: 'Узнать знаменитость по фото', questionType: 'image', aiHint: 'text: "Кто изображён на фото?". answer: "Имя знаменитости". НЕ упоминай имя в text!' },
      { id: 'flag', name: 'Флаг страны', desc: 'Определить страну по флагу', questionType: 'image', aiHint: 'text: "Флаг какой страны показан на экране?". answer: "Название страны". НЕ упоминай страну в text!' },
      { id: 'silhouette', name: 'Силуэт', desc: 'По чёрному силуэту угадать предмет/персонажа', questionType: 'image', aiHint: 'text: "Угадайте, чей это силуэт?". answer: "Название объекта/персонажа". НЕ упоминай ответ в text!' },
      { id: 'spot_difference', name: 'Найди отличие', desc: 'Две похожие картинки — найти отличия', questionType: 'image', aiHint: 'text: "Найдите отличия между двумя картинками". answer: "Описание отличия".' },
    ],
  },
  {
    id: 'puzzle',
    name: 'Головоломки',
    icon: '🧩',
    roundTypes: [
      { id: 'rebus', name: 'Ребус', desc: 'Картинки + буквы = зашифрованное слово', questionType: 'text', aiHint: 'Составьте текстовый ребус (используя визуальное расположение текста), ответ — зашифрованное слово' },
      { id: 'anagram', name: 'Анаграмма', desc: 'Перемешанные буквы — составить слово', questionType: 'text', aiHint: 'Перемешанные буквы: ОЛОКМО, ответ — МОЛОКО' },
      { id: 'missing_vowels', name: 'Без гласных', desc: 'Слово без гласных букв — угадать слово', questionType: 'text', aiHint: 'Слово без гласных: МСКВ, ответ — МОСКВА' },
      { id: 'ditloid', name: 'Числа и буквы', desc: '"7 Д Н" = 7 дней недели', questionType: 'text', aiHint: 'Числовая аббревиатура, например: 12 М в Г = 12 месяцев в году' },
      { id: 'emoji_puzzle', name: 'Эмодзи-загадка', desc: 'Фраза/название зашифровано эмодзи', questionType: 'text', aiHint: 'Зашифруйте слово или фразу эмодзи, ответ — расшифровка' },
      { id: 'before_after', name: 'До и после', desc: 'Два слова с общим словом посередине', questionType: 'text', aiHint: '___ГРАД = ЛЕНИНГРАД и ГРАДУС. Какое общее слово? Ответ: ГРАД' },
    ],
  },
];

// Flatten all round types for lookup
export const ALL_ROUND_TYPES = CATEGORIES.flatMap(c =>
  c.roundTypes.map(r => ({ ...r, categoryId: c.id, categoryName: c.name }))
);

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id);
}

export function getRoundTypeById(id) {
  return ALL_ROUND_TYPES.find(r => r.id === id);
}
