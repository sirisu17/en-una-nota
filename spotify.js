const CLIENT_ID = "5a259001840a41d2a455fde31fd41b93";
const SCOPE = "user-library-read";

const TOKEN_KEY = "spotify_token";
const VERIFIER_KEY = "spotify_code_verifier";

let canciones = [];
let cancionActual = null;
let audio = new Audio();
let puntos = 0;
let ronda = 1;

function getRedirectUri() {
  const path = window.location.pathname.replace(/index\.html$/, "");
  const pathConBarra = path.endsWith("/") ? path : path + "/";

  return window.location.origin + pathConBarra;
}

function mostrarEstado(mensaje) {
  document.getElementById("estado").innerHTML = mensaje;
}

function generarTextoAleatorio(length) {
  const posibles =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const valores = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(valores)
    .map((valor) => posibles[valor % posibles.length])
    .join("");
}

async function sha256(texto) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
}

function base64UrlEncode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function loginSpotify() {
  const codeVerifier = generarTextoAleatorio(64);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  localStorage.setItem(VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPE,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href =
    "https://accounts.spotify.com/authorize?" + params.toString();
}

function obtenerTokenGuardado() {
  const tokenGuardado = localStorage.getItem(TOKEN_KEY);

  if (!tokenGuardado) {
    return null;
  }

  const datos = JSON.parse(tokenGuardado);

  if (!datos.access_token || Date.now() >= datos.expires_at) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return datos.access_token;
}

function guardarToken(datos) {
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      access_token: datos.access_token,
      expires_at: Date.now() + datos.expires_in * 1000,
    })
  );
}

async function cambiarCodigoPorToken(code) {
  const codeVerifier = localStorage.getItem(VERIFIER_KEY);

  if (!codeVerifier) {
    mostrarEstado("No se pudo completar el login. Proba conectarte de nuevo.");
    return null;
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  });

  const respuesta = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!respuesta.ok) {
    mostrarEstado("Spotify no acepto el login. Revisa el Redirect URI.");
    return null;
  }

  const datos = await respuesta.json();
  guardarToken(datos);
  localStorage.removeItem(VERIFIER_KEY);
  window.history.replaceState({}, document.title, getRedirectUri());

  return datos.access_token;
}

async function obtenerToken() {
  const token = obtenerTokenGuardado();

  if (token) {
    return token;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    return null;
  }

  return cambiarCodigoPorToken(code);
}

async function pedirASpotify(url, token) {
  const respuesta = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (respuesta.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  if (!respuesta.ok) {
    return null;
  }

  return respuesta.json();
}

async function obtenerCanciones() {
  const token = await obtenerToken();

  if (!token) {
    return [];
  }

  let url = "https://api.spotify.com/v1/me/tracks?limit=50";
  const resultado = [];

  while (url && resultado.length < 150) {
    const data = await pedirASpotify(url, token);

    if (!data) {
      break;
    }

    resultado.push(...data.items.map((item) => item.track).filter(Boolean));
    url = data.next;
  }

  return resultado;
}

async function buscarPreviewAlternativo(track) {
  const artista = track.artists.map((artist) => artist.name).join(" ");
  const busqueda = new URLSearchParams({
    term: `${track.name} ${artista}`,
    media: "music",
    entity: "song",
    limit: "1",
  });

  try {
    const respuesta = await fetch(
      "https://itunes.apple.com/search?" + busqueda.toString()
    );
    const data = await respuesta.json();

    return data.results && data.results[0]
      ? data.results[0].previewUrl
      : null;
  } catch {
    return null;
  }
}

async function prepararPreview(track) {
  if (track.preview_url) {
    return track.preview_url;
  }

  return buscarPreviewAlternativo(track);
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function actualizarMarcador() {
  document.getElementById("puntos").innerHTML = puntos;
  document.getElementById("ronda").innerHTML = ronda;
}

async function nuevaRonda() {
  document.getElementById("respuesta").value = "";
  document.getElementById("nota").innerHTML = "♪";
  audio.pause();

  const disponibles = [...canciones].sort(() => Math.random() - 0.5);

  for (const track of disponibles) {
    const preview = await prepararPreview(track);

    if (preview) {
      cancionActual = track;
      audio = new Audio(preview);
      mostrarEstado("Listo. Escucha el fragmento y adivina la cancion.");
      return;
    }
  }

  mostrarEstado(
    "No encontre previews para tus Me gusta. Proba guardando mas canciones."
  );
}

async function iniciarJuego() {
  mostrarEstado("Buscando tus Me gusta en Spotify...");
  canciones = await obtenerCanciones();
  window.canciones = canciones;

  if (canciones.length === 0) {
    mostrarEstado("No pude traer tus canciones. Conectate otra vez.");
    return;
  }

  mostrarEstado(`Encontradas ${canciones.length} canciones.`);
  actualizarMarcador();
  await nuevaRonda();
}

function reproducir() {
  if (!cancionActual) {
    mostrarEstado("Todavia estoy preparando la ronda...");
    return;
  }

  audio.currentTime = Math.floor(Math.random() * 8);
  audio.play();
  mostrarEstado("Reproduciendo fragmento...");

  setTimeout(() => {
    audio.pause();
    mostrarEstado("Escribi el nombre de la cancion.");
  }, 5000);
}

function adivinar() {
  if (!cancionActual) {
    return;
  }

  const respuesta = normalizar(document.getElementById("respuesta").value);
  const correcta = normalizar(cancionActual.name);

  if (!respuesta) {
    mostrarEstado("Escribi una respuesta primero.");
    return;
  }

  if (respuesta.length < 3) {
    mostrarEstado("Escribi al menos 3 letras.");
    return;
  }

  if (correcta.includes(respuesta) || respuesta.includes(correcta)) {
    puntos++;
    mostrarEstado(`Correcto: ${cancionActual.name}`);
  } else {
    const artista = cancionActual.artists.map((artist) => artist.name).join(", ");
    mostrarEstado(`Era: ${cancionActual.name} - ${artista}`);
  }

  ronda++;
  actualizarMarcador();

  setTimeout(() => {
    nuevaRonda();
  }, 2200);
}

function conectado() {
  const params = new URLSearchParams(window.location.search);

  return obtenerTokenGuardado() != null || params.get("code") != null;
}
