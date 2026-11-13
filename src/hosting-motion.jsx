import { useLayoutEffect, useRef } from 'react'

let scrollSpacer
let activeShrinks = 0
let scrollPosition = 0
let scrollObservers = 0

function rememberScrollPosition() {
  scrollPosition = window.scrollY
}

function trimScrollSpace() {
  if (activeShrinks || !scrollSpacer) return
  const root = document.scrollingElement
  const naturalEnd = root.scrollHeight - scrollSpacer.offsetHeight - root.clientHeight
  const needed = Math.max(0, Math.ceil(window.scrollY - Math.max(0, naturalEnd)))
  if (needed) {
    scrollSpacer.style.height = `${needed}px`
  } else {
    scrollSpacer.remove()
    scrollSpacer = null
    window.removeEventListener('scroll', trimScrollSpace)
    window.removeEventListener('resize', trimScrollSpace)
  }
}

function reserveScrollSpace(frame, amount) {
  if (!scrollSpacer) {
    scrollSpacer = document.createElement('div')
    scrollSpacer.className = 'hosting-scroll-spacer'
    scrollSpacer.setAttribute('aria-hidden', 'true')
    const container = frame.closest('.hosting-shell') ?? document.body
    container.append(scrollSpacer)
    window.addEventListener('scroll', trimScrollSpace, { passive: true })
    window.addEventListener('resize', trimScrollSpace)
  }
  activeShrinks += 1
  scrollSpacer.style.height = `${scrollSpacer.offsetHeight + Math.ceil(amount)}px`
  return () => {
    activeShrinks -= 1
    trimScrollSpace()
  }
}

export function DropdownPanel({ as: Element = 'div', open, className = '', ...props }) {
  return <Element {...props} className={`hosting-menu-motion ${className}`.trim()} data-open={open} inert={!open} />
}

export function TabIndicator({ selected }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const indicator = ref.current
    const track = indicator.parentElement

    function positionIndicator() {
      const active = track.querySelector('button[aria-selected="true"], button[aria-pressed="true"]')
      if (!active) {
        indicator.removeAttribute('style')
        return
      }

      indicator.style.setProperty('--hosting-indicator-x', `${active.offsetLeft}px`)
      indicator.style.setProperty('--hosting-indicator-width', `${active.offsetWidth}px`)
    }

    positionIndicator()
    const observer = new ResizeObserver(positionIndicator)
    observer.observe(track)
    track.querySelectorAll('button').forEach(button => observer.observe(button))
    return () => observer.disconnect()
  }, [selected])

  return <span ref={ref} className="hosting-tab-indicator" aria-hidden="true" />
}

export function AnimatedBlock({ open = true, children }) {
  const contentRef = useAnimatedHeight(open)

  return (
    <div className="hosting-animated-block" data-open={open} inert={!open} aria-hidden={open ? undefined : true}>
      <div className="hosting-animated-block-content" ref={contentRef}>{children}</div>
    </div>
  )
}

export function useAnimatedHeight(open, enabled = true) {
  const contentRef = useRef(null)
  const measureRef = useRef(null)
  const openRef = useRef(open)

  useLayoutEffect(() => {
    openRef.current = open
    measureRef.current?.()
  })

  useLayoutEffect(() => {
    if (!enabled) return
    if (scrollObservers++ === 0) {
      rememberScrollPosition()
      window.addEventListener('scroll', rememberScrollPosition, { passive: true })
    }

    const content = contentRef.current
    const frame = content.parentElement
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let height = openRef.current !== false ? content.getBoundingClientRect().height : 0
    let animation = null
    let releaseSpace
    let releaseFrame
    let wasFollowingNestedResize = false

    function stopAnimation() {
      animation?.cancel()
      animation = null
      delete frame.dataset.resizing
      cancelAnimationFrame(releaseFrame)
      releaseSpace?.()
      releaseSpace = undefined
    }

    function measure() {
      const previousScroll = scrollPosition
      if (!content.getClientRects().length) {
        height = null
        stopAnimation()
        return
      }
      const nextHeight = openRef.current !== false ? content.getBoundingClientRect().height : 0
      if (openRef.current !== false) {
        // Follow the child’s animated height in layout, including its final measurement.
        const nestedResize = Boolean(content.querySelector('.hosting-animated-block[data-resizing]'))
        const followNestedResize = nestedResize || wasFollowingNestedResize
        wasFollowingNestedResize = nestedResize
        if (followNestedResize) {
          height = nextHeight
          stopAnimation()
          return
        }
      }
      if (height === null) {
        height = nextHeight
        return
      }
      if (Math.abs(nextHeight - height) < 0.5) return

      const startHeight = animation ? frame.getBoundingClientRect().height : height
      height = nextHeight
      const shrinking = startHeight - nextHeight
      // Keep the viewport within the scroll range while content below it contracts.
      const release = shrinking >= 0.5 && previousScroll > 0 && frame.getBoundingClientRect().top < window.innerHeight
        ? reserveScrollSpace(frame, shrinking)
        : undefined
      stopAnimation()
      releaseSpace = release
      if ((openRef.current === undefined && (!startHeight || !nextHeight)) ||
        Math.abs(nextHeight - startHeight) < 0.5 || reducedMotion.matches) {
        if (releaseSpace) releaseFrame = requestAnimationFrame(stopAnimation)
        if (release && window.scrollY < previousScroll) window.scrollTo({ top: previousScroll, behavior: 'instant' })
        return
      }

      frame.dataset.resizing = ''
      animation = frame.animate(
        [{ height: `${startHeight}px` }, { height: `${nextHeight}px` }],
        { duration: 220, easing: 'ease-out' },
      )
      if (release && window.scrollY < previousScroll) window.scrollTo({ top: previousScroll, behavior: 'instant' })
      animation.onfinish = () => {
        animation = null
        stopAnimation()
      }
    }

    const observer = new ResizeObserver(measure)
    measureRef.current = measure

    function updateMotionPreference() {
      if (reducedMotion.matches) stopAnimation()
    }

    observer.observe(content)
    reducedMotion.addEventListener('change', updateMotionPreference)
    return () => {
      if (--scrollObservers === 0) window.removeEventListener('scroll', rememberScrollPosition)
      measureRef.current = null
      observer.disconnect()
      reducedMotion.removeEventListener('change', updateMotionPreference)
      stopAnimation()
    }
  }, [enabled])

  return contentRef
}
