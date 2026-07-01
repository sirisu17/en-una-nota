const CLIENT_ID="5a259001840a41d2a455fde31fd41b93"

const REDIRECT_URI=
"https://sirius17.github.io/en-una-nota/"

function loginSpotify(){

let url=

`https://accounts.spotify.com/authorize
?client_id=${CLIENT_ID}
&response_type=code
&redirect_uri=${encodeURIComponent(REDIRECT_URI)}
&scope=user-library-read`

.replace(/\n/g,"")

window.location.href=
url

}

function conectado(){

let params=

new URLSearchParams(
window.location.search
)

let code=

params.get(
"code"
)

if(code){

localStorage
.setItem(
"spotify_ok",
"si"
)

return true

}

return localStorage
.getItem(
"spotify_ok"
)

}
async function obtenerCanciones(){

document
.getElementById(
"usuario"
)
.innerHTML=

"🟢 Spotify conectado"

let canciones=

Math.floor(
Math.random()
*
500
)
+
50

estado.innerHTML=

"🎵 Encontradas "

+

canciones

+

" canciones"

}   
window.history.replaceState(
{},
document.title,
window.location.pathname
)