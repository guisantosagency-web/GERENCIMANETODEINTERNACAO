"use client"

import { useEffect } from "react"

export function SecurityShield() {
  useEffect(() => {
    // Desabilitar clique direito
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Desabilitar teclas de atalho para DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+I (Inspecionar)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+C (Inspecionar elemento)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault()
        return false
      }
      // Ctrl+U (Ver código fonte)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault()
        return false
      }
      // Ctrl+S (Salvar página)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        return false
      }
      // Ctrl+P (Imprimir - pode revelar conteúdo)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault()
        return false
      }
    }

    // Desabilitar seleção de texto
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement
      // Permitir seleção em inputs e textareas
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return true
      }
      e.preventDefault()
      return false
    }

    // Desabilitar arrastar elementos
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // Detectar DevTools aberto (método de detecção de tempo)
    let devToolsOpen = false
    const detectDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true
          // Opcional: redirecionar ou mostrar aviso
          console.clear()
        }
      } else {
        devToolsOpen = false
      }
    }

    // Limpar console periodicamente
    const clearConsole = setInterval(() => {
      console.clear()
    }, 1000)

    // Adicionar event listeners
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("selectstart", handleSelectStart)
    document.addEventListener("dragstart", handleDragStart)
    window.addEventListener("resize", detectDevTools)

    // Detectar debugger
    const debuggerCheck = setInterval(() => {
      const start = performance.now()
      // eslint-disable-next-line no-debugger
      debugger
      const end = performance.now()
      if (end - start > 100) {
        // DevTools está aberto
        console.clear()
      }
    }, 1000)

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("selectstart", handleSelectStart)
      document.removeEventListener("dragstart", handleDragStart)
      window.removeEventListener("resize", detectDevTools)
      clearInterval(clearConsole)
      clearInterval(debuggerCheck)
    }
  }, [])

  return null
}
