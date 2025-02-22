let midi;

const lowestNoteNum = 21;
const highestNoteNum = 108;

const accidentals = ["𝄪","♯","♮","♭","𝄫"];
const noteNames = [
  [null,"B♯","C" ,null,"D𝄫"],
  ["B𝄪","C♯",null,"D♭",null],
  ["C𝄪",null,"D" ,null,"E𝄫"],
  [null,"D♯",null,"E♭","F𝄫"],
  ["D𝄪",null,"E" ,"F♭",null],
  [null,"E♯","F" ,null,"G𝄫"],
  ["E𝄪","F♯",null,"G♭",null],
  ["F𝄪",null,"G" ,null,"A𝄫"],
  [null,"G♯",null,"A♭",null],
  ["G𝄪",null,"A" ,null,"B𝄫"],
  [null,"A♯",null,"B♭","C𝄫"],
  ["A𝄪",null,"B" ,"C♭",null]
];
const qualities = [
  {label:"", offsets:[0,4,7]},
  {label:"m", offsets:[0,3,7]},
  {label:"sus4", offsets:[0,5,7]},
  {label:"sus2", offsets:[0,2,7]},
  {label:"dim", offsets:[0,3,6]},
  {label:"+", offsets:[0,4,8]},
  {label:"7", offsets:[0,4,7,10]},
  {label:"M7", offsets:[0,4,7,11]},
  {label:"m7", offsets:[0,3,7,10]},
  {label:"mM7", offsets:[0,3,7,11]},
  {label:"dim7", offsets:[0,3,6,9]},
  {label:"ø", offsets:[0,3,6,10]},
];

let chords = [];
let chord;

let chordPrompt_e;

let selectedAccidentals = new Set();

async function initialize() {
  if (document.getElementById("doublesharps").checked) selectedAccidentals.add(0);
  if (document.getElementById("sharps").checked) selectedAccidentals.add(1);
  if (document.getElementById("naturals").checked) selectedAccidentals.add(2);
  if (document.getElementById("flats").checked) selectedAccidentals.add(3);
  if (document.getElementById("doubleflats").checked) selectedAccidentals.add(4);
  
  generateChords();

  chordPrompt_e = document.getElementById("chordPrompt");
  getRandomChord();
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') getRandomChord();
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

  for (let i=0; i<noteNames.length; i++) {
    for (let a of selectedAccidentals) {
      if (noteNames[i][a] == null) continue;
      for (let quality of qualities) {
        const c = {};
        c.name = noteNames[i][a] + quality.label;
        c.rootAccidental = accidentals[a];
        c.checks = [];
        for (let offset of quality.offsets) {
          c.checks.push((i + offset) % 12);
        }
        chords.push(c);
      }
    }
  }
}

function getRandomChord() {
  const i = Math.round((chords.length-1) *  Math.random());
  chord = chords[i];
  chordPrompt_e.innerText = chord.name;
  console.log(chord);
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
  for (check of chord.checks) {
    if (noteNum % 12 == check) return true;
  }
  return false;
}

function updateSelectedAccidentals(e) {
  if (e.target.checked) selectedAccidentals.add(Number(e.target.value));
  else selectedAccidentals.delete(Number(e.target.value));
  console.log(selectedAccidentals);
  generateChords();
}