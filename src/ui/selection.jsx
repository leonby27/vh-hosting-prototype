import { useImperativeHandle, useLayoutEffect, useRef } from 'react'

export function Radio(props) {
  return <input {...props} type="radio" />
}

export function Checkbox({ indeterminate = false, ref, ...props }) {
  const input = useRef(null)
  useImperativeHandle(ref, () => input.current, [])
  useLayoutEffect(() => {
    input.current.indeterminate = indeterminate
  }, [indeterminate])
  return <input {...props} type="checkbox" ref={input} />
}

export function SelectionCard({ className = '', children, ...props }) {
  return <label className={`vh-selection-card ${className}`.trim()}>
    <Radio {...props} className="vh-selection-input" />
    {children}
  </label>
}
