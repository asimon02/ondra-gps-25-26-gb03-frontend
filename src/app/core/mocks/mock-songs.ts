import { Song } from '../models/song.model';

export const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: {
      id: '101',
      artisticName: 'Queen',
      profileImage: 'https://picsum.photos/seed/queen/200/200',
    },
    duration: 354,
    genre: 'Rock',
    price: 1.99,
    coverUrl: 'https://picsum.photos/seed/nightopera/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 15420,
    averageRating: 4.9,
    releaseDate: '2024-01-01T00:00:00',
    description:
      'Una obra maestra del rock progresivo que combina ópera, balada y hard rock en una experiencia única.',
    isFavorite: true,
    isPurchased: true,
    albums: [
      {
        id: '201',
        title: 'A Night at the Opera',
        coverUrl: 'https://picsum.photos/seed/nightopera/400/400',
      },
    ],
  },
  {
    id: '2',
    title: "You're My Best Friend",
    artist: {
      id: '101',
      artisticName: 'Queen',
      profileImage: 'https://picsum.photos/seed/queen/200/200',
    },
    duration: 170,
    genre: 'Rock',
    price: 1.49,
    coverUrl: 'https://picsum.photos/seed/nightopera/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 8934,
    averageRating: 4.6,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: false,
    isPurchased: true,
    albums: [
      {
        id: '201',
        title: 'A Night at the Opera',
        coverUrl: 'https://picsum.photos/seed/nightopera/400/400',
      },
    ],
  },
  {
    id: '3',
    title: 'Comfortably Numb',
    artist: {
      id: '102',
      artisticName: 'Pink Floyd',
      profileImage: 'https://picsum.photos/seed/pinkfloyd/200/200',
    },
    duration: 382,
    genre: 'Progressive Rock',
    price: 2.49,
    coverUrl: 'https://picsum.photos/seed/thewall/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 23567,
    averageRating: 4.8,
    releaseDate: '2024-01-01T00:00:00',
    description:
      'Uno de los solos de guitarra más icónicos de la historia del rock.',
    isFavorite: true,
    isPurchased: false,
    albums: [
      {
        id: '202',
        title: 'The Wall',
        coverUrl: 'https://picsum.photos/seed/thewall/400/400',
      },
    ],
  },
  {
    id: '4',
    title: 'Another Brick in the Wall (Part 2)',
    artist: {
      id: '102',
      artisticName: 'Pink Floyd',
      profileImage: 'https://picsum.photos/seed/pinkfloyd/200/200',
    },
    duration: 238,
    genre: 'Progressive Rock',
    price: 1.99,
    coverUrl: 'https://picsum.photos/seed/thewall/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 31245,
    averageRating: 4.7,
    releaseDate: '2024-01-01T00:00:00',
    description: 'Un himno generacional contra la educación autoritaria.',
    isFavorite: false,
    isPurchased: false,
    albums: [
      {
        id: '202',
        title: 'The Wall',
        coverUrl: 'https://picsum.photos/seed/thewall/400/400',
      },
    ],
  },
  {
    id: '5',
    title: 'Stairway to Heaven',
    artist: {
      id: '103',
      artisticName: 'Led Zeppelin',
      profileImage: 'https://picsum.photos/seed/ledzeppelin/200/200',
    },
    duration: 482,
    genre: 'Rock',
    price: 0,
    coverUrl: 'https://picsum.photos/seed/ledzep4/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 45678,
    averageRating: 5.0,
    releaseDate: '2024-01-01T00:00:00',
    description: 'Una épica travesía musical de ocho minutos.',
    isFavorite: true,
    isPurchased: true,
    albums: [], // antes era null
  },
  {
    id: '6',
    title: 'Imagine',
    artist: {
      id: '104',
      artisticName: 'John Lennon',
      profileImage: 'https://picsum.photos/seed/lennon/200/200',
    },
    duration: 183,
    genre: 'Pop',
    price: 0,
    coverUrl: 'https://picsum.photos/seed/imagine/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 67890,
    averageRating: 4.9,
    releaseDate: '2024-01-01T00:00:00',
    description: 'Un himno universal de paz.',
    isFavorite: false,
    isPurchased: false,
    albums: [],
  },

  /* ---- Beatles ---- */

  {
    id: '7',
    title: 'Come Together',
    artist: {
      id: '105',
      artisticName: 'The Beatles',
      profileImage: 'https://picsum.photos/seed/beatles/200/200',
    },
    duration: 259,
    genre: 'Rock',
    price: 1.49,
    coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 54312,
    averageRating: 4.8,
    releaseDate: '2024-01-01T00:00:00',
    description:
      'Una de las aperturas más potentes de la discografía de The Beatles.',
    isFavorite: true,
    isPurchased: false,
    albums: [
      {
        id: '203',
        title: 'Abbey Road',
        coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
      },
    ],
  },
  {
    id: '8',
    title: 'Something',
    artist: {
      id: '105',
      artisticName: 'The Beatles',
      profileImage: 'https://picsum.photos/seed/beatles/200/200',
    },
    duration: 183,
    genre: 'Rock Ballad',
    price: 1.29,
    coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 40123,
    averageRating: 4.9,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: false,
    isPurchased: false,
    albums: [
      {
        id: '203',
        title: 'Abbey Road',
        coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
      },
    ],
  },
  {
    id: '9',
    title: 'Here Comes the Sun',
    artist: {
      id: '105',
      artisticName: 'The Beatles',
      profileImage: 'https://picsum.photos/seed/beatles/200/200',
    },
    duration: 185,
    genre: 'Folk Rock',
    price: 1.29,
    coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 73212,
    averageRating: 4.9,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: true,
    isPurchased: true,
    albums: [
      {
        id: '203',
        title: 'Abbey Road',
        coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
      },
    ],
  },

  /* ---- Michael Jackson ---- */

  {
    id: '10',
    title: 'Thriller',
    artist: {
      id: '106',
      artisticName: 'Michael Jackson',
      profileImage: 'https://picsum.photos/seed/mj/200/200',
    },
    duration: 358,
    genre: 'Pop',
    price: 1.49,
    coverUrl: 'https://picsum.photos/seed/thriller/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 98231,
    averageRating: 5.0,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: true,
    isPurchased: false,
    albums: [
      {
        id: '204',
        title: 'Thriller',
        coverUrl: 'https://picsum.photos/seed/thriller/400/400',
      },
    ],
  },
  {
    id: '11',
    title: 'Beat It',
    artist: {
      id: '106',
      artisticName: 'Michael Jackson',
      profileImage: 'https://picsum.photos/seed/mj/200/200',
    },
    duration: 258,
    genre: 'Pop Rock',
    price: 1.29,
    coverUrl: 'https://picsum.photos/seed/thriller/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 74210,
    averageRating: 4.8,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: false,
    isPurchased: true,
    albums: [
      {
        id: '204',
        title: 'Thriller',
        coverUrl: 'https://picsum.photos/seed/thriller/400/400',
      },
    ],
  },
  {
    id: '12',
    title: 'Billie Jean',
    artist: {
      id: '106',
      artisticName: 'Michael Jackson',
      profileImage: 'https://picsum.photos/seed/mj/200/200',
    },
    duration: 294,
    genre: 'Pop',
    price: 1.49,
    coverUrl: 'https://picsum.photos/seed/thriller/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 82134,
    averageRating: 5.0,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: true,
    isPurchased: false,
    albums: [
      {
        id: '204',
        title: 'Thriller',
        coverUrl: 'https://picsum.photos/seed/thriller/400/400',
      },
    ],
  },

  /* ---- Daft Punk ---- */

  {
    id: '13',
    title: 'Get Lucky',
    artist: {
      id: '107',
      artisticName: 'Daft Punk',
      profileImage: 'https://picsum.photos/seed/daftpunk/200/200',
    },
    duration: 369,
    genre: 'Funk',
    price: 1.49,
    coverUrl: 'https://picsum.photos/seed/ram/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 60123,
    averageRating: 4.7,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: false,
    isPurchased: false,
    albums: [
      {
        id: '205',
        title: 'Random Access Memories',
        coverUrl: 'https://picsum.photos/seed/ram/400/400',
      },
    ],
  },
  {
    id: '14',
    title: 'Instant Crush',
    artist: {
      id: '107',
      artisticName: 'Daft Punk',
      profileImage: 'https://picsum.photos/seed/daftpunk/200/200',
    },
    duration: 337,
    genre: 'Synthpop',
    price: 1.29,
    coverUrl: 'https://picsum.photos/seed/ram/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 42111,
    averageRating: 4.6,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: true,
    isPurchased: false,
    albums: [
      {
        id: '205',
        title: 'Random Access Memories',
        coverUrl: 'https://picsum.photos/seed/ram/400/400',
      },
    ],
  },
  {
    id: '15',
    title: 'Lose Yourself to Dance',
    artist: {
      id: '107',
      artisticName: 'Daft Punk',
      profileImage: 'https://picsum.photos/seed/daftpunk/200/200',
    },
    duration: 350,
    genre: 'Funk',
    price: 1.49,
    coverUrl: 'https://picsum.photos/seed/ram/400/400',
    audioUrl:
      'https://res.cloudinary.com/diiozhbng/video/upload/v1763401450/sandbreaker-379630_mjpozh.mp3',
    playCount: 38912,
    averageRating: 4.5,
    releaseDate: '2024-01-01T00:00:00',
    isFavorite: false,
    isPurchased: false,
    albums: [
      {
        id: '205',
        title: 'Random Access Memories',
        coverUrl: 'https://picsum.photos/seed/ram/400/400',
      },
    ],
  },
];
