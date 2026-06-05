import { useRef, useState, useCallback } from "react";
import * as Prot from "../ble/protocol";
import {
  BleManager,
  Device,
  Characteristic,
} from "react-native-ble-plx";
import { Buffer } from "buffer";
(global as any).Buffer = Buffer;

/* ---------- BLE UUIDs HM-10 ---------- */
const SERVICE_UUID = "FFE0";
const CHAR_UUID    = "FFE1";

/* ---------- Tipos ---------- */
type Frame = Uint8Array;
type Pending = {
  frame:   Frame;
  resolve: (ok: boolean) => void;
  retries: number;
  expect:  number;
};

export interface BLEApi {
  connected: boolean;
  modules: Record<number, boolean>;

  scanDevices(): void;
  scanning: boolean;
  devices: Device[];
  connectToDevice(id: string): Promise<void>;
  disconnect(): void;

  play(id:number):   Promise<boolean>;
  pause(id:number):  Promise<boolean>;
  resume(id:number): Promise<boolean>;
  stop(id:number):   Promise<boolean>;
  ping(id:number):   Promise<boolean>;
  configEKG(p: Prot.EkgPayload):   Promise<boolean>;
  configPANI(p: Prot.PaniPayload): Promise<boolean>;
  configSPO(p: Prot.SpoPayload): Promise<boolean>;
  configSOUNDS(p: Prot.SoundsPayload): Promise<boolean>;

  ekgConfig:  Prot.EkgPayload  | null;
  paniConfig: Prot.PaniPayload | null;
  spoConfig:  Prot.SpoPayload | null;
  soundsConfig: Prot.SoundsPayload | null;
  setEkgConfig(p: Prot.EkgPayload | null): void;
  setPaniConfig(p: Prot.PaniPayload | null): void;
  setSpoConfig(p: Prot.SpoPayload | null): void;
  setSoundsConfig(p: Prot.SoundsPayload | null): void;

  // Estado actual (último STATE_ACK recibido para cada módulo)
  stateEkg: any | null;
  statePani: any | null;
  stateSpo: any | null;
  stateSounds: any | null;
  getModuleState(id: number): Promise<any | null>;

  isBusy(): boolean;
  pingPaused: boolean;
  resetAll(): Promise<boolean>;
}

/* ---------- ACK ---------- */
const ACK_TIMEOUT = 1000;
const ACK_OF: Record<number, number> = {
  [Prot.CMD_PING]:        Prot.CMD_ACK,
  [Prot.CMD_CONFIG_SET]:  Prot.CMD_CONFIG_ACK,
  [Prot.CMD_PLAY]:        Prot.CMD_PLAY_ACK,
  [Prot.CMD_PAUSE]:       Prot.CMD_PAUSE_ACK,
  [Prot.CMD_RESUME]:      Prot.CMD_RESUME_ACK,
  [Prot.CMD_STOP]:        Prot.CMD_STOP_ACK,
  [Prot.CMD_STATE]:       Prot.CMD_STATE_ACK,   // NUEVO para STATE
};

/* ---------- Hook principal ---------- */
export default function useBLE(): BLEApi {
  /* --- estados UI --- */
  const [connected, setConnected] = useState(false);
  const [modules,   setModules]   = useState<Record<number, boolean>>({});
  const [devices,   setDevices]   = useState<Device[]>([]);
  const [scanning,  setScanning]  = useState(false);

  /* --- configuraciones --- */
  const [ekgConfig,  setEkgConfig]  = useState<Prot.EkgPayload | null>(null);
  const [paniConfig, setPaniConfig] = useState<Prot.PaniPayload | null>(null);
  const [spoConfig, setSpoConfig] = useState<Prot.SpoPayload | null>(null);
  const [soundsConfig, setSoundsConfig] = useState<Prot.SoundsPayload | null>(null);

  // NUEVO: Estado de los módulos (último STATE_ACK recibido)
  const [stateEkg, setStateEkg] = useState<any | null>(null);
  const [statePani, setStatePani] = useState<any | null>(null);
  const [stateSpo, setStateSpo] = useState<any | null>(null);
  const [stateSounds, setStateSounds] = useState<any | null>(null);

  /* --- refs internos --- */
  const lastEkgConfig = useRef<Prot.EkgPayload | null>(null);
  const lastPaniConfig = useRef<Prot.PaniPayload | null>(null);
  const lastSpoConfig = useRef<Prot.SpoPayload | null>(null);
  const lastSoundsConfig = useRef<Prot.SoundsPayload | null>(null);
  const manager  = useRef(new BleManager()).current;
  const devRef   = useRef<Device | null>(null);
  const queue    = useRef<Pending[]>([]);
  const busy     = useRef(false);
  const lastAck  = useRef<{cmd:number; ts:number}>({cmd:0, ts:0});
  const rxBuf    = useRef<number[]>([]);

  // --- Promises para espera de STATE_ACK ---
  const stateWaiters = useRef<{[id: number]: (data: any) => void}>({});

  /* --- ping automático --- */
  const [pingPaused, setPingPaused] = useState(false);
  const pausePing  = () => setPingPaused(true);
  const resumePing = () => setPingPaused(false);

  const runWithPingPause = async (fn: () => Promise<boolean>) => {
    pausePing();
    try { return await fn(); }
    finally { setTimeout(resumePing, 2000); }
  };

  /* ---------- helpers ---------- */
  const buildFrame = (id: number, cmd: number, data: number[] = []) => {
    const len = data.length;
    const buf = new Uint8Array(6 + len);
    buf[0] = Prot.STX;
    buf[1] = id;
    buf[2] = cmd;
    buf[3] = len;
    data.forEach((v, i) => (buf[4 + i] = v));
    let crc = 0;
    for (let i = 1; i <= 3 + len; i++) crc ^= buf[i];
    buf[4 + len] = crc;
    buf[5 + len] = Prot.ETX;
    return buf;
  };

  const write = async (bytes:Uint8Array)=>{
    if(!devRef.current) throw new Error("Sin dispositivo BLE");
    try {
      await devRef.current.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID, CHAR_UUID,
        Buffer.from(bytes).toString("base64")
      );
    } catch (err) {
      setConnected(false);
      throw err;
    }
  };

  /* ---------- Cola de envío + ACK ---------- */
  const processNext = async () => {
    if (busy.current || queue.current.length === 0) return;
    busy.current = true;

    const job = queue.current[0];
    lastAck.current = { cmd: 0, ts: 0 };
    await write(job.frame);

    if (job.frame[1] === Prot.ID.BROAD) {
      job.resolve(true);
      queue.current.shift();
      busy.current = false;
      processNext();
      return;
    }

    const ok = await Promise.race<boolean>([
      new Promise(res => {
        const poll = setInterval(() => {
          if (
            lastAck.current.cmd === job.expect &&
            Date.now() - lastAck.current.ts < ACK_TIMEOUT
          ) {
            clearInterval(poll);
            res(true);
          }
        }, 5);
      }),
      new Promise(res => setTimeout(() => res(false), ACK_TIMEOUT)),
    ]);

    if (!ok && job.retries < 1) {
      job.retries++;
      busy.current = false;
      processNext();
      return;
    }
    job.resolve(ok);
    queue.current.shift();
    busy.current = false;
    processNext();
  };

  const sendFrameExpectAck = (frame:Frame)=>
    new Promise<boolean>(resolve=>{
      queue.current.push({frame,resolve,retries:0,expect:ACK_OF[frame[2]]??Prot.CMD_ACK});
      processNext();
    });

  /* ---------- BLE scan ---------- */
  const scanDevices = useCallback(() => {
    setScanning(true);
    setDevices([]);

    manager.startDeviceScan(
      null,
      { allowDuplicates: true },
      (err, dev) => {
        if (err) { setScanning(false); return; }
        if (!dev)  return;

        const advName = dev.localName ?? dev.name ?? "";
        const isHM10  = advName.includes("HMSoft");

        setDevices(prev => {
          const idx = prev.findIndex(d => d.id === dev.id);
          if (idx >= 0) {
            if (advName && !prev[idx].name) {
              (dev as any).name = advName;
              const copy = [...prev]; copy[idx] = dev;
              return copy;
            }
            return prev;
          }
          return isHM10 ? [...prev, dev] : prev;
        });
      }
    );

    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 12000);
  }, [manager]);

  /* ---------- Conexión ---------- */
  const connectToDevice = useCallback(async(id:string)=>{
    const dev = devices.find(d => d.id === id);
    if(!dev) throw new Error("Dispositivo no encontrado");
    manager.stopDeviceScan();
    try { await dev.cancelConnection(); } catch {}
    await dev.connect();
    await dev.discoverAllServicesAndCharacteristics();
    devRef.current = dev;
    setConnected(true);
    dev.monitorCharacteristicForService(SERVICE_UUID, CHAR_UUID, (_e,ch)=>onRx(ch));
  }, [devices]);

  const disconnect = () => {
    setConnected(false);
    if (devRef.current) {
      try { devRef.current.cancelConnection(); } catch { }
    }
    devRef.current = null;
    rxBuf.current = [];
    queue.current = [];
    busy.current = false;
  };

  /* ---------- RX parser ---------- */
  const onRx = (char: Characteristic | null) => {
    if (!char?.value) return;
    rxBuf.current.push(...Uint8Array.from(Buffer.from(char.value, "base64")));

    while (rxBuf.current.length) {
      const stx = rxBuf.current.indexOf(Prot.STX);
      if (stx < 0) { rxBuf.current.length = 0; break; }
      if (stx > 0) rxBuf.current.splice(0, stx);
      if (rxBuf.current.length < 6) break;

      const len  = rxBuf.current[3];
      const size = 6 + len;
      if (rxBuf.current.length < size) break;

      const frame = rxBuf.current.slice(0, size);
      rxBuf.current.splice(0, size);
      if (frame[size - 1] !== Prot.ETX) continue;

      const id  = frame[1];
      const cmd = frame[2];

      if (cmd === Prot.CMD_ACK) {
        lastAck.current = { cmd, ts: Date.now() };
      } else if (cmd === Prot.CMD_CONFIG_ACK) {
        if (id === Prot.ID.EKG && lastEkgConfig.current)
          setEkgConfig(lastEkgConfig.current);
        if (id === Prot.ID.PANI && lastPaniConfig.current)
          setPaniConfig(lastPaniConfig.current);
        if (id === Prot.ID.SPO && lastSpoConfig.current)
          setSpoConfig(lastSpoConfig.current);
        if (id === Prot.ID.SOUNDS && lastSoundsConfig.current)
          setSoundsConfig(lastSoundsConfig.current);
        lastAck.current = { cmd, ts: Date.now() };
      } else if (
        cmd === Prot.CMD_PLAY_ACK ||
        cmd === Prot.CMD_PAUSE_ACK  || cmd === Prot.CMD_RESUME_ACK ||
        cmd === Prot.CMD_STOP_ACK
      ) {
        lastAck.current = { cmd, ts: Date.now() };
      }
      // --- STATE ACK handling ---
      else if (cmd === Prot.CMD_STATE_ACK) {
        if (typeof stateWaiters.current[id] === "function") {
          let parsed = null;
          const data: Uint8Array = Uint8Array.from(frame.slice(4, 4+len));
          if      (id === Prot.ID.EKG)    parsed = Prot.parseStateEkg(data);
          else if (id === Prot.ID.PANI)   parsed = Prot.parseStatePani(data);
          else if (id === Prot.ID.SPO)    parsed = Prot.parseStateSpo(data);
          else if (id === Prot.ID.SOUNDS) parsed = Prot.parseStateSounds(data);

          if      (id === Prot.ID.EKG)    setStateEkg(parsed);
          else if (id === Prot.ID.PANI)   setStatePani(parsed);
          else if (id === Prot.ID.SPO)    setStateSpo(parsed);
          else if (id === Prot.ID.SOUNDS) setStateSounds(parsed);

          stateWaiters.current[id](parsed);
          delete stateWaiters.current[id];
        }
      }
    }
  };

  const failCnt = useRef<Record<number, number>>({});

  /* ---------- API alto nivel ---------- */
  const ping = (id: number) =>
    sendFrameExpectAck(buildFrame(id, Prot.CMD_PING))
      .then(ok => {
        setModules(m => {
          if (ok) {
            failCnt.current[id] = 0;
            return { ...m, [id]: true };
          } else {
            const c = (failCnt.current[id] ?? 0) + 1;
            failCnt.current[id] = c;
            return c >= 2 ? { ...m, [id]: false } : m;
          }
        });
        return ok;
      });

  const play   = (id:number)=>runWithPingPause(()=>sendFrameExpectAck(buildFrame(id,Prot.CMD_PLAY  )));
  const pause  = (id:number)=>runWithPingPause(()=>sendFrameExpectAck(buildFrame(id,Prot.CMD_PAUSE )));
  const resume = (id:number)=>runWithPingPause(()=>sendFrameExpectAck(buildFrame(id,Prot.CMD_RESUME)));
  const stop   = (id:number)=>runWithPingPause(()=>sendFrameExpectAck(buildFrame(id,Prot.CMD_STOP  )));

  const configEKG  = (p:Prot.EkgPayload)=> {
    lastEkgConfig.current = p;
    return runWithPingPause(()=>sendFrameExpectAck(
      buildFrame(Prot.ID.EKG, Prot.CMD_CONFIG_SET, [
        p.mode, p.bpm & 0xFF, p.bpm >> 8, p.duration & 0xFF, p.duration >> 8
      ])));
  };
  const configPANI = (p:Prot.PaniPayload)=> {
    lastPaniConfig.current = p;
    return runWithPingPause(()=>sendFrameExpectAck(
      buildFrame(Prot.ID.PANI, Prot.CMD_CONFIG_SET, [
        p.mode, p.lo, p.hi, 0x00, 0x00
      ])));
  };

  const configSPO = (p: Prot.SpoPayload) => {
    lastSpoConfig.current = p;
    return runWithPingPause(() =>sendFrameExpectAck(
        buildFrame(Prot.ID.SPO, Prot.CMD_CONFIG_SET, [
          p.action, p.b1, p.b2, p.b3, p.b4
        ])));
  };

  const configSOUNDS = (p: Prot.SoundsPayload) => {
    lastSoundsConfig.current = p;
    return runWithPingPause(() =>sendFrameExpectAck(
        buildFrame(Prot.ID.SOUNDS, Prot.CMD_CONFIG_SET, [
          p.sound, p.b1, p.b2, p.b3, p.b4
        ])));
  };

  // NUEVO: Función para pedir el estado de un módulo (STATE)
  const getModuleState = (id: number): Promise<any | null> => {
    // Borra el último estado almacenado para forzar refresh
    if      (id === Prot.ID.EKG)    setStateEkg(null);
    else if (id === Prot.ID.PANI)   setStatePani(null);
    else if (id === Prot.ID.SPO)    setStateSpo(null);
    else if (id === Prot.ID.SOUNDS) setStateSounds(null);

    return new Promise<any | null>(resolve => {
      stateWaiters.current[id] = resolve;
      // Enviar frame STATE, sin data extra
      sendFrameExpectAck(buildFrame(id, Prot.CMD_STATE)).catch(() => {
        resolve(null);
      });
      setTimeout(() => {
        if (typeof stateWaiters.current[id] === "function") {
          stateWaiters.current[id](null);
          delete stateWaiters.current[id];
        }
      }, ACK_TIMEOUT + 400);
    });
  };

  const isBusy = ()=>busy.current;
  const resetAll = () => sendFrameExpectAck(buildFrame(Prot.ID.BROAD, Prot.CMD_RESET));

  /* ---------- export ---------- */
  return{
    connected,
    modules,
    scanDevices,
    scanning,
    devices,
    connectToDevice,
    disconnect,

    play, pause, resume, stop,
    ping,
    configEKG, configPANI,
    configSPO, configSOUNDS,

    ekgConfig,  setEkgConfig,
    paniConfig, setPaniConfig,
    spoConfig, setSpoConfig,       
    soundsConfig, setSoundsConfig, 

    // Nuevo: para mostrar estado actual en UI
    stateEkg, statePani, stateSpo, stateSounds,
    getModuleState,

    isBusy,
    pingPaused,
    resetAll
  };
}