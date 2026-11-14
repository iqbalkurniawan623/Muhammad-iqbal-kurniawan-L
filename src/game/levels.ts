import { LevelConfig } from './algorithms';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Pulau I: Taman Embun Sakura (BFS)',
    subtitle: 'Siraman Air Melebar Lapis demi Lapis',
    algorithmFocus: 'Breadth-First Search (FIFO Queue)',
    width: 15,
    height: 11,
    crystalsRequired: 3,
    parMoves: 28,
    seed: 4201,
    description:
      'Gunakan Siram Embun BFS [1] untuk mengalirkan riak air sungai secara melebar (Queue FIFO) dan menemukan rute terpendek menuju Kuncup Bunga Sakura.',
    tip: 'BFS menjamin jalur terpendek (Shortest Path) menuju kuncup bunga karena menyiram seluruh petak berjarak d sebelum jarak d+1.',
  },
  {
    id: 2,
    title: 'Pulau II: Lembah Sulur Akar (DFS)',
    subtitle: 'Penelusuran Akar Mendalam & Backtracking',
    algorithmFocus: 'Depth-First Search (LIFO Stack)',
    width: 17,
    height: 13,
    crystalsRequired: 4,
    parMoves: 38,
    seed: 8819,
    description:
      'Gunakan Sulur Akar DFS [2] untuk menjulurkan akar pohon menembus lorong sedalam mungkin (Stack LIFO), membuka semak ranting kering, dan menenangkan Roh Kabut.',
    tip: 'DFS menggunakan Stack (LIFO): akar menjalar pada satu cabang sampai ujung buntu terlebih dahulu sebelum melakukan Backtracking.',
  },
  {
    id: 3,
    title: 'Pulau III: Harmoni Taman Langit',
    subtitle: 'Perbandingan Ekosistem BFS & DFS',
    algorithmFocus: 'Kombinasi Siraman BFS & Akar DFS',
    width: 19,
    height: 13,
    crystalsRequired: 5,
    parMoves: 46,
    seed: 9377,
    description:
      'Mekarkan seluruh Kuncup Sakura di Pulau Langit Utama! Gunakan Bandingkan [3] untuk melihat perbedaan sebaran Air (BFS) dan Akar (DFS) secara langsung.',
    tip: 'Tekan [3] kapan saja untuk membandingkan efisiensi petak yang disiram oleh BFS (Queue) vs DFS (Stack) menuju Pohon Sakura Agung.',
  },
];

export interface PresentationSlide {
  stepNumber: string;
  timeRange: string;
  title: string;
  subtitle: string;
  talkingPoints: string[];
  codeSnippet: string;
  liveDemoActionLabel: string;
  demoType: 'bfs' | 'dfs' | 'compare' | 'enemy';
}

export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    stepNumber: '01',
    timeRange: 'Menit 0:00 – 1:15',
    title: 'Konsep Game "Komorebi: Cloud Island Bloom" & Graf Grid 2D',
    subtitle: 'Representasi Ekosistem Pulau Langit sebagai Graf G = (V, E)',
    talkingPoints: [
      'Perkenalkan game "Komorebi: Cloud Island Bloom", game puzzle-ekosistem pixel art bergaya Ghibli di mana pemain berperan sebagai Hana (Penjaga Taman Awan).',
      'Setiap petak rumput di pulau melayang adalah Vertex / Simpul (V) dengan koordinat (x, y), dan ketetanggaan 4-arah (Atas, Kanan, Bawah, Kiri) adalah Edge / Sisi (E) tanpa bobot.',
      'Misi permainan: menyiram dan memekarkan seluruh Kuncup Sakura lalu menuju Pohon Sakura Agung (Torii Sanctuary), sambil menghindari Roh Kabut (Soot Sprites) yang juga bergerak dengan algoritma BFS & DFS.',
      'Tata letak taman di pulau melayang dibentuk secara prosedural menggunakan algoritma Randomized DFS (Recursive Backtracker) dengan jalur melingkar (Braided Loops) agar terdapat banyak pilihan rute.',
    ],
    codeSnippet: `// Representasi Simpul Taman & Ketetanggaan 4-Arah
const DIRS_4 = [{x:0, y:-1}, {x:1, y:0}, {x:0, y:1}, {x:-1, y:0}];
// Setiap petak rumput (x,y) adalah Vertex dalam Graf G=(V,E)`,
    liveDemoActionLabel: 'Tampilkan Pulau & Perbandingan Graf',
    demoType: 'compare',
  },
  {
    stepNumber: '02',
    timeRange: 'Menit 1:15 – 3:00',
    title: 'Mekanika "Siram Embun BFS" — Struktur Data Queue (FIFO)',
    subtitle: 'Aliran Air Melebar Lapis demi Lapis & Jaminan Rute Terpendek',
    talkingPoints: [
      'Saat pemain menekan tombol [1] Siram Embun BFS, karakter mengalirkan air jernih dari posisinya menggunakan algoritma Breadth-First Search.',
      'BFS menggunakan struktur data Antrean / Queue (First-In, First-Out): petak tetangga dimasukkan dari belakang (enqueue/push) dan diproses dari depan (dequeue/shift).',
      'Secara visual di taman pulau: air menyebar seperti riak kolam secara konsentris (Jarak d=1, d=2, d=3...) dan menumbuhkan bunga-bunga kecil di sepanjang riaknya.',
      'Karena memeriksa lapis demi lapis, saat riak air BFS menyentuh Kuncup Sakura pertama kali, jalur air tersebut DIJAMIN merupakan rute terpendek (Shortest Path)!',
    ],
    codeSnippet: `// Algoritma Siram Embun BFS (FIFO Queue)
const queue: GridCoord[] = [start];
while (queue.length > 0) {
  const current = queue.shift()!; // FIFO: Dequeue dari DEPAN antrean
  if (isLotusBud(current)) return reconstructShortestPath(parentMap, current);
  for (const neighbor of getGardenNeighbors(current)) {
    if (!visited.has(key(neighbor))) {
      visited.add(key(neighbor));
      parentMap[key(neighbor)] = current;
      queue.push(neighbor); // Enqueue ke BELAKANG antrean
    }
  }
}`,
    liveDemoActionLabel: 'Simulasikan Riak Air BFS Step-by-Step',
    demoType: 'bfs',
  },
  {
    stepNumber: '03',
    timeRange: 'Menit 3:00 – 4:45',
    title: 'Mekanika "Sulur Akar DFS" — Struktur Data Stack (LIFO)',
    subtitle: 'Pertumbuhan Sulur Akar Mendalam, Pembuka Semak & Backtracking',
    talkingPoints: [
      'Saat pemain menekan tombol [2] Sulur Akar DFS, karakter menumbuhkan sulur akar emas-sakura menggunakan algoritma Depth-First Search dengan struktur data Stack (Last-In, First-Out).',
      'Petak tetangga dimasukkan ke puncak tumpukan (push) dan langsung diambil dari puncak tumpukan (pop).',
      'Visualisasi di game: sulur akar menjalar lurus menembus satu lorong taman sampai mentok di tebing/batu (Dead-End), lalu melakukan Backtracking ke cabang sebelumnya.',
      'Kegunaan unik di gameplay: Sulur Akar DFS mampu membuka rintangan Ranting Kering (Bramble) menjadi rumput hidup dan menenangkan Roh Kabut selama 3 giliran, walaupun rute yang ditemukannya belum tentu rute terpendek!',
    ],
    codeSnippet: `// Algoritma Sulur Akar DFS (LIFO Stack)
const stack: GridCoord[] = [start];
while (stack.length > 0) {
  const current = stack.pop()!; // LIFO: Pop dari PUNCAK tumpukan
  if (visited.has(key(current))) continue;
  visited.add(key(current));
  if (isLotusBud(current)) return reconstructVinePath(parentMap, current);
  for (const neighbor of getGardenNeighbors(current)) {
    if (!visited.has(key(neighbor))) {
      parentMap[key(neighbor)] = current;
      stack.push(neighbor); // Push ke PUNCAK tumpukan
    }
  }
}`,
    liveDemoActionLabel: 'Simulasikan Sulur Akar DFS Step-by-Step',
    demoType: 'dfs',
  },
  {
    stepNumber: '04',
    timeRange: 'Menit 4:45 – 6:30',
    title: 'Perbandingan Langsung & Perilaku Roh Kabut (AI BFS vs DFS)',
    subtitle: 'Analisis Kompleksitas O(V + E), Memori Queue vs Stack, dan AI',
    talkingPoints: [
      'Tekan tombol [3] Bandingkan untuk menampilkan perbedaan rute Air BFS (Biru Cerah, pendek & langsung) melawan rute Sulur DFS (Merah Muda/Emas, berkelok jauh mengelilingi taman).',
      'Roh Kabut 1 — Pengejar Riak (BFS Spirit): mencari pemain menggunakan BFS setiap giliran sehingga selalu memilih jalan potong tercepat.',
      'Roh Kabut 2 — Penjelajah Sulur (DFS Spirit): berkeliling taman menggunakan memori Stack DFS dan melakukan backtracking otomatis saat buntu.',
      'Roh Kabut 3 — Penjaga Lentera (Radius BFS): menjaga area sekitar dengan Depth-Limited BFS (radius jarak d <= 4).',
    ],
    codeSnippet: `// Perbandingan Algoritma pada Graf Pulau Melayang:
// BFS (Air): Time O(V + E) | Space O(V) Queue | Rute Terpendek: YA (Optimal)
// DFS (Akar): Time O(V + E) | Space O(V) Stack | Rute Terpendek: TIDAK DIJAMIN`,
    liveDemoActionLabel: 'Bandingkan Air BFS vs Akar DFS di Pulau',
    demoType: 'compare',
  },
];
