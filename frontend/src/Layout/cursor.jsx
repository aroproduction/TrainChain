import React from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import './css/cursor.css'

const cursor_layout = () => {

  useGSAP(() => {
    const cursor = document.querySelector('#cursor')

    document.addEventListener('mousemove', (e) => {
      gsap.to(cursor, {
        x: e.clientX - 2,
        y: e.clientY - 5,
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
    })
  })

  document.addEventListener('click', () => {
    gsap.to(cursor, {
      scale: 1.5,
      duration: 0.3,
    })

    gsap.to(cursor, {
      scale: 1,
      duration: 0.3,
      delay: 0.2,
    })
  })

  useGSAP(() => {
    const cursor = document.querySelector('#cursor_')

    document.addEventListener('mousemove', (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
    })
  })

  return (
    <div id='body'>
      <div id="cursor"></div>
      <div id="cursor_">
        <img src="https://img.icons8.com/?size=100&id=GKmXaly2KTHV&format=png&color=000000" alt="custom cursor" />
      </div>
    </div>
  )
}

export default cursor_layout;