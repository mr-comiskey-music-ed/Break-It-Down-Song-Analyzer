export interface SongLookupResult {
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  timeSignature: string;
  referenceBpm: number | null;
}

// A few well-known songs with a verified tempo. Used only as a starting reference:
// students still find the tempo themselves with Tap Tempo.
const KNOWN_SONG_BPMS: Record<string, { bpm: number; timeSignature: string }> = {
  'coldplay:yellow': { bpm: 88, timeSignature: '4/4' },
  'coldplay:fix you': { bpm: 138, timeSignature: '4/4' },
  'coldplay:viva la vida': { bpm: 138, timeSignature: '4/4' },
  'coldplay:clocks': { bpm: 131, timeSignature: '4/4' },
  'the killers:mr. brightside': { bpm: 148, timeSignature: '4/4' },
  'corinne bailey rae:put your records on': { bpm: 96, timeSignature: '4/4' },
  'michael jackson:billie jean': { bpm: 117, timeSignature: '4/4' },
  'queen:bohemian rhapsody': { bpm: 72, timeSignature: '4/4' },
  'the weeknd:blinding lights': { bpm: 171, timeSignature: '4/4' },
  'dua lipa:levitating': { bpm: 103, timeSignature: '4/4' },
  'ed sheeran:shape of you': { bpm: 96, timeSignature: '4/4' },
  'taylor swift:anti-hero': { bpm: 97, timeSignature: '4/4' },
  'harry styles:as it was': { bpm: 174, timeSignature: '4/4' },
  'olivia rodrigo:good 4 u': { bpm: 167, timeSignature: '4/4' },
  'fleetwood mac:dreams': { bpm: 120, timeSignature: '4/4' },
  'eminem:lose yourself': { bpm: 171, timeSignature: '4/4' },
};

const JUNK_TAGS =
  /[([](official (music )?video|official audio|music video|lyrics?( video)?|audio|hd|4k|remaster(ed)?( \d{4})?|visualizer|feat\.[^)\]]*|ft\.[^)\]]*)[)\]]/gi;

function cleanQuery(text: string): string {
  return text.replace(JUNK_TAGS, '').replace(/\|.*$/, '').replace(/"/g, '').trim();
}

async function fetchJson(url: string, timeoutMs = 4000): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function lookupKnownBpm(artist: string, title: string) {
  const a = artist.toLowerCase().trim();
  const t = title.toLowerCase().trim();
  if (a.length < 3 || t.length < 3) return null;
  const exact = KNOWN_SONG_BPMS[`${a}:${t}`];
  if (exact) return exact;
  for (const [key, value] of Object.entries(KNOWN_SONG_BPMS)) {
    const [kArtist, kTitle] = key.split(':');
    if ((a.includes(kArtist) || kArtist.includes(a)) && (t.includes(kTitle) || kTitle.includes(t))) {
      return value;
    }
  }
  return null;
}

/**
 * Looks up song details straight from the browser (YouTube oEmbed for the video title,
 * Apple's public iTunes Search for the details). No server and no account needed.
 * Returns null if nothing could be found (for example if the school network blocks it).
 */
export async function lookupSongInfo(input: {
  title?: string;
  artist?: string;
  youtubeUrl?: string;
}): Promise<SongLookupResult | null> {
  const title = (input.title || '').trim();
  const artist = (input.artist || '').trim();

  let ytTitle = '';
  let ytAuthor = '';
  if (input.youtubeUrl) {
    const oembed = await fetchJson(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(input.youtubeUrl)}&format=json`
    );
    ytTitle = oembed?.title || '';
    ytAuthor = (oembed?.author_name || '').replace(/ - Topic$/i, '');
  }

  const candidates: string[] = [];
  if (artist && title) candidates.push(`${artist} ${title}`);
  if (ytTitle) candidates.push(cleanQuery(ytTitle));
  if (title) candidates.push(cleanQuery(title));
  if (ytAuthor && ytTitle) candidates.push(`${ytAuthor} ${cleanQuery(ytTitle)}`);

  let track: any = null;
  for (const term of candidates) {
    if (!term || term.length < 2) continue;
    const data = await fetchJson(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`
    );
    if (data?.results?.length) {
      const wanted = artist.toLowerCase();
      track =
        (wanted &&
          data.results.find(
            (r: any) =>
              r.artistName.toLowerCase().includes(wanted) || wanted.includes(r.artistName.toLowerCase())
          )) ||
        data.results[0];
      break;
    }
  }

  if (!track) return null;

  const foundTitle: string = track.trackName || title;
  const foundArtist: string = track.artistName || artist || ytAuthor;
  const known = lookupKnownBpm(foundArtist, foundTitle);

  return {
    title: foundTitle,
    artist: foundArtist,
    album: track.collectionName || '',
    year: track.releaseDate ? String(track.releaseDate).substring(0, 4) : '',
    genre: track.primaryGenreName || '',
    timeSignature: known?.timeSignature || '4/4',
    referenceBpm: known?.bpm ?? null,
  };
}
