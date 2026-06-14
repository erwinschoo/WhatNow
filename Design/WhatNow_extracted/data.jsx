// data.jsx — WhatNow content: films, themes, genres, quiz, badges, profile
// Real well-known films; artwork rendered as styled poster placeholders.

const FILMS = [
  {
    id: 'br2049', title: 'Blade Runner 2049', year: 2017, dir: 'Denis Villeneuve',
    runtime: 164, genres: ['Sci-Fi', 'Drama'], decade: '2010s', cult: false,
    themes: ['Identiteit', 'Herinnering', 'Eenzaamheid', 'Mens-zijn'],
    scores: { imdb: 8.0, rt: 88, mc: 81 },
    grad: ['#3a1d4d', '#0b1230'], ink: '#FFB347',
    feel: { cinematography: 10, intrigue: 8, comedic: 2, emotional: 7, pace: 3 },
    why: 'Omdat je trager, beeldgedreven sci-fi over identiteit waardeert.',
    synopsis: 'Dertig jaar na de eerste replicant-jacht ontdekt een nieuwe blade runner een geheim dat de restanten van de samenleving in chaos kan storten — en hij gaat op zoek naar een man die al lang verdwenen is.',
    trivia: [
      'Roger Deakins won hiervoor zijn éérste Oscar voor cinematografie — na dertien eerdere nominaties.',
      'Veel sets werden fysiek gebouwd in plaats van met CGI, om tastbaar licht en mist te krijgen.',
    ],
  },
  {
    id: 'her', title: 'Her', year: 2013, dir: 'Spike Jonze',
    runtime: 126, genres: ['Sci-Fi', 'Romance', 'Drama'], decade: '2010s', cult: false,
    themes: ['Eenzaamheid', 'Verbinding', 'Technologie', 'Intimiteit'],
    scores: { imdb: 8.0, rt: 95, mc: 91 },
    grad: ['#b23a48', '#3a1626'], ink: '#FFC9A0',
    feel: { cinematography: 8, intrigue: 6, comedic: 4, emotional: 9, pace: 4 },
    why: 'Eenzelfde melancholie over verbinding en technologie als wat je laatst bekeek.',
    synopsis: 'Een introverte briefschrijver wordt verliefd op een besturingssysteem dat is ontworpen om aan al zijn behoeften te voldoen — een relatie die hem dwingt opnieuw na te denken over intimiteit.',
    trivia: [
      'Samantha werd eerst ingesproken door Samantha Morton; in postproductie verving Scarlett Johansson haar volledig.',
      'De warme, retro-futuristische skyline is deels in Shanghai opgenomen.',
    ],
  },
  {
    id: 'arrival', title: 'Arrival', year: 2016, dir: 'Denis Villeneuve',
    runtime: 116, genres: ['Sci-Fi', 'Drama'], decade: '2010s', cult: false,
    themes: ['Taal', 'Tijd', 'Verlies', 'Communicatie'],
    scores: { imdb: 7.9, rt: 94, mc: 81 },
    grad: ['#1f3b2e', '#0a1714'], ink: '#9FE3C5',
    feel: { cinematography: 9, intrigue: 9, comedic: 1, emotional: 8, pace: 3 },
    why: 'Cerebrale sci-fi met een emotionele kern, net als je favorieten.',
    synopsis: 'Wanneer mysterieuze ruimteschepen wereldwijd landen, moet een taalkundige een manier vinden om met de bezoekers te communiceren — een taak die haar besef van tijd zelf verandert.',
    trivia: [
      'De cirkelvormige logogrammen zijn als een complete, leesbare schrijftaal ontworpen.',
      'Gebaseerd op de novelle "Story of Your Life" van Ted Chiang.',
    ],
  },
  {
    id: 'eternal', title: 'Eternal Sunshine of the Spotless Mind', year: 2004, dir: 'Michel Gondry',
    runtime: 108, genres: ['Sci-Fi', 'Romance', 'Drama'], decade: '2000s', cult: true,
    themes: ['Herinnering', 'Liefde', 'Verlies', 'Identiteit'],
    scores: { imdb: 8.3, rt: 92, mc: 89 },
    grad: ['#2a4a6b', '#101d2b'], ink: '#BCD7F2',
    feel: { cinematography: 7, intrigue: 8, comedic: 5, emotional: 10, pace: 5 },
    why: 'Een speelse maar diep emotionele kijk op herinnering en liefde.',
    synopsis: 'Nadat een stel hun herinneringen aan elkaar laat wissen, vecht een man zich door zijn eigen vervagende geheugen om vast te houden aan wat hij dreigt te verliezen.',
    trivia: [
      'Veel geheugen-effecten werden in-camera opgenomen, niet met CGI.',
      'Jim Carrey speelt hier bewust tegen zijn komische typecasting in.',
    ],
  },
  {
    id: 'parasite', title: 'Parasite', year: 2019, dir: 'Bong Joon-ho',
    runtime: 132, genres: ['Thriller', 'Drama'], decade: '2010s', cult: true,
    themes: ['Klasse', 'Bedrog', 'Familie', 'Ongelijkheid'],
    scores: { imdb: 8.5, rt: 99, mc: 96 },
    grad: ['#4a4a2a', '#16160c'], ink: '#E6E0A8',
    feel: { cinematography: 9, intrigue: 9, comedic: 6, emotional: 7, pace: 6 },
    why: 'Scherpe genre-mix met sociale lading — precies jouw smaak.',
    synopsis: 'Een arme familie dringt sluw binnen in het leven van een rijk gezin, totdat een verborgen geheim de hele constructie laat ontsporen.',
    trivia: [
      'De eerste niet-Engelstalige film die de Oscar voor Beste Film won.',
      'Het hele huis was een gebouwde set; de overstromingsscène gebruikte een gigantische watertank.',
    ],
  },
  {
    id: 'twbb', title: 'There Will Be Blood', year: 2007, dir: 'Paul Thomas Anderson',
    runtime: 158, genres: ['Drama'], decade: '2000s', cult: false,
    themes: ['Hebzucht', 'Ambitie', 'Isolatie', 'Geloof'],
    scores: { imdb: 8.2, rt: 91, mc: 93 },
    grad: ['#5a3210', '#1a0e05'], ink: '#F0B070',
    feel: { cinematography: 10, intrigue: 7, comedic: 2, emotional: 6, pace: 2 },
    why: 'Meeslepende karakterstudie met magistrale cinematografie.',
    synopsis: 'Een meedogenloze oliebaron bouwt aan het begin van de twintigste eeuw een imperium, terwijl zijn ambitie hem stap voor stap van elke menselijke band losweekt.',
    trivia: [
      'Daniel Day-Lewis baseerde zijn stem op filmmaker John Huston.',
      'De score van Jonny Greenwood (Radiohead) werd door een regel gediskwalificeerd voor een Oscar.',
    ],
  },
  {
    id: 'itmfl', title: 'In the Mood for Love', year: 2000, dir: 'Wong Kar-wai',
    runtime: 98, genres: ['Romance', 'Drama'], decade: '2000s', cult: true,
    themes: ['Verlangen', 'Terughoudendheid', 'Herinnering', 'Tijd'],
    scores: { imdb: 8.1, rt: 92, mc: 87 },
    grad: ['#7a1f3a', '#250b14'], ink: '#F4B8C4',
    feel: { cinematography: 10, intrigue: 6, comedic: 1, emotional: 9, pace: 2 },
    why: 'Ingehouden, beeldschoon verlangen — een tonale tweeling van wat je liket.',
    synopsis: 'Twee buren in het Hongkong van de jaren zestig ontdekken dat hun partners een affaire hebben, en vinden in hun gedeelde verdriet een verboden, onuitgesproken tederheid.',
    trivia: [
      'Maggie Cheung draagt meer dan twintig verschillende cheongsam-jurken.',
      'De film werd ruim vijftien maanden gedraaid, grotendeels zonder afgerond script.',
    ],
  },
  {
    id: 'ncfom', title: 'No Country for Old Men', year: 2007, dir: 'Joel & Ethan Coen',
    runtime: 122, genres: ['Thriller', 'Crime'], decade: '2000s', cult: false,
    themes: ['Lot', 'Geweld', 'Ouder worden', 'Moraal'],
    scores: { imdb: 8.2, rt: 93, mc: 91 },
    grad: ['#3f3a2c', '#14120c'], ink: '#D8CFA8',
    feel: { cinematography: 8, intrigue: 9, comedic: 2, emotional: 5, pace: 5 },
    why: 'Strakke spanning en een onontkoombaar noodlot.',
    synopsis: 'Een jager vindt een koffer vol geld op de plek van een mislukte drugsdeal, en wordt opgejaagd door een huurmoordenaar die het lot zelf lijkt te belichamen.',
    trivia: [
      'De Coens hielden zich bijna woordelijk aan de roman van Cormac McCarthy.',
      'Het kapsel van Javier Bardem werd bewust verontrustend gekozen.',
    ],
  },
  {
    id: 'drive', title: 'Drive', year: 2011, dir: 'Nicolas Winding Refn',
    runtime: 100, genres: ['Crime', 'Drama'], decade: '2010s', cult: true,
    themes: ['Identiteit', 'Geweld', 'Romance', 'Terughoudendheid'],
    scores: { imdb: 7.8, rt: 93, mc: 78 },
    grad: ['#1b2d4f', '#7a1f5a'], ink: '#FF9FD6',
    feel: { cinematography: 9, intrigue: 7, comedic: 2, emotional: 6, pace: 5 },
    why: 'Neon-noir met ingehouden romantiek en plotselinge dreiging.',
    synopsis: 'Een zwijgzame stuntchauffeur klust bij als vluchtauto-bestuurder, tot hij voor zijn buurvrouw kiest en in een spiraal van geweld belandt.',
    trivia: [
      'Het schorpioenjasje werd iconisch; er werden meerdere exemplaren van gemaakt.',
      'Refn is kleurenblind, wat het hoog-contrast neonpalet mede vormgaf.',
    ],
  },
  {
    id: '2001', title: '2001: A Space Odyssey', year: 1968, dir: 'Stanley Kubrick',
    runtime: 149, genres: ['Sci-Fi'], decade: '1960s', cult: true,
    themes: ['Evolutie', 'Technologie', 'Het onbekende', 'Tijd'],
    scores: { imdb: 8.3, rt: 92, mc: 84 },
    grad: ['#11111c', '#3a0d0d'], ink: '#FF6B5E',
    feel: { cinematography: 10, intrigue: 9, comedic: 1, emotional: 4, pace: 1 },
    why: 'Hypnotiserend en ambitieus — de oerbron van slow sci-fi.',
    synopsis: 'Van de dageraad van de mens tot een missie naar Jupiter onderzoekt de film evolutie, kunstmatige intelligentie en de plaats van de mens in een onverschillig universum.',
    trivia: [
      'Kubrick liet de gedetailleerde sets vernietigen om hergebruik te voorkomen.',
      'De "Star Gate"-sequentie gebruikte de toen nieuwe slit-scan-fotografie.',
    ],
  },
  {
    id: 'mulholland', title: 'Mulholland Drive', year: 2001, dir: 'David Lynch',
    runtime: 147, genres: ['Mystery', 'Thriller'], decade: '2000s', cult: true,
    themes: ['Dromen', 'Identiteit', 'Hollywood', 'Verlangen'],
    scores: { imdb: 7.9, rt: 83, mc: 85 },
    grad: ['#2a1a3a', '#0c0814'], ink: '#D6B8F2',
    feel: { cinematography: 9, intrigue: 10, comedic: 3, emotional: 6, pace: 3 },
    why: 'Droomlogica en identiteit — een raadsel dat blijft hangen.',
    synopsis: 'Een aspirant-actrice en een vrouw met geheugenverlies trekken door een droomachtig Los Angeles, waar werkelijkheid en verlangen steeds verder in elkaar overlopen.',
    trivia: [
      'Begon als een afgewezen tv-pilot en werd later tot speelfilm omgewerkt.',
      'Lynch bood "tien aanwijzingen" aan om de film te ontrafelen.',
    ],
  },
  {
    id: 'master', title: 'The Master', year: 2012, dir: 'Paul Thomas Anderson',
    runtime: 138, genres: ['Drama'], decade: '2010s', cult: true,
    themes: ['Controle', 'Geloof', 'Mannelijkheid', 'Trauma'],
    scores: { imdb: 7.1, rt: 85, mc: 86 },
    grad: ['#2c4a52', '#0d1719'], ink: '#9FD4DE',
    feel: { cinematography: 10, intrigue: 8, comedic: 2, emotional: 7, pace: 2 },
    why: 'Een hypnotische machtsstrijd tussen twee onvergetelijke personages.',
    synopsis: 'Een ontheemde oorlogsveteraan raakt in de ban van de charismatische leider van een nieuwe beweging, in een relatie van aantrekking, controle en verzet.',
    trivia: [
      'Opgenomen in 65mm/70mm — zeldzaam voor een intiem karakterdrama.',
      'Losjes geïnspireerd op de ontstaansjaren van een midden-twintigste-eeuwse beweging.',
    ],
  },
  {
    id: 'intowild', title: 'Into the Wild', year: 2007, dir: 'Sean Penn',
    runtime: 148, genres: ['Drama', 'Avontuur'], decade: '2000s', cult: true,
    themes: ['Eenzaamheid', 'Vrijheid', 'Natuur', 'Zelfontdekking'],
    scores: { imdb: 8.1, rt: 83, mc: 73 },
    grad: ['#2e4a1e', '#0d1408'], ink: '#A8D67E',
    feel: { cinematography: 8, intrigue: 6, comedic: 3, emotional: 9, pace: 3 },
    why: 'Eenzelfde drang naar vrijheid en de wildernis als waar je naar zocht.',
    synopsis: 'Een pas afgestudeerde student geeft zijn bezittingen weg en trekt alleen de Amerikaanse wildernis in, op zoek naar een leven van pure vrijheid — tot in de uitgestrekte natuur van Alaska.',
    trivia: [
      'Gebaseerd op het non-fictieboek van Jon Krakauer over Christopher McCandless.',
      'Eddie Vedder van Pearl Jam schreef en zong de complete soundtrack.',
    ],
  },
  {
    id: '127hours', title: '127 Hours', year: 2010, dir: 'Danny Boyle',
    runtime: 94, genres: ['Drama', 'Avontuur'], decade: '2010s', cult: false,
    themes: ['Overleven', 'Eenzaamheid', 'Wilskracht', 'Natuur'],
    scores: { imdb: 7.5, rt: 93, mc: 82 },
    grad: ['#7a3410', '#1f0d06'], ink: '#F4A95E',
    feel: { cinematography: 8, intrigue: 8, comedic: 3, emotional: 8, pace: 6 },
    why: 'Dezelfde solo-overlevingsstrijd en innerlijke reis.',
    synopsis: 'Een avontuurlijke bergbeklimmer raakt met zijn arm beklemd onder een rotsblok in een afgelegen canyon, en moet in vijf dagen het onmogelijke onder ogen zien om te overleven.',
    trivia: [
      'Gebaseerd op het waargebeurde verhaal van Aron Ralston in Blue John Canyon, Utah.',
      'Danny Boyle filmde met twee cameramannen tegelijk om geen moment te missen.',
    ],
  },
  {
    id: 'wild', title: 'Wild', year: 2014, dir: 'Jean-Marc Vallée',
    runtime: 115, genres: ['Drama', 'Avontuur'], decade: '2010s', cult: false,
    themes: ['Zelfontdekking', 'Verlies', 'Natuur', 'Verlossing'],
    scores: { imdb: 7.1, rt: 89, mc: 76 },
    grad: ['#3a4a2a', '#121609'], ink: '#C6D89A',
    feel: { cinematography: 7, intrigue: 5, comedic: 3, emotional: 9, pace: 4 },
    why: 'Een lange tocht door de natuur als manier om te helen.',
    synopsis: 'Na het verlies van haar moeder en het uiteenvallen van haar leven gaat een vrouw alleen de Pacific Crest Trail lopen — meer dan duizend mijl, om zichzelf terug te vinden.',
    trivia: [
      'Gebaseerd op de memoires van Cheryl Strayed over haar tocht over de Pacific Crest Trail.',
      'Reese Witherspoon droeg een bewust overladen rugzak die de crew "Monster" doopte.',
    ],
  },
  {
    id: 'nomadland', title: 'Nomadland', year: 2020, dir: 'Chloé Zhao',
    runtime: 107, genres: ['Drama'], decade: '2020s', cult: false,
    themes: ['Eenzaamheid', 'Vrijheid', 'Verlies', 'Natuur'],
    scores: { imdb: 7.3, rt: 93, mc: 93 },
    grad: ['#4a3a52', '#14101a'], ink: '#D2B8E0',
    feel: { cinematography: 9, intrigue: 5, comedic: 2, emotional: 8, pace: 2 },
    why: 'Ingehouden, beeldschoon en zwervend — vrijheid en verlies in balans.',
    synopsis: 'Na het verlies van alles trekt een vrouw in een busje door het Amerikaanse Westen en leeft als moderne nomade, in een wereld van weidse landschappen en vluchtige ontmoetingen.',
    trivia: [
      'Veel rollen worden vertolkt door échte nomaden die een versie van zichzelf spelen.',
      'Won de Oscars voor Beste Film, Beste Regie (Chloé Zhao) en Beste Actrice.',
    ],
  },
];

const FILM_BY_ID = Object.fromEntries(FILMS.map(f => [f.id, f]));

// Thematic "more like this" chains — the heart of the app
const CHAINS = {
  br2049: ['her', 'arrival', '2001', 'eternal'],
  her: ['eternal', 'arrival', 'itmfl', 'br2049'],
  arrival: ['br2049', '2001', 'eternal', 'her'],
  eternal: ['her', 'itmfl', 'mulholland', 'arrival'],
  parasite: ['ncfom', 'twbb', 'mulholland', 'master'],
  twbb: ['master', 'ncfom', 'parasite', '2001'],
  itmfl: ['her', 'eternal', 'drive', 'mulholland'],
  ncfom: ['twbb', 'drive', 'parasite', 'master'],
  drive: ['ncfom', 'mulholland', 'itmfl', 'twbb'],
  '2001': ['arrival', 'br2049', 'master', 'mulholland'],
  mulholland: ['eternal', 'drive', 'master', '2001'],
  master: ['twbb', 'parasite', '2001', 'mulholland'],
  intowild: ['127hours', 'wild', 'nomadland', '2001'],
  '127hours': ['intowild', 'wild', 'nomadland', 'ncfom'],
  wild: ['intowild', 'nomadland', '127hours', 'eternal'],
  nomadland: ['intowild', 'wild', 'itmfl', 'arrival'],
};

const GENRES = ['Sci-Fi', 'Drama', 'Thriller', 'Romance', 'Crime', 'Mystery'];
const DECADES = ['1960s', '2000s', '2010s', '2020s'];
const ALL_THEMES = ['Herinnering', 'Identiteit', 'Eenzaamheid', 'Tijd', 'Klasse', 'Verlangen', 'Lot', 'Dromen', 'Technologie', 'Geweld'];

const FEELS = [
  { key: 'cinematography', label: 'Cinematografie', lo: 'Functioneel', hi: 'Schilderachtig' },
  { key: 'intrigue', label: 'Intrige', lo: 'Rechttoe', hi: 'Raadselachtig' },
  { key: 'comedic', label: 'Humor', lo: 'Bloedserieus', hi: 'Speels' },
  { key: 'emotional', label: 'Emotionele diepte', lo: 'Koel', hi: 'Hartverscheurend' },
  { key: 'pace', label: 'Tempo', lo: 'Beschouwend', hi: 'Strak' },
];

// Onboarding
const WATCH_LEVELS = [
  { id: 'soms', label: 'Af en toe', sub: 'Een paar films per maand', films: '~2/mnd' },
  { id: 'regelmatig', label: 'Regelmatig', sub: 'Wekelijkse filmavond', films: '~1/week' },
  { id: 'liefhebber', label: 'Filmliefhebber', sub: 'Je leeft voor cinema', films: '~3/week' },
  { id: 'dagelijks', label: 'Dagelijks', sub: 'Eén per dag, minstens', films: '~7/week' },
];
const ONB_GENRES = ['Sci-Fi', 'Drama', 'Thriller', 'Romance', 'Crime', 'Mystery', 'Comedy', 'Horror', 'Documentaire', 'Animatie'];
const ONB_THEMES = ['Herinnering', 'Identiteit', 'Eenzaamheid', 'Tijd', 'Klasse', 'Verlangen', 'Lot', 'Dromen', 'Technologie', 'Geweld', 'Familie', 'Hebzucht', 'Geloof', 'Verlies'];

// Quiz
const QUIZ = [
  {
    q: 'Welke film was de eerste niet-Engelstalige winnaar van de Oscar voor Beste Film?',
    options: ['Drive', 'Parasite', 'Her', 'Arrival'], answer: 1,
    fact: 'Parasite (2019) van Bong Joon-ho schreef in 2020 geschiedenis als eerste niet-Engelstalige Beste Film.',
    film: 'parasite',
  },
  {
    q: 'Voor welke film won Roger Deakins zijn éérste Oscar voor cinematografie?',
    options: ['Blade Runner 2049', 'No Country for Old Men', 'There Will Be Blood', '2001'], answer: 0,
    fact: 'Na dertien nominaties won Deakins eindelijk voor Blade Runner 2049 (2017).',
    film: 'br2049',
  },
  {
    q: 'Daniel Day-Lewis modelleerde zijn stem naar regisseur John Huston in welke film?',
    options: ['The Master', 'There Will Be Blood', 'No Country for Old Men', 'Drive'], answer: 1,
    fact: 'Zijn beroemde stemklank in There Will Be Blood is geïnspireerd op John Huston.',
    film: 'twbb',
  },
  {
    q: 'Welke film begon zijn leven als een afgewezen tv-pilot?',
    options: ['Mulholland Drive', 'Eternal Sunshine', 'In the Mood for Love', 'Her'], answer: 0,
    fact: 'Mulholland Drive werd eerst als tv-pilot gedraaid en daarna tot speelfilm omgewerkt.',
    film: 'mulholland',
  },
  {
    q: 'Scarlett Johansson sprak een kunstmatige intelligentie in. In welke film?',
    options: ['Arrival', 'Her', 'Eternal Sunshine', '2001'], answer: 1,
    fact: 'Zij verving Samantha Morton in postproductie als de stem van Samantha in Her.',
    film: 'her',
  },
];

// Profile
const BADGES = [
  { id: 'cinephile', label: 'Cinefiel', icon: 'film', earned: true, sub: '50+ films gezien' },
  { id: 'theme', label: 'Thema-ontdekker', icon: 'compass', earned: true, sub: '10 thematische ketens gevolgd' },
  { id: 'night', label: 'Nachtbraker', icon: 'moon', earned: true, sub: '20 films na middernacht' },
  { id: 'quizmaster', label: 'Quizmeester', icon: 'star', earned: true, sub: '5 quizzes 100% gehaald' },
  { id: 'decade', label: 'Tijdreiziger', icon: 'clock', earned: false, sub: 'Film uit elk decennium sinds 1950' },
  { id: 'complete', label: 'Voltooier', icon: 'check', earned: false, sub: 'Een hele thematische keten af' },
];

const PROFILE = {
  name: 'Mara Devlin',
  handle: '@maradev',
  level: 'Filmliefhebber',
  levelPct: 0.72,
  stats: { seen: 47, watchlist: 12, quizAvg: 84, hours: 112, streak: 9 },
  topThemes: [
    { label: 'Herinnering', n: 18 },
    { label: 'Identiteit', n: 14 },
    { label: 'Eenzaamheid', n: 11 },
    { label: 'Tijd', n: 9 },
  ],
  genreBars: [
    { label: 'Drama', n: 22 }, { label: 'Sci-Fi', n: 17 }, { label: 'Thriller', n: 12 },
    { label: 'Crime', n: 8 }, { label: 'Romance', n: 6 }, { label: 'Mystery', n: 4 },
  ],
  quizHistory: [62, 80, 75, 90, 84, 100, 88],
};

Object.assign(window, {
  FILMS, FILM_BY_ID, CHAINS, GENRES, DECADES, ALL_THEMES, FEELS,
  WATCH_LEVELS, ONB_GENRES, ONB_THEMES, QUIZ, BADGES, PROFILE,
});
