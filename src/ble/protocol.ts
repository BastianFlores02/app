/* ---------------- Bytes fijos del protocolo ---------------- */
export const STX = 0x02;
export const ETX = 0x03;

/* ---------------- IDs de módulos --------------------------- */
export const ID = {
  BROAD: 0x00,
  EKG:   0x10,
  PANI:  0x13,
  SPO:   0x11,
  SOUNDS: 0x12,
  MASTER: 0x01,
};

/* ---------------- Comandos ------------------------------- */
export const CMD_PING        = 0x10;
export const CMD_ACK         = 0x11;
export const CMD_CONFIG_SET  = 0x20;
export const CMD_PLAY        = 0x30;
export const CMD_PAUSE       = 0x31;
export const CMD_RESUME      = 0x32;
export const CMD_STOP        = 0x33;
export const CMD_CONFIG_ACK  = 0x21;
export const CMD_PLAY_ACK    = 0x35;
export const CMD_PAUSE_ACK   = 0x36;
export const CMD_RESUME_ACK  = 0x37;
export const CMD_STOP_ACK    = 0x38;
export const CMD_RESET       = 0x34;
export const CMD_RESET_ACK   = 0x39;
export const CMD_STATE       = 0x23;
export const CMD_STATE_ACK   = 0x24;

/* ---------------- Utils ---------------------------------- */
export const calcXor = (buf: Uint8Array, from: number, to: number) => {
  let x = 0;
  for (let i = from; i <= to; i++) x ^= buf[i];
  return x & 0xff;
};

/* ---------------- Payload helpers ------------------------ */
export interface EkgPayload {
  mode: 0x01 | 0x02 | 0x03;
  bpm: number;
  duration: number;
}

export interface PaniPayload {
  mode: 0x01 | 0x02;
  lo:   number;
  hi:   number;
}

// --- SpO2
export interface SpoPayload {
  action: 1 | 2; // 1: saturación, 2: frecuencia
  b1: number;
  b2: number;
  b3: number;
  b4: number;
}

// --- Sounds
export interface SoundsPayload {
  sound: 1 | 2 | 3 | 4;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
}

/* --------- Helpers para parsear respuesta STATE_ACK ---------- */
// data es Uint8Array con la DATA del STATE_ACK (vacío si no hay config)
export function parseStateEkg(data: Uint8Array) {
  if (!data || data.length < 3) return null;
  return {
    mode: data[0] as 1 | 2 | 3,
    bpm: data[1],
    duration: data[2],
  };
}
export function parseStatePani(data: Uint8Array) {
  if (!data || data.length < 5) return null;
  return {
    mode: data[0] as 1 | 2,
    bpm: data[1],
    sys: data[2],
    dia: data[3],
    duration: data[4],
  };
}
export function parseStateSpo(data: Uint8Array) {
  if (!data || data.length < 5) return null;
  return {
    action: data[0] as 1 | 2,
    sat: data[1],             // saturación
    freq: (data[3] << 8) | data[2], // frecuencia (LE)
    duration: data[4],
  };
}
export function parseStateSounds(data: Uint8Array) {
  if (!data || data.length < 5) return null;
  return {
    soundType: data[0],
    duration: (data[4] << 8) | data[3], // duración (LE)
  };
}

/* --------- Helper para resumen legible de configuración ---------- */
// (Puedes ajustar los textos según tu preferencia)
export function stateToString(mod: string, state: any): string {
  if (!state) return `${mod}: (Sin configuración)`;
  switch (mod) {
    case "EKG":
      return `EKG: modo ${state.mode}, ${state.bpm} bpm, ${state.duration}s`;
    case "PANI":
      return state.mode === 1
        ? `PANI: Presión ${state.sys}/${state.dia} mmHg`
        : `PANI: modo ${state.mode}, ${state.bpm} bpm, ${state.duration}s`;
    case "SpO₂":
    case "SPO":
      return state.action === 1
        ? `SpO₂: Sat ${state.sat}%`
        : `SpO₂: ${state.freq} bpm, ${state.duration}s`;
    case "Sonidos":
    case "SOUNDS":
      return `Sonidos: tipo ${state.soundType}, ${state.duration}s`;
    default:
      return "";
  }
}