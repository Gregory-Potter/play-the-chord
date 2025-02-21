let midi;

const lowestNoteNum = 21;
const highestNoteNum = 108;

const noteNames = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
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
]
const chords = [];

let chordPrompt_e;
let chord;

async function initialize() {
  for (let i=0; i<noteNames.length; i++) {
    for (let quality of qualities) {
      const c = {};
      c.name = noteNames[i] + quality.label;
      c.checks = [];
      for (let offset of quality.offsets) {
        c.checks.push((i + offset) % 12);
      }
      chords.push(c);
    }
  }

  chordPrompt_e = document.getElementById("chordPrompt");
  getRandomChord();

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

function getRandomChord() {
  const i = Math.round((chords.length-1) *  Math.random());
  chord = chords[i];
  chordPrompt_e.innerText = chord.name;
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