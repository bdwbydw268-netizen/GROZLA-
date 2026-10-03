export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  duration?: number;
  genre?: string;
  mood?: string;
}

export const REAL_SONGS: Song[] = [
  {
    id: "1525196857",
    title: "Fi Hwak (Randall Remix)",
    artist: "Didine Canon 16 & Djalil Palermo",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c4/33/4b/c4334bc7-e8ee-aba0-34e1-33b0ccc1c6f0/mzaf_9936698770840267490.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/67/10/3c/67103c3e-3ceb-ae93-d474-8d0f7c6cd4f8/cover.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Rap / Rai",
    mood: "حماسي"
  },
  {
    id: "880940097",
    title: "Tamly Maak (تملي معاك)",
    artist: "Amr Diab (عمرو دياب)",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5e/df/09/5edf0981-ce52-4740-f0b2-f6ad0760afcb/mzaf_17144740537777531434.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music69/v4/31/4d/d4/314dd42d-3246-e7a3-107a-3d521fa9a7e2/dj.iiicnpub.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Arabic Pop",
    mood: "رومانسي"
  },
  {
    id: "1741551356",
    title: "Machafouhach (ما شافوهاش)",
    artist: "Mouh Milano (موح ميلانو)",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bd/fb/96/bdfb960d-aa96-b935-78e4-29a04476be20/mzaf_12176129753070539526.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0d/5f/de/0d5fde6b-a3f5-0e9c-75de-df99ee867aa0/5283023984488_Cover.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Rai",
    mood: "طاقة"
  },
  {
    id: "713560979",
    title: "Kifak Inta (كيفك إنت)",
    artist: "Fairouz (فيروز)",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f2/07/71/f207718f-d62c-dcd8-01e2-46f2bc38595e/mzaf_1624702329572020210.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/20/1b/a7/201ba7cf-7c88-bdbf-a4bf-421910e8bb3f/13UAAIM00493.rgb.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Classic Arabic",
    mood: "هدوء واسترخاء"
  },
  {
    id: "1736603760",
    title: "Ya Lili (يا ليلي)",
    artist: "Balti feat. Hamouda",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/61/71/f9/6171f9c7-c829-347c-b546-d0774b26f50d/mzaf_16808196648340713624.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ba/ce/7f/bace7f85-2439-190a-cfb5-323e15b427d6/3615932032363_Cover.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Hip-Hop / Maghreb",
    mood: "حماسي"
  },
  {
    id: "992389153",
    title: "LMALLEM (لمعلم)",
    artist: "Saad Lamjarred",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/f7/5d/e9/f75de961-17aa-f68f-d470-ddbfff83853b/mzaf_885105884713152764.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/f2/60/8c/f2608cc5-2a01-3dd7-a3e5-58364d6971c9/444676.jpg/600x600bb.jpg",
    duration: 30,
    genre: "North African Pop",
    mood: "فرح"
  },
  {
    id: "1542842761",
    title: "Blinding Lights",
    artist: "The Weeknd",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/08/fe/de/08fede6c-762e-b24f-f4ff-a9e51bbde1cc/mzaf_6048815850106316934.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Pop / Synthwave",
    mood: "إيقاعي سريع"
  },
  {
    id: "1685995585",
    title: "Suavemente",
    artist: "Soolking",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f1/a1/38/f1a138de-86c1-00b3-bb93-e3f6da065268/mzaf_16940518097321467656.plus.aac.p.m4a",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/94/2f/a9/942fa97f-0246-dfbe-8fc2-7028e33850f3/197368788425_cover.jpg/600x600bb.jpg",
    duration: 30,
    genre: "Afrobeat / Rai",
    mood: "احتفالي"
  }
];
