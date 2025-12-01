import { Album } from '../models/album.model';
import { MOCK_SONGS } from './mock-songs';

function getSong(id: string) {
  return MOCK_SONGS.find((s) => s.id === id)!;
}

export const MOCK_ALBUMS: Album[] = [
  {
    id: '201',
    title: 'A Night at the Opera',
    description: 'El cuarto álbum de Queen, considerado una obra maestra.',
    coverUrl: 'https://picsum.photos/seed/nightopera/400/400',
    releaseDate: '1975-11-21T00:00:00Z',
    genre: 'Rock',
    price: 9.99,

    // TRACKLIST
    trackList: [
      { ...getSong('1'), trackNumber: 1, addedDate: '1975-11-21T00:00:00Z' },
      { ...getSong('2'), trackNumber: 2, addedDate: '1975-11-21T00:00:00Z' },
    ],

    // CÁLCULOS
    totalDuration: getSong('1').duration + getSong('2').duration,
    totalTracks: 2,
    totalPlayCount: getSong('1').playCount + getSong('2').playCount,
    averageRating: 4.8,

    // ARTISTA
    artistId: '101',
    artist: {
      id: '101',
      artisticName: 'Queen',
      profileImage: 'https://picsum.photos/seed/queen/200/200',
    },
  },

  {
    id: '202',
    title: 'The Wall',
    description: 'Una ópera rock conceptual de Pink Floyd.',
    coverUrl: 'https://picsum.photos/seed/thewall/400/400',
    releaseDate: '1979-11-30T00:00:00Z',
    genre: 'Progressive Rock',
    price: 12.99,

    trackList: [
      { ...getSong('4'), trackNumber: 1, addedDate: '1979-11-30T00:00:00Z' },
      { ...getSong('3'), trackNumber: 2, addedDate: '1979-11-30T00:00:00Z' },
    ],

    totalDuration: getSong('4').duration + getSong('3').duration,
    totalTracks: 2,
    totalPlayCount: getSong('4').playCount + getSong('3').playCount,
    averageRating: 4.9,

    artistId: '102',
    artist: {
      id: '102',
      artisticName: 'Pink Floyd',
      profileImage: 'https://picsum.photos/seed/pinkfloyd/200/200',
    },
  },

  {
    id: '203',
    title: 'Abbey Road',
    description:
      'El último disco grabado por The Beatles, una despedida monumental.',
    coverUrl: 'https://picsum.photos/seed/abbeyroad/400/400',
    releaseDate: '1969-09-26T00:00:00Z',
    genre: 'Rock',
    price: 10.99,

    trackList: [
      { ...getSong('7'), trackNumber: 1, addedDate: '1969-09-26T00:00:00Z' },
      { ...getSong('8'), trackNumber: 2, addedDate: '1969-09-26T00:00:00Z' },
      { ...getSong('9'), trackNumber: 3, addedDate: '1969-09-26T00:00:00Z' },
    ],

    totalDuration:
      getSong('7').duration + getSong('8').duration + getSong('9').duration,

    totalTracks: 3,
    totalPlayCount:
      getSong('7').playCount + getSong('8').playCount + getSong('9').playCount,

    averageRating: 4.9,

    artistId: '105',
    artist: {
      id: '105',
      artisticName: 'The Beatles',
      profileImage: 'https://picsum.photos/seed/beatles/200/200',
    },
  },

  {
    id: '204',
    title: 'Thriller',
    description: 'El álbum más vendido de todos los tiempos.',
    coverUrl: 'https://picsum.photos/seed/thriller/400/400',
    releaseDate: '1982-11-30T00:00:00Z',
    genre: 'Pop',
    price: 11.99,

    trackList: [
      { ...getSong('10'), trackNumber: 1, addedDate: '1982-11-30T00:00:00Z' },
      { ...getSong('11'), trackNumber: 2, addedDate: '1982-11-30T00:00:00Z' },
      { ...getSong('12'), trackNumber: 3, addedDate: '1982-11-30T00:00:00Z' },
    ],

    totalDuration:
      getSong('10').duration + getSong('11').duration + getSong('12').duration,

    totalTracks: 3,
    totalPlayCount:
      getSong('10').playCount +
      getSong('11').playCount +
      getSong('12').playCount,

    averageRating: 5.0,

    artistId: '106',
    artist: {
      id: '106',
      artisticName: 'Michael Jackson',
      profileImage: 'https://picsum.photos/seed/mj/200/200',
    },
  },

  {
    id: '205',
    title: 'Random Access Memories',
    description: 'El homenaje de Daft Punk a la música de estudio clásica.',
    coverUrl: 'https://picsum.photos/seed/ram/400/400',
    releaseDate: '2013-05-17T00:00:00Z',
    genre: 'Electronic',
    price: 9.49,

    trackList: [
      { ...getSong('13'), trackNumber: 1, addedDate: '2013-05-17T00:00:00Z' },
      { ...getSong('14'), trackNumber: 2, addedDate: '2013-05-17T00:00:00Z' },
      { ...getSong('15'), trackNumber: 3, addedDate: '2013-05-17T00:00:00Z' },
    ],

    totalDuration:
      getSong('13').duration + getSong('14').duration + getSong('15').duration,

    totalTracks: 3,
    totalPlayCount:
      getSong('13').playCount +
      getSong('14').playCount +
      getSong('15').playCount,

    averageRating: 4.7,

    artistId: '107',
    artist: {
      id: '107',
      artisticName: 'Daft Punk',
      profileImage: 'https://picsum.photos/seed/daftpunk/200/200',
    },
  },
];
