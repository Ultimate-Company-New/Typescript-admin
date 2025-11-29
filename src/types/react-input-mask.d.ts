declare module 'react-input-mask' {
  import { Component, InputHTMLAttributes } from 'react'

  export interface InputState {
    value: string
    selection: Selection | null
  }

  export interface Selection {
    start: number
    end: number
  }

  export interface BeforeMaskedValueChangeResult {
    value: string
    selection: Selection | null
  }

  export interface MaskOptions {
    mask: string | Array<string | RegExp>
    maskChar?: string | null
    formatChars?: Record<string, string>
    alwaysShowMask?: boolean
    beforeMaskedValueChange?: (
      newState: InputState,
      oldState: InputState,
      userInput: string,
      maskOptions: MaskOptions,
    ) => BeforeMaskedValueChangeResult
  }

  export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    mask: string | Array<string | RegExp>
    maskChar?: string | null
    formatChars?: Record<string, string>
    alwaysShowMask?: boolean
    beforeMaskedValueChange?: (
      newState: InputState,
      oldState: InputState,
      userInput: string,
      maskOptions: MaskOptions,
    ) => BeforeMaskedValueChangeResult
    children?: (inputProps: InputHTMLAttributes<HTMLInputElement>) => React.ReactElement
  }

  export default class InputMask extends Component<Props> {}
}

