"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Producto } from "@/lib/types";

interface VoiceCommands {
  onOpenModal: () => void;
  onAddProduct: (nombre: string, cantidad: number) => void;
  onRemoveProduct: (nombre: string, cantidad: number | null) => void;
  onRegisterSale: () => void;
  onClear: () => void;
  isModalOpen: boolean;
  productos: Producto[];
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  ) as (new () => SpeechRecognitionInstance) | null;
}

// ===== HELPERS =====

function parsearCantidad(texto: string): number {
  const num = parseInt(texto);
  if (!isNaN(num) && num > 0) return num;

  const palabrasNum: Record<string, number> = {
    un: 1, uno: 1, una: 1,
    dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50,
  };
  return palabrasNum[texto.toLowerCase()] || 0;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ""); // quita todo lo que no sea letra o número
}

function similitud(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;

  let matches = 0;
  const shorterChars = shorter.split("");
  const longerChars = longer.split("");

  for (const char of shorterChars) {
    const idx = longerChars.indexOf(char);
    if (idx !== -1) {
      matches++;
      longerChars[idx] = "\0";
    }
  }
  return matches / longer.length;
}

function buscarProducto(productos: Producto[], nombre: string): Producto | null {
  if (productos.length === 0) return null;

  // Normalizar: minúsculas, quitar tildes
  let norm = normalizar(nombre);

  // Quitar 's' final para plurales (coca colas -> coca cola)
  if (norm.endsWith("s") && norm.length > 3) {
    norm = norm.slice(0, -1);
  }

  // Versión sin espacios (cocacola, bonobon)
  const normNoSpace = norm.replace(/\s+/g, "");

  let matches: Producto[] = [];

  // Nivel 1: Exacto con espacios
  matches = productos.filter((p) => {
    const pNorm = normalizar(p.nombre);
    return pNorm === norm;
  });

  // Nivel 2: Exacto SIN espacios (cocacola vs coca cola)
  if (matches.length === 0) {
    matches = productos.filter((p) => {
      const pNorm = normalizar(p.nombre).replace(/\s+/g, "");
      return pNorm === normNoSpace;
    });
  }

  // Nivel 3: Empieza con (con o sin espacios)
  if (matches.length === 0) {
    const startMatches = productos.filter((p) => {
      const pNorm = normalizar(p.nombre);
      const pNoSpace = pNorm.replace(/\s+/g, "");
      return pNorm.startsWith(norm) || pNoSpace.startsWith(normNoSpace);
    });
    if (startMatches.length > 0) matches = startMatches;
  }

  // Nivel 4: Incluye (con o sin espacios)
  if (matches.length === 0) {
    const includeMatches = productos.filter((p) => {
      const pNorm = normalizar(p.nombre);
      const pNoSpace = pNorm.replace(/\s+/g, "");
      return (
        pNorm.includes(norm) ||
        pNoSpace.includes(normNoSpace) ||
        norm.includes(pNorm)
      );
    });
    if (includeMatches.length > 0) matches = includeMatches;
  }

  if (matches.length === 0) return null;

  // Si hay varios matches, devolver el de nombre más corto (versión base)
  return matches.reduce((a, b) =>
    a.nombre.length <= b.nombre.length ? a : b
  );
}

// ===== HOOK =====

export function useVoice(commands: VoiceCommands) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("Esperando tu comando...");
  const [statusMessage, setStatusMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const listeningRef = useRef(false);

  // Mantener ref actualizado sin causar re-renders
  const commandsRef = useRef(commands);
  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  const procesarComando = useCallback((texto: string) => {
    const cmd = commandsRef.current;
    const t = texto.toLowerCase().trim();

    // "detener" / "parar" / "apagar"
    if (/\b(detener|parar|apagar|stop)\b/.test(t)) {
      setListening(false);
      listeningRef.current = false;
      return;
    }

    // "registrar venta" / "guardar venta" / "finalizar"
    if (/\b(registrar|guardar|finalizar)\b/.test(t)) {
      if (cmd.isModalOpen) {
        setStatusMessage("Registrando venta por voz...");
        cmd.onRegisterSale();
      } else {
        setStatusMessage("Abrí primero el modal de venta");
      }
      return;
    }

    // "nueva venta" / "abrir venta"
    if (/\b(nueva|abrir|crear)\b.*\bventa\b/.test(t)) {
      setStatusMessage("Abriendo modal de venta...");
      cmd.onOpenModal();
      return;
    }

    // "limpiar" / "borrar todo"
    if (/\b(limpiar|borrar todo|resetear)\b/.test(t)) {
      if (cmd.isModalOpen) {
        cmd.onClear();
        setStatusMessage("Detalles limpiados");
      }
      return;
    }

    // "quitar/eliminar [cantidad] [producto]"
    const matchQuitar = t.match(
      /(?:quitar|eliminar|sacar|borrar|remover)\s+(.+)/i
    );
    if (matchQuitar) {
      const resto = matchQuitar[1].trim();
      let cantQuitar: number | null = null;
      let nomQuitar = resto;

      const partes = resto.match(/^(\S+(?:\s+\S+)?)\s+(.+)/i);
      if (partes) {
        const c = parsearCantidad(partes[1]);
        if (c > 0) {
          cantQuitar = c;
          nomQuitar = partes[2].trim();
        }
      }

      if (!cmd.isModalOpen) {
        setStatusMessage("No hay venta abierta");
        return;
      }

      cmd.onRemoveProduct(nomQuitar, cantQuitar);
      return;
    }

    // "agregar/vender [cantidad] [producto]"
    // "agregar/vender [cantidad] [producto]" (cantidad opcional, default 1)
    const matchVender = t.match(
      /(?:agregar|vender|añadir|poner)\s+(?:(\S+)\s+)?(.+)/i
    );
    const matchSimple = t.match(/^(\S+)\s+(.+)/i); // fallback: "2 fideos"

    let cantidad = 0;
    let nombreProducto = "";

    if (matchVender) {
      if (matchVender[1]) {
        cantidad = parsearCantidad(matchVender[1]);
      }
      nombreProducto = matchVender[2].trim();

      // Si no dijo número, asumir 1
      if (cantidad === 0 && nombreProducto) {
        cantidad = 1;
      }
    } else if (matchSimple && !matchVender) {
      const posibleCant = parsearCantidad(matchSimple[1]);
      if (posibleCant > 0) {
        cantidad = posibleCant;
        nombreProducto = matchSimple[2].trim();
      }
    }

    if (cantidad > 0 && nombreProducto) {
      if (!cmd.isModalOpen) {
        setStatusMessage("Abriendo venta...");
        cmd.onOpenModal();
        setTimeout(() => {
          commandsRef.current.onAddProduct(nombreProducto, cantidad);
        }, 400);
      } else {
        cmd.onAddProduct(nombreProducto, cantidad);
      }
      return;
    }

    setStatusMessage(`No entendí: "${texto}"`);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setTranscript("Tu navegador no soporta reconocimiento de voz. Usá Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setTranscript("Escuchando... hablá ahora");
      setStatusMessage("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (interimText) {
        setTranscript(`"${interimText}"`);
      }
      if (finalText) {
        setTranscript(`"${finalText}"`);
        procesarComando(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed") {
        setStatusMessage("Permiso de micrófono denegado");
        setListening(false);
        listeningRef.current = false;
      } else if (event.error === "audio-capture") {
        setStatusMessage("No se detectó micrófono");
        setListening(false);
        listeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          // ya corriendo
        }
      }
    };

    recognitionRef.current = recognition;
    listeningRef.current = true;
    setListening(true);

    try {
      recognition.start();
    } catch {
      // ya corriendo
    }
  }, [procesarComando]);

  const stop = useCallback(() => {
    listeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ya detenido
      }
    }
    setListening(false);
    setTranscript("Esperando tu comando...");
    setStatusMessage("");
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      listeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ok */
        }
      }
    };
  }, []);

  return { listening, transcript, statusMessage, toggle };
}