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
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  }

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
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
          width={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
          height={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
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
