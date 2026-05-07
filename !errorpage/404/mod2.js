let container=document.querySelector(".page404")
let img=document.querySelector(".page404__img")

function moveEffect(e) {
    let x=e.clientX
    let y=e.clientY
    img.style.setProperty("--x",`${x}px`)
    img.style.setProperty("--y",`${y}px`)
}

container.addEventListener("mousemove",moveEffect)