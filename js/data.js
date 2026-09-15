/* =========================================================
   CONTENIDO DEL SITIO
   ========================================================= */
window.SITE = {
  mail: 'hola@uriydani.com', // PENDIENTE: mail real de la dupla

  /* ---------- LABUROS ----------
     stamp.kind:
       'png'   → estampilla ya diseñada (imagen con troquel propio)
       'photo' → estampilla con foto en duotono + trama de puntos + texto encima
     cover / coverPos / coverZoom → imagen del óvalo en el afiche del proyecto
     kind → 'Videocaso' | 'Comercial' | 'Gráfica' (texto del botón y del sticker)
  */
  projects: [
    {
      n: 1, id: 'budtwin', title: 'Bud-Twin', client: 'Budweiser', year: 2025, kind: 'Videocaso',
      tags: ['Digital'],
      stamp: { kind: 'png', src: 'assets/stamps/budtwin.png', w: 300, rot: -2.4, postmark: true },
      cover: 'assets/covers/budtwin.jpg', coverPos: '50% 40%',
      board: ['assets/proyectos/budtwin/board.jpg'],
      extras: ['assets/proyectos/budtwin/kv1.jpg', 'assets/proyectos/budtwin/kv2.jpg', 'assets/proyectos/budtwin/kv3.jpg', 'assets/proyectos/budtwin/kv4.jpg'],
      video: 'assets/proyectos/budtwin/video.mp4',
      lead: '¿Por qué contratar una celebridad si todos tenemos un amigo que se parece a una?'
    },
    {
      n: 2, id: 'lolla', title: 'Grito Lolla', client: 'Lollapalooza', year: 2025, kind: 'Videocaso',
      tags: ['Digital'],
      stamp: { kind: 'png', src: 'assets/stamps/lolla.png', w: 310, rot: 2.2 },
      cover: 'assets/proyectos/lolla/view1.jpg', coverPos: '50% 38%', coverZoom: 1.8,
      board: ['assets/proyectos/lolla/board.jpg'],
      extras: ['assets/proyectos/lolla/mockup1.jpg', 'assets/proyectos/lolla/mockup3.jpg', 'assets/proyectos/lolla/mockup5.jpg'],
      video: 'assets/proyectos/lolla/video.mp4',
      lead: 'Capturando el instante en el que empieza la emoción.'
    },
    {
      n: 3, id: 'pelota', title: 'Cuidemos la Pelota', client: 'Club Atlético Excursionistas', year: 2025, kind: 'Videocaso',
      tags: ['Acción'],
      stamp: { kind: 'png', src: 'assets/stamps/pelota.png', w: 340, rot: -1.2 },
      cover: 'assets/covers/pelota.jpg', coverPos: '50.5% 48%', coverZoom: 1.55,
      board: ['assets/proyectos/pelota/board.jpg'], extras: [],
      video: 'assets/proyectos/pelota/video.mp4',
      lead: 'Cuando tus pelotas están así, no podés jugar.',
      note: 'Presentado en Premios Obrar Estudiantes 2025'
    },
    {
      n: 4, id: 'spotifuck', title: 'Spotifuck', client: 'Spotify × Tulipán', year: 2025, kind: 'Videocaso',
      tags: ['Producto'],
      award: 'Oro · Obrar 2025',
      stamp: { kind: 'photo', shape: 'shape13', w: 320, rot: 1.8, ratio: 942 / 1211,
        img: 'assets/covers/spotifuck.jpg', pos: '82% 22%', zoom: 1.7, bright: 2.6,
        paper: '#E3EEE2', ink: '#0E5F52', label: 'Spotifuck', denom: '4' },
      cover: 'assets/covers/spotifuck.jpg', coverPos: '70% 50%',
      board: ['assets/proyectos/spotifuck/board.jpg'], extras: [],
      youtube: 'ccAMcqTBcJg', video: true,
      lead: 'El mensaje que no esperabas, pero más necesitabas.',
      note: 'Oro en Premios Obrar 2025'
    },
    {
      n: 5, id: 'clari', title: 'Clari', client: 'Footwear', year: 2025, kind: 'Comercial',
      tags: ['Comercial'],
      stamp: { kind: 'photo', shape: 'shape7', w: 270, rot: -3, ratio: 699 / 1096,
        img: 'assets/covers/clari.jpg', pos: '74% 30%', zoom: 1.1,
        paper: '#F6D3CF', ink: '#A51D2D', label: 'Clari', denom: '5' },
      cover: 'assets/covers/clari.jpg', coverPos: '68% 40%',
      board: [], extras: [],
      youtube: 'GLUeMK2gqn8', video: true,
      lead: 'Todas las Claris que fue Clari.'
    },
    {
      n: 6, id: 'nomebano', title: 'No Me Baño', client: 'Dove Men+Care', year: 2025, kind: 'Videocaso',
      tags: ['Vía pública'],
      stamp: { kind: 'photo', shape: 'shape11', w: 340, rot: 2.6, ratio: 915 / 980, postmark: true,
        img: 'assets/covers/nomebano.jpg', pos: '72% 45%', zoom: 1.2,
        paper: '#F4D2C2', ink: '#3B2217', label: 'No me baño', denom: '6' },
      cover: 'assets/covers/nomebano.jpg', coverPos: '66% 45%',
      board: ['assets/proyectos/nomebano/board.jpg'], extras: [],
      youtube: '9LLS0UC1eTI', video: true,
      lead: 'Dove, en todas partes.'
    },
    {
      n: 7, id: 'transito', title: 'Tránsito', client: 'Buenos Aires Ciudad', year: 2025, kind: 'Gráfica',
      tags: ['Gráfica'],
      stamp: { kind: 'photo', shape: 'shape15', w: 440, rot: -1.6, ratio: 1147 / 782,
        img: 'assets/proyectos/transito/calle.jpg', pos: '0% 62%', zoom: 1.9,
        paper: '#F2DE86', ink: '#1D1B16', label: 'Tránsito', denom: '7' },
      cover: 'assets/proyectos/transito/calle.jpg', coverPos: '0% 64%', coverZoom: 2,
      board: ['assets/proyectos/transito/kv1.jpg', 'assets/proyectos/transito/kv2.jpg', 'assets/proyectos/transito/kv3.jpg'], extras: [],
      video: null,
      lead: 'Lo que suena a festejo, al volante es un choque.'
    }
  ],

  /* ---------- CONTENT ---------- */
  content: [
    { title: 'Leuthe 01', who: 'Leuthe', by: 'Dani', src: 'assets/content/leuthe-1.mp4' },
    { title: 'Crocs', who: 'Crocs', by: 'Dani', src: 'assets/content/crocs.mp4' },
    { title: 'Leuthe 02', who: 'Leuthe', by: 'Dani', src: 'assets/content/leuthe-2.mp4' },
    { title: 'Campaña OE', who: 'OE', by: 'Dani', src: 'assets/content/campana-oe.mp4' },
    { title: 'Pieza 05', who: 'A confirmar', by: 'Dani', src: 'assets/content/img-9214.mp4' },
    { title: 'Pieza 06', who: 'A confirmar', by: 'Dani', src: 'assets/content/content-wa.mp4' },
    { title: 'Me robaron', who: 'Lyna', by: 'Uri', src: 'assets/content/lyna-me-robaron.mp4' },
    { title: 'Mandarina muestra su cara', who: 'Lyna', by: 'Uri', src: 'assets/content/lyna-mandarina.mp4' }
  ]
};
