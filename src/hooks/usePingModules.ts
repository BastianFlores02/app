// src/hooks/usePingModules.ts
export function startPingModules(
  ping: (id: number) => Promise<boolean>,
  isBusy: () => boolean,
  pingPaused: boolean,
  moduleIds: number[],
  connected: boolean,
  getModuleState?: (id: number) => Promise<any | null> // Nuevo: función para solicitar el STATE
) {
  let stopped = false;
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  async function pingCycle() {
    while (!stopped && connected && moduleIds.length > 0) {
      if (!pingPaused && !isBusy()) {
        for (const id of moduleIds) {
          // --- Espera que no haya nada pendiente
          while ((isBusy() || pingPaused) && !stopped) await delay(50);

          console.log(`[PING MODULE] → PING a ID: ${id}`);
          let ok = await ping(id);
          console.log(`[PING MODULE] ← PING a ID: ${id} resultado:`, ok);
          await delay(1200); // Espera tras ping

          if (!ok) {
            // 2do intento si falla el primero
            while ((isBusy() || pingPaused) && !stopped) await delay(50);
            console.log(`[PING MODULE] → 2do PING a ID: ${id}`);
            ok = await ping(id);
            console.log(`[PING MODULE] ← 2do PING a ID: ${id} resultado:`, ok);
            await delay(1200);
          }

          // --- Ahora solicita el STATE si hay getModuleState y PING fue OK
          if (ok && typeof getModuleState === "function") {
            try {
              while ((isBusy() || pingPaused) && !stopped) await delay(50);
              console.log(`[PING MODULE] → STATE a ID: ${id}`);
              await getModuleState(id);
              console.log(`[PING MODULE] ← STATE a ID: ${id} (espera extra para robustez)`);
              await delay(1800); // Da tiempo a recibir la respuesta (sube si hace falta)
            } catch (err) {
              console.warn("[PING MODULE] STATE falló para id", id);
            }
          }
        }
        // Espera antes de repetir el ciclo completo
        console.log("[PING MODULE] Esperando 3 segundos para siguiente ciclo...");
        await delay(3000);
      } else {
        await delay(500);
      }
    }
  }

  if (connected && moduleIds.length > 0) {
    pingCycle();
  }

  return () => { stopped = true; };
}