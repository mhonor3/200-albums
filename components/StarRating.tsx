'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  readonly?: boolean
}

export default function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number>(0)

  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1">
      {stars.map((star) => {
        const filled = hoverValue ? star <= hoverValue : star <= value

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            className={`text-3xl transition ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            {filled ? (
              <span className="text-yellow-400">★</span>
            ) : (
              <span className="text-gray-300">☆</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
