export const useSmoothScroll = () => {
  const scrollTo = (target: string, offset: number = 80) => {
    const element = document.querySelector(target)
    if (element) {
      const headerOffset = offset
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const scrollToHash = (hash: string, offset: number = 80) => {
    if (hash.startsWith('#')) {
      scrollTo(hash, offset)
    }
  }

  return {
    scrollTo,
    scrollToHash
  }
}
