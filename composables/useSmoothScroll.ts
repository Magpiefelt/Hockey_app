export const useSmoothScroll = () => {
  return {
    scrollTo: (target: string) => {
      const element = document.querySelector(target)
      element?.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
