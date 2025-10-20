/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality, Type } from "@google/genai";

const surahListContainer = document.getElementById('surah-list') as HTMLUListElement;
const mainContent = document.getElementById('main-content') as HTMLElement;
const welcomeMessage = document.getElementById('welcome-message') as HTMLElement;
const surahContentContainer = document.getElementById('surah-content') as HTMLElement;
const loader = document.getElementById('loader') as HTMLElement;
const errorMessage = document.getElementById('error-message') as HTMLElement;

// Audio state
let outputAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
const audioCache = new Map<string, AudioBuffer>();

// Data for all 114 Surahs
const surahs = [
    { "id": 1, "name": "Al-Fatihah", "english": "The Opening", "verses": 7 },
    { "id": 2, "name": "Al-Baqarah", "english": "The Cow", "verses": 286 },
    { "id": 3, "name": "Aal-E-Imran", "english": "The Family of Imran", "verses": 200 },
    { "id": 4, "name": "An-Nisa", "english": "The Women", "verses": 176 },
    { "id": 5, "name": "Al-Ma'idah", "english": "The Table", "verses": 120 },
    { "id": 6, "name": "Al-An'am", "english": "The Cattle", "verses": 165 },
    { "id": 7, "name": "Al-A'raf", "english": "The Heights", "verses": 206 },
    { "id": 8, "name": "Al-Anfal", "english": "The Spoils of War", "verses": 75 },
    { "id": 9, "name": "At-Tawbah", "english": "The Repentance", "verses": 129 },
    { "id": 10, "name": "Yunus", "english": "Jonah", "verses": 109 },
    { "id": 11, "name": "Hud", "english": "Hud", "verses": 123 },
    { "id": 12, "name": "Yusuf", "english": "Joseph", "verses": 111 },
    { "id": 13, "name": "Ar-Ra'd", "english": "The Thunder", "verses": 43 },
    { "id": 14, "name": "Ibrahim", "english": "Abraham", "verses": 52 },
    { "id": 15, "name": "Al-Hijr", "english": "The Rock", "verses": 99 },
    { "id": 16, "name": "An-Nahl", "english": "The Bee", "verses": 128 },
    { "id": 17, "name": "Al-Isra", "english": "The Night Journey", "verses": 111 },
    { "id": 18, "name": "Al-Kahf", "english": "The Cave", "verses": 110 },
    { "id": 19, "name": "Maryam", "english": "Mary", "verses": 98 },
    { "id": 20, "name": "Ta-Ha", "english": "Ta-Ha", "verses": 135 },
    { "id": 21, "name": "Al-Anbiya", "english": "The Prophets", "verses": 112 },
    { "id": 22, "name": "Al-Hajj", "english": "The Pilgrimage", "verses": 78 },
    { "id": 23, "name": "Al-Mu'minun", "english": "The Believers", "verses": 118 },
    { "id": 24, "name": "An-Nur", "english": "The Light", "verses": 64 },
    { "id": 25, "name": "Al-Furqan", "english": "The Criterion", "verses": 77 },
    { "id": 26, "name": "Ash-Shu'ara", "english": "The Poets", "verses": 227 },
    { "id": 27, "name": "An-Naml", "english": "The Ant", "verses": 93 },
    { "id": 28, "name": "Al-Qasas", "english": "The Stories", "verses": 88 },
    { "id": 29, "name": "Al-Ankabut", "english": "The Spider", "verses": 69 },
    { "id": 30, "name": "Ar-Rum", "english": "The Romans", "verses": 60 },
    { "id": 31, "name": "Luqman", "english": "Luqman", "verses": 34 },
    { "id": 32, "name": "As-Sajdah", "english": "The Prostration", "verses": 30 },
    { "id": 33, "name": "Al-Ahzab", "english": "The Combined Forces", "verses": 73 },
    { "id": 34, "name": "Saba", "english": "Sheba", "verses": 54 },
    { "id": 35, "name": "Fatir", "english": "The Originator", "verses": 45 },
    { "id": 36, "name": "Ya-Sin", "english": "Ya-Sin", "verses": 83 },
    { "id": 37, "name": "As-Saffat", "english": "Those Who Set the Ranks", "verses": 182 },
    { "id": 38, "name": "Sad", "english": "The Letter Sad", "verses": 88 },
    { "id": 39, "name": "Az-Zumar", "english": "The Troops", "verses": 75 },
    { "id": 40, "name": "Ghafir", "english": "The Forgiver", "verses": 85 },
    { "id": 41, "name": "Fussilat", "english": "Explained in Detail", "verses": 54 },
    { "id": 42, "name": "Ash-Shura", "english": "The Consultation", "verses": 53 },
    { "id": 43, "name": "Az-Zukhruf", "english": "The Ornaments of Gold", "verses": 89 },
    { "id": 44, "name": "Ad-Dukhan", "english": "The Smoke", "verses": 59 },
    { "id": 45, "name": "Al-Jathiyah", "english": "The Crouching", "verses": 37 },
    { "id": 46, "name": "Al-Ahqaf", "english": "The Wind-Curved Sandhills", "verses": 35 },
    { "id": 47, "name": "Muhammad", "english": "Muhammad", "verses": 38 },
    { "id": 48, "name": "Al-Fath", "english": "The Victory", "verses": 29 },
    { "id": 49, "name": "Al-Hujurat", "english": "The Rooms", "verses": 18 },
    { "id": 50, "name": "Qaf", "english": "The Letter Qaf", "verses": 45 },
    { "id": 51, "name": "Adh-Dhariyat", "english": "The Winnowing Winds", "verses": 60 },
    { "id": 52, "name": "At-Tur", "english": "The Mount", "verses": 49 },
    { "id": 53, "name": "An-Najm", "english": "The Star", "verses": 62 },
    { "id": 54, "name": "Al-Qamar", "english": "The Moon", "verses": 55 },
    { "id": 55, "name": "Ar-Rahman", "english": "The Beneficent", "verses": 78 },
    { "id": 56, "name": "Al-Waqi'ah", "english": "The Inevitable", "verses": 96 },
    { "id": 57, "name": "Al-Hadid", "english": "The Iron", "verses": 29 },
    { "id": 58, "name": "Al-Mujadilah", "english": "The Pleading Woman", "verses": 22 },
    { "id": 59, "name": "Al-Hashr", "english": "The Exile", "verses": 24 },
    { "id": 60, "name": "Al-Mumtahanah", "english": "She that is to be examined", "verses": 13 },
    { "id": 61, "name": "As-Saff", "english": "The Ranks", "verses": 14 },
    { "id": 62, "name": "Al-Jumu'ah", "english": "The Congregation, Friday", "verses": 11 },
    { "id": 63, "name": "Al-Munafiqun", "english": "The Hypocrites", "verses": 11 },
    { "id": 64, "name": "At-Taghabun", "english": "The Mutual Disillusion", "verses": 18 },
    { "id": 65, "name": "At-Talaq", "english": "The Divorce", "verses": 12 },
    { "id": 66, "name": "At-Tahrim", "english": "The Prohibition", "verses": 12 },
    { "id": 67, "name": "Al-Mulk", "english": "The Sovereignty", "verses": 30 },
    { "id": 68, "name": "Al-Qalam", "english": "The Pen", "verses": 52 },
    { "id": 69, "name": "Al-Haqqah", "english": "The Reality", "verses": 52 },
    { "id": 70, "name": "Al-Ma'arij", "english": "The Ascending Stairways", "verses": 44 },
    { "id": 71, "name": "Nuh", "english": "Noah", "verses": 28 },
    { "id": 72, "name": "Al-Jinn", "english": "The Jinn", "verses": 28 },
    { "id": 73, "name": "Al-Muzzammil", "english": "The Enshrouded One", "verses": 20 },
    { "id": 74, "name": "Al-Muddaththir", "english": "The Cloaked One", "verses": 56 },
    { "id": 75, "name": "Al-Qiyamah", "english": "The Resurrection", "verses": 40 },
    { "id": 76, "name": "Al-Insan", "english": "The Man", "verses": 31 },
    { "id": 77, "name": "Al-Mursalat", "english": "The Emissaries", "verses": 50 },
    { "id": 78, "name": "An-Naba", "english": "The Tidings", "verses": 40 },
    { "id": 79, "name": "An-Nazi'at", "english": "Those Who Drag Forth", "verses": 46 },
    { "id": 80, "name": "Abasa", "english": "He Frowned", "verses": 42 },
    { "id": 81, "name": "At-Takwir", "english": "The Overthrowing", "verses": 29 },
    { "id": 82, "name": "Al-Infitar", "english": "The Cleaving", "verses": 19 },
    { "id": 83, "name": "Al-Mutaffifin", "english": "The Defrauding", "verses": 36 },
    { "id": 84, "name": "Al-Inshiqaq", "english": "The Splitting Asunder", "verses": 25 },
    { "id": 85, "name": "Al-Buruj", "english": "The Mansions of the Stars", "verses": 22 },
    { "id": 86, "name": "At-Tariq", "english": "The Nightcommer", "verses": 17 },
    { "id": 87, "name": "Al-A'la", "english": "The Most High", "verses": 19 },
    { "id": 88, "name": "Al-Ghashiyah", "english": "The Overwhelming", "verses": 26 },
    { "id": 89, "name": "Al-Fajr", "english": "The Dawn", "verses": 30 },
    { "id": 90, "name": "Al-Balad", "english": "The City", "verses": 20 },
    { "id": 91, "name": "Ash-Shams", "english": "The Sun", "verses": 15 },
    { "id": 92, "name": "Al-Lail", "english": "The Night", "verses": 21 },
    { "id": 93, "name": "Ad-Duha", "english": "The Morning Hours", "verses": 11 },
    { "id": 94, "name": "Ash-Sharh", "english": "The Relief", "verses": 8 },
    { "id": 95, "name": "At-Tin", "english": "The Fig", "verses": 8 },
    { "id": 96, "name": "Al-Alaq", "english": "The Clot", "verses": 19 },
    { "id": 97, "name": "Al-Qadr", "english": "The Power", "verses": 5 },
    { "id": 98, "name": "Al-Bayyinah", "english": "The Clear Proof", "verses": 8 },
    { "id": 99, "name": "Az-Zalzalah", "english": "The Earthquake", "verses": 8 },
    { "id": 100, "name": "Al-Adiyat", "english": "The Courser", "verses": 11 },
    { "id": 101, "name": "Al-Qari'ah", "english": "The Calamity", "verses": 11 },
    { "id": 102, "name": "At-Takathur", "english": "The Rivalry in World Increase", "verses": 8 },
    { "id": 103, "name": "Al-Asr", "english": "The Declining Day", "verses": 3 },
    { "id": 104, "name": "Al-Humazah", "english": "The Traducer", "verses": 9 },
    { "id": 105, "name": "Al-Fil", "english": "The Elephant", "verses": 5 },
    { "id": 106, "name": "Quraysh", "english": "Quraysh", "verses": 4 },
    { "id": 107, "name": "Al-Ma'un", "english": "The Small Kindnesses", "verses": 7 },
    { "id": 108, "name": "Al-Kawthar", "english": "The Abundance", "verses": 3 },
    { "id": 109, "name": "Al-Kafirun", "english": "The Disbelievers", "verses": 6 },
    { "id": 110, "name": "An-Nasr", "english": "The Divine Support", "verses": 3 },
    { "id": 111, "name": "Al-Masad", "english": "The Palm Fiber", "verses": 5 },
    { "id": 112, "name": "Al-Ikhlas", "english": "The Sincerity", "verses": 4 },
    { "id": 113, "name": "Al-Falaq", "english": "The Daybreak", "verses": 5 },
    { "id": 114, "name": "An-Nas", "english": "Mankind", "verses": 6 }
];

function renderSidebar() {
    surahs.forEach(surah => {
        const li = document.createElement('li');
        li.className = 'surah-item';
        li.dataset.id = surah.id.toString();

        li.innerHTML = `
            <div class="surah-number">${surah.id}</div>
            <div class="surah-meta">
                <h3>${surah.name}</h3>
                <span>${surah.english}</span>
            </div>
        `;

        li.addEventListener('click', () => handleSurahClick(surah, li));
        surahListContainer.appendChild(li);
    });
}

async function handleSurahClick(surah: {id: number, name: string, english: string, verses: number}, element: HTMLLIElement) {
    // Stop any playing audio
    stopCurrentAudio();
    
    // Update UI state
    welcomeMessage.classList.add('hidden');
    surahContentContainer.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loader.classList.remove('hidden');

    // Update active class
    document.querySelectorAll('.surah-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Provide Surah ${surah.name} (number ${surah.id}) from the Quran. Return it as a JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        surah_name_arabic: { type: Type.STRING, description: "The name of the Surah in Arabic script." },
                        verses: {
                            type: Type.ARRAY,
                            description: "An array of all verses in the Surah.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    verse_number: { type: Type.NUMBER, description: "The verse number." },
                                    arabic_text: { type: Type.STRING, description: "The text of the verse in Arabic." },
                                    urdu_translation: { type: Type.STRING, description: "The translation of the verse in Urdu." }
                                },
                                required: ["verse_number", "arabic_text", "urdu_translation"]
                            }
                        }
                    },
                    required: ["surah_name_arabic", "verses"]
                },
            },
        });
        
        const surahData = JSON.parse(response.text);
        renderSurahContent(surahData, surah.id);

    } catch (error) {
        console.error("Error fetching Surah data:", error);
        loader.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
}

function renderSurahContent(data: { surah_name_arabic: string; verses: { verse_number: number; arabic_text: string; urdu_translation: string }[] }, surahId: number) {
    surahContentContainer.innerHTML = ''; // Clear previous content

    const title = document.createElement('h2');
    title.textContent = data.surah_name_arabic;
    surahContentContainer.appendChild(title);

    data.verses.forEach(verse => {
        const verseDiv = document.createElement('div');
        verseDiv.className = 'verse-container';
        const verseKey = `${surahId}-${verse.verse_number}`;
        
        verseDiv.innerHTML = `
            <div class="verse-header">
                <span>Verse ${verse.verse_number}</span>
                 <button class="play-audio-btn" data-verse-key="${verseKey}" aria-label="Play verse ${verse.verse_number}">
                    <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                    <svg class="icon-stop" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"></path></svg>
                    <div class="spinner"></div>
                </button>
            </div>
            <p class="arabic-text">${verse.arabic_text}</p>
            <p class="urdu-translation">${verse.urdu_translation}</p>
        `;

        const playButton = verseDiv.querySelector('.play-audio-btn') as HTMLButtonElement;
        playButton.addEventListener('click', () => handlePlayVerseClick(verse.arabic_text, playButton, verseKey));

        surahContentContainer.appendChild(verseDiv);
    });

    loader.classList.add('hidden');
    surahContentContainer.classList.remove('hidden');
    mainContent.scrollTop = 0; // Scroll to top
}

async function handlePlayVerseClick(arabicText: string, button: HTMLButtonElement, verseKey: string) {
    if (button.classList.contains('playing')) {
        stopCurrentAudio();
        return;
    }

    stopCurrentAudio();
    button.classList.add('playing');
    
    if (audioCache.has(verseKey)) {
        playAudio(audioCache.get(verseKey)!, button);
    } else {
        await fetchAndPlayAudio(arabicText, button, verseKey);
    }
}

async function fetchAndPlayAudio(arabicText: string, button: HTMLButtonElement, verseKey: string) {
    button.classList.add('loading');
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: arabicText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received.");
        
        if (!outputAudioContext) {
            outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
        audioCache.set(verseKey, audioBuffer);
        playAudio(audioBuffer, button);

    } catch (error) {
        console.error("Error generating audio:", error);
        button.classList.remove('playing');
    } finally {
        button.classList.remove('loading');
    }
}

function playAudio(buffer: AudioBuffer, button: HTMLButtonElement) {
    if (!outputAudioContext) return;
    currentSource = outputAudioContext.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.connect(outputAudioContext.destination);
    currentSource.start();
    currentSource.onended = () => {
        button.classList.remove('playing');
        currentSource = null;
    };
}

function stopCurrentAudio() {
    if (currentSource) {
        currentSource.stop();
        currentSource.disconnect();
        currentSource = null;
    }
    document.querySelectorAll('.play-audio-btn.playing').forEach(btn => btn.classList.remove('playing'));
}

// Audio decoding utilities
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// Initialize the application
renderSidebar();