import type { FC, ReactNode, Ref, SVGAttributes } from 'react'
import { createElement } from 'react'

export interface IconProps extends SVGAttributes<SVGElement> {
  ref?: Ref<SVGElement>
}

export function icon(size: number = 16): (...children: ReactNode[]) => FC<IconProps> {
  return (...children) => {
    const component: FC<IconProps> = (props) => {
      return createElement(
        'svg',
        {
          width: size,
          height: size,
          viewBox: `0 0 ${size} ${size}`,
          ...props,
        },
        ...children,
      )
    }

    component.displayName = 'Icon'

    return component
  }
}
