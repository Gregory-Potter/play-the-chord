let midi;

let chords = [];
let currentChord;

let chordPrompt_e;

const selectedLetters = new Set([0,1,2,3,4,5,6]);
const selectedAccidentals = new Set([0,1,2]);
const selectedQualities = new Set([0,1,2,3,4,5]);

async function initialize() {
  buildLettersOptions();
  buildAccidentalsOptions();
  buildQualitiesOptions();
  
  generateChords();

  chordPrompt_e = document.getElementById("chordPrompt");
  getRandomChord();
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      getRandomChord();
    }
  });

  try {
    midi = await navigator.requestMIDIAccess();
    console.log(midi);

    for (const input of midi.inputs.values()) {
      input.onmidimessage = receivedMidiMessage;
    }
  } catch(e) {
    console.log(e);
  }
}

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
  const i = Math.round((chords.length-1) *  Math.random());
  currentChord = chords[i];
  chordPrompt_e.innerText = currentChord.name;
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
      if (checkNote(noteNum)) key_e.dataset.pressed = "pos";
      else key_e.dataset.pressed = "neg";
    }
  } else if (cmd === NOTE_OFF) {
    console.log(`NoteOff note: ${noteNum}`);
    if (noteNum >= lowestNoteNum && noteNum <= highestNoteNum) {
      const key_e = document.getElementById("n" + noteNum);
      key_e.dataset.pressed = "";
    }
  }
}

function checkNote(noteNum) {
  for (check of currentChord.checks) {
    if (noteNum.mod(12) == check) return true;
  }
  return false;
}

Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

//#region HTML Builders
function buildLettersOptions() {
  const fieldset = document.getElementById("lettersOptions");
  for (let i=0; i<letters.length; i++) {
    const letter = letters[i];
    const id = "note" + letter.symbol;

    const span = document.createElement("span");
    span.className = "option";

    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", id);
    input.setAttribute("value", i);
    input.checked = selectedLetters.has(i);
    input.oninput = function(e) {
      if (e.target.checked) {
        selectedLetters.add(Number(e.target.value));
        if (selectedLetters.size == 2) {
          const isDisabled = document.querySelector("#lettersOptions input[disabled]");
          isDisabled.disabled = false;
        }
      }
      else {
        selectedLetters.delete(Number(e.target.value));
        if (selectedLetters.size == 1) {
          const remainingChecked = document.querySelector("#lettersOptions input:checked");
          remainingChecked.disabled = true;
        }
      }
      generateChords();
    };
    span.appendChild(input);

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerText = letter.symbol;
    span.appendChild(label);

    fieldset.appendChild(span);
  }
}

function buildAccidentalsOptions() {
  const fieldset = document.getElementById("accidentalsOptions");
  for (let i=0; i<accidentals.length; i++) {
    const accidental = accidentals[i];
    const id = accidental.name.toLowerCase().replace(/[^\w]/g, "");

    const span = document.createElement("span");
    span.className = "option";

    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", id);
    input.setAttribute("value", i);
    input.checked = selectedAccidentals.has(i);
    input.oninput = function(e) {
      if (e.target.checked) {
        selectedAccidentals.add(Number(e.target.value));
        if (selectedAccidentals.size == 2) {
          const isDisabled = document.querySelector("#accidentalsOptions input[disabled]");
          isDisabled.disabled = false;
        }
      }
      else {
        selectedAccidentals.delete(Number(e.target.value));
        if (selectedAccidentals.size == 1) {
          const remainingChecked = document.querySelector("#accidentalsOptions input:checked");
          remainingChecked.disabled = true;
        }
      }
      generateChords();
    };
    span.appendChild(input);

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerText = accidental.symbol + " " + accidental.name;
    span.appendChild(label);

    fieldset.appendChild(span);
  }
}

function buildQualitiesOptions() {
  const fieldset = document.getElementById("qualitiesOptions");
  for (let i=0; i<qualities.length; i++) {
    const quality = qualities[i];
    const id = quality.name.toLowerCase().replace(/[^\w]/g, "");

    const span = document.createElement("span");
    span.className = "option";

    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", id);
    input.setAttribute("value", i);
    input.checked = selectedQualities.has(i);
    input.oninput = function(e) {
      if (e.target.checked) {
        selectedQualities.add(Number(e.target.value));
        if (selectedQualities.size == 2) {
          const isDisabled = document.querySelector("#qualitiesOptions input[disabled]");
          isDisabled.disabled = false;
        }
      }
      else {
        selectedQualities.delete(Number(e.target.value));
        if (selectedQualities.size == 1) {
          const remainingChecked = document.querySelector("#qualitiesOptions input:checked");
          remainingChecked.disabled = true;
        }
      }
      generateChords();
    };
    span.appendChild(input);

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerText = quality.name;
    span.appendChild(label);

    fieldset.appendChild(span);
  }
}
//#endregion

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
//#endregion