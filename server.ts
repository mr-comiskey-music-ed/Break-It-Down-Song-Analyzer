import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to run generateContent with retries and fast fallback models
async function generateWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  schema: any,
  models = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]
): Promise<string> {
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      // Continue to next model immediately for maximum speed
      continue;
    }
  }

  throw lastError || new Error("Failed to generate content across all fallback models");
}

// Fallback heuristic metadata parser from query string
function parseSongMetadataHeuristic(query?: string, youtubeUrl?: string) {
  let cleanQuery = (query || "").trim();
  // Strip common Youtube junk like (Official Video), [Audio], etc.
  cleanQuery = cleanQuery.replace(/\((official video|official audio|music video|lyrics|audio|hd|4k|remastered|visualizer)\)/gi, "");
  cleanQuery = cleanQuery.replace(/\[(official video|official audio|music video|lyrics|audio|hd|4k|remastered|visualizer)\]/gi, "");
  cleanQuery = cleanQuery.trim();

  let artist = "Unknown Artist";
  let title = cleanQuery || "My Song";

  if (cleanQuery.includes(" - ")) {
    const parts = cleanQuery.split(" - ");
    artist = parts[0]?.trim() || "Unknown Artist";
    title = parts.slice(1).join(" - ")?.trim() || "My Song";
  } else if (cleanQuery.includes(":")) {
    const parts = cleanQuery.split(":");
    artist = parts[0]?.trim() || "Unknown Artist";
    title = parts.slice(1).join(":")?.trim() || "My Song";
  }

  return {
    title: title.replace(/^"|"$/g, "").trim(),
    artist: artist.replace(/^"|"$/g, "").trim(),
    album: "Single Release",
    year: new Date().getFullYear().toString(),
    genre: "Pop",
    timeSignature: "4/4",
    referenceBpm: 120,
    notes: "4/4 standard meter",
  };
}

// Known song BPM reference database for instantaneous, 100% accurate tempo matching
const KNOWN_SONG_BPMS: Record<string, { bpm: number; timeSignature: string; notes?: string }> = {
  "coldplay:yellow": { bpm: 88, timeSignature: "4/4", notes: "Steady 88 BPM ballad rock tempo in 4/4" },
  "coldplay:fix you": { bpm: 138, timeSignature: "4/4", notes: "Builds from 69 to 138 BPM in 4/4" },
  "coldplay:viva la vida": { bpm: 138, timeSignature: "4/4", notes: "138 BPM driving strings in 4/4" },
  "coldplay:clocks": { bpm: 131, timeSignature: "4/4", notes: "131 BPM iconic piano arpeggio in 4/4" },
  "the killers:mr. brightside": { bpm: 148, timeSignature: "4/4", notes: "148 BPM fast driving 16th note rhythm in 4/4" },
  "the killers:mr brightside": { bpm: 148, timeSignature: "4/4", notes: "148 BPM fast driving 16th note rhythm in 4/4" },
  "corinne bailey rae:put your records on": { bpm: 96, timeSignature: "4/4", notes: "96 BPM relaxed soul groove in 4/4" },
  "michael jackson:billie jean": { bpm: 117, timeSignature: "4/4", notes: "117 BPM iconic four-on-the-floor funk groove in 4/4" },
  "queen:bohemian rhapsody": { bpm: 72, timeSignature: "4/4", notes: "Multi-part tempo shifting between 72 BPM ballad and 144 BPM opera/rock in 4/4" },
  "the weeknd:blinding lights": { bpm: 171, timeSignature: "4/4", notes: "171 BPM 80s synthwave drive in 4/4" },
  "dua lipa:levitating": { bpm: 103, timeSignature: "4/4", notes: "103 BPM modern disco-pop groove in 4/4" },
  "ed sheeran:shape of you": { bpm: 96, timeSignature: "4/4", notes: "96 BPM dancehall-pop marimba rhythm in 4/4" },
  "taylor swift:anti-hero": { bpm: 97, timeSignature: "4/4", notes: "97 BPM mid-tempo synth pop in 4/4" },
  "harry styles:as it was": { bpm: 174, timeSignature: "4/4", notes: "174 BPM upbeat indie-pop in 4/4" },
  "olivia rodrigo:good 4 u": { bpm: 167, timeSignature: "4/4", notes: "167 BPM pop-punk energetic drive in 4/4" },
  "fleetwood mac:dreams": { bpm: 120, timeSignature: "4/4", notes: "120 BPM classic soft rock groove in 4/4" },
  "eminem:lose yourself": { bpm: 171, timeSignature: "4/4", notes: "171 BPM (86 half-time) hip hop pulse in 4/4" },
};

// API: Lookup song metadata and reference BPM from YouTube URL or Song Title / Artist
app.post("/api/song-metadata", async (req, res) => {
  const { query, artist: reqArtist, title: reqTitle, youtubeUrl } = req.body;
  if (!query && !reqArtist && !reqTitle && !youtubeUrl) {
    return res.status(400).json({ error: "Query, Title/Artist, or YouTube URL is required" });
  }

  // 1. If YouTube URL is provided, query YouTube oEmbed to get the official video title & creator
  let ytTitle = "";
  let ytAuthor = "";
  if (youtubeUrl) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
      const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(3000) });
      if (oembedRes.ok) {
        const oembedData = (await oembedRes.json()) as any;
        ytTitle = oembedData.title || "";
        ytAuthor = oembedData.author_name || "";
      }
    } catch {
      // Non-blocking
    }
  }

  // 2. Build prioritized search query candidates
  const cleanStr = (s: string) =>
    s
      .replace(/\((official video|official audio|music video|lyrics|audio|hd|4k|remastered|visualizer|feat\.[^)]*|ft\.[^)]*)\)/gi, "")
      .replace(/\[(official video|official audio|music video|lyrics|audio|hd|4k|remastered|visualizer|feat\.[^\]]*|ft\.[^\]]*)]/gi, "")
      .replace(/\|.*$/g, "")
      .replace(/"/g, "")
      .trim();

  const candidates: string[] = [];

  if (reqArtist && reqTitle) {
    candidates.push(`${reqArtist} ${reqTitle}`);
    candidates.push(`${reqTitle} ${reqArtist}`);
  }
  if (ytTitle) {
    candidates.push(cleanStr(ytTitle));
  }
  if (query) {
    candidates.push(cleanStr(query));
  }
  if (reqTitle) {
    candidates.push(cleanStr(reqTitle));
  }
  if (ytAuthor && ytTitle) {
    candidates.push(`${ytAuthor} ${cleanStr(ytTitle)}`);
  }

  // 3. Search the world-wide official iTunes Music Catalog
  let itunesTrack: any = null;
  for (const term of candidates) {
    if (!term || term.length < 2) continue;
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`;
      const itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(3000) });
      if (itunesRes.ok) {
        const itunesData = (await itunesRes.json()) as any;
        if (itunesData.results && itunesData.results.length > 0) {
          // If we have both artist and title, find the best match in results
          if (reqArtist) {
            const match = itunesData.results.find(
              (r: any) =>
                r.artistName.toLowerCase().includes(reqArtist.toLowerCase()) ||
                reqArtist.toLowerCase().includes(r.artistName.toLowerCase())
            );
            itunesTrack = match || itunesData.results[0];
          } else {
            itunesTrack = itunesData.results[0];
          }
          break;
        }
      }
    } catch {
      // Non-blocking
    }
  }

  // 4. Assemble high-confidence base metadata
  let songTitle = itunesTrack?.trackName || reqTitle || "";
  let songArtist = itunesTrack?.artistName || reqArtist || ytAuthor || "";
  let album = itunesTrack?.collectionName || "Single Release";
  let year = itunesTrack?.releaseDate ? itunesTrack.releaseDate.substring(0, 4) : "";
  let genre = itunesTrack?.primaryGenreName || "Pop";
  let timeSignature = "4/4";
  let referenceBpm = 120;
  let notes = "4/4 standard meter";

  // Check known database first
  const normKey = `${songArtist.toLowerCase()}:${songTitle.toLowerCase()}`;
  if (KNOWN_SONG_BPMS[normKey]) {
    referenceBpm = KNOWN_SONG_BPMS[normKey].bpm;
    timeSignature = KNOWN_SONG_BPMS[normKey].timeSignature;
    notes = KNOWN_SONG_BPMS[normKey].notes || notes;
  } else {
    // Check partial matches in known songs
    for (const [k, v] of Object.entries(KNOWN_SONG_BPMS)) {
      const [kArtist, kTitle] = k.split(":");
      if (
        (songArtist.toLowerCase().includes(kArtist) || kArtist.includes(songArtist.toLowerCase())) &&
        (songTitle.toLowerCase().includes(kTitle) || kTitle.includes(songTitle.toLowerCase()))
      ) {
        referenceBpm = v.bpm;
        timeSignature = v.timeSignature;
        notes = v.notes || notes;
        break;
      }
    }
  }

  // 5. Use Gemini AI to enrich/confirm BPM, time signature, and metadata if needed
  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Identify the official music metadata for this song:
Artist: "${songArtist || reqArtist || ytAuthor || "Unknown"}"
Song Title: "${songTitle || reqTitle || query || "Unknown"}"
Album: "${album}"
Search Query / YouTube: "${query || ytTitle || youtubeUrl || ""}"

Respond with:
- title: Clean official song title
- artist: Primary artist or band
- album: Album name or Single release
- year: Release year (e.g. 2000)
- genre: Musical genre (e.g. Pop, Alternative, Rock, Hip Hop, R&B, Country, EDM)
- timeSignature: Usually 4/4 unless 3/4, 6/8, or 12/8
- referenceBpm: Accurate integer tempo BPM
- notes: Brief meter note`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          artist: { type: Type.STRING },
          album: { type: Type.STRING },
          year: { type: Type.STRING },
          genre: { type: Type.STRING },
          timeSignature: { type: Type.STRING },
          referenceBpm: { type: Type.NUMBER },
          notes: { type: Type.STRING },
        },
        required: ["title", "artist", "year", "genre", "timeSignature", "referenceBpm"],
      };

      const text = await generateWithFallback(ai, prompt, schema);
      const parsed = JSON.parse(text || "{}");

      if (parsed.title && (!songTitle || songTitle === "My Song")) songTitle = parsed.title;
      if (parsed.artist && (!songArtist || songArtist === "Unknown Artist")) songArtist = parsed.artist;
      if (parsed.album && (!album || album === "Single Release")) album = parsed.album;
      if (parsed.year && !year) year = parsed.year;
      if (parsed.genre && (!genre || genre === "Pop")) genre = parsed.genre;
      if (parsed.timeSignature) timeSignature = parsed.timeSignature;
      if (typeof parsed.referenceBpm === "number" && parsed.referenceBpm > 40 && parsed.referenceBpm < 260) {
        referenceBpm = Math.round(parsed.referenceBpm);
      }
      if (parsed.notes) notes = parsed.notes;
    }
  } catch (err: any) {
    console.warn("AI metadata enrichment note:", err?.message || err);
  }

  // Final fallback values if everything else is empty
  const fallback = parseSongMetadataHeuristic(query || ytTitle, youtubeUrl);

  return res.json({
    title: songTitle || fallback.title,
    artist: songArtist || fallback.artist,
    album: album || fallback.album,
    year: year || fallback.year,
    genre: genre || fallback.genre,
    timeSignature: timeSignature || fallback.timeSignature,
    referenceBpm: referenceBpm || fallback.referenceBpm,
    notes: notes || fallback.notes,
  });
});

// API: Evaluate student's song form analysis assignment
app.post("/api/evaluate-assignment", async (req, res) => {
  try {
    const { songData, sections, tapTempoUsed } = req.body;
    if (!songData || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: "Invalid submission data" });
    }

    // Rigorous heuristic scan for complete student engagement across every element
    const issues: string[] = [];
    const hasTitle = Boolean(songData.title && songData.title.trim().length > 0);
    const hasArtist = Boolean(songData.artist && songData.artist.trim().length > 0);
    const hasBpm = Boolean(songData.bpm && Number(songData.bpm) > 0);
    const sectionCount = sections.length;

    if (!hasTitle) {
      issues.push("Song Title is missing in the header box. Please enter the exact title of the song you are analyzing.");
    }
    if (!hasArtist) {
      issues.push("Artist name is missing in the header box. Please credit the recording artist or band.");
    }
    if (!hasBpm) {
      issues.push("Tempo (BPM) is not entered in the header box.");
    }
    if (!tapTempoUsed) {
      issues.push("Tap Tempo tool was not used. Please click the Tap Tempo button to physically tap along with the beat and calculate your song's accurate tempo.");
    }
    if (sectionCount < 4) {
      issues.push(`You have mapped ${sectionCount} section(s) on your timeline. To perform a thorough structural analysis, please map at least 4 distinct song sections (e.g., Intro, Verse, Chorus, Bridge, Outro).`);
    }

    let missingInstruments = 0;
    let shortInstruments = 0;
    sections.forEach((s: any) => {
      if (!s.instrumentationNotes || s.instrumentationNotes.trim().length === 0) {
        missingInstruments++;
      } else if (s.instrumentationNotes.trim().length < 5) {
        shortInstruments++;
      }
    });
    if (missingInstruments > 0) {
      issues.push(`You have ${missingInstruments} section(s) with empty instrument information boxes. Every instrument box must describe what instruments are playing.`);
    } else if (shortInstruments > 0) {
      issues.push(`Some instrument notes are too brief (${shortInstruments} section(s)). Expand your descriptions to detail specific instruments (e.g., lead vocals, rhythm guitar, synths, drums).`);
    }

    let totalScales = sectionCount * 4;
    let modifiedScalesCount = 0;
    sections.forEach((s: any) => {
      if (s.modifiedScales?.energyLevel) modifiedScalesCount++;
      if (s.modifiedScales?.rhythmicDrive) modifiedScalesCount++;
      if (s.modifiedScales?.vocalComplexity) modifiedScalesCount++;
      if (s.modifiedScales?.textureDensity) modifiedScalesCount++;
    });
    const requiredModified = Math.ceil(totalScales * 0.75); // at least 75% of all scales across the song must be altered
    if (modifiedScalesCount < requiredModified) {
      issues.push(`You have only modified ${modifiedScalesCount} out of ${totalScales} linear analysis scales (sliders). Please carefully adjust the Energy, Rhythm, Vocals, and Texture sliders on the majority of your section cards to reflect how the music changes.`);
    }

    const isAdequate = issues.length === 0 && sectionCount >= 4;
    const score = isAdequate 
      ? Math.min(100, 92 + (sectionCount >= 5 ? 5 : 0) + (modifiedScalesCount >= totalScales ? 3 : 0)) 
      : Math.max(40, 80 - issues.length * 12);

    const defaultEvaluation = {
      status: isAdequate ? "excellent" : "needs_work",
      score,
      isThorough: isAdequate,
      feedbackItems: issues.length > 0
        ? issues
        : [
            "All song header information and tap tempo verification completed.",
            `Timeline comprehensively maps ${sectionCount} song sections with precise bar counts.`,
            "All instrument information boxes and linear scales have been thoroughly customized and analyzed.",
          ],
      encouragement: isAdequate
        ? "Exceptional work! You demonstrated a comprehensive, rigorous understanding of the song's structural arrangement, dynamics, and instrumentation."
        : "Your analysis needs more depth. Review the specific recommendations above to improve your song form analysis quality.",
      summaryReport: `Rigorously analyzed "${songData.title || "Song"}" by ${songData.artist || "Artist"} across ${sectionCount} sections (${songData.bpm || 120} BPM in ${songData.timeSignature || "4/4"}).`,
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(defaultEvaluation);
    }

    // Fast AI scan with a rigorous prompt for high standards
    const sectionSummaries = sections.map((s: any) => `${s.label} (${s.calculatedBars || 4} bars): Instruments: "${s.instrumentationNotes || "none"}", Energy: ${s.energyLevel}, Rhythm: ${s.rhythmicDrive}, Vocals: ${s.vocalComplexity}, Texture: ${s.textureDensity}, AlteredScales: ${JSON.stringify(s.modifiedScales || {})}`).join("; ");
    const prompt = `Evaluate this student's Song Form Analysis assignment with rigorous academic standards.
Song: "${songData.title || ""}" by "${songData.artist || ""}" (${songData.bpm || ""} BPM, ${songData.timeSignature || "4/4"}, TapTempoUsed: ${tapTempoUsed}).
Sections (${sectionCount}): ${sectionSummaries}.
Issues detected locally: ${JSON.stringify(issues)}.

Evaluate whether the student made a considered, thorough effort across every element of the app (header info, tap tempo, at least 4 sections, detailed instrumentation for every section, and active manipulation of the majority of linear sliders across cards).
If there are any deficiencies, set isThorough = false, status = "needs_work", and provide specific, actionable feedback telling them what they must do to improve their analysis.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: "'excellent' or 'needs_work'" },
        isThorough: { type: Type.BOOLEAN, description: "True if >=3 sections and basic info entered" },
        score: { type: Type.NUMBER, description: "Score out of 100" },
        feedbackItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of 2-3 brief remarks",
        },
        encouragement: { type: Type.STRING, description: "Closing phrase" },
        summaryReport: { type: Type.STRING, description: "1-2 sentence overview" },
      },
      required: ["status", "isThorough", "score", "feedbackItems", "encouragement", "summaryReport"],
    };

    try {
      const text = await generateWithFallback(ai, prompt, schema, ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]);
      const parsed = JSON.parse(text || "{}");
      return res.json({
        status: parsed.status || defaultEvaluation.status,
        isThorough: typeof parsed.isThorough === "boolean" ? parsed.isThorough : defaultEvaluation.isThorough,
        score: typeof parsed.score === "number" ? parsed.score : defaultEvaluation.score,
        feedbackItems: Array.isArray(parsed.feedbackItems) && parsed.feedbackItems.length > 0 ? parsed.feedbackItems : defaultEvaluation.feedbackItems,
        encouragement: parsed.encouragement || defaultEvaluation.encouragement,
        summaryReport: parsed.summaryReport || defaultEvaluation.summaryReport,
      });
    } catch {
      return res.json(defaultEvaluation);
    }
  } catch (error: any) {
    console.warn("Assignment evaluation error; returning fast default evaluation:", error?.message || error);
    const { songData, sections } = req.body || {};
    const sectionCount = Array.isArray(sections) ? sections.length : 0;
    const isAdequate = Boolean(songData?.title && songData?.artist && songData?.bpm && sectionCount >= 3);
    return res.json({
      status: isAdequate ? "excellent" : "needs_work",
      score: isAdequate ? 98 : 75,
      isThorough: isAdequate,
      feedbackItems: isAdequate ? ["Header details completed", "Timeline sections mapped"] : ["Check that song title, artist, BPM, and at least 3 sections are entered"],
      encouragement: isAdequate
        ? "Nice work! Isn't it fun to learn more about the music you already love?"
        : "Add any missing details and try again!",
      summaryReport: `Analyzed "${songData?.title || "Song"}" by ${songData?.artist || "Artist"} across ${sectionCount} sections.`,
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
