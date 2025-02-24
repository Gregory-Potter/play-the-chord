let midi;

let chords = [];
let currentChord;

let chordPrompt_e;
let lettersOptions_e;
let accidentalsOptions_e;
let qualitiesOptions_e;

const selectedLetters = new Set([0,1,2,3,4,5,6]);
const selectedAccidentals = new Set([0,1,2]);
const selectedQualities = new Set([0,1,2,3,4,5]);

const pressedNotes = new Set();

//#region Initialization
async function initialize() {
  lettersOptions_e = document.getElementById("lettersOptions");
  accidentalsOptions_e = document.getElementById("accidentalsOptions");
  qualitiesOptions_e = document.getElementById("qualitiesOptions");

  buildLettersOptions();
  buildAccidentalsOptions();
  buildQualitiesOptions();
  
  generateChords();

  chordPrompt_e = document.getElementById("chordPrompt");
  getRandomChord();

  try {
    await navigator.wakeLock.request('screen');
    console.log("Screen Wake Lock activated.");
  } catch (error) {
    console.log(error);
  }

  try {
    midi = await navigator.requestMIDIAccess();
    console.log(midi);

    for (const input of midi.inputs.values()) {
      input.onmidimessage = receivedMidiMessage;
    }
  } catch(error) {
    console.log(error);
  }
}
//#endregion Initialization

//#region Runtime Functions
function generateChords() {
  chords = [];

  for (const l of selectedLetters) {
    for (const a of selectedAccidentals) {
      for (const q of selectedQualities) {
        const letter = letters[l];
        const accidental = accidentals[a];
        const quality = qualities[q];

        const c = {
          letter: letter,
          accidental: accidental,
          quality: quality,
          name: letter.symbol + accidental.suffix + quality.suffix
        };
        c.checks = [];
        for (let qualityOffset of quality.offsets) {
          c.checks.push((letter.modValue + accidental.offset + qualityOffset).mod(12));
        }
        chords.push(c);
      }
    }
  }
}

function getRandomChord() {
  let i = Math.round((chords.length-1) *  Math.random());
  while (chords[i] == currentChord) {
    i = Math.round((chords.length-1) *  Math.random());
  }
  currentChord = chords[i];
  chordPrompt_e.innerText = currentChord.name;
  checkChord();
  for (const noteNum of pressedNotes) {
    checkNote(noteNum);
  }
  console.log(currentChord);
}

function receivedMidiMessage(msg) {
  const NOTE_OFF = 8;
  const NOTE_ON = 9;
  const cmd = msg.data[0] >> 4;
  const noteNum = msg.data[1];
  const velocity = (msg.data.length > 2) ? msg.data[2] : 1;
  
  if (cmd === NOTE_ON) {
    console.log(`NoteOn note: ${noteNum}, velocity: ${velocity}`);
    if (noteNum >= lowestNoteNum && noteNum <= highestNoteNum) {
      const key_e = document.getElementById("n" + noteNum);
      checkNote(noteNum);
    }
    pressedNotes.add(noteNum);
    checkChord();
  } else if (cmd === NOTE_OFF) {
    console.log(`NoteOff note: ${noteNum}`);
    if (noteNum >= lowestNoteNum && noteNum <= highestNoteNum) {
      const key_e = document.getElementById("n" + noteNum);
      key_e.dataset.pressed = "";
    }
    pressedNotes.delete(noteNum);
    checkChord()
  }
}

function checkNote(noteNum) {
  const key_e = document.getElementById("n" + noteNum);
  for (const check of currentChord.checks) {
    if (noteNum.mod(12) == check) {
      key_e.dataset.pressed = "pos";
      return true;
    }
  }
  key_e.dataset.pressed = "neg";
  return false;
}

function checkChord() {
  checks: for (const check of currentChord.checks) {
    for (const noteNum of pressedNotes) {
      if (noteNum.mod(12) == check) continue checks;
    }
    chordPrompt_e.dataset.playing = "false";
    return false;
  }
  notes: for (const noteNum of pressedNotes) {
    for (const check of currentChord.checks) {
      if (noteNum.mod(12) == check) continue notes;
    }
    chordPrompt_e.dataset.playing = "false";
    return false;
  }
  chordPrompt_e.dataset.playing = "true";
  setTimeout(getRandomChord, 750);
  return true;
}

//#region Set Updaters
function updateSet(set, fieldSet_e, target) {
  if (target.checked) {
    set.add(Number(target.value));
    if (set.size == 2) {
      const isDisabled = fieldSet_e.querySelector("input[disabled]");
      isDisabled.disabled = false;
    }
  }
  else {
    set.delete(Number(target.value));
    if (set.size == 1) {
      const remainingChecked = fieldSet_e.querySelector("input:checked");
      remainingChecked.disabled = true;
    }
  }
  generateChords();
}

function updateLetters(event) {
  updateSet(selectedLetters, lettersOptions_e, event.target);
}

function updateAccidentals(event) {
  updateSet(selectedAccidentals, accidentalsOptions_e, event.target);
}

function updateQualities(event) {
  updateSet(selectedQualities,qualitiesOptions_e, event.target);
}
//#endregion Set Updaters
//#endregion Runtime Functions

//#region HTML Builders
function checkboxString(id, value, oninput, checked, label) {
  const str =
  `<span class="option">` +
      `<input type="checkbox" id="${id}" value="${value}" oninput="${oninput}"${checked}>` +
      `<label for="${id}">${label}</label>` +
  `</span>`;
  return str;
}

function buildLettersOptions() {
  let htmlString = "";
  for (let i=0; i<letters.length; i++) {
    const letter = letters[i];
    const id = "note" + letter.symbol;
    const checked = selectedLetters.has(i) ? " checked": "";
    const label = letter.symbol;
    htmlString += checkboxString(id, i, "updateLetters(event)", checked, label);
  }
  lettersOptions_e.innerHTML += htmlString;
}

function buildAccidentalsOptions() {
  let htmlString = "";
  for (let i=0; i<accidentals.length; i++) {
    const accidental = accidentals[i];
    const id = accidental.name.toLowerCase().replace(/[^\w]/g, "");
    const checked = selectedAccidentals.has(i) ? " checked": "";
    const label = `${accidental.symbol} ${accidental.name}`;
    htmlString += checkboxString(id, i, "updateAccidentals(event)", checked, label);
  }
  accidentalsOptions_e.innerHTML += htmlString;
}

function buildQualitiesOptions() {
  let htmlString = "";
  for (let i=0; i<qualities.length; i++) {
    const quality = qualities[i];
    const id = quality.name.toLowerCase().replace(/[^\w]/g, "");
    const checked = selectedQualities.has(i) ? " checked": "";
    const label = quality.name;
    htmlString += checkboxString(id, i, "updateQualities(event)", checked, label);
  }
  qualitiesOptions_e.innerHTML += htmlString;
}
//#endregion HTML Builders

//#region Source Data
const lowestNoteNum = 21;
const highestNoteNum = 108;

const letters = [
  {symbol: "C", modValue: 0},
  {symbol: "D", modValue: 2},
  {symbol: "E", modValue: 4},
  {symbol: "F", modValue: 5},
  {symbol: "G", modValue: 7},
  {symbol: "A", modValue: 9},
  {symbol: "B", modValue: 11}
];
const accidentals = [
  {name: "Natural", symbol: "♮", suffix: "", offset: 0},
  {name: "Flat", symbol: "♭", suffix: "♭", offset: -1},
  {name: "Sharp", symbol: "♯", suffix: "♯", offset: 1},
  {name: "Double Flat", symbol: "𝄫", suffix: "𝄫", offset: -2},
  {name: "Double Sharp", symbol: "𝄪", suffix: "𝄪", offset: 2}
];
const qualities = [
  {name: "Major", suffix:"", offsets:[0,4,7]},
  {name: "Minor", suffix:"m", offsets:[0,3,7]},
  {name: "Sus4", suffix:"sus4", offsets:[0,5,7]},
  {name: "Sus2", suffix:"sus2", offsets:[0,2,7]},
  {name: "Diminished", suffix:"dim", offsets:[0,3,6]},
  {name: "Augmented", suffix:"+", offsets:[0,4,8]},
  {name: "Dominant 7", suffix:"7", offsets:[0,4,7,10]},
  {name: "Major 7", suffix:"M7", offsets:[0,4,7,11]},
  {name: "Minor 7", suffix:"m7", offsets:[0,3,7,10]},
  {name: "Minor Major 7", suffix:"mM7", offsets:[0,3,7,11]},
  {name: "Diminished 7", suffix:"dim7", offsets:[0,3,6,9]},
  {name: "Half-Diminished 7", suffix:"ø", offsets:[0,3,6,10]},
];
//#endregion Source Data

Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};