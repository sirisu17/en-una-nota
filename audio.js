let audio=

new Audio(
"https://p.scdn.co/mp3-preview/9f5f7ef4f4f6a8b3.mp3"
)

function reproducir(){

audio.currentTime=0

audio.play()

estado.innerHTML=

"🎵 Reproduciendo"

setTimeout(()=>{

audio.pause()

estado.innerHTML=

"✍️ Escribí tu respuesta"

},2000)

}