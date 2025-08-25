"use client"

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white' | 'dark' | 'gradient'
  showText?: boolean
}

export function Logo({ 
  className = '', 
  size = 'md', 
  variant = 'gradient',
  showText = true 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const colors = {
    default: {
      text: ''
    },
    white: {
      text: ''
    },
    dark: {
      text: ''
    },
    gradient: {
      text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800'
    }
  }

  const currentColors = colors[variant]

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
        <Image
          src="/logo.png"
          alt="F.AI Interview Logo"
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className="w-full h-full object-contain drop-shadow-sm"
          priority
        />
      </div>
      
      {/* Logo Text - Optional */}
      {showText && (
        <span className={`font-bold ${textSizes[size]} ${currentColors.text} tracking-tight`}>
          F.AI Interview
        </span>
      )}
    </div>
  )
}
