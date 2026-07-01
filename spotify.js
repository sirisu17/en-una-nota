const CLIENT_ID="5a259001840a41d2a455fde31fd41b93"

const REDIRECT_URI=
"https://sirisu17.github.io/en-una-nota/"

const SCOPE=
"user-library-read"

function loginSpotify(){

let url=

`https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`

window.location.href=
url

}

function obtenerToken(){

let hash=
window.location.hash

if(
!hash
)
return null

let params=
new URLSearchParams(
hash.substring(1)
)

return params.get(
"access_token"
)

}

async function obtenerCanciones(){

let token=
obtenerToken()

if(
!token
)
return []

let r=

await fetch(
"https://api.spotify.com/v1/me/tracks?limit=50",
{
headers:{
Authorization:
`Bearer ${token}`
}
}
)

let data=
await r.json()

return data.items

}

async function iniciarJuego(){

let canciones=
await obtenerCanciones()

window.canciones=
canciones

estado.innerHTML=

`🎵 Encontradas ${canciones.length} canciones`

}

function conectado(){

return obtenerToken()!=null

}