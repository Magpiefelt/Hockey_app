export const useAnimation = () => {
  return {
    animate: (element: Element, animation: string) => {
      element.classList.add(animation)
    }
  }
}
